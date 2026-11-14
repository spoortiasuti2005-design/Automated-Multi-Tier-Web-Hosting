import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { CloudProviderMode, NetworkAccessPolicy, SystemSettings, SystemState } from '../types';

interface SettingsPageProps {
  state: SystemState;
  darkMode: boolean;
  onToggleTheme: () => void;
  onSaveSettings: (partial: Partial<SystemSettings>) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  state,
  darkMode,
  onToggleTheme,
  onSaveSettings,
}) => {
  const [form, setForm] = useState(state.settings);
  const [savedNotice, setSavedNotice] = useState('');
  const [adapterInfo, setAdapterInfo] = useState<{
    computeService: string;
    loadBalancerService: string;
    monitoringService: string;
    databaseService: string;
    statusMessage: string;
  } | null>(null);

  useEffect(() => {
    setForm(state.settings);
    void api.getCloudAdapter().then(setAdapterInfo).catch(() => {});
  }, [state.settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(form);
    setSavedNotice('Settings saved and streamed to live control plane.');
    setTimeout(() => setSavedNotice(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <form onSubmit={handleSave} className="surface-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              System &amp; Cloud Integration Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure Auto-Scaling thresholds, instance limits, real-time SSE tick rate, network access policy, and cloud adapter.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240] transition whitespace-nowrap"
          >
            Theme: {darkMode ? 'Dark Navy' : 'Light Slate'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label htmlFor="min-inst" className="block font-semibold mb-1.5">
              Minimum Instances
            </label>
            <input
              id="min-inst"
              type="number"
              min={1}
              max={10}
              value={form.minInstances}
              onChange={(e) => setForm({ ...form, minInstances: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] font-mono tabular-metrics"
            />
          </div>
          <div>
            <label htmlFor="max-inst" className="block font-semibold mb-1.5">
              Maximum Instances
            </label>
            <input
              id="max-inst"
              type="number"
              min={2}
              max={20}
              value={form.maxInstances}
              onChange={(e) => setForm({ ...form, maxInstances: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] font-mono tabular-metrics"
            />
          </div>
          <div>
            <label htmlFor="up-cpu" className="block font-semibold mb-1.5">
              Scale-Up CPU Threshold (%)
            </label>
            <input
              id="up-cpu"
              type="number"
              min={35}
              max={95}
              value={form.scaleUpCpuThreshold}
              onChange={(e) => setForm({ ...form, scaleUpCpuThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] font-mono tabular-metrics"
            />
          </div>
          <div>
            <label htmlFor="down-cpu" className="block font-semibold mb-1.5">
              Scale-Down CPU Threshold (%)
            </label>
            <input
              id="down-cpu"
              type="number"
              min={5}
              max={65}
              value={form.scaleDownCpuThreshold}
              onChange={(e) => setForm({ ...form, scaleDownCpuThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240] font-mono tabular-metrics"
            />
          </div>
          <div>
            <label htmlFor="tick-ms" className="block font-semibold mb-1.5">
              Real-Time Stream Interval
            </label>
            <select
              id="tick-ms"
              value={form.tickIntervalMs}
              onChange={(e) => setForm({ ...form, tickIntervalMs: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240]"
            >
              <option value={500}>Ultra-Fast (0.5 seconds)</option>
              <option value={1000}>Real-Time (1 second)</option>
              <option value={2000}>Fast (2 seconds)</option>
              <option value={3000}>Standard (3 seconds)</option>
            </select>
          </div>
          <div>
            <label htmlFor="access-policy" className="block font-semibold mb-1.5">
              Network &amp; Database Access Policy
            </label>
            <select
              id="access-policy"
              value={form.accessPolicy}
              onChange={(e) => setForm({ ...form, accessPolicy: e.target.value as NetworkAccessPolicy })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240]"
            >
              <option value="allow_all">Allow All (0.0.0.0/0 Open Access + CORS *)</option>
              <option value="vpc_isolated">Strict Private VPC Isolation (10.0.2.0/24 Only)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cloud-provider" className="block font-semibold mb-1.5">
              Cloud Infrastructure Adapter
            </label>
            <select
              id="cloud-provider"
              value={form.cloudProvider}
              onChange={(e) => setForm({ ...form, cloudProvider: e.target.value as CloudProviderMode })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#112240]"
            >
              <option value="simulated">Local Simulation Engine (Demo + Live Host Telemetry)</option>
              <option value="aws">AWS Cloud Adapter (EC2 / ALB / CloudWatch / RDS)</option>
              <option value="azure">Microsoft Azure Adapter (VMSS / AppGW / Monitor)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{savedNotice}</span>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 text-[#061020] hover:bg-teal-400 transition whitespace-nowrap"
          >
            Apply Settings
          </button>
        </div>
      </form>

      {adapterInfo && (
        <div className="surface-card p-5 space-y-3 text-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Active Cloud Provider Adapter Mapping
          </h4>
          <p className="text-teal-600 dark:text-teal-400 font-medium">{adapterInfo.statusMessage}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Compute:</span>{' '}
              <span className="text-slate-600 dark:text-slate-300">{adapterInfo.computeService}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Load Balancer:</span>{' '}
              <span className="text-slate-600 dark:text-slate-300">{adapterInfo.loadBalancerService}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Monitoring:</span>{' '}
              <span className="text-slate-600 dark:text-slate-300">{adapterInfo.monitoringService}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Database:</span>{' '}
              <span className="text-slate-600 dark:text-slate-300">{adapterInfo.databaseService}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
