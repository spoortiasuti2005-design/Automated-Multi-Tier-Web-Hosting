import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { ActivityLog, SystemState } from '../types';

export const ActivityLogsPage: React.FC<{ state: SystemState }> = ({ state }) => {
  const [filter, setFilter] = useState<'all' | ActivityLog['category']>('all');
  const [query, setQuery] = useState('');

  const filtered = state.activityLogs.filter((l) => {
    const matchCategory = filter === 'all' || l.category === filter;
    const matchQuery =
      query.trim() === '' ||
      l.message.toLowerCase().includes(query.toLowerCase()) ||
      l.category.toLowerCase().includes(query.toLowerCase());
    return matchCategory && matchQuery;
  });

  return (
    <div className="space-y-6">
      <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            System Activity &amp; Audit Logs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time operational log across auto-scaling, load balancing, database isolation, and deployments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search logs..."
              aria-label="Search activity logs"
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] text-slate-900 dark:text-white w-48"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | ActivityLog['category'])}
            aria-label="Filter logs by category"
            className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] text-slate-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            <option value="scaling">Auto-Scaling</option>
            <option value="load_balancer">Load Balancer</option>
            <option value="database">Database</option>
            <option value="security">Security</option>
            <option value="deployment">Deployment</option>
            <option value="monitoring">Monitoring</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      <div className="surface-card p-5 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No activity logs match the current filter criteria.
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2.5 pr-4 font-semibold">Timestamp</th>
                <th className="py-2.5 pr-4 font-semibold">Category</th>
                <th className="py-2.5 pr-4 font-semibold">Severity</th>
                <th className="py-2.5 font-semibold">Event Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-[#112240]/50">
                  <td className="py-2.5 pr-4 font-mono tabular-metrics whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[11px] capitalize whitespace-nowrap">
                    {log.category.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 pr-4 font-semibold capitalize whitespace-nowrap">
                    <span
                      className={
                        log.severity === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : log.severity === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : log.severity === 'error'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-sky-600 dark:text-sky-400'
                      }
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-700 dark:text-slate-200">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
