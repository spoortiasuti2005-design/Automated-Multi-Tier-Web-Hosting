import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Lock,
  Network,
  Server,
  ShieldAlert,
  Sliders,
  Unlock,
  XCircle,
} from 'lucide-react';
import type { ServerInstance, SystemState } from '../types';

type SelectedComponent =
  | { type: 'presentation' }
  | { type: 'load_balancer' }
  | { type: 'autoscaling' }
  | { type: 'monitoring' }
  | { type: 'automation' }
  | { type: 'database' }
  | { type: 'instance'; instance: ServerInstance };

interface ArchitectureDiagramProps {
  state: SystemState;
  onToggleInstanceHealth: (id: string) => void;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  state,
  onToggleInstanceHealth,
}) => {
  const [selected, setSelected] = useState<SelectedComponent>({ type: 'load_balancer' });

  const selectedInstance =
    selected.type === 'instance'
      ? state.instances.find((i) => i.id === selected.instance.id) ?? selected.instance
      : null;

  const isAllowAll = state.settings.accessPolicy === 'allow_all';

  return (
    <section className="surface-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Interactive Multi-Tier Cloud Architecture
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Users → Elastic Load Balancer → Auto-Scaling Group → Application Instances → Database Tier. Click any component for live state.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Traffic Flow
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
            <XCircle className="w-3.5 h-3.5" /> Drained / Blocked
          </span>
        </div>
      </div>

      {/* Interactive 3-Tier Topology Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 py-6 items-stretch">
        {/* Presentation Tier */}
        <div className="xl:col-span-2 flex flex-col justify-between p-4 rounded-xl border border-dashed border-sky-400/50 bg-sky-500/5">
          <div>
            <div className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-3">
              Tier 1 · Presentation
            </div>
            <button
              onClick={() => setSelected({ type: 'presentation' })}
              className={`w-full text-left p-3.5 rounded-lg border transition ${
                selected.type === 'presentation'
                  ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/25'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#112240] hover:border-teal-400'
              }`}
            >
              <Globe className="w-5 h-5 text-sky-500 mb-2" />
              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                Users &amp; Web UI
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-metrics">
                {state.totalRequestsPerMin.toLocaleString()} req/min
              </div>
            </button>
          </div>
          <div className="mt-4 pt-3 border-t border-sky-400/20 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span>{isAllowAll ? 'Open CORS + HTTPS' : 'HTTPS to ELB only'}</span>
          </div>
        </div>

        {/* Application Tier */}
        <div className="xl:col-span-7 flex flex-col justify-between p-4 rounded-xl border border-teal-500/35 bg-teal-500/5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              Tier 2 · Application Tier (Subnet 10.0.2.0/24)
            </span>
            <span className="text-xs font-mono tabular-metrics text-slate-600 dark:text-slate-300">
              Capacity: {state.activeInstanceCount} / {state.settings.maxInstances} nodes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <div className="md:col-span-4 flex flex-col gap-3">
              <button
                onClick={() => setSelected({ type: 'load_balancer' })}
                className={`text-left p-3.5 rounded-lg border transition flex-1 ${
                  selected.type === 'load_balancer'
                    ? 'border-teal-500 bg-teal-500/15 ring-2 ring-teal-500/25'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#112240] hover:border-teal-400'
                }`}
              >
                <Network className="w-5 h-5 text-teal-500 mb-2" />
                <div className="font-semibold text-sm text-slate-900 dark:text-white">
                  Elastic Load Balancer
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Policy: {state.settings.lbAlgorithm.replace('_', ' ')}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-mono tabular-metrics">
                  {state.healthyInstanceCount}/{state.activeInstanceCount} healthy targets
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelected({ type: 'monitoring' })}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    selected.type === 'monitoring'
                      ? 'border-teal-500 bg-teal-500/15'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#112240] hover:border-teal-400'
                  }`}
                >
                  <Activity className="w-4 h-4 text-teal-500 mb-1" />
                  <div className="text-xs font-semibold">Monitor</div>
                  <div className="text-[11px] font-mono tabular-metrics text-slate-500 dark:text-slate-400">
                    {state.avgCpuUtilization}% CPU
                  </div>
                </button>
                <button
                  onClick={() => setSelected({ type: 'automation' })}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    selected.type === 'automation'
                      ? 'border-teal-500 bg-teal-500/15'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#112240] hover:border-teal-400'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-sky-500 mb-1" />
                  <div className="text-xs font-semibold">Automation</div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {state.currentVersion}
                  </div>
                </button>
              </div>
            </div>

            <div className="md:col-span-8 flex flex-col p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/80 dark:bg-[#061020]/60">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setSelected({ type: 'autoscaling' })}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Auto-Scaling Group ({state.scalingStatus.replace('_', ' ')})</span>
                </button>
                <span className="text-[11px] font-mono tabular-metrics text-slate-500 dark:text-slate-400">
                  Policy: &gt;{state.settings.scaleUpCpuThreshold}% +1 · &lt;{state.settings.scaleDownCpuThreshold}% -1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                {state.instances.map((inst) => {
                  const isHealthy = inst.status === 'healthy';
                  const isSelected = selectedInstance?.id === inst.id;
                  return (
                    <button
                      key={inst.id}
                      onClick={() => setSelected({ type: 'instance', instance: inst })}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        isSelected
                          ? 'ring-2 ring-teal-500/30 border-teal-500 bg-teal-500/10'
                          : isHealthy
                            ? 'border-emerald-500/35 bg-emerald-500/5 hover:border-emerald-500'
                            : 'border-rose-500/40 bg-rose-500/10 hover:border-rose-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold truncate">
                          <Server
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isHealthy ? 'text-emerald-500' : 'text-rose-500'
                            }`}
                          />
                          <span className="truncate">{inst.name}</span>
                        </span>
                        <span
                          className={`text-[11px] font-medium shrink-0 ${
                            isHealthy
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isHealthy ? 'Healthy' : 'Unhealthy'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono tabular-metrics">
                        <span>CPU {inst.cpuUsage}%</span>
                        <span>{inst.requestsPerMin} req/m</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Traffic routed strictly to healthy instances</span>
            <span className="inline-flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-teal-500" />
              <span>TLS 1.3 database queries</span>
            </span>
          </div>
        </div>

        {/* Database Tier */}
        <div className="xl:col-span-3 flex flex-col justify-between p-4 rounded-xl border border-indigo-500/35 bg-indigo-500/5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                Tier 3 · Database
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  isAllowAll ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isAllowAll ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isAllowAll ? 'Allow All' : 'Isolated'}
              </span>
            </div>

            <button
              onClick={() => setSelected({ type: 'database' })}
              className={`w-full text-left p-3.5 rounded-lg border transition ${
                selected.type === 'database'
                  ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/25'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#112240] hover:border-teal-400'
              }`}
            >
              <Database className="w-5 h-5 text-indigo-500 mb-2" />
              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                PostgreSQL Tier
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {state.database.privateHost}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono tabular-metrics">
                {state.database.activeConnections} active conns · {state.database.responseTimeMs}ms
              </div>
            </button>
          </div>

          <div
            className={`mt-4 pt-3 border-t border-indigo-500/20 text-xs flex items-center gap-1.5 ${
              isAllowAll ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isAllowAll ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="tabular-metrics">
              {isAllowAll
                ? `Open 0.0.0.0/0 (${state.database.allowedPublicAttempts} public ok)`
                : `Public blocked (${state.database.blockedPublicAttempts} dropped)`}
            </span>
          </div>
        </div>
      </div>

      {/* Component Inspector Footer */}
      <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
        {selected.type === 'presentation' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold">Presentation Tier · Public Edge</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Handles user UI delivery and incoming HTTP/HTTPS requests with permissive CORS enabled, forwarding traffic to the Elastic Load Balancer.
              </p>
            </div>
            <span className="font-mono tabular-metrics text-xs font-semibold text-sky-600 dark:text-sky-400">
              {state.totalRequestsPerMin.toLocaleString()} req/min inbound
            </span>
          </div>
        )}

        {selected.type === 'load_balancer' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold">Elastic Load Balancer · Layer-7 Router</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distributes {state.totalRequestsPerMin.toLocaleString()} req/min across {state.healthyInstanceCount} healthy server instances using {state.settings.lbAlgorithm.replace('_', ' ')}.
              </p>
            </div>
            <span className="font-mono tabular-metrics text-xs font-semibold text-teal-600 dark:text-teal-400">
              Avg Response: {state.avgResponseTimeMs} ms
            </span>
          </div>
        )}

        {selected.type === 'autoscaling' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold">Auto-Scaling Group · Dynamic Capacity Controller</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluates cluster CPU every {state.settings.tickIntervalMs / 1000}s: adds +1 instance above {state.settings.scaleUpCpuThreshold}% CPU, removes 1 below {state.settings.scaleDownCpuThreshold}% CPU (Min {state.settings.minInstances}, Max {state.settings.maxInstances}).
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400 capitalize">
              State: {state.scalingStatus.replace('_', ' ')}
            </span>
          </div>
        )}

        {selected.type === 'monitoring' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold">Real-Time SSE Telemetry System</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Streams cluster CPU ({state.avgCpuUtilization}%), Memory ({state.avgMemoryUtilization}%), and live Node.js host metrics ({state.hostTelemetry.liveHttpRequestsPerMin} live HTTP req/m) over Server-Sent Events.
              </p>
            </div>
            <span className="font-mono tabular-metrics text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Availability: {state.systemAvailability}%
            </span>
          </div>
        )}

        {selected.type === 'automation' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold">Deployment &amp; Provisioning Automation</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Executes zero-downtime rolling updates across active Application Tier nodes and validates ELB 200 OK health checks before finalizing release {state.currentVersion}.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
              Active Release: {state.currentVersion}
            </span>
          </div>
        )}

        {selected.type === 'database' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold">
                Database Tier · {isAllowAll ? 'Allow All Access (0.0.0.0/0)' : 'VPC Isolated'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {state.database.engine} · {state.database.subnetCidr} ({state.database.securityGroup}). {state.database.encryptionAtRest} · {state.database.tlsVersion}.
              </p>
            </div>
            <span className="font-mono tabular-metrics text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {state.database.activeConnections}/{state.database.maxConnections} connections
            </span>
          </div>
        )}

        {selectedInstance && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold">
                {selectedInstance.name} · {selectedInstance.privateIp}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-metrics">
                AZ {selectedInstance.availabilityZone} · Version {selectedInstance.appVersion} · CPU {selectedInstance.cpuUsage}% · Memory {selectedInstance.memoryUsage}% · Traffic {selectedInstance.requestsPerMin} req/min
              </p>
            </div>
            <button
              onClick={() => onToggleInstanceHealth(selectedInstance.id)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0a192f] dark:bg-teal-500 text-white dark:text-[#061020] hover:opacity-90 transition whitespace-nowrap"
            >
              Simulate {selectedInstance.status === 'healthy' ? 'Health Failure' : 'Node Recovery'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
