import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, SESSION_EXPIRED_EVENT, type AuthState } from '../lib/api';
import type { OwnerProfile } from '../../shared/types';
import { useToast } from '../components/Toasts';

interface AuthCtx {
  state: AuthState | null;
  owner: OwnerProfile | null;
  error: string;
  refresh: () => Promise<void>;
  setOwner: (o: OwnerProfile | null) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const signOutLock = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setError('');
      setState(await api.authState());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the server.');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // Any owner request that comes back 401 drops the UI back to sign-in.
  useEffect(() => {
    const expire = () => setState(s => (s ? { ...s, owner: null } : s));
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
  }, []);

  const setOwner = useCallback((owner: OwnerProfile | null) => setState(s => (s ? { ...s, owner } : s)), []);
  const signOut = useCallback(async () => {
    if (signOutLock.current) return;
    signOutLock.current = true;
    try { await api.logout(); setOwner(null); }
    catch (e) { toast('error', `Could not sign out. ${e instanceof Error ? e.message : 'Check your connection and try again.'}`); }
    finally { signOutLock.current = false; }
  }, [setOwner, toast]);

  return (
    <Ctx.Provider value={{ state, owner: state?.owner ?? null, error, refresh, setOwner, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
