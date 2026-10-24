import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import mockData from '../mocks/mockData.json';
import type { AuthUser } from '../services/auth/authModels';

/**
 * Mirrors Flutter `SessionController` + `SessionStorage`.
 * localStorage stands in for SharedPreferences (same key and JSON shape).
 */

export interface AppUserProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  isGuest: boolean;
}

const STORAGE_KEY = mockData.session.storageKey;
const DEMO_USER: AppUserProfile = mockData.session.demoUser;

function load(): AppUserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw) as Partial<AppUserProfile>;
    return {
      id: json.id ?? '',
      name: json.name ?? 'User',
      email: json.email ?? null,
      phone: json.phone ?? null,
      businessName: json.businessName ?? null,
      isGuest: json.isGuest ?? false,
    };
  } catch {
    clear();
    return null;
  }
}

function save(user: AppUserProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Storage unavailable — session stays in memory only.
  }
}

function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface SessionState {
  user: AppUserProfile;
  isLoggedIn: boolean;
}

/** Equivalent of `SessionController.restore()` run before the app starts. */
function restore(): SessionState {
  const saved = load();
  if (saved?.isGuest) return { user: saved, isLoggedIn: true };
  return { user: DEMO_USER, isLoggedIn: false };
}

/** Equivalent of the AuthUser → AppUserProfile mapping in `setFromAuth`. */
function profileFromAuth(authUser: AuthUser): AppUserProfile {
  const fullName = authUser.fullName?.trim() ?? '';
  const name =
    fullName !== ''
      ? fullName
      : authUser.isGuest
        ? 'Guest'
        : authUser.email !== ''
          ? authUser.email.split('@')[0]
          : authUser.mobileNumber ?? 'User';
  return {
    id: authUser.id,
    name,
    email: authUser.email === '' ? null : authUser.email,
    phone: authUser.mobileNumber ?? null,
    businessName: authUser.businessName ?? null,
    isGuest: authUser.isGuest ?? false,
  };
}

interface SessionContextValue extends SessionState {
  setFromProfile: (user: AppUserProfile) => void;
  setFromAuth: (authUser: AuthUser) => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(restore);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          fullName: firebaseUser.displayName,
          mobileNumber: firebaseUser.phoneNumber,
        };
        const user = profileFromAuth(authUser);
        save(user);
        setState({ user, isLoggedIn: true });
        return;
      }

      setState((current) => {
        if (current.user.isGuest) return current;
        clear();
        return { user: DEMO_USER, isLoggedIn: false };
      });
    });
  }, []);

  const setFromProfile = useCallback((user: AppUserProfile) => {
    save(user);
    setState({ user, isLoggedIn: true });
  }, []);

  const setFromAuth = useCallback((authUser: AuthUser) => {
    const user = profileFromAuth(authUser);
    save(user);
    setState({ user, isLoggedIn: true });
  }, []);

  const logout = useCallback(async () => {
    if (auth.currentUser) await signOut(auth);
    clear();
    setState({ user: DEMO_USER, isLoggedIn: false });
  }, []);

  return (
    <SessionContext.Provider value={{ ...state, setFromProfile, setFromAuth, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
