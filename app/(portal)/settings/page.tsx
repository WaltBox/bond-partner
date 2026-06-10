"use client";

import * as React from "react";
import { Building2, Tag, Zap, Check, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PartnerAvatar } from "@/components/partner-avatar";
import { getSettings, patchOffer, type Offer } from "@/lib/api";
import { useAsync } from "@/lib/api/use-async";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data, loading, error, reload } = useAsync(() => getSettings(), []);

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
              <CardDescription>How your business appears in Bond. Read-only in this preview.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <PartnerAvatar
                  name={data.partner.name}
                  logoUrl={data.partner.logoUrl}
                  className="size-20 rounded-2xl text-2xl"
                />
                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                  <Field icon={Building2} label="Business name" value={data.partner.name ?? "—"} />
                  <Field icon={Tag} label="Category" value={data.partner.category ?? "—"} />
                </div>
              </div>
            </CardContent>
          </Card>

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
