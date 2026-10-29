import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { ROLE_LABELS, WRITER_ROLES } from '../config/constants';
import { enumOf } from '../schemas/common';
import type { Credentials, Result, Session, User } from '../types';
import { ok } from '../utils/results';
import { useApi } from './ApiContext';

const STORAGE_KEY = 'jigi.session';

const sessionSchema: z.ZodType<Session> = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    role: enumOf(ROLE_LABELS),
    active: z.boolean(),
    donorId: z.number().nullable(),
  }),
});

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
}

type AuthAction = { type: 'login'; user: User } | { type: 'logout' };

function reducer(_state: AuthState, action: AuthAction): AuthState {
  return action.type === 'login' ? { user: action.user } : { user: null };
}

interface AuthContextValue {
  user: User | null;
  /** Vrai pour l'administrateur et le gestionnaire ; le lecteur et le donateur sont en lecture seule. */
  canWrite: boolean;
  login: (credentials: Credentials) => Promise<Result<User>>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [state, dispatch] = useReducer(reducer, undefined, (): AuthState => {
    // Le jeton doit être connu de l'API avant les premiers effets des vues enfants,
    // qui s'exécutent avant ceux de ce composant : on le restaure donc ici, à l'initialisation.
    const stored = readSession();
    if (stored) api.setToken(stored.token);
    return { user: stored?.user ?? null };
  });

  const logout = useCallback(async () => {
    await api.logout();
    api.setToken(null);
    sessionStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'logout' });
  }, [api]);

  // Vérifie une seule fois, au démarrage, que la session restaurée est toujours valide.
  const restoredUser = state.user;
  useEffect(() => {
    if (!restoredUser) return;
    let cancelled = false;
    void api.me().then((result) => {
      if (!cancelled && !result.ok && result.error.status === 401) void logout();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- vérification unique au montage
  }, []);

  const login = useCallback(
    async (credentials: Credentials): Promise<Result<User>> => {
      const result = await api.login(credentials);
      if (!result.ok) return result;
      api.setToken(result.data.token);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
      dispatch({ type: 'login', user: result.data.user });
      return ok(result.data.user);
    },
    [api],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user: state.user, canWrite: state.user !== null && WRITER_ROLES.includes(state.user.role), login, logout }),
    [state.user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé à l’intérieur d’un <AuthProvider>.');
  return context;
}
