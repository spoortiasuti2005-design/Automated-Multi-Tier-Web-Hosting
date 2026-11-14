import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, MinusCircle, Sliders } from 'lucide-react';
import type { SystemState } from '../types';

interface AutoScalingPageProps {
  state: SystemState;
  onManualScale: (action: 'add' | 'remove') => void;
  onToggleAutoScaling: (enabled: boolean) => void;
  onSetTraffic: (reqPerMin: number) => void;
}

export const AutoScalingPage: React.FC<AutoScalingPageProps> = ({
  state,
  onManualScale,
  onToggleAutoScaling,
  onSetTraffic,
}) => {
  const latestEvent = state.scalingHistory[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="surface-card p-5 lg:col-span-2 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-teal-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Automatic Scaling Policy Engine
              </h3>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={state.settings.autoScalingEnabled}
                onChange={(e) => onToggleAutoScaling(e.target.checked)}
                className="w-4 h-4 accent-teal-500"
              />
              <span>Auto-Scaling Enabled</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="py-2">
              <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ArrowUpCircle className="w-4 h-4" /> Scale Out Rule
              </div>
              <p className="mt-1.5 text-slate-600 dark:text-slate-300 tabular-metrics">
                CPU &gt; {state.settings.scaleUpCpuThreshold}% → Add +1 instance (Max {state.settings.maxInstances})
              </p>
            </div>
            <div className="py-2">
              <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <ArrowDownCircle className="w-4 h-4" /> Scale In Rule
              </div>
              <p className="mt-1.5 text-slate-600 dark:text-slate-300 tabular-metrics">
                CPU &lt; {state.settings.scaleDownCpuThreshold}% → Remove 1 instance (Min {state.settings.minInstances})
              </p>
            </div>
            <div className="py-2">
              <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4" /> Steady State
              </div>
              <p className="mt-1.5 text-slate-600 dark:text-slate-300 tabular-metrics">
                CPU {state.settings.scaleDownCpuThreshold}%–{state.settings.scaleUpCpuThreshold}% → Maintain capacity
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Current Activity:</span>{' '}
              <span className="font-bold text-teal-600 dark:text-teal-400 capitalize">
                {state.scalingStatus.replace('_', ' ')}
              </span>
              {state.cooldownTicksRemaining > 0 && (
                <span className="ml-2 text-amber-500 font-mono tabular-metrics">
                  · Cooldown {state.cooldownTicksRemaining} tick
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSetTraffic(2800)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition whitespace-nowrap"
              >
                Trigger High CPU (&gt;70%)
              </button>
              <button
                onClick={() => onSetTraffic(300)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 transition whitespace-nowrap"
              >
                Trigger Low CPU (&lt;30%)
              </button>
              <button
                onClick={() => onManualScale('add')}
                disabled={state.activeInstanceCount >= state.settings.maxInstances}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 text-[#061020] hover:bg-teal-400 disabled:opacity-40 transition whitespace-nowrap"
              >
                Manual +1
              </button>
              <button
                onClick={() => onManualScale('remove')}
                disabled={state.activeInstanceCount <= state.settings.minInstances}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240] disabled:opacity-40 transition whitespace-nowrap"
              >
                Manual -1
              </button>
            </div>
          </div>
        </div>

        <div className="surface-card p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Latest Scaling Activity</h4>
          <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Previous Count</span>
              <div className="text-2xl font-bold font-mono tabular-metrics mt-1">
                {latestEvent ? latestEvent.previousCount : state.activeInstanceCount}
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Current Count</span>
              <div className="text-2xl font-bold font-mono tabular-metrics text-teal-600 dark:text-teal-400 mt-1">
                {state.activeInstanceCount}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <div className="font-semibold text-slate-900 dark:text-white mb-1">Reason for Scaling</div>
            <p>
              {latestEvent
                ? latestEvent.reason
                : `Evaluating cluster CPU (${state.avgCpuUtilization}%) against ${state.settings.scaleUpCpuThreshold}% scale-out threshold.`}
            </p>
          </div>
        </div>
      </div>

      {/* Scaling History Table */}
      <div className="surface-card p-5">
        <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">Scaling Event History</h4>
        {state.scalingHistory.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No scaling events recorded yet. Wait for the next evaluation tick or inject a traffic change to test auto-scaling.
            </p>
            <button
              onClick={() => onSetTraffic(2800)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 text-[#061020] hover:bg-teal-400 transition"
            >
              Simulate Traffic Spike
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 pr-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 pr-4 font-semibold">Action</th>
                  <th className="py-2.5 pr-4 font-semibold">Instances</th>
                  <th className="py-2.5 pr-4 font-semibold">CPU at Event</th>
                  <th className="py-2.5 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {state.scalingHistory.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-[#112240]/50">
                    <td className="py-2.5 pr-4 font-mono tabular-metrics whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold capitalize whitespace-nowrap">
                      <span
                        className={
                          ev.action.includes('up') || ev.action.includes('add')
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-sky-600 dark:text-sky-400'
                        }
                      >
                        {ev.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-metrics font-bold whitespace-nowrap">
                      {ev.previousCount} → {ev.newCount}
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-metrics whitespace-nowrap">{ev.cpuAtEvent}%</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">{ev.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
