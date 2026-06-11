"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { StickerButton, BrandField } from "@/components/brand";
import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in");
      setBusy(false);
    }
  }

  return (
    <AuthShell title="welcome back" subtitle="Sign in to your Bond partner portal">
      <form onSubmit={onSubmit} className="space-y-4">
        <BrandField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="you@restaurant.com"
        />
        <BrandField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
        {error ? <p className="text-sm font-semibold text-[#FF4D6D]">{error}</p> : null}
        <StickerButton type="submit" full disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Sign in
        </StickerButton>
      </form>
    </AuthShell>
  );
}
