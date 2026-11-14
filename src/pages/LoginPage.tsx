import React from 'react';
import { Cloud, Database, Moon, Network, Server, ShieldCheck, Sun } from 'lucide-react';

interface LoginPageProps {
  onGoogleSignIn: () => void;
  signingIn: boolean;
  error: string | null;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGoogleSignIn,
  signingIn,
  error,
  darkMode,
  onToggleTheme,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#061020] text-slate-900 dark:text-slate-100">
      {/* Minimal Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0a192f]/80 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30">
            <Cloud className="w-5 h-5 text-teal-500" />
          </div>
          <span className="text-sm font-bold tracking-tight whitespace-nowrap">
            CloudHost Control
          </span>
        </div>
        <button
          onClick={onToggleTheme}
          aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#112240] transition"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </header>

      {/* Main Split Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: System Summary */}
          <div className="lg:col-span-7 flex flex-col justify-between p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b192e]">
            <div className="space-y-4">
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                Multi-Tier Cloud Architecture Console
              </p>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug"
                style={{ textWrap: 'balance' }}
              >
                Automated Multi-Tier Web Application Hosting System
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Sign in with your Google account to access real-time telemetry streaming, dynamic auto-scaling policies, Layer-7 load balancing, database access controls, and automated CI/CD deployments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Network className="w-4 h-4 text-teal-500" />
                  <span>Load Balancing</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Routes traffic across healthy compute targets.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Server className="w-4 h-4 text-sky-500" />
                  <span>Auto Scaling</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Adjusts capacity dynamically on CPU thresholds.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <span>Tiered Security</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Real-time SSE streams and access policy testing.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Google Sign-In Card */}
          <div className="lg:col-span-5 flex flex-col justify-center p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b192e]">
            <div className="space-y-2 mb-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Operator Authentication</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Sign in to Console
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authenticate with Google to unlock the live hosting dashboard and control plane.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg border border-rose-500/35 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-[#112240] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-[#162b4d] disabled:opacity-50 transition shadow-sm"
            >
              {/* Google G SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>{signingIn ? 'Signing in with Google...' : 'Continue with Google'}</span>
            </button>

            <p className="mt-5 text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Protected by Firebase Authentication · Verified Google accounts only
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
