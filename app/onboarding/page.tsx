"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Building2, MapPin, Tag, FileSignature, PartyPopper, Zap } from "lucide-react";
import { BondMark } from "@/components/app-shell/logo";
import { PartnerAvatar } from "@/components/partner-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-context";
import { usePartner } from "@/components/partner-context";
import {
  getSettings,
  patchOffer,
  patchOnboarding,
  signAgreement,
  type Offer,
  type Onboarding,
  type OnboardingStep,
} from "@/lib/api";
import { useAsync } from "@/lib/api/use-async";
import { cn } from "@/lib/utils";

const STEPS: { key: OnboardingStep; title: string; icon: typeof Building2 }[] = [
  { key: "profile", title: "Business profile", icon: Building2 },
  { key: "locations", title: "Locations", icon: MapPin },
  { key: "offers", title: "Offer costs", icon: Tag },
  { key: "agreement", title: "Agreement", icon: FileSignature },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { partner, onboarding, loading, refresh } = usePartner();
  const [ob, setOb] = React.useState<Onboarding | null>(onboarding);

  React.useEffect(() => setOb(onboarding), [onboarding]);
  React.useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const done = ob?.status === "complete" || ob?.status === "live";
  const current = STEPS.find((s) => !ob?.steps?.[s.key])?.key ?? null;

  if (authLoading || loading || !ob) {
    return (
      <Shell>
        <Skeleton className="h-64 w-full" />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        {/* Stepper */}
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const complete = !!ob.steps?.[s.key];
            const active = current === s.key;
            return (
              <li
                key={s.key}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  active && "bg-secondary"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                    complete
                      ? "border-transparent bg-success text-success-foreground"
                      : active
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                  )}
                >
                  {complete ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={cn(complete ? "text-foreground" : "text-muted-foreground", active && "font-medium text-foreground")}>
                  {s.title}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Content */}
        <div className="min-h-[16rem]">
          {done ? (
            <Finished
              onGo={() => {
                refresh();
                router.push("/dashboard");
              }}
            />
          ) : current === "profile" ? (
            <ProfileStep
              partner={partner}
              onDone={(next) => setOb(next)}
            />
          ) : current === "locations" ? (
            <LocationsStep onDone={(next) => setOb(next)} />
          ) : current === "offers" ? (
            <OffersStep onDone={(next) => setOb(next)} />
          ) : current === "agreement" ? (
            <AgreementStep onDone={(next) => setOb(next)} />
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <BondMark className="size-8" />
        <span className="text-sm font-semibold tracking-tight">Partner Portal</span>
      </div>
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-foreground">Finish setting up</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          A few quick steps and you&apos;ll be ready to track what Bond drives you.
        </p>
        {children}
      </div>
    </div>
  );
}

function StepHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {children ? <p className="mt-1 text-sm text-muted-foreground">{children}</p> : null}
    </div>
  );
}

function useStepAction(action: () => Promise<Onboarding>, onDone: (o: Onboarding) => void) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      onDone(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };
  return { run, busy, error };
}

function ProfileStep({
  partner,
  onDone,
}: {
  partner: ReturnType<typeof usePartner>["partner"];
  onDone: (o: Onboarding) => void;
}) {
  const { run, busy, error } = useStepAction(() => patchOnboarding("profile"), onDone);
  return (
    <div>
      <StepHeader title="Review your business profile">
        Set up by the Bond team. Confirm it looks right.
      </StepHeader>
      <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-secondary/30 p-4">
        <PartnerAvatar name={partner?.name} logoUrl={partner?.logoUrl} className="size-14 rounded-xl text-lg" />
        <div>
          <p className="font-medium text-foreground">{partner?.name ?? "—"}</p>
          <p className="text-sm capitalize text-muted-foreground">{partner?.category ?? "—"}</p>
        </div>
      </div>
      <Actions busy={busy} error={error} label="Confirm & continue" onClick={run} />
    </div>
  );
}

function LocationsStep({ onDone }: { onDone: (o: Onboarding) => void }) {
  const { run, busy, error } = useStepAction(() => patchOnboarding("locations"), onDone);
  return (
    <div>
      <StepHeader title="Confirm your locations">
        Your locations are managed by the Bond team. Confirm they&apos;re set up correctly.
      </StepHeader>
      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground">
        <MapPin className="size-5 shrink-0" />
        Locations were configured during setup. Reach out to your Bond contact to add or change one.
      </div>
      <Actions busy={busy} error={error} label="Confirm & continue" onClick={run} />
    </div>
  );
}

function OffersStep({ onDone }: { onDone: (o: Onboarding) => void }) {
  const { data, loading, error: loadError } = useAsync(() => getSettings(), []);
  const { run, busy, error } = useStepAction(() => patchOnboarding("offers"), onDone);

  return (
    <div>
      <StepHeader title="Set your cost to make">
        For each offer, enter what the comped item costs you. This powers your True Cost &amp; Kept.
      </StepHeader>
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : loadError || !data ? (
        <p className="text-sm text-destructive">{loadError ?? "Couldn't load offers"}</p>
      ) : (
        <div className="space-y-3">
          {data.offers.map((o) => (
            <OfferCostRow key={o.id} offer={o} />
          ))}
        </div>
      )}
      <Actions busy={busy} error={error} label="Continue" onClick={run} disabled={loading} />
    </div>
  );
}

function OfferCostRow({ offer }: { offer: Offer }) {
  const [saved, setSaved] = React.useState(false);
  async function save(raw: string) {
    const t = raw.trim();
    const cents = t === "" ? null : Math.max(0, Math.round(parseFloat(t) * 100));
    try {
      await patchOffer(offer.id, { kind: offer.kind, costToMakeCents: Number.isNaN(cents) ? null : cents });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          {offer.kind === "super_perk" ? <Zap className="size-3.5" /> : <Tag className="size-3.5" />}
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{offer.name ?? "Untitled offer"}</p>
          <p className="text-xs text-muted-foreground">{offer.rewardSummary}</p>
        </div>
      </div>
      <div className="relative w-32">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          type="number"
          min="0"
          step="0.05"
          defaultValue={offer.costToMakeCents != null ? (offer.costToMakeCents / 100).toFixed(2) : ""}
          placeholder="—"
          onBlur={(e) => save(e.target.value)}
          className="pl-6 pr-8 tabular"
        />
        {saved ? <Check className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-success" /> : null}
      </div>
    </div>
  );
}

function AgreementStep({ onDone }: { onDone: (o: Onboarding) => void }) {
  const [agreed, setAgreed] = React.useState(false);
  const { run, busy, error } = useStepAction(() => signAgreement(), onDone);
  return (
    <div>
      <StepHeader title="Partner agreement">Review and sign to finish onboarding.</StepHeader>
      <div className="h-40 overflow-y-auto rounded-xl border border-border/70 bg-secondary/20 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Bond Partner Agreement</p>
        <p className="mb-2">
          By signing, you authorize Bond to deliver paybacks to diners on your behalf and to settle
          the corresponding amounts with you on a monthly basis. You agree to honor active offers at
          your locations and to keep your cost-to-make figures reasonably accurate.
        </p>
        <p>
          This preview records your name, agreement version, and timestamp. Going live in the Bond
          consumer app is subject to a separate Bond review.
        </p>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="size-4 rounded border-input accent-[hsl(var(--primary))]"
        />
        I&apos;ve read and agree to the partner agreement.
      </label>
      <Actions busy={busy} error={error} label="Sign &amp; finish" onClick={run} disabled={!agreed} />
    </div>
  );
}

function Finished({ onGo }: { onGo: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
        <PartyPopper className="size-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">You&apos;re all set</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Onboarding complete. Bond will review your account before you go live in the consumer app —
          meanwhile, your dashboard is ready.
        </p>
      </div>
      <Button onClick={onGo}>Go to dashboard</Button>
    </div>
  );
}

function Actions({
  busy,
  error,
  label,
  onClick,
  disabled,
}: {
  busy: boolean;
  error: string | null;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : <span />}
      <Button onClick={onClick} disabled={busy || disabled}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {label}
      </Button>
    </div>
  );
}
