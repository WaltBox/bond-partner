"use client";

import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { USE_MOCK } from "@/lib/api";

type AuthState = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (args: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<{ needsVerification: boolean }>;
  signOut: () => Promise<void>;
};

// In mock mode we pretend the user is always signed in.
const FAKE_SESSION = { access_token: "mock", user: { id: "mock", email: "demo@bond.app" } } as unknown as Session;

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(USE_MOCK ? FAKE_SESSION : null);
  const [loading, setLoading] = React.useState(!USE_MOCK);

  React.useEffect(() => {
    if (USE_MOCK || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    if (USE_MOCK || !supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = React.useCallback<AuthState["signUp"]>(async ({ email, password, name, phone }) => {
    if (USE_MOCK || !supabase) return { needsVerification: false };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });
    if (error) throw new Error(error.message);
    // No session back => email confirmation required.
    return { needsVerification: !data.session };
  }, []);

  const signOut = React.useCallback(async () => {
    if (USE_MOCK || !supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({ session, loading, signIn, signUp, signOut }),
    [session, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
