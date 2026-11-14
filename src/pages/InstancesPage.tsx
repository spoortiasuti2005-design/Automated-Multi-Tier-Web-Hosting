import React from 'react';
import { CheckCircle2, Plus, Power, Server, Trash2, XCircle } from 'lucide-react';
import type { SystemState } from '../types';

interface InstancesPageProps {
  state: SystemState;
  onAddInstance: () => void;
  onRemoveInstance: (id: string) => void;
  onToggleHealth: (id: string) => void;
}

export const InstancesPage: React.FC<InstancesPageProps> = ({
  state,
  onAddInstance,
  onRemoveInstance,
  onToggleHealth,
}) => {
  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Application Tier Server Instances
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Provision or terminate elastic compute nodes across Availability Zones. Only healthy nodes receive ELB traffic.
          </p>
        </div>
        <button
          onClick={onAddInstance}
          disabled={state.activeInstanceCount >= state.settings.maxInstances}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 text-[#061020] hover:bg-teal-400 disabled:opacity-40 transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Provision Instance
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {state.instances.map((inst) => {
          const healthy = inst.status === 'healthy';
          return (
            <div key={inst.id} className="surface-card p-5 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 ${
                      healthy ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                    }`}
                  >
                    <Server className={`w-5 h-5 ${healthy ? 'text-emerald-500' : 'text-rose-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{inst.name}</h4>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                      {inst.id} · {inst.privateIp}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${
                    healthy
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {healthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {healthy ? 'Healthy' : 'Unhealthy'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">CPU Usage</span>
                  <div className="font-bold font-mono tabular-metrics mt-0.5">{inst.cpuUsage}%</div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-[#112240] rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${inst.cpuUsage > 70 ? 'bg-rose-500' : 'bg-teal-500'}`}
                      style={{ width: `${inst.cpuUsage}%` }}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Memory Usage</span>
                  <div className="font-bold font-mono tabular-metrics mt-0.5">{inst.memoryUsage}%</div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-[#112240] rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-sky-500 transition-all" style={{ width: `${inst.memoryUsage}%` }} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Requests / Min</span>
                  <div className="font-bold font-mono tabular-metrics mt-0.5">{inst.requestsPerMin}</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Response Latency</span>
                  <div className="font-bold font-mono tabular-metrics mt-0.5">
                    {healthy ? `${inst.responseTimeMs} ms` : 'Timeout'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Availability Zone</span>
                  <div className="font-mono mt-0.5">{inst.availabilityZone}</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Version · Uptime</span>
                  <div className="font-mono tabular-metrics text-teal-600 dark:text-teal-400 mt-0.5">
                    {inst.appVersion} · {formatUptime(inst.uptimeSeconds)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onToggleHealth(inst.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240] transition whitespace-nowrap"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{healthy ? 'Simulate Failure' : 'Restore Health'}</span>
                </button>
                <button
                  onClick={() => onRemoveInstance(inst.id)}
                  disabled={state.activeInstanceCount <= state.settings.minInstances}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 transition whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Terminate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
