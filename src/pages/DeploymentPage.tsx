import React, { useState } from 'react';
import { CheckCircle2, Clock, GitBranch, Loader2, Play, XCircle } from 'lucide-react';
import type { SystemState } from '../types';

interface DeploymentPageProps {
  state: SystemState;
  onDeploy: (version: string, simulateFailure: boolean) => void;
}

export const DeploymentPage: React.FC<DeploymentPageProps> = ({ state, onDeploy }) => {
  const [nextVersion, setNextVersion] = useState('v2.4.1');
  const [simulateFailure, setSimulateFailure] = useState(false);

  const latest = state.deployments[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeploy(nextVersion, simulateFailure);
    const parts = nextVersion.replace('v', '').split('.').map(Number);
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      setNextVersion(`v${parts[0]}.${parts[1]}.${parts[2] + 1}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-500/15">
            <GitBranch className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Automated CI/CD Deployment Pipeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active Production Version:{' '}
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                {state.currentVersion}
              </span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <label htmlFor="deploy-version" className="sr-only">
            Target Application Version
          </label>
          <input
            id="deploy-version"
            type="text"
            value={nextVersion}
            onChange={(e) => setNextVersion(e.target.value)}
            placeholder="v2.4.1"
            className="px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] text-slate-900 dark:text-white w-28"
          />
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="accent-rose-500"
            />
            <span>Simulate Test Failure</span>
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 text-[#061020] hover:bg-teal-400 transition whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Trigger Deployment</span>
          </button>
        </form>
      </div>

      {/* Latest Pipeline Execution */}
      {latest && (
        <div className="surface-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Latest Pipeline · <span className="font-mono">{latest.version}</span> ({latest.commitSha})
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Triggered by {latest.triggeredBy} · Build Status:{' '}
                <span className="font-semibold capitalize">{latest.buildStatus}</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold capitalize ${
                latest.status === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : latest.status === 'failed'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {latest.status === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {latest.status === 'failed' && <XCircle className="w-4 h-4" />}
              {latest.status !== 'success' && latest.status !== 'failed' && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>{latest.status}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            {latest.steps.map((step) => (
              <div
                key={step.name}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#061020] text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold truncate">{step.name}</span>
                  {step.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {step.status === 'failed' && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  {step.status === 'running' && <Loader2 className="w-4 h-4 text-teal-500 animate-spin shrink-0" />}
                  {step.status === 'pending' && <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <div className="text-[11px] font-mono tabular-metrics text-slate-500 dark:text-slate-400">
                  {step.durationMs > 0 ? `${step.durationMs} ms` : step.status}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Deployment Output Logs
            </h5>
            <div className="rounded-lg bg-[#061020] text-slate-200 p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto border border-slate-800">
              {latest.logs.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.includes('ERROR') || line.includes('ROLLBACK')
                      ? 'text-rose-400'
                      : 'text-teal-300'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deployment History */}
      <div className="surface-card p-5">
        <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">Deployment History</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2.5 pr-4 font-semibold">Version</th>
                <th className="py-2.5 pr-4 font-semibold">Commit</th>
                <th className="py-2.5 pr-4 font-semibold">Build Status</th>
                <th className="py-2.5 pr-4 font-semibold">Deployment Status</th>
                <th className="py-2.5 pr-4 font-semibold">Triggered By</th>
                <th className="py-2.5 font-semibold text-right">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {state.deployments.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-[#112240]/50">
                  <td className="py-2.5 pr-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {d.version}
                  </td>
                  <td className="py-2.5 pr-4 font-mono">{d.commitSha}</td>
                  <td className="py-2.5 pr-4 capitalize font-medium">{d.buildStatus}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold capitalize ${
                        d.status === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : d.status === 'failed'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {d.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {d.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                      {d.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{d.triggeredBy}</td>
                  <td className="py-2.5 font-mono tabular-metrics text-right">
                    {new Date(d.startedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
