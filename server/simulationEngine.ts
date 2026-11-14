import { randomUUID } from 'node:crypto';
import os from 'node:os';
import { type CloudProviderAdapter, createCloudAdapter } from './cloudAdapter.ts';
import type { DataRepository } from './db.ts';
import type {
  ActivityLog,
  DatabaseMetrics,
  DeploymentRecord,
  HostTelemetry,
  MonitoringPoint,
  NetworkAccessPolicy,
  ScalingEvent,
  ScalingStatus,
  ServerInstance,
  SystemSettings,
  SystemState,
} from './types.ts';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

type StateListener = (state: SystemState) => void;

export class SimulationEngine {
  private repo: DataRepository;
  private adapter: CloudProviderAdapter;
  private timer: NodeJS.Timeout | null = null;
  private listeners = new Set<StateListener>();
  private nodeCounter = 2;
  private cooldownTicks = 0;
  private currentVersion = 'v2.4.0';

  private liveRequestTimestamps: number[] = [];
  private liveRequestsTotal = 0;
  private lastRequestLatencyMs = 2;

  private settings: SystemSettings = {
    minInstances: 1,
    maxInstances: 20,
    scaleUpCpuThreshold: 70,
    scaleDownCpuThreshold: 30,
    lbAlgorithm: 'round_robin',
    cloudProvider: 'simulated',
    accessPolicy: 'allow_all',
    autoScalingEnabled: true,
    tickIntervalMs: 1000,
    simulationRunning: true,
    targetTrafficPerMin: 1200,
  };

  private instances: ServerInstance[] = [];
  private metricsHistory: MonitoringPoint[] = [];
  private scalingHistory: ScalingEvent[] = [];
  private deployments: DeploymentRecord[] = [];
  private activityLogs: ActivityLog[] = [];
  private scalingStatus: ScalingStatus = 'stable';

  private database: DatabaseMetrics = {
    engine: 'PostgreSQL 16.4 (Multi-AZ)',
    privateHost: '10.0.3.15:5432',
    subnetCidr: '10.0.3.0/24',
    securityGroup: 'sg-db-tier-open',
    publicAccessBlocked: false,
    accessPolicy: 'allow_all',
    health: 'Healthy',
    activeConnections: 24,
    maxConnections: 500,
    responseTimeMs: 4,
    storageUsedGb: 42.6,
    storageTotalGb: 250,
    encryptionAtRest: 'AES-256 (KMS Managed)',
    tlsVersion: 'TLS 1.3 Enforced',
    lastBackupAt: new Date(Date.now() - 3600_000).toISOString(),
    blockedPublicAttempts: 0,
    allowedPublicAttempts: 0,
  };

  constructor(repo: DataRepository) {
    this.repo = repo;
    this.adapter = createCloudAdapter(this.settings.cloudProvider);
    this.seedInitialState();
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    if (this.listeners.size === 0) return;
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  recordLiveHttpRequest(latencyMs: number): void {
    const now = Date.now();
    this.liveRequestsTotal += 1;
    this.lastRequestLatencyMs = Math.max(1, Math.round(latencyMs * 10) / 10);
    this.liveRequestTimestamps.push(now);
    const cutoff = now - 60_000;
    while (this.liveRequestTimestamps.length > 0 && this.liveRequestTimestamps[0] < cutoff) {
      this.liveRequestTimestamps.shift();
    }
  }

  private getLiveRequestsPerMin(): number {
    const cutoff = Date.now() - 60_000;
    while (this.liveRequestTimestamps.length > 0 && this.liveRequestTimestamps[0] < cutoff) {
      this.liveRequestTimestamps.shift();
    }
    return this.liveRequestTimestamps.length;
  }

  private getHostTelemetry(): HostTelemetry {
    const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
    const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
    const usedMemMb = Math.max(0, totalMemMb - freeMemMb);
    const cpus = os.cpus().length || 1;
    const load1m = os.loadavg()[0] || 0;
    const hostCpuLoadPct = round1(clamp((load1m / cpus) * 100, 1, 100));
    const rssMb = Math.round(process.memoryUsage().rss / (1024 * 1024));

    return {
      hostname: os.hostname(),
      platform: `${os.platform()} ${os.arch()}`,
      cpuCores: cpus,
      hostCpuLoadPct,
      hostMemoryUsedMb: usedMemMb,
      hostMemoryTotalMb: totalMemMb,
      processRssMb: rssMb,
      processUptimeSec: Math.round(process.uptime()),
      liveHttpRequestsPerMin: this.getLiveRequestsPerMin(),
      liveHttpRequestsTotal: this.liveRequestsTotal,
      lastRequestLatencyMs: this.lastRequestLatencyMs,
    };
  }

  private seedInitialState(): void {
    const now = Date.now();
    this.instances = [
      {
        id: 'i-sim-node01',
        name: 'app-tier-node-01',
        privateIp: '10.0.2.11',
        availabilityZone: 'ap-south-1a',
        status: 'healthy',
        cpuUsage: 83.2,
        memoryUsage: 68.5,
        requestsPerMin: 600,
        responseTimeMs: 64,
        appVersion: this.currentVersion,
        uptimeSeconds: 14820,
        totalRequestsHandled: 48210,
        createdAt: new Date(now - 14820_000).toISOString(),
      },
      {
        id: 'i-sim-node02',
        name: 'app-tier-node-02',
        privateIp: '10.0.2.12',
        availabilityZone: 'ap-south-1b',
        status: 'healthy',
        cpuUsage: 80.8,
        memoryUsage: 66.1,
        requestsPerMin: 600,
        responseTimeMs: 61,
        appVersion: this.currentVersion,
        uptimeSeconds: 14800,
        totalRequestsHandled: 47980,
        createdAt: new Date(now - 14800_000).toISOString(),
      },
    ];

    const basePoints = [
      { req: 740, cpu: 52, mem: 49, inst: 2, rt: 38 },
      { req: 820, cpu: 57, mem: 52, inst: 2, rt: 41 },
      { req: 910, cpu: 63, mem: 55, inst: 2, rt: 46 },
      { req: 1030, cpu: 71, mem: 60, inst: 2, rt: 52 },
      { req: 1120, cpu: 77, mem: 64, inst: 2, rt: 58 },
      { req: 1200, cpu: 82, mem: 67.3, inst: 2, rt: 62 },
    ];

    this.metricsHistory = basePoints.map((p, idx) => {
      const t = new Date(now - (basePoints.length - 1 - idx) * 1000);
      return {
        timestamp: t.toISOString(),
        label: t.toLocaleTimeString('en-US', { hour12: false }),
        requestsPerMin: p.req,
        cpuUsage: p.cpu,
        memoryUsage: p.mem,
        activeInstances: p.inst,
        responseTimeMs: p.rt,
        healthStatus: 'Healthy',
      };
    });

    this.deployments = [
      {
        id: randomUUID(),
        version: 'v2.4.0',
        commitSha: 'a94f21c',
        status: 'success',
        buildStatus: 'passed',
        triggeredBy: 'ci-pipeline@github',
        startedAt: new Date(now - 7200_000).toISOString(),
        completedAt: new Date(now - 7150_000).toISOString(),
        steps: [
          { name: 'Source Checkout', status: 'success', durationMs: 1200 },
          { name: 'Install Dependencies', status: 'success', durationMs: 4100 },
          { name: 'Build & Bundle', status: 'success', durationMs: 6300 },
          { name: 'Security & Unit Tests', status: 'success', durationMs: 3800 },
          { name: 'Rolling Deploy to App Tier', status: 'success', durationMs: 5200 },
          { name: 'ELB Health Verification', status: 'success', durationMs: 2100 },
        ],
        logs: [
          '[CI] Checked out commit a94f21c (main)',
          '[BUILD] TypeScript compilation and Vite production bundle succeeded',
          '[TEST] 42/42 integration and security isolation tests passed',
          '[DEPLOY] Rolling update completed across 2 healthy nodes with zero downtime',
        ],
      },
      {
        id: randomUUID(),
        version: 'v2.3.9',
        commitSha: '7c18b0e',
        status: 'success',
        buildStatus: 'passed',
        triggeredBy: 'devops-admin',
        startedAt: new Date(now - 86400_000).toISOString(),
        completedAt: new Date(now - 86350_000).toISOString(),
        steps: [
          { name: 'Source Checkout', status: 'success', durationMs: 1100 },
          { name: 'Install Dependencies', status: 'success', durationMs: 3900 },
          { name: 'Build & Bundle', status: 'success', durationMs: 5900 },
          { name: 'Security & Unit Tests', status: 'success', durationMs: 3600 },
          { name: 'Rolling Deploy to App Tier', status: 'success', durationMs: 4800 },
          { name: 'ELB Health Verification', status: 'success', durationMs: 1900 },
        ],
        logs: ['[DEPLOY] Release v2.3.9 verified healthy behind Elastic Load Balancer.'],
      },
    ];

    this.addLog(
      'system',
      'info',
      'Real-time SSE telemetry stream initialized (1s cadence · Allow All access policy active).'
    );
  }

  start(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.settings.simulationRunning) {
        void this.tick();
      }
    }, this.settings.tickIntervalMs);
  }

  private addLog(
    category: ActivityLog['category'],
    severity: ActivityLog['severity'],
    message: string
  ): void {
    const entry: ActivityLog = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      category,
      severity,
      message,
    };
    this.activityLogs.unshift(entry);
    if (this.activityLogs.length > 200) this.activityLogs.pop();
    void this.repo.recordActivityLog(entry);
  }

  private addScalingEvent(
    action: ScalingEvent['action'],
    previousCount: number,
    newCount: number,
    cpuAtEvent: number,
    reason: string
  ): void {
    const event: ScalingEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      previousCount,
      newCount,
      cpuAtEvent: round1(cpuAtEvent),
      reason,
    };
    this.scalingHistory.unshift(event);
    if (this.scalingHistory.length > 50) this.scalingHistory.pop();
    void this.repo.recordScalingEvent(event);
  }

  async tick(): Promise<void> {
    const liveHttpRpm = this.getLiveRequestsPerMin();
    const jitter = Math.round(
      (Math.random() - 0.48) * Math.max(18, this.settings.targetTrafficPerMin * 0.04)
    );
    // Combine baseline simulated traffic + real live HTTP requests hitting the Express server
    const totalTraffic = Math.max(50, this.settings.targetTrafficPerMin + liveHttpRpm * 10 + jitter);

    const healthyNodes = this.instances.filter((i) => i.status === 'healthy');
    const unhealthyNodes = this.instances.filter((i) => i.status === 'unhealthy');
    const hostLoad = this.getHostTelemetry();

    for (const node of unhealthyNodes) {
      node.requestsPerMin = 0;
      node.cpuUsage = round1(clamp(node.cpuUsage * 0.55 + 5, 4, 15));
      node.memoryUsage = round1(clamp(node.memoryUsage * 0.95, 22, 38));
      node.responseTimeMs = 0;
      node.uptimeSeconds += Math.max(1, Math.round(this.settings.tickIntervalMs / 1000));
    }

    if (healthyNodes.length > 0) {
      const weights = healthyNodes.map((n, idx) => {
        if (this.settings.lbAlgorithm === 'least_connections') {
          return 1 / Math.max(1, n.cpuUsage);
        }
        if (this.settings.lbAlgorithm === 'weighted_response') {
          return 1 / Math.max(15, n.responseTimeMs);
        }
        return 1 + (idx % 2 === 0 ? 0.01 : -0.01);
      });
      const weightSum = weights.reduce((a, b) => a + b, 0);

      healthyNodes.forEach((node, idx) => {
        const share = Math.round((totalTraffic * weights[idx]) / weightSum);
        node.requestsPerMin = share;
        node.totalRequestsHandled += Math.max(1, Math.round((share * this.settings.tickIntervalMs) / 60000));

        // Blend real host CPU jitter with traffic model
        const hostDelta = (hostLoad.hostCpuLoadPct % 4) - 1.5;
        const targetCpu = clamp(12 + share * 0.116 + hostDelta + (Math.random() * 2 - 1), 6, 99.4);
        node.cpuUsage = round1(node.cpuUsage * 0.25 + targetCpu * 0.75);

        const targetMem = clamp(28 + share * 0.065 + (Math.random() * 1.5 - 0.75), 20, 96);
        node.memoryUsage = round1(node.memoryUsage * 0.4 + targetMem * 0.6);

        node.responseTimeMs = Math.round(
          clamp(18 + node.cpuUsage * 0.52 + hostLoad.lastRequestLatencyMs * 0.5, 12, 450)
        );
        node.uptimeSeconds += Math.max(1, Math.round(this.settings.tickIntervalMs / 1000));
        void this.repo.saveInstance(node);
      });
    }

    const avgCpu =
      healthyNodes.length > 0
        ? round1(healthyNodes.reduce((acc, n) => acc + n.cpuUsage, 0) / healthyNodes.length)
        : 99;
    const avgMem =
      healthyNodes.length > 0
        ? round1(healthyNodes.reduce((acc, n) => acc + n.memoryUsage, 0) / healthyNodes.length)
        : 0;
    const avgRt =
      healthyNodes.length > 0
        ? Math.round(healthyNodes.reduce((acc, n) => acc + n.responseTimeMs, 0) / healthyNodes.length)
        : 0;

    this.database.activeConnections = clamp(
      8 + healthyNodes.length * 8 + Math.round(totalTraffic / 120),
      6,
      this.database.maxConnections
    );
    this.database.responseTimeMs = Math.round(clamp(2 + totalTraffic / 380 + Math.random() * 1.5, 2, 26));

    if (!this.settings.autoScalingEnabled) {
      this.scalingStatus = 'paused';
    } else if (this.cooldownTicks > 0) {
      this.cooldownTicks -= 1;
      this.scalingStatus = 'cooldown';
    } else {
      const currentCount = this.instances.length;
      if (avgCpu > this.settings.scaleUpCpuThreshold && currentCount < this.settings.maxInstances) {
        this.scalingStatus = 'scaling_up';
        await this.scaleUpInternal(
          avgCpu,
          `Auto-Scale Trigger: Average CPU (${avgCpu}%) exceeded ${this.settings.scaleUpCpuThreshold}% threshold.`
        );
        this.cooldownTicks = 2;
      } else if (avgCpu < this.settings.scaleDownCpuThreshold && currentCount > this.settings.minInstances) {
        this.scalingStatus = 'scaling_down';
        await this.scaleDownInternal(
          avgCpu,
          `Auto-Scale Trigger: Average CPU (${avgCpu}%) dropped below ${this.settings.scaleDownCpuThreshold}% threshold.`
        );
        this.cooldownTicks = 2;
      } else {
        this.scalingStatus = 'stable';
      }
    }

    const healthStatus: MonitoringPoint['healthStatus'] =
      healthyNodes.length === 0
        ? 'Critical'
        : unhealthyNodes.length > 0 || avgCpu > 88
          ? 'Degraded'
          : 'Healthy';

    const now = new Date();
    const point: MonitoringPoint = {
      timestamp: now.toISOString(),
      label: now.toLocaleTimeString('en-US', { hour12: false }),
      requestsPerMin: healthyNodes.length > 0 ? totalTraffic : 0,
      cpuUsage: avgCpu,
      memoryUsage: avgMem,
      activeInstances: this.instances.length,
      responseTimeMs: avgRt,
      healthStatus,
    };

    this.metricsHistory.push(point);
    if (this.metricsHistory.length > 45) this.metricsHistory.shift();
    void this.repo.recordMetric(point);

    this.emit();
  }

  private async scaleUpInternal(
    cpuAtEvent: number,
    reason: string,
    isManual = false
  ): Promise<ServerInstance | null> {
    if (this.instances.length >= this.settings.maxInstances) {
      this.addLog(
        'scaling',
        'warning',
        `Scale-up skipped: already at maximum capacity (${this.settings.maxInstances} instances).`
      );
      this.emit();
      return null;
    }

    const prevCount = this.instances.length;
    this.nodeCounter += 1;
    const newInst = await this.adapter.provisionInstance(this.nodeCounter, this.currentVersion);
    this.instances.push(newInst);
    void this.repo.saveInstance(newInst);

    this.addScalingEvent(isManual ? 'manual_add' : 'scale_up', prevCount, this.instances.length, cpuAtEvent, reason);
    this.addLog(
      'scaling',
      'success',
      `Provisioned ${newInst.name} (${newInst.privateIp}) in ${newInst.availabilityZone}. Instances: ${prevCount} -> ${this.instances.length}.`
    );
    this.emit();
    return newInst;
  }

  private async scaleDownInternal(cpuAtEvent: number, reason: string, isManual = false): Promise<boolean> {
    if (this.instances.length <= this.settings.minInstances) {
      this.addLog(
        'scaling',
        'warning',
        `Scale-down skipped: at minimum capacity (${this.settings.minInstances} instances).`
      );
      this.emit();
      return false;
    }

    const prevCount = this.instances.length;
    const unhealthyIdx = this.instances.findIndex((i) => i.status === 'unhealthy');
    const removeIdx = unhealthyIdx >= 0 ? unhealthyIdx : this.instances.length - 1;
    const [removed] = this.instances.splice(removeIdx, 1);

    await this.adapter.terminateInstance(removed.id);
    void this.repo.deleteInstance(removed.id);

    this.addScalingEvent(
      isManual ? 'manual_remove' : 'scale_down',
      prevCount,
      this.instances.length,
      cpuAtEvent,
      reason
    );
    this.addLog(
      'scaling',
      'info',
      `Terminated ${removed.name} (${removed.privateIp}). Instances: ${prevCount} -> ${this.instances.length}.`
    );
    this.emit();
    return true;
  }

  async manualAddInstance(): Promise<ServerInstance | null> {
    const cpu = this.getAvgCpu();
    return this.scaleUpInternal(cpu, 'Manual scale-out initiated by operator from control plane.', true);
  }

  async manualRemoveInstance(instanceId?: string): Promise<boolean> {
    if (this.instances.length <= this.settings.minInstances) return false;
    const cpu = this.getAvgCpu();
    if (!instanceId) {
      return this.scaleDownInternal(cpu, 'Manual scale-in initiated by operator.', true);
    }
    const idx = this.instances.findIndex((i) => i.id === instanceId);
    if (idx === -1) return false;
    const prev = this.instances.length;
    const [removed] = this.instances.splice(idx, 1);
    await this.adapter.terminateInstance(removed.id);
    void this.repo.deleteInstance(removed.id);
    this.addScalingEvent(
      'manual_remove',
      prev,
      this.instances.length,
      cpu,
      `Operator terminated instance ${removed.name}.`
    );
    this.addLog('scaling', 'info', `Operator manually terminated ${removed.name} (${removed.privateIp}).`);
    this.emit();
    return true;
  }

  toggleInstanceHealth(instanceId: string): ServerInstance | null {
    const inst = this.instances.find((i) => i.id === instanceId);
    if (!inst) return null;
    inst.status = inst.status === 'healthy' ? 'unhealthy' : 'healthy';
    if (inst.status === 'unhealthy') {
      inst.requestsPerMin = 0;
      inst.responseTimeMs = 0;
      this.addLog(
        'load_balancer',
        'warning',
        `Health check failed on ${inst.name}. ELB removed node from active target rotation.`
      );
    } else {
      this.addLog(
        'load_balancer',
        'success',
        `${inst.name} passed ELB health probe and rejoined target rotation.`
      );
    }
    void this.repo.saveInstance(inst);
    this.emit();
    return inst;
  }

  setTargetTraffic(reqPerMin: number): void {
    this.settings.targetTrafficPerMin = clamp(Math.round(reqPerMin), 50, 10000);
    this.addLog(
      'monitoring',
      'info',
      `Live incoming traffic target updated to ${this.settings.targetTrafficPerMin.toLocaleString()} req/min.`
    );
    this.emit();
  }

  setAccessPolicy(policy: NetworkAccessPolicy): void {
    this.settings.accessPolicy = policy;
    this.database.accessPolicy = policy;
    this.database.publicAccessBlocked = policy === 'vpc_isolated';
    this.database.securityGroup = policy === 'allow_all' ? 'sg-db-tier-open (0.0.0.0/0)' : 'sg-private-db-tier';
    this.addLog(
      'security',
      policy === 'allow_all' ? 'warning' : 'success',
      policy === 'allow_all'
        ? 'Network firewall updated to Allow All (0.0.0.0/0): Public and VPC requests permitted.'
        : 'Network firewall updated to Strict VPC Isolation: Public internet database requests blocked.'
    );
    this.emit();
  }

  updateSettings(partial: Partial<SystemSettings>): SystemSettings {
    const prevInterval = this.settings.tickIntervalMs;
    this.settings = {
      ...this.settings,
      ...partial,
      minInstances: clamp(partial.minInstances ?? this.settings.minInstances, 1, 10),
      maxInstances: clamp(partial.maxInstances ?? this.settings.maxInstances, 2, 20),
      scaleUpCpuThreshold: clamp(partial.scaleUpCpuThreshold ?? this.settings.scaleUpCpuThreshold, 35, 95),
      scaleDownCpuThreshold: clamp(partial.scaleDownCpuThreshold ?? this.settings.scaleDownCpuThreshold, 5, 65),
      tickIntervalMs: clamp(partial.tickIntervalMs ?? this.settings.tickIntervalMs, 500, 10000),
    };
    if (this.settings.minInstances > this.settings.maxInstances) {
      this.settings.maxInstances = this.settings.minInstances;
    }
    if (partial.accessPolicy) {
      this.setAccessPolicy(partial.accessPolicy);
    }
    if (partial.cloudProvider) {
      this.adapter = createCloudAdapter(partial.cloudProvider);
      this.addLog('system', 'info', `Cloud provider adapter switched to ${partial.cloudProvider.toUpperCase()}.`);
    }
    if (partial.lbAlgorithm) {
      this.addLog('load_balancer', 'info', `Load Balancer routing algorithm updated to ${partial.lbAlgorithm}.`);
    }
    if (partial.tickIntervalMs && partial.tickIntervalMs !== prevInterval) {
      this.start();
    }
    void this.repo.saveSettings(this.settings);
    this.emit();
    return this.settings;
  }

  testDatabaseAccess(source: 'public_internet' | 'app_tier_vpc'): {
    allowed: boolean;
    source: string;
    destination: string;
    latencyMs: number;
    statusCode: number;
    message: string;
  } {
    if (source === 'public_internet' && this.settings.accessPolicy === 'vpc_isolated') {
      this.database.blockedPublicAttempts += 1;
      this.addLog(
        'security',
        'warning',
        `Blocked unauthorized public connection attempt (0.0.0.0/0 -> ${this.database.privateHost}) under Strict VPC Isolation.`
      );
      this.emit();
      return {
        allowed: false,
        source: 'Public Internet (0.0.0.0/0)',
        destination: `${this.database.privateHost} (${this.database.subnetCidr})`,
        latencyMs: 0,
        statusCode: 403,
        message:
          'ACCESS DENIED: Strict VPC Isolation is active. Switch policy to Allow All to permit external connections.',
      };
    }

    if (source === 'public_internet') {
      this.database.allowedPublicAttempts += 1;
      this.addLog(
        'database',
        'info',
        `Allowed public connection (0.0.0.0/0 -> ${this.database.privateHost}) under Allow All access policy in ${this.database.responseTimeMs}ms.`
      );
      this.emit();
      return {
        allowed: true,
        source: 'Public Internet (0.0.0.0/0)',
        destination: `${this.database.privateHost} (${this.database.subnetCidr})`,
        latencyMs: this.database.responseTimeMs,
        statusCode: 200,
        message: `ALLOWED (Allow All Policy): Encrypted ${this.database.tlsVersion} connection accepted from public network.`,
      };
    }

    this.addLog(
      'database',
      'success',
      `Authorized private VPC query from Application Tier (10.0.2.0/24 -> ${this.database.privateHost}) succeeded in ${this.database.responseTimeMs}ms.`
    );
    this.emit();
    return {
      allowed: true,
      source: 'Application Tier VPC (10.0.2.0/24)',
      destination: `${this.database.privateHost} (${this.database.subnetCidr})`,
      latencyMs: this.database.responseTimeMs,
      statusCode: 200,
      message: `AUTHORIZED: Encrypted ${this.database.tlsVersion} connection established from Application Tier Security Group.`,
    };
  }

  triggerDeployment(version: string, simulateFailure = false): DeploymentRecord {
    const cleanVersion = version.trim() || `v2.4.${this.deployments.length + 1}`;
    const sha = Math.random().toString(16).substring(2, 9);
    const dep: DeploymentRecord = {
      id: randomUUID(),
      version: cleanVersion,
      commitSha: sha,
      status: 'building',
      buildStatus: 'running',
      triggeredBy: 'operator@cloud-console',
      startedAt: new Date().toISOString(),
      steps: [
        { name: 'Source Checkout', status: 'running', durationMs: 0 },
        { name: 'Install Dependencies', status: 'pending', durationMs: 0 },
        { name: 'Build & Bundle', status: 'pending', durationMs: 0 },
        { name: 'Security & Unit Tests', status: 'pending', durationMs: 0 },
        { name: 'Rolling Deploy to App Tier', status: 'pending', durationMs: 0 },
        { name: 'ELB Health Verification', status: 'pending', durationMs: 0 },
      ],
      logs: [`[CI] Pipeline started for release ${cleanVersion} (commit ${sha})`],
    };

    this.deployments.unshift(dep);
    if (this.deployments.length > 20) this.deployments.pop();
    this.addLog('deployment', 'info', `Deployment pipeline triggered for version ${cleanVersion} (${sha}).`);
    void this.repo.saveDeployment(dep);
    this.emit();

    this.runPipelineSteps(dep, simulateFailure);
    return dep;
  }

  private runPipelineSteps(dep: DeploymentRecord, simulateFailure: boolean): void {
    const durations = [500, 650, 750, 700, 800, 600];
    const logMessages = [
      `[GIT] Checked out repository at ${dep.commitSha}.`,
      `[NPM] Dependencies resolved cleanly (0 critical vulnerabilities).`,
      `[BUILD] Compiled TypeScript + optimized production assets.`,
      `[TEST] Executed 42 automated tests + network checks.`,
      `[DEPLOY] Rolling deployment across ${this.instances.length} application instances.`,
      `[HEALTH] Load balancer confirmed 200 OK across active targets.`,
    ];

    let stepIndex = 0;
    const advance = () => {
      if (stepIndex >= dep.steps.length) return;
      const step = dep.steps[stepIndex];
      const dur = durations[stepIndex];

      if (simulateFailure && stepIndex === 3) {
        step.status = 'failed';
        step.durationMs = dur;
        dep.buildStatus = 'failed';
        dep.status = 'failed';
        dep.completedAt = new Date().toISOString();
        dep.logs.push('[TEST] ERROR: Integration suite failed (AssertionError in auth-middleware).');
        dep.logs.push(`[ROLLBACK] Deployment aborted. Active instances remain on ${this.currentVersion}.`);
        this.addLog(
          'deployment',
          'error',
          `Deployment ${dep.version} failed during automated tests. Production version preserved at ${this.currentVersion}.`
        );
        void this.repo.saveDeployment(dep);
        this.emit();
        return;
      }

      step.status = 'success';
      step.durationMs = dur;
      dep.logs.push(logMessages[stepIndex]);

      if (stepIndex === 2) dep.buildStatus = 'passed';
      if (stepIndex === 3) dep.status = 'deploying';

      if (stepIndex === 4) {
        this.currentVersion = dep.version;
        for (const inst of this.instances) {
          inst.appVersion = dep.version;
          void this.repo.saveInstance(inst);
        }
      }

      stepIndex += 1;
      if (stepIndex < dep.steps.length) {
        dep.steps[stepIndex].status = 'running';
        void this.repo.saveDeployment(dep);
        this.emit();
        setTimeout(advance, durations[stepIndex]);
      } else {
        dep.status = 'success';
        dep.completedAt = new Date().toISOString();
        this.addLog(
          'deployment',
          'success',
          `Deployment ${dep.version} (${dep.commitSha}) completed with zero downtime.`
        );
        void this.repo.saveDeployment(dep);
        this.emit();
      }
    };

    setTimeout(advance, durations[0]);
  }

  private getAvgCpu(): number {
    const healthy = this.instances.filter((i) => i.status === 'healthy');
    if (healthy.length === 0) return 0;
    return round1(healthy.reduce((sum, i) => sum + i.cpuUsage, 0) / healthy.length);
  }

  getState(): SystemState {
    const healthy = this.instances.filter((i) => i.status === 'healthy');
    const totalReq = healthy.reduce((sum, i) => sum + i.requestsPerMin, 0);
    const avgCpu = this.getAvgCpu();
    const avgMem =
      healthy.length > 0 ? round1(healthy.reduce((sum, i) => sum + i.memoryUsage, 0) / healthy.length) : 0;
    const avgRt =
      healthy.length > 0 ? Math.round(healthy.reduce((sum, i) => sum + i.responseTimeMs, 0) / healthy.length) : 0;

    const overallHealth: SystemState['overallHealth'] =
      healthy.length === 0
        ? 'Critical'
        : healthy.length < this.instances.length || avgCpu > 88
          ? 'Degraded'
          : 'Healthy';

    const availability = healthy.length === 0 ? 0 : healthy.length === this.instances.length ? 99.99 : 99.45;

    return {
      isSimulated: !this.adapter.isLiveCloud,
      storageBackend: this.repo.mode,
      cloudProvider: this.settings.cloudProvider,
      currentVersion: this.currentVersion,
      serverTimestamp: new Date().toISOString(),
      systemAvailability: availability,
      totalRequestsPerMin: totalReq,
      avgCpuUtilization: avgCpu,
      avgMemoryUtilization: avgMem,
      avgResponseTimeMs: avgRt,
      activeInstanceCount: this.instances.length,
      healthyInstanceCount: healthy.length,
      overallHealth,
      scalingStatus: this.scalingStatus,
      cooldownTicksRemaining: this.cooldownTicks,
      hostTelemetry: this.getHostTelemetry(),
      instances: this.instances,
      metricsHistory: this.metricsHistory,
      scalingHistory: this.scalingHistory,
      database: this.database,
      deployments: this.deployments,
      activityLogs: this.activityLogs,
      settings: this.settings,
    };
  }
}
