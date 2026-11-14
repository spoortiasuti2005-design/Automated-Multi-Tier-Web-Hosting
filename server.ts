import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCloudAdapter } from './server/cloudAdapter.ts';
import { DataRepository } from './server/db.ts';
import { SimulationEngine } from './server/simulationEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const repo = new DataRepository();
  await repo.init();

  const engine = new SimulationEngine(repo);
  engine.start();

  const app = express();

  // Allow all origins, methods, and headers (permissive CORS) + popup auth compatibility
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    return next();
  });

  app.use(express.json());

  // Track real HTTP request throughput and response latency on API endpoints (excluding SSE stream)
  app.use('/api', (req, res, next) => {
    if (req.path === '/stream' || req.path === '/state') {
      return next();
    }
    const start = performance.now();
    res.on('finish', () => {
      const elapsed = performance.now() - start;
      engine.recordLiveHttpRequest(elapsed);
    });
    return next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, storage: repo.mode, timestamp: new Date().toISOString() });
  });

  app.get('/api/state', (_req, res) => {
    res.json(engine.getState());
  });

  // Real-time Server-Sent Events (SSE) stream pushing updates on every tick and action
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendState = (state: ReturnType<typeof engine.getState>) => {
      res.write(`data: ${JSON.stringify(state)}\n\n`);
    };

    sendState(engine.getState());
    const unsubscribe = engine.subscribe(sendState);

    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
      res.end();
    });
  });

  // Live endpoint for real HTTP load/request testing
  app.all('/api/work', (req, res) => {
    res.json({
      ok: true,
      method: req.method,
      handledAt: new Date().toISOString(),
      state: engine.getState(),
    });
  });

  app.get('/api/cloud-adapter', (_req, res) => {
    const mode = engine.getState().cloudProvider;
    const adapter = createCloudAdapter(mode);
    res.json(adapter.getIntegrationMetadata());
  });

  app.post('/api/instances', async (_req, res) => {
    const created = await engine.manualAddInstance();
    if (!created) {
      return res.status(400).json({ error: 'Maximum instance capacity reached.' });
    }
    return res.status(201).json({ instance: created, state: engine.getState() });
  });

  app.delete('/api/instances/:id', async (req, res) => {
    const ok = await engine.manualRemoveInstance(req.params.id);
    if (!ok) {
      return res.status(400).json({ error: 'Cannot remove instance (minimum capacity reached or not found).' });
    }
    return res.json({ ok: true, state: engine.getState() });
  });

  app.patch('/api/instances/:id/health', (req, res) => {
    const updated = engine.toggleInstanceHealth(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Instance not found.' });
    }
    return res.json({ instance: updated, state: engine.getState() });
  });

  app.post('/api/scaling/manual', async (req, res) => {
    const { action } = req.body as { action?: 'add' | 'remove' };
    if (action === 'add') {
      const created = await engine.manualAddInstance();
      if (!created) return res.status(400).json({ error: 'At maximum capacity.' });
      return res.json({ ok: true, state: engine.getState() });
    }
    if (action === 'remove') {
      const ok = await engine.manualRemoveInstance();
      if (!ok) return res.status(400).json({ error: 'At minimum capacity.' });
      return res.json({ ok: true, state: engine.getState() });
    }
    return res.status(400).json({ error: 'Invalid scaling action.' });
  });

  app.post('/api/traffic', (req, res) => {
    const { requestsPerMin } = req.body as { requestsPerMin: number };
    if (typeof requestsPerMin !== 'number' || Number.isNaN(requestsPerMin)) {
      return res.status(400).json({ error: 'requestsPerMin must be a number.' });
    }
    engine.setTargetTraffic(requestsPerMin);
    return res.json({ ok: true, state: engine.getState() });
  });

  app.post('/api/simulation/tick', async (_req, res) => {
    await engine.tick();
    res.json({ ok: true, state: engine.getState() });
  });

  app.post('/api/database/policy', (req, res) => {
    const { policy } = req.body as { policy?: 'vpc_isolated' | 'allow_all' };
    if (policy !== 'vpc_isolated' && policy !== 'allow_all') {
      return res.status(400).json({ error: 'Invalid access policy.' });
    }
    engine.setAccessPolicy(policy);
    return res.json({ ok: true, state: engine.getState() });
  });

  app.post('/api/database/test-access', (req, res) => {
    const { source } = req.body as { source: 'public_internet' | 'app_tier_vpc' };
    if (source !== 'public_internet' && source !== 'app_tier_vpc') {
      return res.status(400).json({ error: 'Invalid source type.' });
    }
    const result = engine.testDatabaseAccess(source);
    return res.json({ result, state: engine.getState() });
  });

  app.post('/api/deployments', (req, res) => {
    const { version, simulateFailure } = req.body as { version?: string; simulateFailure?: boolean };
    const dep = engine.triggerDeployment(version ?? '', Boolean(simulateFailure));
    res.status(201).json({ deployment: dep, state: engine.getState() });
  });

  app.patch('/api/settings', (req, res) => {
    const updated = engine.updateSettings(req.body);
    res.json({ settings: updated, state: engine.getState() });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Automated Multi-Tier Hosting Control Plane listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
