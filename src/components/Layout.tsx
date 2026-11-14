import React, { useState } from 'react';
import {
  Activity,
  Cloud,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Network,
  Pause,
  Play,
  RefreshCw,
  Server,
  Settings,
  Sliders,
  Sun,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { PageKey, SystemState } from '../types';

interface LayoutProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  state: SystemState;
  user: User;
  onSignOut: () => void;
  streamConnected: boolean;
  darkMode: boolean;
  onToggleTheme: () => void;
  onToggleSimulation: () => void;
  onStepSimulation: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'monitoring', label: 'Live Monitoring', icon: Activity },
  { key: 'instances', label: 'Server Instances', icon: Server },
  { key: 'autoscaling', label: 'Auto Scaling', icon: Sliders },
  { key: 'loadbalancer', label: 'Load Balancer', icon: Network },
  { key: 'database', label: 'Database Management', icon: Database },
  { key: 'deployment', label: 'Deployment Automation', icon: GitBranch },
  { key: 'logs', label: 'Activity Logs', icon: FileText },
  { key: 'settings', label: 'System Settings', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  state,
  user,
  onSignOut,
  streamConnected,
  darkMode,
  onToggleTheme,
  onToggleSimulation,
  onStepSimulation,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeNav = NAV_ITEMS.find((item) => item.key === currentPage);

  const healthColor =
    state.overallHealth === 'Healthy'
      ? 'text-emerald-600 dark:text-emerald-400'
      : state.overallHealth === 'Degraded'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#061020] text-slate-900 dark:text-slate-100">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-[#071326] text-slate-100 flex flex-col border-r border-slate-800/80 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-teal-500/15 border border-teal-400/25 shrink-0">
              <Cloud className="w-5 h-5 text-teal-400" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white truncate">
              CloudHost Control
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-teal-500 text-[#061020] font-semibold'
                    : 'text-slate-300 hover:bg-[#0f223d] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Operator Profile + Sign Out */}
        <div className="px-4 py-3.5 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Operator'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-slate-700 shrink-0 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-bold shrink-0">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user.displayName || 'Operator'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0f223d] transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Access Policy</span>
              <span className="font-mono text-teal-400">
                {state.settings.accessPolicy === 'allow_all' ? 'Allow All' : 'VPC Isolated'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Database</span>
              <span className="font-mono text-slate-200">
                {state.storageBackend === 'postgresql' ? 'PostgreSQL' : 'In-Memory'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Release</span>
              <span className="font-mono text-slate-200">{state.currentVersion}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#0a192f]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240]"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                Automated Multi-Tier Web Application Hosting System
              </span>
              <span className="hidden sm:inline text-slate-400" aria-hidden="true">
                /
              </span>
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {activeNav?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onToggleSimulation}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition whitespace-nowrap shrink-0 ${
                state.settings.simulationRunning
                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {state.settings.simulationRunning ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{state.settings.simulationRunning ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>

            <button
              onClick={onStepSimulation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240] transition whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Step Tick</span>
            </button>

            <button
              onClick={onToggleTheme}
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240] transition shrink-0"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </header>

        {/* Real-Time Telemetry Status Bar */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-[#071326]/70 px-4 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-semibold ${
                streamConnected
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {streamConnected ? 'Real-Time SSE Stream Connected' : 'Reconnecting SSE Stream'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {state.isSimulated ? 'Simulated Cloud Cluster + Live Host Metrics' : 'Live Cloud Telemetry'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Health: <strong className={healthColor}>{state.overallHealth}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-metrics">
              Access: {state.settings.accessPolicy === 'allow_all' ? 'Allow All (0.0.0.0/0)' : 'VPC Isolated'}
            </span>
          </div>
          <div className="font-mono tabular-metrics text-slate-500 dark:text-slate-400">
            Updated {new Date(state.serverTimestamp).toLocaleTimeString()} · {state.settings.tickIntervalMs / 1000}s tick
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
