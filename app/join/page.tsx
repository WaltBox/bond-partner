"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-context";
import { joinPartner } from "@/lib/api";

function JoinInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const { user, signUp } = useAuth();

  const [form, setForm] = React.useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const redeemed = React.useRef(false);

  // Once a user exists (fresh signup that didn't need verification, or a
  // returning verified user), redeem the join token and head to onboarding.
  React.useEffect(() => {
    if (!user || redeemed.current) return;
    redeemed.current = true;
    (async () => {
      try {
        if (token) await joinPartner(token);
      } catch {
        /* already a member, or invalid token — continue to onboarding regardless */
      }
      router.replace("/onboarding");
    })();
  }, [user, token, router]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signUp({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
      });
      // user is set → the effect above redeems the token + routes to onboarding.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account");
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <AuthShell title="Setting up your account">
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Linking you to your business…
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Join Bond"
      subtitle={token ? "Create your account to get started" : undefined}
    >
      {!token ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          This page needs an invite link. Ask your Bond contact for your join link.
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <Field id="name" label="Your name" value={form.name} onChange={set("name")} required />
        <Field id="email" label="Email" type="email" value={form.email} onChange={set("email")} required />
        <Field id="phone" label="Phone (optional)" type="tel" value={form.phone} onChange={set("phone")} />
        <Field
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={set("password")}
          required
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy || !token}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={onChange} required={required} />
    </div>
  );
}

export default function JoinPage() {
  return (
    <React.Suspense fallback={null}>
      <JoinInner />
    </React.Suspense>
  );
}
