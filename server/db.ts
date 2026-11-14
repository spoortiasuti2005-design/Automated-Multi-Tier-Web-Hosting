import { Pool } from 'pg';
import type {
  ActivityLog,
  DeploymentRecord,
  MonitoringPoint,
  ScalingEvent,
  ServerInstance,
  SystemSettings,
} from './types.ts';

/**
 * Dual-mode Persistence Layer:
 * Uses PostgreSQL when DATABASE_URL is configured and reachable;
 * automatically falls back to in-memory persistence for zero-config demonstrations.
 */
export class DataRepository {
  private pool: Pool | null = null;
  public mode: 'postgresql' | 'in_memory_fallback' = 'in_memory_fallback';

  async init(): Promise<void> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.log('[DB] DATABASE_URL not set. Using in-memory simulation persistence.');
      return;
    }

    try {
      this.pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 3000 });
      await this.pool.query('SELECT 1');
      this.mode = 'postgresql';
      console.log('[DB] Connected to PostgreSQL database.');
    } catch (err) {
      console.warn('[DB] PostgreSQL unreachable. Falling back to in-memory storage.', (err as Error).message);
      this.pool = null;
      this.mode = 'in_memory_fallback';
    }
  }

  async saveInstance(inst: ServerInstance): Promise<void> {
    if (!this.pool) return;
    await this.pool
      .query(
        `INSERT INTO server_instances (id, name, private_ip, availability_zone, status, cpu_usage, memory_usage, requests_per_min, response_time_ms, app_version, uptime_seconds)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           cpu_usage = EXCLUDED.cpu_usage,
           memory_usage = EXCLUDED.memory_usage,
           requests_per_min = EXCLUDED.requests_per_min,
           response_time_ms = EXCLUDED.response_time_ms,
           app_version = EXCLUDED.app_version,
           uptime_seconds = EXCLUDED.uptime_seconds`,
        [
          inst.id,
          inst.name,
          inst.privateIp,
          inst.availabilityZone,
          inst.status,
          inst.cpuUsage,
          inst.memoryUsage,
          inst.requestsPerMin,
          inst.responseTimeMs,
          inst.appVersion,
          inst.uptimeSeconds,
        ]
      )
      .catch(() => {});
  }

  async deleteInstance(id: string): Promise<void> {
    if (!this.pool) return;
    await this.pool.query('DELETE FROM server_instances WHERE id = $1', [id]).catch(() => {});
  }

  async recordMetric(point: MonitoringPoint): Promise<void> {
    if (!this.pool) return;
    await this.pool
      .query(
        `INSERT INTO monitoring_metrics (requests_per_min, avg_cpu, avg_memory, active_instances, avg_response_time_ms, system_health)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          point.requestsPerMin,
          point.cpuUsage,
          point.memoryUsage,
          point.activeInstances,
          point.responseTimeMs,
          point.healthStatus,
        ]
      )
      .catch(() => {});
  }

  async recordScalingEvent(event: ScalingEvent): Promise<void> {
    if (!this.pool) return;
    await this.pool
      .query(
        `INSERT INTO scaling_events (id, timestamp, action, previous_count, new_count, cpu_at_event, reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
        [event.id, event.timestamp, event.action, event.previousCount, event.newCount, event.cpuAtEvent, event.reason]
      )
      .catch(() => {});
  }

  async recordActivityLog(log: ActivityLog): Promise<void> {
    if (!this.pool) return;
    await this.pool
      .query(
        `INSERT INTO activity_logs (id, timestamp, category, severity, message)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [log.id, log.timestamp, log.category, log.severity, log.message]
      )
      .catch(() => {});
  }

  async saveDeployment(dep: DeploymentRecord): Promise<void> {
    if (!this.pool) return;
    await this.pool
      .query(
        `INSERT INTO deployments (id, version, commit_sha, status, build_status, triggered_by, started_at, completed_at, logs)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           build_status = EXCLUDED.build_status,
           completed_at = EXCLUDED.completed_at,
           logs = EXCLUDED.logs`,
        [
          dep.id,
          dep.version,
          dep.commitSha,
          dep.status,
          dep.buildStatus,
          dep.triggeredBy,
          dep.startedAt,
          dep.completedAt ?? null,
          JSON.stringify(dep.logs),
        ]
      )
      .catch(() => {});
  }

  async saveSettings(settings: SystemSettings): Promise<void> {
    if (!this.pool) return;
    await this.pool
      .query(
        `UPDATE system_settings SET
           min_instances=$1, max_instances=$2, scale_up_cpu_threshold=$3,
           scale_down_cpu_threshold=$4, lb_algorithm=$5, cloud_provider=$6,
           auto_scaling_enabled=$7, tick_interval_ms=$8, updated_at=NOW()
         WHERE id = 1`,
        [
          settings.minInstances,
          settings.maxInstances,
          settings.scaleUpCpuThreshold,
          settings.scaleDownCpuThreshold,
          settings.lbAlgorithm,
          settings.cloudProvider,
          settings.autoScalingEnabled,
          settings.tickIntervalMs,
        ]
      )
      .catch(() => {});
  }
}
