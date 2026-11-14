import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Network, XCircle } from 'lucide-react';
import type { LoadBalancerAlgorithm, SystemState } from '../types';

interface LoadBalancerPageProps {
  state: SystemState;
  onChangeAlgorithm: (algo: LoadBalancerAlgorithm) => void;
  onToggleInstanceHealth: (id: string) => void;
}

export const LoadBalancerPage: React.FC<LoadBalancerPageProps> = ({
  state,
  onChangeAlgorithm,
  onToggleInstanceHealth,
}) => {
  const chartData = state.instances.map((i) => ({
    name: i.name,
    requestsPerMin: i.requestsPerMin,
    responseTimeMs: i.responseTimeMs,
  }));

  return (
    <div className="space-y-6">
      <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-500/15">
            <Network className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Elastic Load Balancer · Layer-7 Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-metrics">
              Distributes {state.totalRequestsPerMin.toLocaleString()} incoming req/min exclusively across {state.healthyInstanceCount} healthy server instances.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label htmlFor="lb-algo" className="text-xs font-semibold whitespace-nowrap">
            Routing Algorithm:
          </label>
          <select
            id="lb-algo"
            value={state.settings.lbAlgorithm}
            onChange={(e) => onChangeAlgorithm(e.target.value as LoadBalancerAlgorithm)}
            className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] text-slate-900 dark:text-slate-100"
          >
            <option value="round_robin">Round Robin</option>
            <option value="least_connections">Least CPU / Connections</option>
            <option value="weighted_response">Weighted Response Time</option>
          </select>
        </div>
      </div>

      <div className="surface-card p-5">
        <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">
          Requests Distributed Per Server Instance (req/min)
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a192f',
                  borderColor: '#1e293b',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Bar dataKey="requestsPerMin" name="Requests / min" fill="#14b8a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface-card p-5">
        <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">
          Target Group Health Probes &amp; Request Breakdown
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2.5 pr-4 font-semibold">Instance</th>
                <th className="py-2.5 pr-4 font-semibold">Private IP</th>
                <th className="py-2.5 pr-4 font-semibold">Health Check</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Current Traffic</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Total Handled</th>
                <th className="py-2.5 pr-4 font-semibold text-right">Response Time</th>
                <th className="py-2.5 text-right font-semibold">Failover Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {state.instances.map((inst) => {
                const healthy = inst.status === 'healthy';
                return (
                  <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-[#112240]/50">
                    <td className="py-2.5 pr-4 font-semibold text-slate-900 dark:text-white">{inst.name}</td>
                    <td className="py-2.5 pr-4 font-mono tabular-metrics">{inst.privateIp}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          healthy
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {healthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {healthy ? '200 OK · In Rotation' : 'Failed · Drained'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-metrics font-bold text-right">
                      {inst.requestsPerMin} req/m
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-metrics text-right">
                      {inst.totalRequestsHandled.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-metrics text-right">
                      {healthy ? `${inst.responseTimeMs} ms` : 'Unreachable'}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onToggleInstanceHealth(inst.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240] transition whitespace-nowrap"
                      >
                        Mark {healthy ? 'Unhealthy' : 'Healthy'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
