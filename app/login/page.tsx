"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { session, signIn } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

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
    <AuthShell title="Partner Portal" subtitle="Sign in to your Bond partner account">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@restaurant.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
