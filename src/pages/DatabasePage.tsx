import React, { useState } from 'react';
import { CheckCircle2, Database, Lock, ShieldAlert, ShieldCheck, Unlock } from 'lucide-react';
import type { DbAccessTestResult, NetworkAccessPolicy, SystemState } from '../types';

interface DatabasePageProps {
  state: SystemState;
  onChangePolicy: (policy: NetworkAccessPolicy) => void;
  onTestAccess: (source: 'public_internet' | 'app_tier_vpc') => Promise<DbAccessTestResult>;
}

export const DatabasePage: React.FC<DatabasePageProps> = ({
  state,
  onChangePolicy,
  onTestAccess,
}) => {
  const [testResult, setTestResult] = useState<DbAccessTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const db = state.database;
  const storagePct = Math.round((db.storageUsedGb / db.storageTotalGb) * 100);
  const isAllowAll = state.settings.accessPolicy === 'allow_all';

  const runTest = async (source: 'public_internet' | 'app_tier_vpc') => {
    setTesting(true);
    try {
      const res = await onTestAccess(source);
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/15">
            <Database className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Database Management &amp; Network Access Control
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              {db.engine} · {db.subnetCidr} · {db.securityGroup}
            </p>
          </div>
        </div>

        {/* Interactive Policy Selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#061020] border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => onChangePolicy('allow_all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
              isAllowAll
                ? 'bg-teal-500 text-[#061020]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Allow All (0.0.0.0/0)</span>
          </button>
          <button
            onClick={() => onChangePolicy('vpc_isolated')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
              !isAllowAll
                ? 'bg-indigo-500 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Strict VPC Isolation</span>
          </button>
        </div>
      </div>

      {/* 5 Database Health & Security KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Database Health</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{db.health}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Multi-AZ Standby Ready</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Connections</p>
          <p className="text-xl font-bold font-mono tabular-metrics mt-1">
            {db.activeConnections} / {db.maxConnections}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAllowAll ? 'Public + VPC Pooled' : 'VPC App Tier Only'}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Response Time</p>
          <p className="text-xl font-bold font-mono tabular-metrics mt-1">{db.responseTimeMs} ms</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time query latency</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Storage Usage</p>
          <p className="text-xl font-bold font-mono tabular-metrics mt-1">
            {db.storageUsedGb} / {db.storageTotalGb} GB
          </p>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-[#112240] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${storagePct}%` }} />
          </div>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Security Status</p>
          <p className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-1">{db.tlsVersion}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{db.encryptionAtRest}</p>
        </div>
      </div>

      {/* Multi-Tier Security Boundary Summary */}
      <div className="surface-card p-5">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Multi-Tier Access &amp; Separation Policy
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="pt-2 space-y-1.5">
            <div className="font-bold text-sky-600 dark:text-sky-400">1. Presentation Tier (Public)</div>
            <p className="text-slate-600 dark:text-slate-300">
              Web application interface and incoming client HTTP/HTTPS requests with permissive CORS (<span className="font-mono">*</span>).
            </p>
          </div>
          <div className="pt-2 space-y-1.5">
            <div className="font-bold text-teal-600 dark:text-teal-400">2. Application Tier (10.0.2.0/24)</div>
            <p className="text-slate-600 dark:text-slate-300">
              Auto-scaled application instances ({state.activeInstanceCount} active) authorized to query PostgreSQL over TLS 1.3.
            </p>
          </div>
          <div className="pt-2 space-y-1.5">
            <div className="font-bold text-indigo-600 dark:text-indigo-400">
              3. Database Tier ({isAllowAll ? 'Open 0.0.0.0/0' : 'Isolated Subnet'})
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {isAllowAll
                ? `Allow All policy active: accepts both public and VPC connections (${db.allowedPublicAttempts} public queries allowed).`
                : `Strict VPC Isolation active: rejects public 0.0.0.0/0 connections (${db.blockedPublicAttempts} blocked attempts).`}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Access Verification Tool */}
      <div className="surface-card p-5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Interactive Connection &amp; Access Policy Tester
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test requests from the public internet (<span className="font-mono">0.0.0.0/0</span>) or Application Tier VPC (<span className="font-mono">10.0.2.0/24</span>) against {db.privateHost}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void runTest('public_internet')}
            disabled={testing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-teal-500/35 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 disabled:opacity-50 transition whitespace-nowrap"
          >
            {isAllowAll ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span>Test Public Request (0.0.0.0/0)</span>
          </button>
          <button
            onClick={() => void runTest('app_tier_vpc')}
            disabled={testing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 transition whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Test Application Tier Query (10.0.2.0/24)</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-1.5 ${
              testResult.allowed
                ? 'border-emerald-500/40 bg-emerald-500/10 text-slate-900 dark:text-slate-100'
                : 'border-rose-500/40 bg-rose-500/10 text-slate-900 dark:text-slate-100'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
              <span className="inline-flex items-center gap-1.5">
                {testResult.allowed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                )}
                Status {testResult.statusCode} · {testResult.allowed ? 'Connection Allowed' : 'Connection Blocked'}
              </span>
              {testResult.allowed && (
                <span className="font-mono tabular-metrics">Latency: {testResult.latencyMs} ms</span>
              )}
            </div>
            <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
              {testResult.source} → {testResult.destination}
            </div>
            <p className="text-slate-700 dark:text-slate-200">{testResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};
