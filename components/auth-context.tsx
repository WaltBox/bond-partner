"use client";

import * as React from "react";
import {
  authLogin,
  authLogout,
  authMe,
  authSignup,
  hasSession,
  USE_MOCK,
  type AuthUser,
} from "@/lib/api";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (args: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const FAKE_USER: AuthUser = { id: "mock", email: "demo@bond.app", role: "owner" };

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(USE_MOCK ? FAKE_USER : null);
  const [loading, setLoading] = React.useState(!USE_MOCK);

  React.useEffect(() => {
    if (USE_MOCK) return;
    if (!hasSession()) {
      setLoading(false);
      return;
    }
    let active = true;
    authMe()
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    if (USE_MOCK) {
      setUser(FAKE_USER);
      return;
    }
    const { user: u } = await authLogin(email, password);
    setUser(u);
  }, []);

  const signUp = React.useCallback<AuthState["signUp"]>(async ({ email, password, name, phone }) => {
    if (USE_MOCK) {
      setUser(FAKE_USER);
      return;
    }
    await authSignup({ email, password, username: name, phone });
    // Per the contract, log in after signup to obtain a session token.
    const { user: u } = await authLogin(email, password);
    setUser(u);
  }, []);

  const signOut = React.useCallback(async () => {
    setUser(null);
    if (USE_MOCK) return;
    await authLogout();
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
