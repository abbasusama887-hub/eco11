"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiLogin, apiLogout, apiRegister, changePassword, updateProfile, type AuthUser } from "@/app/lib/api";

// Re-export so callers that imported AuthUser from here still work
export type { AuthUser };

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: { name: string; email: string; phone: string }) => Promise<void>;
  changePassword: (payload: { current_password: string; new_password: string; confirm_password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** localStorage key that holds the DRF token string */
const TOKEN_KEY = "ndps_token";
/** localStorage key that caches the user profile to avoid a /me round-trip on every load */
const USER_KEY = "ndps_user";

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistSession(token: string, user: AuthUser): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // storage unavailable — session still works in memory this tab
  }
  // Cookie lets proxy.ts guard protected routes server-side
  document.cookie = "ndps_session=1; path=/; SameSite=Lax";
}

function clearSession(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
  document.cookie = "ndps_session=; path=/; max-age=0; SameSite=Lax";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // On mount: restore session from localStorage (no extra network request)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // corrupt cache — ignore, user will need to log in again
    } finally {
      setHydrated(true);
    }
  }, []);

  const signup = async (
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<void> => {
    const { token, user: profile } = await apiRegister(name, email, phone, password);
    persistSession(token, profile);
    setUser(profile);
  };

  const login = async (identifier: string, password: string): Promise<void> => {
    const { token, user: profile } = await apiLogin(identifier, password);
    persistSession(token, profile);
    setUser(profile);
  };

  const logout = (): void => {
    const token = readToken();
    if (token) {
      // Fire-and-forget — backend deletes the token row in Supabase
      apiLogout(token).catch(() => {});
    }
    clearSession();
    setUser(null);
  };

  const updateProfileDetails = async (payload: { name: string; email: string; phone: string }) => {
    const profile = await updateProfile(payload);
    setUser(profile);
    try { window.localStorage.setItem(USER_KEY, JSON.stringify(profile)); } catch { /* session state remains current */ }
  };

  const changePasswordDetails = async (payload: { current_password: string; new_password: string; confirm_password: string }) => {
    const response = await changePassword(payload);
    try { window.localStorage.setItem(TOKEN_KEY, response.token); } catch { /* token remains in memory only */ }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoggedIn: !!user, login, signup, logout, updateProfile: updateProfileDetails, changePassword: changePasswordDetails }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  // Don't render children until we've checked localStorage to avoid flicker
  if (!hydrated) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
