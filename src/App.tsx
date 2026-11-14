import { useEffect, useState } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { api } from './api';
import { Layout } from './components/Layout';
import { auth, db, googleProvider, handleFirestoreError, testFirestoreConnection } from './firebase';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { AutoScalingPage } from './pages/AutoScalingPage';
import { DashboardPage } from './pages/DashboardPage';
import { DatabasePage } from './pages/DatabasePage';
import { DeploymentPage } from './pages/DeploymentPage';
import { InstancesPage } from './pages/InstancesPage';
import { LoadBalancerPage } from './pages/LoadBalancerPage';
import { LoginPage } from './pages/LoginPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { SettingsPage } from './pages/SettingsPage';
import type { PageKey, SystemSettings, SystemState } from './types';

function formatAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const message = err instanceof Error ? err.message : String(err);

  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google Sign-In window was closed before completing sign-in. Please try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    return `Domain "${window.location.hostname}" is not authorized in Firebase Authentication. Add it under Firebase Console → Authentication → Settings → Authorized domains.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google Sign-In provider is not enabled in Firebase Authentication. Enable Google under Firebase Console → Authentication → Sign-in method.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error while contacting Google Authentication. Check your connection and try again.';
  }
  return message || 'Google Sign-In failed.';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [page, setPage] = useState<PageKey>('dashboard');
  const [state, setState] = useState<SystemState | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const syncUserProfile = async (signedInUser: User) => {
    const profilePath = `users/${signedInUser.uid}`;
    try {
      await setDoc(
        doc(db, 'users', signedInUser.uid),
        {
          uid: signedInUser.uid,
          email: signedInUser.email || '',
          displayName: (signedInUser.displayName || signedInUser.email || 'Operator').slice(0, 120),
          ...(signedInUser.photoURL ? { photoURL: signedInUser.photoURL.slice(0, 512) } : {}),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (fsErr) {
      try {
        handleFirestoreError(fsErr, 'write', profilePath);
      } catch {
        // Profile sync is non-blocking once authenticated
      }
    }
  };

  useEffect(() => {
    void getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          void syncUserProfile(result.user);
        }
      })
      .catch((err) => {
        setAuthError(formatAuthError(err));
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        void testFirestoreConnection();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    let closed = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const loadInitial = async () => {
      try {
        const data = await api.getState();
        if (!closed) {
          setState(data);
          setError(null);
        }
      } catch (err) {
        if (!closed) setError((err as Error).message);
      }
    };

    const connectStream = () => {
      if (closed) return;
      source = new EventSource('/api/stream');
      source.onopen = () => {
        if (!closed) {
          setStreamConnected(true);
          setError(null);
        }
      };
      source.onmessage = (event) => {
        if (closed) return;
        try {
          const parsed = JSON.parse(event.data) as SystemState;
          setState(parsed);
          setStreamConnected(true);
          setError(null);
        } catch {
          // ignore keepalive payload
        }
      };
      source.onerror = () => {
        if (closed) return;
        setStreamConnected(false);
        source?.close();
        reconnectTimer = setTimeout(connectStream, 2000);
      };
    };

    void loadInitial();
    connectStream();

    return () => {
      closed = true;
      source?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [authReady, user]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(credential.user);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setAuthError(formatAuthError(redirectErr));
        }
      } else {
        setAuthError(formatAuthError(err));
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setState(null);
    setStreamConnected(false);
  };

  const handleAction = async (fn: () => Promise<{ state: SystemState }>) => {
    try {
      const res = await fn();
      setState(res.state);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#061020] text-slate-200 p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Initializing Authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onGoogleSignIn={() => void handleGoogleSignIn()}
        signingIn={signingIn}
        error={authError}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((d) => !d)}
      />
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#061020] text-slate-200 p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Connecting to Real-Time Cloud Stream...</p>
          {error && <p className="text-xs text-rose-400">Backend connection error: {error}</p>}
        </div>
      </div>
    );
  }

  const updateSettings = async (partial: Partial<SystemSettings>) => {
    await handleAction(() => api.updateSettings(partial));
  };

  const handleLiveBurst = async () => {
    try {
      const next = await api.sendLiveBurst(10);
      setState(next);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Layout
      currentPage={page}
      onNavigate={setPage}
      state={state}
      user={user}
      onSignOut={() => void handleSignOut()}
      streamConnected={streamConnected}
      darkMode={darkMode}
      onToggleTheme={() => setDarkMode((d) => !d)}
      onToggleSimulation={() =>
        void updateSettings({ simulationRunning: !state.settings.simulationRunning })
      }
      onStepSimulation={() => void handleAction(() => api.stepSimulation())}
    >
      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between gap-2">
          <span>Notice: {error}</span>
          <button onClick={() => setError(null)} className="underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {page === 'dashboard' && (
        <DashboardPage
          state={state}
          onNavigate={setPage}
          onToggleInstanceHealth={(id) => void handleAction(() => api.toggleInstanceHealth(id))}
          onTrafficPreset={(req) => void handleAction(() => api.setTraffic(req))}
          onManualScale={(action) => void handleAction(() => api.manualScale(action))}
          onSendLiveBurst={() => void handleLiveBurst()}
        />
      )}

      {page === 'monitoring' && (
        <MonitoringPage
          state={state}
          onSetTraffic={(req) => void handleAction(() => api.setTraffic(req))}
          onSendLiveBurst={() => void handleLiveBurst()}
        />
      )}

      {page === 'instances' && (
        <InstancesPage
          state={state}
          onAddInstance={() => void handleAction(() => api.addInstance())}
          onRemoveInstance={(id) => void handleAction(() => api.removeInstance(id))}
          onToggleHealth={(id) => void handleAction(() => api.toggleInstanceHealth(id))}
        />
      )}

      {page === 'autoscaling' && (
        <AutoScalingPage
          state={state}
          onManualScale={(action) => void handleAction(() => api.manualScale(action))}
          onToggleAutoScaling={(enabled) => void updateSettings({ autoScalingEnabled: enabled })}
          onSetTraffic={(req) => void handleAction(() => api.setTraffic(req))}
        />
      )}

      {page === 'loadbalancer' && (
        <LoadBalancerPage
          state={state}
          onChangeAlgorithm={(algo) => void updateSettings({ lbAlgorithm: algo })}
          onToggleInstanceHealth={(id) => void handleAction(() => api.toggleInstanceHealth(id))}
        />
      )}

      {page === 'database' && (
        <DatabasePage
          state={state}
          onChangePolicy={(policy) => void handleAction(() => api.setAccessPolicy(policy))}
          onTestAccess={async (source) => {
            const res = await api.testDbAccess(source);
            setState(res.state);
            return res.result;
          }}
        />
      )}

      {page === 'deployment' && (
        <DeploymentPage
          state={state}
          onDeploy={(version, simulateFailure) =>
            void handleAction(() => api.triggerDeployment(version, simulateFailure))
          }
        />
      )}

      {page === 'logs' && <ActivityLogsPage state={state} />}

      {page === 'settings' && (
        <SettingsPage
          state={state}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((d) => !d)}
          onSaveSettings={updateSettings}
        />
      )}
    </Layout>
  );
}
