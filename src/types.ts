export type PageKey =
  | 'dashboard'
  | 'monitoring'
  | 'instances'
  | 'autoscaling'
  | 'loadbalancer'
  | 'database'
  | 'deployment'
  | 'logs'
  | 'settings';

export type InstanceHealth = 'healthy' | 'unhealthy' | 'provisioning' | 'terminating';
export type ScalingStatus = 'stable' | 'scaling_up' | 'scaling_down' | 'cooldown' | 'paused';
export type LoadBalancerAlgorithm = 'round_robin' | 'least_connections' | 'weighted_response';
export type CloudProviderMode = 'simulated' | 'aws' | 'azure';
export type NetworkAccessPolicy = 'vpc_isolated' | 'allow_all';

export interface ServerInstance {
  id: string;
  name: string;
  privateIp: string;
  availabilityZone: string;
  status: InstanceHealth;
  cpuUsage: number;
  memoryUsage: number;
  requestsPerMin: number;
  responseTimeMs: number;
  appVersion: string;
  uptimeSeconds: number;
  totalRequestsHandled: number;
  createdAt: string;
}

export interface MonitoringPoint {
  timestamp: string;
  label: string;
  requestsPerMin: number;
  cpuUsage: number;
  memoryUsage: number;
  activeInstances: number;
  responseTimeMs: number;
  healthStatus: 'Healthy' | 'Degraded' | 'Critical';
}

export interface ScalingEvent {
  id: string;
  timestamp: string;
  action: 'scale_up' | 'scale_down' | 'manual_add' | 'manual_remove' | 'maintain';
  previousCount: number;
  newCount: number;
  cpuAtEvent: number;
  reason: string;
}

export interface DatabaseMetrics {
  engine: string;
  privateHost: string;
  subnetCidr: string;
  securityGroup: string;
  publicAccessBlocked: boolean;
  accessPolicy: NetworkAccessPolicy;
  health: 'Healthy' | 'Degraded';
  activeConnections: number;
  maxConnections: number;
  responseTimeMs: number;
  storageUsedGb: number;
  storageTotalGb: number;
  encryptionAtRest: string;
  tlsVersion: string;
  lastBackupAt: string;
  blockedPublicAttempts: number;
  allowedPublicAttempts: number;
}

export interface HostTelemetry {
  hostname: string;
  platform: string;
  cpuCores: number;
  hostCpuLoadPct: number;
  hostMemoryUsedMb: number;
  hostMemoryTotalMb: number;
  processRssMb: number;
  processUptimeSec: number;
  liveHttpRequestsPerMin: number;
  liveHttpRequestsTotal: number;
  lastRequestLatencyMs: number;
}

export interface DeploymentStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  durationMs: number;
}

export interface DeploymentRecord {
  id: string;
  version: string;
  commitSha: string;
  status: 'building' | 'testing' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  buildStatus: 'running' | 'passed' | 'failed';
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  steps: DeploymentStep[];
  logs: string[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  category: 'scaling' | 'load_balancer' | 'database' | 'deployment' | 'monitoring' | 'security' | 'system';
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface SystemSettings {
  minInstances: number;
  maxInstances: number;
  scaleUpCpuThreshold: number;
  scaleDownCpuThreshold: number;
  lbAlgorithm: LoadBalancerAlgorithm;
  cloudProvider: CloudProviderMode;
  accessPolicy: NetworkAccessPolicy;
  autoScalingEnabled: boolean;
  tickIntervalMs: number;
  simulationRunning: boolean;
  targetTrafficPerMin: number;
}

export interface SystemState {
  isSimulated: boolean;
  storageBackend: 'postgresql' | 'in_memory_fallback';
  cloudProvider: CloudProviderMode;
  currentVersion: string;
  serverTimestamp: string;
  systemAvailability: number;
  totalRequestsPerMin: number;
  avgCpuUtilization: number;
  avgMemoryUtilization: number;
  avgResponseTimeMs: number;
  activeInstanceCount: number;
  healthyInstanceCount: number;
  overallHealth: 'Healthy' | 'Degraded' | 'Critical';
  scalingStatus: ScalingStatus;
  cooldownTicksRemaining: number;
  hostTelemetry: HostTelemetry;
  instances: ServerInstance[];
  metricsHistory: MonitoringPoint[];
  scalingHistory: ScalingEvent[];
  database: DatabaseMetrics;
  deployments: DeploymentRecord[];
  activityLogs: ActivityLog[];
  settings: SystemSettings;
}

export interface DbAccessTestResult {
  allowed: boolean;
  source: string;
  destination: string;
  latencyMs: number;
  statusCode: number;
  message: string;
}
