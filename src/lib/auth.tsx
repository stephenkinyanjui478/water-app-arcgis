/**
 * Client auth context. Holds the current session (JWT + user), exposes login /
 * register / logout, and a hook to guard protected pages.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { api, clearSession, getStoredUser, getToken, setSession, type SessionUser } from "@/lib/api";

interface AuthState {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; full_name?: string; phone?: string }) => Promise<void>;
  updateUser: (patch: Partial<SessionUser>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthResponse {
  token: string;
  user: SessionUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Rehydrate from localStorage on first mount (client only).
    if (getToken()) setUser(getStoredUser());
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/api/auth/login", { email, password });
    setSession(res.token, res.user);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; full_name?: string; phone?: string }) => {
      const res = await api.post<AuthResponse>("/api/auth/register", input);
      setSession(res.token, res.user);
      setUser(res.user);
    },
    []
  );

  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      const token = getToken();
      if (token) setSession(token, next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, ready, login, register, updateUser, logout }),
    [user, ready, login, register, updateUser, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Redirects to /login if there is no session once auth has rehydrated. */
export function useRequireAuth(): AuthState {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.ready && !auth.user) router.replace("/login");
  }, [auth.ready, auth.user, router]);
  return auth;
}
