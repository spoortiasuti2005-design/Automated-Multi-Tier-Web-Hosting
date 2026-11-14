import React from 'react';
import { Zap } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SystemState } from '../types';

interface MonitoringPageProps {
  state: SystemState;
  onSetTraffic: (reqPerMin: number) => void;
  onSendLiveBurst: () => void;
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({
  state,
  onSetTraffic,
  onSendLiveBurst,
}) => {
  const presets = [
    { label: 'Low (350)', value: 350 },
    { label: 'Baseline (1,200)', value: 1200 },
    { label: 'High (2,400)', value: 2400 },
    { label: 'Burst (5,000)', value: 5000 },
  ];

  return (
    <div className="space-y-6">
      <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Real-Time Cloud &amp; Host Telemetry Monitor
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live Server-Sent Events stream every {state.settings.tickIntervalMs / 1000}s combining simulated cluster load and live Node.js Express telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onSendLiveBurst}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 text-[#061020] hover:bg-teal-400 transition whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Send 10 Live HTTP Requests</span>
          </button>

          <div className="flex items-center gap-1.5">
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => onSetTraffic(p.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition whitespace-nowrap ${
                  Math.abs(state.settings.targetTrafficPerMin - p.value) < 60
                    ? 'bg-teal-500 text-[#061020] border-teal-500'
                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="traffic-slider"
              className="text-xs font-semibold font-mono tabular-metrics whitespace-nowrap"
            >
              {state.settings.targetTrafficPerMin.toLocaleString()} req/m
            </label>
            <input
              id="traffic-slider"
              type="range"
              min={50}
              max={10000}
              step={50}
              value={state.settings.targetTrafficPerMin}
              onChange={(e) => onSetTraffic(Number(e.target.value))}
              className="w-40 accent-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Cluster + Live Host Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { k: 'Cluster Traffic', v: `${state.totalRequestsPerMin.toLocaleString()} req/m` },
          { k: 'CPU Usage', v: `${state.avgCpuUtilization}%` },
          { k: 'Memory Usage', v: `${state.avgMemoryUtilization}%` },
          { k: 'Active Instances', v: `${state.activeInstanceCount}` },
          { k: 'Avg Response', v: `${state.avgResponseTimeMs} ms` },
          { k: 'Live HTTP Reqs', v: `${state.hostTelemetry.liveHttpRequestsTotal} (${state.hostTelemetry.lastRequestLatencyMs}ms)` },
        ].map((item) => (
          <div key={item.k} className="surface-card p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">{item.k}</div>
            <div className="text-lg font-bold mt-1 font-mono tabular-metrics text-slate-900 dark:text-white">
              {item.v}
            </div>
          </div>
        ))}
      </div>

      {/* Live OS Process Bar */}
      <div className="surface-card px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-metrics">
        <span>
          Host: <strong className="text-slate-900 dark:text-white">{state.hostTelemetry.hostname}</strong> ({state.hostTelemetry.platform})
        </span>
        <span>
          OS CPU Load: <strong className="text-teal-600 dark:text-teal-400">{state.hostTelemetry.hostCpuLoadPct}%</strong> ({state.hostTelemetry.cpuCores} cores)
        </span>
        <span>
          Host Memory: {state.hostTelemetry.hostMemoryUsedMb.toLocaleString()} / {state.hostTelemetry.hostMemoryTotalMb.toLocaleString()} MB
        </span>
        <span>Node RSS: {state.hostTelemetry.processRssMb} MB · Uptime: {state.hostTelemetry.processUptimeSec}s</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card p-5">
          <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">
            CPU, Memory &amp; Active Instances Over Time
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={state.metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
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
                <Legend />
                <Line
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="cpuUsage"
                  name="CPU (%)"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="memoryUsage"
                  name="Memory (%)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  isAnimationActive={false}
                  type="stepAfter"
                  dataKey="activeInstances"
                  name="Instances"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">
            Incoming Traffic &amp; Server Response Time (ms)
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={state.metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a192f',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend />
                <Line
                  isAnimationActive={false}
                  yAxisId="left"
                  type="monotone"
                  dataKey="requestsPerMin"
                  name="Requests / min"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  isAnimationActive={false}
                  yAxisId="right"
                  type="monotone"
                  dataKey="responseTimeMs"
                  name="Latency (ms)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
