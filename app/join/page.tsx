"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { StickerButton, BrandField } from "@/components/brand";
import { useAuth } from "@/components/auth-context";
import { ApiError } from "@/lib/api";

function JoinInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const { user, joinWithToken } = useAuth();

  const [form, setForm] = React.useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Once we have a session, hand off to the portal — it resolves the company via
  // GET /api/partner/me and routes through onboarding as needed.
  React.useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setBusy(true);
    try {
      await joinWithToken({
        token,
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        username: form.name.trim() || undefined,
      });
      // user is set → the effect routes to the portal.
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Account already exists — send them to sign in instead.
        router.replace(`/login?email=${encodeURIComponent(form.email.trim())}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't create your account");
      setBusy(false);
    }
  }

  if (user) {
    return (
      <AuthShell title="setting you up">
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-[#1a1a1a]/70" style={{ fontWeight: 500 }}>
          <Loader2 className="size-4 animate-spin" /> linking you to your crib…
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="join bond" subtitle={token ? "Create your account to get started" : undefined}>
      {!token ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#FFF5E8] p-3 text-xs text-[#1a1a1a]" style={{ fontWeight: 500 }}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          This page needs an invite link. Ask your Bond contact for your join link.
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <BrandField id="name" label="Your name" value={form.name} onChange={set("name")} />
        <BrandField id="email" label="Email" type="email" value={form.email} onChange={set("email")} />
        <BrandField id="phone" label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
        <BrandField id="password" label="Password" type="password" value={form.password} onChange={set("password")} />
        {error ? <p className="text-sm font-semibold text-[#FF4D6D]">{error}</p> : null}
        <StickerButton type="submit" full disabled={busy || !token}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Create account
        </StickerButton>
      </form>
    </AuthShell>
  );
}

export default function JoinPage() {
  return (
    <React.Suspense fallback={null}>
      <JoinInner />
    </React.Suspense>
  );
}
