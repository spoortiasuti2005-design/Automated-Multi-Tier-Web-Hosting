import type { DbAccessTestResult, NetworkAccessPolicy, SystemSettings, SystemState } from './types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  getState: () => request<SystemState>('/api/state'),
  getCloudAdapter: () =>
    request<{
      computeService: string;
      loadBalancerService: string;
      monitoringService: string;
      databaseService: string;
      statusMessage: string;
    }>('/api/cloud-adapter'),
  addInstance: () => request<{ state: SystemState }>('/api/instances', { method: 'POST' }),
  removeInstance: (id: string) =>
    request<{ state: SystemState }>(`/api/instances/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  toggleInstanceHealth: (id: string) =>
    request<{ state: SystemState }>(`/api/instances/${encodeURIComponent(id)}/health`, { method: 'PATCH' }),
  manualScale: (action: 'add' | 'remove') =>
    request<{ state: SystemState }>('/api/scaling/manual', {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  setTraffic: (requestsPerMin: number) =>
    request<{ state: SystemState }>('/api/traffic', {
      method: 'POST',
      body: JSON.stringify({ requestsPerMin }),
    }),
  sendLiveBurst: async (count = 10): Promise<SystemState> => {
    const responses = await Promise.all(
      Array.from({ length: count }, () => request<{ state: SystemState }>('/api/work'))
    );
    return responses[responses.length - 1].state;
  },
  stepSimulation: () => request<{ state: SystemState }>('/api/simulation/tick', { method: 'POST' }),
  setAccessPolicy: (policy: NetworkAccessPolicy) =>
    request<{ state: SystemState }>('/api/database/policy', {
      method: 'POST',
      body: JSON.stringify({ policy }),
    }),
  testDbAccess: (source: 'public_internet' | 'app_tier_vpc') =>
    request<{ result: DbAccessTestResult; state: SystemState }>('/api/database/test-access', {
      method: 'POST',
      body: JSON.stringify({ source }),
    }),
  triggerDeployment: (version: string, simulateFailure: boolean) =>
    request<{ state: SystemState }>('/api/deployments', {
      method: 'POST',
      body: JSON.stringify({ version, simulateFailure }),
    }),
  updateSettings: (settings: Partial<SystemSettings>) =>
    request<{ state: SystemState }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
};
