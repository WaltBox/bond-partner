"use client";

import * as React from "react";
import { Building2, Tag, Zap, Check, AlertCircle, Loader2, CreditCard, X, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PartnerAvatar } from "@/components/partner-avatar";
import { useAuth } from "@/components/auth-context";
import { usePartner } from "@/components/partner-context";
import { getSettings, patchOffer, type Offer } from "@/lib/api";
import { useAsync } from "@/lib/api/use-async";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { bondFetch, partnerPath, getAccessToken } from "@/lib/api/client";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function uploadLogo(file: File): Promise<string> {
  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("logo", file);
  const res = await fetch(`${BASE}/api${partnerPath("/logo")}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: { logo_url: string };
    logo_url?: string;
    error?: string;
  };
  if (!res.ok || json.error) throw new Error(json.error ?? `Upload failed (${res.status})`);
  const url = json.data?.logo_url ?? json.logo_url;
  if (!url) throw new Error("Upload succeeded but no logo URL was returned.");
  return url;
}

function initials(s: string) {
  return (
    s
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export default function SettingsPage() {
  const { data, loading, error, reload } = useAsync(() => getSettings(), []);
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" description="Manage your partner profile and promotion economics." />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ) : error || !data ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="size-7 text-destructive" />
            <p className="text-sm text-muted-foreground">{error ?? "Couldn't load settings"}</p>
            <Button variant="outline" size="sm" onClick={reload}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Partner profile</CardTitle>
              <CardDescription>How your business appears in Bond. Your logo shows everywhere diners see you.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <LogoUpload name={data.partner.name} logoUrl={data.partner.logoUrl} />
                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                  <Field icon={Building2} label="Business name" value={data.partner.name ?? "—"} />
                  <Field icon={Tag} label="Category" value={data.partner.category ?? "—"} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>People with access to this Bond portal.</CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {initials((user.username as string) || user.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {(user.username as string) || user.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {user.role ?? "member"}
                  </Badge>
                </div>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                Team management is handled by the Bond team — reach out to add or remove access.
              </p>
            </CardContent>
          </Card>

          {/* Payment methods */}
          <PaymentMethodsCard />

          {/* Promotions */}
          <Card>
            <CardHeader>
              <CardTitle>Offers</CardTitle>
              <CardDescription>
                Set your <span className="font-medium text-foreground">cost to make</span> for each offer. This
                is your COGS — it powers the True Cost and Kept figures on your dashboard and tickets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.offers.map((offer, i) => (
                <React.Fragment key={offer.id}>
                  {i > 0 ? <Separator /> : null}
                  <OfferRow offer={offer} />
                </React.Fragment>
              ))}
              <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
                <Badge variant="muted" className="mr-2 align-middle font-normal">
                  Tip
                </Badge>
                Keeping cost-to-make accurate gives you the truest picture of what each payback really
                costs — and unlocks True Cost &amp; Kept on the dashboard.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function LogoUpload({ name, logoUrl }: { name?: string | null; logoUrl?: string | null }) {
  const { refresh } = usePartner();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(logoUrl ?? null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!LOGO_TYPES.includes(file.type)) {
      setError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      setPreview(url);
      refresh(); // propagate the new logo everywhere (sidebar, moments, previews)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Upload logo"
        className="group relative size-20 shrink-0 overflow-hidden rounded-2xl border border-border/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <PartnerAvatar name={name} logoUrl={preview} className="size-20 rounded-2xl text-2xl" />
        <span
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white transition-opacity",
            uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Camera className="size-5" />
              <span className="text-[10px] font-medium">Change</span>
            </>
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error ? (
        <p className="max-w-[8rem] text-center text-[11px] text-destructive">{error}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">JPEG/PNG/WebP, max 5MB</p>
      )}
    </div>
  );
}

function PaymentMethodsCard() {
  const [brand, setBrand]       = React.useState<string | null>(null);
  const [last4, setLast4]       = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const [loading, setLoading]   = React.useState(true);

  React.useEffect(() => {
    bondFetch<{ has_payment_method: boolean; payment_method: { brand: string; last4: string } | null }>(
      partnerPath("/billing")
    )
      .then(r => {
        setBrand(r.payment_method?.brand ?? null);
        setLast4(r.payment_method?.last4 ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function remove() {
    setRemoving(true);
    try {
      await bondFetch(partnerPath("/billing/payment-method"), { method: "DELETE" });
      setBrand(null);
      setLast4(null);
    } catch {
      // silent — card stays displayed
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment methods</CardTitle>
        <CardDescription>Cards linked to your account for billing.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-12 w-full rounded-xl" />
        ) : last4 ? (
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <CreditCard className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium capitalize">{brand} ···· {last4}</span>
            </div>
            <button
              onClick={remove}
              disabled={removing}
              aria-label="Remove card"
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 transition-colors"
            >
              {removing ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No card linked. Add one from the billing page.</p>
        )}
      </CardContent>
    </Card>
  );
}

function OfferRow({ offer }: { offer: Offer }) {
  const [cents, setCents] = React.useState<number | null>(offer.costToMakeCents);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(raw: string) {
    const trimmed = raw.trim();
    const next = trimmed === "" ? null : Math.max(0, Math.round(parseFloat(trimmed) * 100));
    const value = next != null && isNaN(next) ? null : next;
    if (value === cents) return;
    setStatus("saving");
    try {
      await patchOffer(offer.id, { kind: offer.kind, costToMakeCents: value });
      setCents(value);
      setStatus("saved");
      window.setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch {
      setStatus("error");
    }
  }

  const ratio = offer.paybackCents && cents != null ? cents / offer.paybackCents : null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {offer.kind === "super_perk" ? <Zap className="size-4" /> : <Tag className="size-4" />}
          </span>
          <p className="font-medium text-foreground">{offer.name ?? "Untitled offer"}</p>
          {!offer.active ? (
            <Badge variant="muted" className="font-normal">
              Inactive
            </Badge>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {ratio != null ? (
            <>
              Costs you <span className="font-medium text-foreground tabular">{formatCents(cents!)}</span> to
              fund a <span className="font-medium text-foreground tabular">{formatCents(offer.paybackCents!)}</span>{" "}
              payback — that&apos;s{" "}
              <span
                className={cn(
                  "font-medium",
                  ratio <= 0.34 ? "text-success" : ratio <= 0.6 ? "text-warning-foreground" : "text-destructive"
                )}
              >
                {Math.round(ratio * 100)}%
              </span>{" "}
              of payback value.
            </>
          ) : (
            <>Reward: {offer.rewardSummary}. Set a cost-to-make to track your True Cost.</>
          )}
        </p>
      </div>

      <div className="md:w-40">
        <Label className="text-xs text-muted-foreground">Reward</Label>
        <div className="mt-1.5 flex h-9 items-center rounded-md border border-transparent bg-secondary/60 px-3 text-sm font-medium text-foreground">
          {offer.rewardSummary}
        </div>
      </div>

      <div className="md:w-40">
        <Label htmlFor={`cost-${offer.id}`} className="text-xs text-muted-foreground">
          Cost to make
        </Label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            id={`cost-${offer.id}`}
            type="number"
            min="0"
            step="0.05"
            defaultValue={offer.costToMakeCents != null ? (offer.costToMakeCents / 100).toFixed(2) : ""}
            placeholder="—"
            onBlur={(e) => save(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="pl-6 pr-9 tabular"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {status === "saving" ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : status === "saved" ? (
              <Check className="size-4 text-success" />
            ) : status === "error" ? (
              <AlertCircle className="size-4 text-destructive" />
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1.5 flex h-9 items-center gap-2 rounded-md border border-input bg-secondary/40 px-3 text-sm text-foreground">
        <Icon className="size-4 text-muted-foreground" />
        {value}
      </div>
    </div>
  );
}
