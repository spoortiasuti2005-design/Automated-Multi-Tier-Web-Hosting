import React from 'react';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  HeartPulse,
  Server,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import type { PageKey, SystemState } from '../types';

interface DashboardPageProps {
  state: SystemState;
  onNavigate: (page: PageKey) => void;
  onToggleInstanceHealth: (id: string) => void;
  onTrafficPreset: (reqPerMin: number) => void;
  onManualScale: (action: 'add' | 'remove') => void;
  onSendLiveBurst: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  state,
  onNavigate,
  onToggleInstanceHealth,
  onTrafficPreset,
  onManualScale,
  onSendLiveBurst,
}) => {
  const kpis = [
    {
      label: 'Incoming Traffic',
      value: `${state.totalRequestsPerMin.toLocaleString()} req/m`,
      sub: `Live HTTP: ${state.hostTelemetry.liveHttpRequestsPerMin} req/m (${state.hostTelemetry.liveHttpRequestsTotal} total)`,
      icon: TrendingUp,
      accent: 'text-teal-500',
    },
    {
      label: 'CPU Utilization',
      value: `${state.avgCpuUtilization}%`,
      sub: `Host Load: ${state.hostTelemetry.hostCpuLoadPct}% (${state.hostTelemetry.cpuCores} cores)`,
      icon: Cpu,
      accent:
        state.avgCpuUtilization > state.settings.scaleUpCpuThreshold
          ? 'text-rose-500'
          : 'text-teal-500',
    },
    {
      label: 'Memory Utilization',
      value: `${state.avgMemoryUtilization}%`,
      sub: `Node RSS: ${state.hostTelemetry.processRssMb} MB · Latency: ${state.avgResponseTimeMs} ms`,
      icon: HardDrive,
      accent: 'text-sky-500',
    },
    {
      label: 'Active Instances',
      value: `${state.activeInstanceCount}`,
      sub: `${state.healthyInstanceCount} healthy in ELB pool`,
      icon: Server,
      accent: 'text-indigo-500',
    },
    {
      label: 'Server Health',
      value: state.overallHealth,
      sub: 'Continuous ELB probes',
      icon: HeartPulse,
      accent:
        state.overallHealth === 'Healthy'
          ? 'text-emerald-500'
          : state.overallHealth === 'Degraded'
            ? 'text-amber-500'
            : 'text-rose-500',
    },
    {
      label: 'Scaling Status',
      value:
        state.scalingStatus === 'scaling_up'
          ? 'Scaling Up'
          : state.scalingStatus === 'scaling_down'
            ? 'Scaling Down'
            : state.scalingStatus === 'cooldown'
              ? 'Cooldown'
              : state.scalingStatus === 'paused'
                ? 'Paused'
                : 'Stable',
      sub: state.settings.autoScalingEnabled ? 'Auto-scaling active' : 'Auto-scaling paused',
      icon: Activity,
      accent: 'text-teal-500',
    },
    {
      label: 'Database Status',
      value: state.database.health,
      sub: `${state.database.activeConnections} conns · ${state.settings.accessPolicy === 'allow_all' ? 'Allow All' : 'VPC Only'}`,
      icon: Database,
      accent: 'text-emerald-500',
    },
    {
      label: 'System Availability',
      value: `${state.systemAvailability}%`,
      sub: `Uptime: ${state.hostTelemetry.processUptimeSec}s`,
      icon: ShieldCheck,
      accent: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workload & Real-Time Request Controls */}
      <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Live Workload &amp; Real-Time HTTP Controls
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Send real HTTP bursts to Express (<span className="font-mono">/api/work</span>) or adjust workload profiles to see real-time SSE scaling.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSendLiveBurst}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 text-[#061020] hover:bg-teal-400 transition whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Send 10 Live HTTP Requests</span>
          </button>
          <button
            onClick={() => onTrafficPreset(350)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 transition whitespace-nowrap"
          >
            Low Load (350 req/m)
          </button>
          <button
            onClick={() => onTrafficPreset(1200)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition whitespace-nowrap"
          >
            Baseline (1,200 req/m)
          </button>
          <button
            onClick={() => onTrafficPreset(2600)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition whitespace-nowrap"
          >
            Traffic Spike (2,600 req/m)
          </button>
          <button
            onClick={() => onManualScale('add')}
            disabled={state.activeInstanceCount >= state.settings.maxInstances}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0a192f] dark:bg-[#112240] text-white border border-slate-700 hover:opacity-90 disabled:opacity-40 transition whitespace-nowrap"
          >
            + Add Instance
          </button>
          <button
            onClick={() => onManualScale('remove')}
            disabled={state.activeInstanceCount <= state.settings.minInstances}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240] disabled:opacity-40 transition whitespace-nowrap"
          >
            - Remove Instance
          </button>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="surface-card p-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="text-xl font-bold mt-1 font-mono tabular-metrics text-slate-900 dark:text-white truncate">
                  {kpi.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-metrics">{kpi.sub}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-[#112240] shrink-0">
                <Icon className={`w-5 h-5 ${kpi.accent}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                CPU &amp; Memory Utilization (%)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time SSE stream updated every {state.settings.tickIntervalMs / 1000}s
              </p>
            </div>
            <button
              onClick={() => onNavigate('monitoring')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap"
            >
              Full Monitoring →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={state.metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a192f',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="cpuUsage"
                  name="CPU %"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.2}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="memoryUsage"
                  name="Memory %"
                  stroke="#38bdf8"
                  fill="#38bdf8"
                  fillOpacity={0.14}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Incoming Requests/Min vs Active Instances
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Load balancer throughput and ASG capacity
              </p>
            </div>
            <button
              onClick={() => onNavigate('autoscaling')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap"
            >
              Scaling History →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={state.metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 20]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a192f',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  isAnimationActive={false}
                  yAxisId="left"
                  type="monotone"
                  dataKey="requestsPerMin"
                  name="Requests/min"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.2}
                />
                <Area
                  isAnimationActive={false}
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="activeInstances"
                  name="Instances"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.14}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ArchitectureDiagram state={state} onToggleInstanceHealth={onToggleInstanceHealth} />
    </div>
  );
};
