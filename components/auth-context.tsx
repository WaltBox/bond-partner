"use client";

import * as React from "react";
import {
  authLogin,
  authLogout,
  authMe,
  partnerJoin,
  hasSession,
  USE_MOCK,
  type AuthUser,
} from "@/lib/api";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Redeem an invite token: create the account, join the company, and log in. */
  joinWithToken: (args: {
    token: string;
    email: string;
    password: string;
    phone: string;
    username?: string;
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

  const joinWithToken = React.useCallback<AuthState["joinWithToken"]>(async ({ token, email, password, phone, username }) => {
    if (USE_MOCK) {
      setUser(FAKE_USER);
      return;
    }
    // One partner call: creates the account, joins the company, returns a session.
    const { user: u } = await partnerJoin({ token, email, password, phone, username });
    setUser(u);
  }, []);

  const signOut = React.useCallback(async () => {
    setUser(null);
    if (USE_MOCK) return;
    await authLogout();
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({ user, loading, signIn, joinWithToken, signOut }),
    [user, loading, signIn, joinWithToken, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
