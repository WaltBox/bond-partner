"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MapPin, Tag, Zap, PartyPopper } from "lucide-react";
import { PartnerAvatar } from "@/components/partner-avatar";
import {
  BrandBg,
  Wordmark,
  StickerCard,
  StickerButton,
  Heading,
  Caveat,
  stickerInput,
  stickerSm,
} from "@/components/brand";
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

const STEPS: { key: OnboardingStep; title: string }[] = [
  { key: "profile", title: "Business profile" },
  { key: "locations", title: "Locations" },
  { key: "offers", title: "Offer costs" },
  { key: "agreement", title: "Agreement" },
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

  return (
    <Shell>
      {authLoading || loading || !ob ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#1a1a1a]/60" style={{ fontWeight: 500 }}>
          <Loader2 className="size-5 animate-spin" /> loading…
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-[200px_1fr]">
          {/* Stepper */}
          <ol className="space-y-2.5">
            {STEPS.map((s, i) => {
              const complete = !!ob.steps?.[s.key];
              const active = current === s.key;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm",
                      stickerSm,
                      complete ? "bg-[#5DD96E] text-[#1a1a1a]" : active ? "bg-gradient-to-b from-[#FFE066] to-[#FFC93C]" : "bg-white text-[#1a1a1a]/50"
                    )}
                    style={{ fontWeight: 900 }}
                  >
                    {complete ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={cn("text-sm", active ? "text-[#1a1a1a]" : "text-[#1a1a1a]/60")}
                    style={{ fontWeight: active ? 900 : 500 }}
                  >
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
              <ProfileStep partner={partner} onDone={setOb} />
            ) : current === "locations" ? (
              <LocationsStep onDone={setOb} />
            ) : current === "offers" ? (
              <OffersStep onDone={setOb} />
            ) : current === "agreement" ? (
              <AgreementStep onDone={setOb} />
            ) : null}
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <BrandBg className="flex flex-col items-center px-4 py-10">
      <div className="mb-7">
        <Wordmark size={36} />
      </div>
      <StickerCard className="w-full max-w-3xl p-6 sm:p-8">
        <Heading className="mb-1 text-3xl">
          finish <Caveat color="#FFC93C">setting up</Caveat>
        </Heading>
        <p className="mb-6 text-sm text-[#1a1a1a]/70" style={{ fontWeight: 500 }}>
          A few quick steps and you&apos;ll be tracking what Bond drives you. 🌮
        </p>
        {children}
      </StickerCard>
    </BrandBg>
  );
}

function StepHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl text-[#1a1a1a]" style={{ fontFamily: "var(--font-baloo)", fontWeight: 800 }}>
        {title}
      </h2>
      {children ? (
        <p className="mt-1 text-sm text-[#1a1a1a]/70" style={{ fontWeight: 500 }}>
          {children}
        </p>
      ) : null}
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
      <StepHeader title="review your business profile">
        Set up by the Bond team. Confirm it looks right.
      </StepHeader>
      <div className={cn("flex items-center gap-4 rounded-2xl bg-[#EEF2FF] p-4", "border-[2.5px] border-[#1a1a1a]")}>
        <PartnerAvatar
          name={partner?.name}
          logoUrl={partner?.logoUrl}
          className={cn("size-14 rounded-xl text-lg", stickerSm)}
        />
        <div>
          <p className="text-[#1a1a1a]" style={{ fontWeight: 900 }}>
            {partner?.name ?? "—"}
          </p>
          <p className="text-sm capitalize text-[#1a1a1a]/70" style={{ fontWeight: 500 }}>
            {partner?.category ?? "—"}
          </p>
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
      <StepHeader title="confirm your locations">
        Your locations are managed by the Bond team. Confirm they&apos;re set up right.
      </StepHeader>
      <div className="flex items-center gap-3 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-[#EEF2FF] p-4 text-sm text-[#1a1a1a]/80" style={{ fontWeight: 500 }}>
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
      <StepHeader title="set your cost to make">
        For each offer, enter what the comped item costs you. This powers your True Cost &amp; Kept.
      </StepHeader>
      {loading ? (
        <div className="py-6 text-sm text-[#1a1a1a]/60" style={{ fontWeight: 500 }}>
          loading offers…
        </div>
      ) : loadError || !data ? (
        <p className="text-sm font-semibold text-[#FF4D6D]">{loadError ?? "Couldn't load offers"}</p>
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
    <div className="flex items-center justify-between gap-3 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-3">
      <div className="flex items-center gap-2.5">
        <span className={cn("flex size-8 items-center justify-center rounded-full bg-[#D4DEFF]", stickerSm)}>
          {offer.kind === "super_perk" ? <Zap className="size-4" /> : <Tag className="size-4" />}
        </span>
        <div>
          <p className="text-sm text-[#1a1a1a]" style={{ fontWeight: 900 }}>
            {offer.name ?? "Untitled offer"}
          </p>
          <p className="text-xs text-[#1a1a1a]/60" style={{ fontWeight: 500 }}>
            {offer.rewardSummary}
          </p>
        </div>
      </div>
      <div className="relative w-32 shrink-0">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#1a1a1a]/50">$</span>
        <input
          type="number"
          min="0"
          step="0.05"
          defaultValue={offer.costToMakeCents != null ? (offer.costToMakeCents / 100).toFixed(2) : ""}
          placeholder="—"
          onBlur={(e) => save(e.target.value)}
          className={cn(stickerInput, "pl-6 pr-8")}
          style={{ fontWeight: 500 }}
        />
        {saved ? <Check className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#5DD96E]" strokeWidth={3} /> : null}
      </div>
    </div>
  );
}

function AgreementStep({ onDone }: { onDone: (o: Onboarding) => void }) {
  const [agreed, setAgreed] = React.useState(false);
  const { run, busy, error } = useStepAction(() => signAgreement(), onDone);
  return (
    <div>
      <StepHeader title="partner agreement">Review and sign to finish onboarding.</StepHeader>
      <div className="h-40 overflow-y-auto rounded-2xl border-[2.5px] border-[#1a1a1a] bg-[#FFF5E8] p-4 text-xs leading-relaxed text-[#1a1a1a]/80" style={{ fontWeight: 500 }}>
        <p className="mb-2" style={{ fontWeight: 900 }}>
          Bond Partner Agreement
        </p>
        <p className="mb-2">
          By signing, you authorize Bond to deliver paybacks to diners on your behalf and to settle
          the corresponding amounts with you monthly. You agree to honor active offers at your
          locations and to keep your cost-to-make figures reasonably accurate.
        </p>
        <p>
          This preview records your name, agreement version, and timestamp. Going live in the Bond
          consumer app is subject to a separate Bond review.
        </p>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-[#1a1a1a]" style={{ fontWeight: 500 }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="size-5 rounded-md border-[2.5px] border-[#1a1a1a] accent-[#7B8FE8]"
        />
        I&apos;ve read and agree to the partner agreement.
      </label>
      <Actions busy={busy} error={error} label="Sign & finish" onClick={run} disabled={!agreed} />
    </div>
  );
}

function Finished({ onGo }: { onGo: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <div className={cn("flex size-14 items-center justify-center rounded-full bg-[#5DD96E]", stickerSm)}>
        <PartyPopper className="size-6 text-[#1a1a1a]" />
      </div>
      <Heading className="text-2xl">
        you&apos;re all <Caveat>set!</Caveat>
      </Heading>
      <p className="max-w-sm text-sm text-[#1a1a1a]/70" style={{ fontWeight: 500 }}>
        Onboarding complete. Bond will review your account before you go live — meanwhile, your
        dashboard is ready.
      </p>
      <StickerButton onClick={onGo}>Go to dashboard</StickerButton>
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
    <div className="mt-6 flex items-center justify-between gap-3">
      {error ? <p className="text-sm font-semibold text-[#FF4D6D]">{error}</p> : <span />}
      <StickerButton onClick={onClick} disabled={busy || disabled}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {label}
      </StickerButton>
    </div>
  );
}
