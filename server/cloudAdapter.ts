import type { CloudProviderMode, ServerInstance } from './types.ts';

export interface CloudProviderAdapter {
  readonly providerName: CloudProviderMode;
  readonly isLiveCloud: boolean;
  provisionInstance(index: number, appVersion: string): Promise<ServerInstance>;
  terminateInstance(instanceId: string): Promise<void>;
  getIntegrationMetadata(): {
    computeService: string;
    loadBalancerService: string;
    monitoringService: string;
    databaseService: string;
    statusMessage: string;
  };
}

const ZONES = ['ap-south-1a', 'ap-south-1b', 'ap-south-1c'];

export class SimulatedCloudAdapter implements CloudProviderAdapter {
  readonly providerName: CloudProviderMode = 'simulated';
  readonly isLiveCloud = false;

  async provisionInstance(index: number, appVersion: string): Promise<ServerInstance> {
    const id = `i-sim-${Math.random().toString(36).substring(2, 8)}`;
    const padded = String(index).padStart(2, '0');
    return {
      id,
      name: `app-tier-node-${padded}`,
      privateIp: `10.0.2.${10 + index}`,
      availabilityZone: ZONES[(index - 1) % ZONES.length],
      status: 'healthy',
      cpuUsage: 32,
      memoryUsage: 38,
      requestsPerMin: 0,
      responseTimeMs: 36,
      appVersion,
      uptimeSeconds: 0,
      totalRequestsHandled: 0,
      createdAt: new Date().toISOString(),
    };
  }

  async terminateInstance(_instanceId: string): Promise<void> {
    // Handled by local simulation pool
  }

  getIntegrationMetadata() {
    return {
      computeService: 'Simulated Auto-Scaling Compute Pool',
      loadBalancerService: 'Simulated Layer-7 Elastic Load Balancer',
      monitoringService: 'Simulated Telemetry Stream (3s intervals)',
      databaseService: 'Simulated Isolated Private PostgreSQL Tier',
      statusMessage: 'Running in Demonstration Simulation Mode (Simulated Telemetry).',
    };
  }
}

export class AwsCloudAdapterStub implements CloudProviderAdapter {
  readonly providerName: CloudProviderMode = 'aws';
  readonly isLiveCloud = false;

  async provisionInstance(index: number, appVersion: string): Promise<ServerInstance> {
    const base = await new SimulatedCloudAdapter().provisionInstance(index, appVersion);
    return { ...base, id: `i-aws-${base.id.slice(6)}` };
  }

  async terminateInstance(_instanceId: string): Promise<void> {}

  getIntegrationMetadata() {
    return {
      computeService: 'AWS EC2 Auto Scaling Group (Adapter Ready)',
      loadBalancerService: 'AWS Application Load Balancer (ALB)',
      monitoringService: 'Amazon CloudWatch Metrics & Alarms',
      databaseService: 'Amazon RDS PostgreSQL (Private VPC Subnet)',
      statusMessage: 'AWS Adapter selected — running simulated telemetry until AWS IAM credentials are connected.',
    };
  }
}

export class AzureCloudAdapterStub implements CloudProviderAdapter {
  readonly providerName: CloudProviderMode = 'azure';
  readonly isLiveCloud = false;

  async provisionInstance(index: number, appVersion: string): Promise<ServerInstance> {
    const base = await new SimulatedCloudAdapter().provisionInstance(index, appVersion);
    return { ...base, id: `vm-az-${base.id.slice(6)}`, availabilityZone: `eastus-${((index - 1) % 3) + 1}` };
  }

  async terminateInstance(_instanceId: string): Promise<void> {}

  getIntegrationMetadata() {
    return {
      computeService: 'Azure Virtual Machine Scale Sets (Adapter Ready)',
      loadBalancerService: 'Azure Application Gateway / Load Balancer',
      monitoringService: 'Azure Monitor & Autoscale Rules',
      databaseService: 'Azure Database for PostgreSQL (Private Endpoint)',
      statusMessage: 'Azure Adapter selected — running simulated telemetry until Azure Service Principal is connected.',
    };
  }
}

export function createCloudAdapter(mode: CloudProviderMode): CloudProviderAdapter {
  if (mode === 'aws') return new AwsCloudAdapterStub();
  if (mode === 'azure') return new AzureCloudAdapterStub();
  return new SimulatedCloudAdapter();
}
