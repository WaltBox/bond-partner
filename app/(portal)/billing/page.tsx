"use client";

import * as React from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  CreditCard,
  Wallet,
  Check,
  Info,
  Bell,
  RefreshCw,
  Zap,
  ExternalLink,
  Settings2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { formatCents, formatCentsWhole } from "@/lib/format";
import { bondFetch, partnerPath } from "@/lib/api/client";

// ─── Stripe ───────────────────────────────────────────────────────────────────

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

// ─── Types ────────────────────────────────────────────────────────────────────

type CollectionMethod = "net_terms" | "auto_pay" | "prepaid";
type Track            = "prepaid" | "payg";
type PaygSettlement   = "net_terms" | "auto_pay";

interface BillingState {
  balance_cents:               number;
  status:                      "active" | "paused" | "past_due";
  paused_reason:               "pot_empty" | "payment_failed" | "limit_hit" | null;
  is_live:                     boolean;
  collection_method:           CollectionMethod | null;
  low_balance_threshold_cents: number | null;
  refill_target_cents:         number | null;
  prepaid_empty_action:        "pause" | "continue" | null;
  auto_pay_threshold_cents:    number | null;
  has_payment_method:          boolean;
  payment_method:              { brand: string; last4: string } | null;
}

interface PerformanceGoal {
  based_on_deposit_cents:  number;
  projected_sales_cents:   number;
  projected_return_cents:  number;
  progress_pct:            number;
}

interface PerformanceCycle {
  redemptions:             number;
  sales_generated_cents:   number;
  return_generated_cents:  number;
}

interface BillingPerformance {
  cycle_started_at: string | null;
  this_cycle:       PerformanceCycle;
  lifetime:         PerformanceCycle;
  goal:             PerformanceGoal | null;
}

interface LedgerEvent {
  id:           string;
  date:         string;
  type:         "redemption" | "payment" | "adjustment";
  source:       string;
  amount_cents: number;
  note:         string | null;
}

interface TransactionsResponse {
  transactions: LedgerEvent[];
  balance_cents: number;
  has_more:      boolean;
  next_cursor:   string | null;
}

interface Invoice {
  id:           string;
  period_start: string;
  period_end:   string;
  amount_cents: number;
  due_at:       string;
  status:       "open" | "paid" | "overdue";
  paid_at:      string | null;
  created_at:   string;
}

interface InvoicesResponse {
  invoices: Invoice[];
  summary:  { total: number; open: number; overdue: number; paid: number };
}

// ─── Fallback billing state (shown while fetching) ────────────────────────────

const EMPTY_BILLING: BillingState = {
  balance_cents:               0,
  status:                      "active",
  paused_reason:               null,
  is_live:                     false,
  collection_method:           "net_terms",
  low_balance_threshold_cents: null,
  refill_target_cents:         null,
  prepaid_empty_action:        null,
  auto_pay_threshold_cents:    null,
  has_payment_method:          false,
  payment_method:              null,
};

const TOPUP_PRESETS = [10000, 25000, 50000, 100000];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtMonth(start: string) {
  return new Date(start).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function parseCents(s: string) {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

function trackOf(method: CollectionMethod | null): Track {
  return method === "prepaid" ? "prepaid" : "payg";
}
function settlementOf(method: CollectionMethod | null): PaygSettlement {
  return method === "auto_pay" ? "auto_pay" : "net_terms";
}
function hasCard(b: BillingState) {
  return b.has_payment_method;
}

function cardLabel(b: BillingState) {
  if (!b.payment_method) return "Card on file";
  return `${b.payment_method.brand.charAt(0).toUpperCase() + b.payment_method.brand.slice(1)} ···· ${b.payment_method.last4}`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type = "success", onDone }: { message: string; type?: "success" | "info" | "error"; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info:    "border-blue-200 bg-blue-50 text-blue-800",
    error:   "border-red-200 bg-red-50 text-red-800",
  }[type];
  return (
    <div className={`fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg ${styles}`}>
      <CheckCircle2 className="size-4 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Status banner ────────────────────────────────────────────────────────────

function StatusBanner({
  status, reason, isLive, onLoadFunds, onUpdateCard,
}: {
  status: BillingState["status"];
  reason: BillingState["paused_reason"];
  isLive: boolean;
  onLoadFunds: () => void;
  onUpdateCard: () => void;
}) {
  if (isLive) return (
    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-2.5">
      <div className="size-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
      <p className="text-sm font-medium text-emerald-800">Program active — members can earn cashback at your restaurant.</p>
    </div>
  );

  if (status === "active") return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Program paused — load funds to go live</p>
          <p className="text-xs text-amber-700/90 mt-0.5">Your prepaid balance is empty. Members can't earn cashback until you add funds.</p>
        </div>
      </div>
      <Button size="sm" onClick={onLoadFunds} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs h-8">Load funds</Button>
    </div>
  );

  if (status === "paused") {
    if (reason === "pot_empty") return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Program paused — balance empty</p>
            <p className="text-xs text-amber-700/90 mt-0.5">Your deals are hidden from Bond users until you load funds.</p>
          </div>
        </div>
        <Button size="sm" onClick={onLoadFunds} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs h-8">Load funds</Button>
      </div>
    );
    if (reason === "payment_failed") return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Program paused — payment failed</p>
            <p className="text-xs text-amber-700/90 mt-0.5">We're retrying automatically. If this keeps happening, update your card.</p>
          </div>
        </div>
        <Button size="sm" onClick={onUpdateCard} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs h-8">Update card</Button>
      </div>
    );
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Program paused — credit limit reached</p>
          <p className="text-xs text-amber-700/90 mt-0.5">Contact Bond support to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <XCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-900">Account past due</p>
        <p className="text-xs text-red-700/90 mt-0.5">Your deals are hidden from users. Please contact Bond support immediately.</p>
      </div>
    </div>
  );
}

// ─── How you pay selector ─────────────────────────────────────────────────────

function HowYouPaySelector({
  track, onTrackClick,
}: {
  track: Track;
  onTrackClick: (t: Track) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">How you pay</p>
      <div className="flex gap-3 max-w-sm">
        {(["prepaid", "payg"] as Track[]).map(t => {
          const isActive = t === track;
          const label    = t === "prepaid" ? "Prepaid" : "Pay as you go";
          const tagline  = t === "prepaid" ? "Load funds upfront. Program runs while balance lasts." : "Tab accrues as members earn. You choose how to settle.";
          const Icon     = t === "prepaid" ? Wallet : CreditCard;
          return (
            <button
              key={t}
              onClick={() => onTrackClick(t)}
              className={[
                "relative flex w-full items-center gap-3 rounded-2xl border-[2.5px] px-4 py-3 text-left transition-all",
                isActive
                  ? "border-[#1a1a1a] bg-[#FFC93C] shadow-[4px_4px_0_0_#1a1a1a] hover:shadow-[2px_2px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px]"
                  : "border-[#1a1a1a]/20 bg-secondary/40 hover:border-[#1a1a1a]/40 hover:bg-secondary/70",
              ].join(" ")}
            >
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl border-2 ${isActive ? "border-[#1a1a1a] bg-white" : "border-[#1a1a1a]/20 bg-white/60"}`}>
                <Icon className={`size-4 ${isActive ? "text-[#1a1a1a]" : "text-[#1a1a1a]/30"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-extrabold truncate ${isActive ? "text-[#1a1a1a]" : "text-[#1a1a1a]/40"}`} style={{ letterSpacing: "-0.02em" }}>{label}</p>
                <p className={`text-[11px] leading-snug truncate ${isActive ? "text-[#1a1a1a]/70" : "text-[#1a1a1a]/30"}`}>{tagline}</p>
              </div>
              {isActive && (
                <div className="shrink-0 flex size-5 items-center justify-center rounded-full bg-[#1a1a1a]">
                  <Check className="size-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stripe card form (inside Elements context) ───────────────────────────────

function StripeCardForm({ clientSecret, onSuccess, onError }: {
  clientSecret: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setBusy(true);
    const { error } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card },
    });
    setBusy(false);
    if (error) {
      onError(error.message ?? "Card setup failed.");
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-xl border border-border bg-card px-3 py-3.5">
        <CardElement options={{ style: { base: { fontSize: "14px", color: "#1a1a1a", "::placeholder": { color: "#9ca3af" } } } }} />
      </div>
      <Button type="submit" size="sm" className="w-full h-9 text-xs" disabled={!stripe || busy}>
        {busy ? <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Saving card…</> : "Save card"}
      </Button>
    </form>
  );
}

// ─── Card section (handles both new add and existing) ─────────────────────────

function CardSection({ billing, clientSecret, onSetupComplete }: {
  billing: BillingState;
  clientSecret: string | null;
  onSetupComplete: () => void;
}) {
  if (hasCard(billing)) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/30 px-4 py-3">
        <CreditCard className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{cardLabel(billing)}</span>
      </div>
    );
  }

  if (!clientSecret) return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      Loading card setup…
    </div>
  );

  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm
        clientSecret={clientSecret}
        onSuccess={onSetupComplete}
        onError={() => {}}
      />
    </Elements>
  );
}

// ─── Sheet: Replace card ─────────────────────────────────────────────────────

function ReplaceCardSheet({
  open, onClose, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientSecret, setCs] = React.useState<string | null>(null);
  const [err, setErr]         = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) { setCs(null); setErr(null); return; }
    bondFetch<{ client_secret: string }>(partnerPath("/billing/setup-intent"), { method: "POST" })
      .then(r => setCs(r.client_secret))
      .catch(() => setErr("Couldn't start card setup. Try again."));
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C]">
              <CreditCard className="size-4 text-[#1a1a1a]" />
            </div>
            <div>
              <SheetTitle>Replace card</SheetTitle>
              <SheetDescription className="text-xs">Your old card will be removed automatically.</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 px-6 py-5">
          {err && <p className="text-sm text-red-600">{err}</p>}
          {!err && !clientSecret && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          )}
          {clientSecret && (
            <Elements stripe={stripePromise}>
              <StripeCardForm
                clientSecret={clientSecret}
                onSuccess={() => { onSuccess(); onClose(); }}
                onError={msg => setErr(msg)}
              />
            </Elements>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Card management section ──────────────────────────────────────────────────

function CardManagementSection({
  billing, onRefresh,
}: {
  billing: BillingState;
  onRefresh: () => Promise<void>;
}) {
  const [replaceSheet, setReplaceSheet] = React.useState(false);

  return (
    <>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Payment method</p>
        {hasCard(billing) ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2.5">
              <CreditCard className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">{cardLabel(billing)}</span>
            </div>
            <button
              onClick={() => setReplaceSheet(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Replace
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <CreditCard className="size-4 text-muted-foreground/50 shrink-0" />
              <span className="text-sm text-muted-foreground">No card on file</span>
            </div>
            <button
              onClick={() => setReplaceSheet(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Add card
            </button>
          </div>
        )}
      </div>

      <ReplaceCardSheet
        open={replaceSheet}
        onClose={() => setReplaceSheet(false)}
        onSuccess={onRefresh}
      />
    </>
  );
}

// ─── Funding projection widget ────────────────────────────────────────────────

interface FundingProjectionData {
  promotion:         { id: string; name: string } | null;
  avg_group_size:    number;
  group_size_source: "history" | "default";
  projection: {
    amount_cents:           number;
    redemptions_funded:     number;
    people_per_reward:      number;
    guaranteed_sales_cents: number;
    real_cost_cents:        number;
    minimum_return_cents:   number;
  } | null;
  reason?: string;
}

function fmtFloor(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function FundingProjection({ amountCents }: { amountCents: number }) {
  const [data, setData]       = React.useState<FundingProjectionData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!amountCents) { setData(null); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await bondFetch<FundingProjectionData>(
          partnerPath("/billing/funding-projection"),
          { method: "POST", body: JSON.stringify({ amount_cents: amountCents }) }
        );
        setData(res);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [amountCents]);

  if (!amountCents) return null;
  if (loading && !data) return (
    <div className="rounded-xl border-[2px] border-[#1a1a1a] bg-card p-4 space-y-3 shadow-[3px_3px_0_0_#1a1a1a] animate-pulse">
      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Projection</p>
      <div className="h-3 w-40 rounded bg-muted" />
      <div className="h-6 w-28 rounded bg-muted" />
      <div className="h-3 w-52 rounded bg-muted" />
    </div>
  );
  if (!data?.projection) return null;

  const { projection, promotion, avg_group_size, group_size_source } = data;

  return (
    <div className={`rounded-xl border-[2px] border-[#1a1a1a] bg-card p-4 space-y-3 shadow-[3px_3px_0_0_#1a1a1a] transition-opacity ${loading ? "opacity-60" : ""}`}>
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">This funds your</p>
        <p className="text-sm font-bold mt-0.5">"{promotion?.name}"</p>
      </div>

      <p className="text-xs text-muted-foreground">~{projection.redemptions_funded} redemptions</p>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Guaranteed sales</span>
          <span className="font-semibold tabular-nums">{fmtFloor(projection.guaranteed_sales_cents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Your real cost</span>
          <span className="font-semibold tabular-nums">− {fmtFloor(projection.real_cost_cents)}</span>
        </div>
        <div className="h-px bg-border/60" />
        <div className="flex justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Minimum return</span>
          <span className="text-base font-black tabular-nums">{fmtFloor(projection.minimum_return_cents)}</span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground leading-snug">
        {group_size_source === "history"
          ? `The floor — based on your average table of ${avg_group_size}. Only goes up as guests order more.`
          : "Conservative estimate until you have redemption data — your real numbers will likely be higher."}
      </p>
    </div>
  );
}

// ─── Sheet: Switch to Prepaid ─────────────────────────────────────────────────

function SwitchToPrepaidSheet({
  open, billing, isAlreadyPrepaid, onClose, onSuccess, onSetupComplete,
}: {
  open: boolean;
  billing: BillingState;
  isAlreadyPrepaid: boolean;
  onClose: () => void;
  onSuccess: (amount: number, config: { low_balance_threshold_cents: number; refill_target_cents: number; prepaid_empty_action: "pause" | "continue" }) => Promise<void>;
  onSetupComplete: () => void;
}) {
  const [amount, setAmount]     = React.useState<number | null>(50000);
  const [custom, setCustom]     = React.useState("");
  const [autoReload, setAutoReload] = React.useState(false);
  const [threshold, setThreshold] = React.useState("50");
  const [refill, setRefill]     = React.useState("500");
  const [clientSecret, setCs]   = React.useState<string | null>(null);
  const [busy, setBusy]         = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (hasCard(billing)) return;
    bondFetch<{ client_secret: string }>(partnerPath("/billing/setup-intent"), { method: "POST" })
      .then(r => setCs(r.client_secret))
      .catch(() => {});
  }, [open, billing]);

  const fundAmount = custom ? parseCents(custom) : (amount ?? 0);
  const cardReady  = hasCard(billing) || !!clientSecret;
  const canSubmit  = fundAmount >= 1000 && hasCard(billing);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    await onSuccess(fundAmount, {
      low_balance_threshold_cents: parseCents(threshold) || 5000,
      refill_target_cents:         parseCents(refill) || 50000,
      prepaid_empty_action:        autoReload ? "continue" : "pause",
    });
    setBusy(false);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C]">
              <Wallet className="size-4 text-[#1a1a1a]" />
            </div>
            <div>
              <SheetTitle>{isAlreadyPrepaid ? "Add funds" : "Switch to Prepaid"}</SheetTitle>
              <SheetDescription className="text-xs">{isAlreadyPrepaid ? "Funds are added to your balance instantly." : "Load funds to get started. Program runs while balance lasts."}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Load funds */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-foreground">Load funds</Label>
            <div className="grid grid-cols-4 gap-2">
              {TOPUP_PRESETS.map(p => (
                <button key={p} onClick={() => { setAmount(p); setCustom(""); }}
                  className={["rounded-lg border py-2.5 text-sm font-semibold transition-colors",
                    amount === p && !custom ? "border-[#1a1a1a] bg-[#FFC93C] text-[#1a1a1a]" : "border-border bg-secondary/40 text-foreground hover:bg-secondary"].join(" ")}>
                  {formatCents(p)}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input className="pl-7 h-9 text-sm" placeholder="Custom amount" value={custom} onChange={e => { setCustom(e.target.value); setAmount(null); }} type="number" min="10" />
            </div>
          </div>

          <FundingProjection amountCents={fundAmount} />

          {/* When balance runs low */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-foreground">When balance runs low</Label>
            <div className="grid grid-cols-2 gap-2">
              {([false, true] as const).map(v => (
                <button key={String(v)} onClick={() => setAutoReload(v)}
                  className={["flex flex-col items-start gap-1 rounded-xl border-[2px] p-3 text-left transition-all",
                    autoReload === v ? "border-[#1a1a1a] bg-[#FFC93C]/20" : "border-border hover:border-[#1a1a1a]/30"].join(" ")}>
                  <div className="flex items-center gap-1.5">
                    {v ? <RefreshCw className="size-3.5" /> : <Bell className="size-3.5" />}
                    <span className="text-xs font-semibold">{v ? "Auto-reload" : "Notify me"}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-tight">{v ? "Card charged to refill automatically." : "You'll get an alert to reload manually."}</span>
                </button>
              ))}
            </div>
            {autoReload && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Reload when below</Label>
                  <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input className="pl-7 h-9 text-sm" value={threshold} onChange={e => setThreshold(e.target.value)} type="number" placeholder="50" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Reload up to</Label>
                  <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input className="pl-7 h-9 text-sm" value={refill} onChange={e => setRefill(e.target.value)} type="number" placeholder="500" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Payment method</Label>
            <CardSection billing={billing} clientSecret={clientSecret} onSetupComplete={onSetupComplete} />
            {!hasCard(billing) && cardReady && (
              <p className="text-[11px] text-muted-foreground">Save your card to continue.</p>
            )}
          </div>

          {/* Summary */}
          {fundAmount > 0 && hasCard(billing) && (
            <div className="rounded-xl border border-border/70 bg-secondary/20 p-3.5 space-y-2">
              <SummaryRow label="Loading"><span className="font-bold text-foreground">{formatCents(fundAmount)}</span></SummaryRow>
              <SummaryRow label="Charged to">{cardLabel(billing)}</SummaryRow>
              <SummaryRow label="When low">{autoReload ? "Auto-reloads" : "Sends alert"}</SummaryRow>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 px-6 py-4">
          <YellowButton disabled={!canSubmit || busy} onClick={submit}>
            {busy ? (isAlreadyPrepaid ? "Loading…" : "Switching…") : fundAmount > 0 && hasCard(billing) ? (isAlreadyPrepaid ? `Add ${formatCents(fundAmount)}` : `Load ${formatCents(fundAmount)} & switch to Prepaid`) : hasCard(billing) ? "Enter an amount to continue" : "Save a card to continue"}
          </YellowButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sheet: PayG setup ────────────────────────────────────────────────────────

const SETTLEMENT_OPTIONS: { id: PaygSettlement; label: string; desc: string; Icon: React.ElementType }[] = [
  { id: "net_terms", label: "Invoice",  desc: "We send you a monthly bill. Pay by the due date. No card required.", Icon: FileText },
  { id: "auto_pay",  label: "Autopay",  desc: "Add a card. We charge it automatically when your tab hits your threshold.", Icon: Zap },
];

function PaygSetupSheet({
  open, billing, current, onClose, onSuccess, onSetupComplete,
}: {
  open: boolean;
  billing: BillingState;
  current: PaygSettlement;
  onClose: () => void;
  onSuccess: (settlement: PaygSettlement, threshold: number) => Promise<void>;
  onSetupComplete: () => void;
}) {
  const [selected, setSelected]   = React.useState<PaygSettlement>(current);
  const [threshold, setThreshold] = React.useState("250");
  const [clientSecret, setCs]     = React.useState<string | null>(null);
  const [busy, setBusy]           = React.useState(false);

  const needsCard = selected === "auto_pay" && !hasCard(billing);

  React.useEffect(() => { if (open) setSelected(current); }, [open, current]);

  React.useEffect(() => {
    if (!open || !needsCard) return;
    bondFetch<{ client_secret: string }>(partnerPath("/billing/setup-intent"), { method: "POST" })
      .then(r => setCs(r.client_secret))
      .catch(() => {});
  }, [open, needsCard]);

  const canSubmit = selected === "net_terms" || hasCard(billing);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    await onSuccess(selected, parseCents(threshold) || 25000);
    setBusy(false);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C]">
              <CreditCard className="size-4 text-[#1a1a1a]" />
            </div>
            <div>
              <SheetTitle>Pay as you go</SheetTitle>
              <SheetDescription className="text-xs">Choose how you settle your tab.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Settlement method</Label>
            {SETTLEMENT_OPTIONS.map(({ id, label, desc, Icon }) => {
              const isSelected = id === selected;
              const isCurrent  = id === current;
              return (
                <button key={id} onClick={() => setSelected(id)}
                  className={["w-full flex items-start gap-3 rounded-xl border-[2px] p-4 text-left transition-all",
                    isSelected ? "border-[#1a1a1a] bg-[#FFC93C]/10" : "border-border hover:border-[#1a1a1a]/30 hover:bg-secondary/30"].join(" ")}>
                  <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-[#1a1a1a] text-white" : "bg-secondary text-muted-foreground"}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      {isCurrent && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Current</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{desc}</p>
                  </div>
                  {isSelected
                    ? <div className="shrink-0 mt-0.5 flex size-5 items-center justify-center rounded-full bg-[#1a1a1a]"><Check className="size-3 text-white" /></div>
                    : <div className="shrink-0 mt-0.5 size-5 rounded-full border-2 border-border/60" />
                  }
                </button>
              );
            })}
          </div>

          {selected === "auto_pay" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Charge card when tab reaches</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input className="pl-7 h-9 text-sm" value={threshold} onChange={e => setThreshold(e.target.value)} type="number" placeholder="250" />
              </div>
            </div>
          )}

          {needsCard && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Payment method</Label>
              <CardSection billing={billing} clientSecret={clientSecret} onSetupComplete={onSetupComplete} />
            </div>
          )}

          {selected === "net_terms" && (
            <div className="flex gap-2.5 rounded-xl border border-blue-200/70 bg-blue-50/60 p-3.5">
              <Info className="size-4 shrink-0 text-blue-500 mt-0.5" />
              <p className="text-sm leading-relaxed text-blue-900">
                You'll receive a monthly invoice on the <strong>1st of each month</strong>, due <strong>30 days later</strong>. No card required.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 px-6 py-4">
          <YellowButton disabled={!canSubmit || busy} onClick={submit}>
            {busy ? "Saving…" : needsCard ? "Save a card to continue" : "Confirm"}
          </YellowButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sheet: Add funds ─────────────────────────────────────────────────────────

function AddFundsSheet({
  open, billing, onClose, onSuccess,
}: {
  open: boolean;
  billing: BillingState;
  onClose: () => void;
  onSuccess: (added: number, newBalance: number) => void;
}) {
  const [amount, setAmount] = React.useState<number | null>(50000);
  const [custom, setCustom] = React.useState("");
  const [busy, setBusy]     = React.useState(false);
  const [err, setErr]       = React.useState<string | null>(null);

  const fundAmount = custom ? parseCents(custom) : (amount ?? 0);
  const canSubmit  = fundAmount >= 100 && hasCard(billing);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true); setErr(null);
    try {
      const r = await bondFetch<{ amount_cents: number; new_balance_cents: number }>(
        partnerPath("/billing/topup"),
        { method: "POST", body: JSON.stringify({ amount_cents: fundAmount }) }
      );
      onSuccess(r.amount_cents, r.new_balance_cents);
      onClose();
      setCustom(""); setAmount(50000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Payment failed. Check your card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C]">
              <Plus className="size-4 text-[#1a1a1a]" />
            </div>
            <div>
              <SheetTitle>Add funds</SheetTitle>
              <SheetDescription className="text-xs">Funds are available instantly.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-foreground">Amount</Label>
            <div className="grid grid-cols-4 gap-2">
              {TOPUP_PRESETS.map(p => (
                <button key={p} onClick={() => { setAmount(p); setCustom(""); }}
                  className={["rounded-lg border py-2.5 text-sm font-semibold transition-colors",
                    amount === p && !custom ? "border-[#1a1a1a] bg-[#FFC93C] text-[#1a1a1a]" : "border-border bg-secondary/40 text-foreground hover:bg-secondary"].join(" ")}>
                  {formatCents(p)}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input className="pl-7 h-9 text-sm" placeholder="Custom amount" value={custom} onChange={e => { setCustom(e.target.value); setAmount(null); }} type="number" min="1" />
            </div>
          </div>

          <FundingProjection amountCents={fundAmount} />

          {hasCard(billing) ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <CreditCard className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{cardLabel(billing)}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No card on file. Add a card from the billing settings.</p>
          )}

          {fundAmount > 0 && hasCard(billing) && (
            <div className="rounded-xl border border-border/70 bg-secondary/20 p-3.5 space-y-2">
              <SummaryRow label="Adding">{formatCents(fundAmount)}</SummaryRow>
              <SummaryRow label="New balance"><span className="font-bold text-foreground">{formatCents(billing.balance_cents + fundAmount)}</span></SummaryRow>
            </div>
          )}

          {err && <p className="text-xs font-medium text-red-600">{err}</p>}
        </div>

        <div className="border-t border-border/60 px-6 py-4">
          <YellowButton disabled={!canSubmit || busy} onClick={submit}>
            {busy ? "Processing…" : fundAmount > 0 ? `Add ${formatCents(fundAmount)}` : "Add funds"}
          </YellowButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sheet: Pay tab ───────────────────────────────────────────────────────────

function PayTabSheet({
  open, billing, onClose, onSuccess,
}: {
  open: boolean;
  billing: BillingState;
  onClose: () => void;
  onSuccess: (paid: number, remaining: number) => void;
}) {
  const tabCents   = Math.abs(billing.balance_cents);
  const [custom, setCustom] = React.useState(String(tabCents / 100));
  const [busy, setBusy]     = React.useState(false);
  const [err, setErr]       = React.useState<string | null>(null);

  React.useEffect(() => { if (open) setCustom(String(tabCents / 100)); }, [open, tabCents]);

  const amount     = parseCents(custom);
  const canSubmit  = amount >= 100 && hasCard(billing);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true); setErr(null);
    try {
      const r = await bondFetch<{ amount_cents: number; tab_remaining_cents: number }>(
        partnerPath("/billing/pay"),
        { method: "POST", body: JSON.stringify({ amount_cents: amount }) }
      );
      onSuccess(r.amount_cents, r.tab_remaining_cents);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Payment failed. Check your card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C]">
              <CreditCard className="size-4 text-[#1a1a1a]" />
            </div>
            <div>
              <SheetTitle>Pay your tab</SheetTitle>
              <SheetDescription className="text-xs">Outstanding: {formatCents(tabCents)}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Amount to pay</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input className="pl-7 h-9 text-sm" value={custom} onChange={e => setCustom(e.target.value)} type="number" placeholder="0.00" />
            </div>
            <button onClick={() => setCustom(String(tabCents / 100))} className="text-xs font-medium text-primary hover:underline">
              Pay full amount ({formatCents(tabCents)})
            </button>
          </div>

          {hasCard(billing) ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <CreditCard className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{cardLabel(billing)}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No card on file. Add a card first.</p>
          )}

          {amount > 0 && hasCard(billing) && (
            <div className="rounded-xl border border-border/70 bg-secondary/20 p-3.5 space-y-2">
              <SummaryRow label="Paying">{formatCents(amount)}</SummaryRow>
              <SummaryRow label="Remaining tab"><span className="font-bold text-foreground">{formatCents(Math.max(0, tabCents - amount))}</span></SummaryRow>
            </div>
          )}

          {err && <p className="text-xs font-medium text-red-600">{err}</p>}
        </div>

        <div className="border-t border-border/60 px-6 py-4">
          <YellowButton disabled={!canSubmit || busy} onClick={submit}>
            {busy ? "Processing…" : amount > 0 ? `Pay ${formatCents(amount)}` : "Enter an amount"}
          </YellowButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Balance cards ────────────────────────────────────────────────────────────

// ─── Performance card ─────────────────────────────────────────────────────────

function PerformanceCard({ perf }: { perf: BillingPerformance | null }) {
  if (!perf) {
    // skeleton while loading
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-8 w-32 rounded bg-secondary" />
            <div className="h-3 w-48 rounded bg-secondary" />
            <div className="h-2 rounded-full bg-secondary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { this_cycle, cycle_started_at, goal } = perf;
  const noRedemptions = this_cycle.redemptions === 0;
  const cycleLabel    = cycle_started_at
    ? `since your last payment on ${new Date(cycle_started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "since you started";

  // ── Prepaid: goal progress ──
  if (goal) {
    const pct       = Math.min(100, goal.progress_pct);
    const hit100    = pct >= 100;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Your {formatCentsWhole(goal.based_on_deposit_cents)} is working
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {noRedemptions ? (
            <p className="text-sm text-muted-foreground">No redemptions yet — sales will show here as guests redeem.</p>
          ) : hit100 ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Projection hit</p>
              <p className="text-[36px] font-extrabold tracking-tight leading-none tabular-nums text-emerald-600">
                {formatCentsWhole(this_cycle.sales_generated_cents)}
              </p>
              <p className="text-xs font-medium text-emerald-600">
                You've already hit your projection. Everything from here is upside.
              </p>
            </>
          ) : (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Sales generated</p>
                <p className="mt-1 text-[36px] font-extrabold tracking-tight leading-none tabular-nums">
                  {formatCentsWhole(this_cycle.sales_generated_cents)}
                  <span className="ml-2 text-base font-semibold text-muted-foreground">
                    of {formatCentsWhole(goal.projected_sales_cents)}
                  </span>
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{pct}% of projection</span>
                  <span>Goal {formatCentsWhole(goal.projected_sales_cents)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">On track — keep it funded to keep going.</p>
            </>
          )}
          <DetailBlock>
            <DetailRow label="Redemptions this cycle">{this_cycle.redemptions}</DetailRow>
            <DetailRow label="Cycle">{cycleLabel}</DetailRow>
          </DetailBlock>
        </CardContent>
      </Card>
    );
  }

  // ── Invoice / net_terms: cycle earnings ──
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">This invoice cycle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {noRedemptions ? (
          <p className="text-sm text-muted-foreground">No redemptions yet — sales will show here as guests redeem.</p>
        ) : (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Sales generated</p>
            <p className="mt-1 text-[42px] font-extrabold tracking-tight leading-none tabular-nums">
              {formatCentsWhole(this_cycle.sales_generated_cents)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              From {this_cycle.redemptions} redemption{this_cycle.redemptions !== 1 ? "s" : ""} · {cycleLabel}
            </p>
          </div>
        )}
        <DetailBlock>
          <DetailRow label="Redemptions">{this_cycle.redemptions}</DetailRow>
          <DetailRow label="Return generated">{formatCentsWhole(this_cycle.return_generated_cents)}</DetailRow>
          <DetailRow label="Resets">when you pay your invoice</DetailRow>
        </DetailBlock>
      </CardContent>
    </Card>
  );
}

function PrepaidBalanceCard({ billing, onAddFunds }: { billing: BillingState; onAddFunds: () => void }) {
  const balance   = billing.balance_cents;
  const threshold = billing.low_balance_threshold_cents;
  const target    = billing.refill_target_cents;
  const isLow     = threshold !== null && balance <= threshold;
  const pct       = target ? Math.min(100, Math.round((balance / target) * 100)) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Remaining balance</p>
          <p className={`mt-1.5 text-[42px] font-extrabold tracking-tight leading-none tabular-nums ${isLow ? "text-amber-600" : "text-foreground"}`}>
            {formatCents(balance)}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {threshold !== null
              ? (billing.prepaid_empty_action === "continue" ? `Auto-reloads below ${formatCents(threshold)}` : `Alert sent below ${formatCents(threshold)}`)
              : "Program pauses at $0"}
          </p>
        </div>
        <YellowButton size="sm" onClick={onAddFunds} className="mb-1 h-9 px-4 text-xs gap-1.5">
          <Plus className="size-3.5" /> Add funds
        </YellowButton>
      </div>

      {pct !== null ? (
        <div className="space-y-1.5">
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div className={`h-full rounded-full transition-all ${isLow ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{pct}% of refill goal</span>
            <span>Goal {formatCents(target!)}</span>
          </div>
        </div>
      ) : (
        <button
          onClick={onAddFunds}
          className="w-full rounded-lg border border-dashed border-border px-4 py-3 text-left text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          No refill goal set — <span className="font-semibold underline underline-offset-2">set one</span> to track your balance health
        </button>
      )}

      {(threshold !== null || target !== null) && (
        <DetailBlock>
          {threshold !== null && <DetailRow label="Low balance alert">{formatCents(threshold)}</DetailRow>}
          {target    !== null && <DetailRow label="Refill target">{formatCents(target)}</DetailRow>}
          <DetailRow label="When low">{billing.prepaid_empty_action === "continue" ? "Auto-reloads" : "Sends alert"}</DetailRow>
        </DetailBlock>
      )}
    </div>
  );
}

function NetTermsBalanceCard({ billing, onPayNow }: { billing: BillingState; onPayNow: () => void }) {
  const owed    = -billing.balance_cents; // balance_cents is negative when owed
  const hasOwed = owed > 0;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Current tab</p>
        <p className={`mt-1.5 text-[42px] font-extrabold tracking-tight leading-none tabular-nums ${hasOwed ? "text-amber-600" : "text-foreground"}`}>{formatCents(owed)}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">Invoiced on the 1st of each month</p>
      </div>
      <DetailBlock>
        <DetailRow label="Invoice date">1st of each month</DetailRow>
        <DetailRow label="Payment due">30 days after invoice</DetailRow>
        {hasCard(billing) && <DetailRow label="Card on file">{cardLabel(billing)}</DetailRow>}
      </DetailBlock>
      {owed > 0 && hasCard(billing) && (
        <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={onPayNow}>
          Pay now ({formatCents(owed)})
        </Button>
      )}
      <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-muted-foreground">
        <ExternalLink className="size-3.5" /> View invoices
      </Button>
    </div>
  );
}

function AutopayBalanceCard({ billing, onManage }: { billing: BillingState; onManage: () => void }) {
  const owed      = -billing.balance_cents;
  const threshold = billing.auto_pay_threshold_cents ?? 25000;
  const pct       = Math.min(100, Math.round((owed / threshold) * 100));
  const near      = pct > 80;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Current tab</p>
        <p className={`mt-1.5 text-[42px] font-extrabold tracking-tight leading-none tabular-nums ${near ? "text-amber-600" : "text-foreground"}`}>{formatCents(owed)}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">Card charged at {formatCents(threshold)}</p>
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
          <div className={`h-full rounded-full transition-all ${near ? "bg-amber-400" : "bg-primary/50"}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{pct}% of threshold</span>
          <span>Charges at {formatCents(threshold)}</span>
        </div>
      </div>
      {hasCard(billing) && (
        <DetailBlock>
          <DetailRow label="Card">{cardLabel(billing)}</DetailRow>
          <DetailRow label="Threshold">{formatCents(threshold)}</DetailRow>
        </DetailBlock>
      )}
      <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={onManage}>
        <Settings2 className="size-3.5" /> Manage autopay
      </Button>
    </div>
  );
}

// ─── Invoice history ──────────────────────────────────────────────────────────

function InvoiceHistory() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading]   = React.useState(true);

  React.useEffect(() => {
    bondFetch<InvoicesResponse>(partnerPath("/billing/invoices"))
      .then(r => setInvoices(r.invoices))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Card><CardContent className="flex items-center gap-2 p-6 text-muted-foreground text-sm"><Loader2 className="size-4 animate-spin" /> Loading invoices…</CardContent></Card>
  );

  if (!invoices.length) return (
    <Card><CardContent className="p-6 text-sm text-muted-foreground">No invoices yet.</CardContent></Card>
  );

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Invoice history</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Period</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Due</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(inv => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium text-sm">{fmtMonth(inv.period_start)}</TableCell>
                <TableCell className="tabular-nums text-sm">{formatCents(inv.amount_cents)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{fmtDate(inv.due_at)}</TableCell>
                <TableCell><InvoiceBadge status={inv.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function InvoiceBadge({ status }: { status: Invoice["status"] }) {
  if (status === "paid")    return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Paid</span>;
  if (status === "overdue") return <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Overdue</span>;
  return <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Open</span>;
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

function Ledger() {
  const [events, setEvents]   = React.useState<LedgerEvent[]>([]);
  const [cursor, setCursor]   = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  async function fetchPage(before?: string) {
    const qs = before ? `?before=${encodeURIComponent(before)}&limit=20` : "?limit=20";
    const r  = await bondFetch<TransactionsResponse>(partnerPath(`/billing/transactions${qs}`));
    return r;
  }

  React.useEffect(() => {
    fetchPage()
      .then(r => { setEvents(r.transactions); setHasMore(r.has_more); setCursor(r.next_cursor); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const r = await fetchPage(cursor);
      setEvents(prev => [...prev, ...r.transactions]);
      setHasMore(r.has_more);
      setCursor(r.next_cursor);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) return (
    <Card><CardContent className="flex items-center gap-2 p-6 text-muted-foreground text-sm"><Loader2 className="size-4 animate-spin" /> Loading transactions…</CardContent></Card>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {events.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs w-28">Date</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-right text-xs">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(evt => {
                const pos      = evt.amount_cents > 0;
                const isAdjust = evt.type === "adjustment";
                return (
                  <TableRow key={evt.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">{fmtDate(evt.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${pos ? "bg-emerald-100" : isAdjust ? "bg-blue-100" : "bg-secondary"}`}>
                          {pos ? <ArrowUpRight className="size-3 text-emerald-700" /> : isAdjust ? <Plus className="size-3 text-blue-700" /> : <ArrowDownLeft className="size-3 text-muted-foreground" />}
                        </div>
                        <span className="text-sm">{evt.note ?? evt.source}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right text-sm font-semibold tabular-nums ${pos ? "text-emerald-700" : ""}`}>
                      {pos ? "+" : ""}{formatCents(evt.amount_cents)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {hasMore && (
          <div className="border-t border-border/40 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={loadMore} disabled={loadingMore} className="w-full text-xs text-muted-foreground gap-1.5">
              {loadingMore ? <><Loader2 className="size-3.5 animate-spin" /> Loading…</> : <><ChevronDown className="size-3.5" /> Load more</>}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function YellowButton({ children, className = "", size, disabled, onClick }: {
  children: React.ReactNode; className?: string; size?: "sm";
  disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button disabled={disabled} onClick={onClick}
      className={["inline-flex items-center justify-center gap-1.5 rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C] font-bold text-[#1a1a1a]",
        "shadow-[3px_3px_0_0_#1a1a1a] transition-all",
        "hover:bg-[#FFD966] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_0_#1a1a1a]",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm w-full",
        className].join(" ")}>
      {children}
    </button>
  );
}

function DetailBlock({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2.5 rounded-xl border border-border/60 bg-secondary/20 p-4">{children}</div>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{children}</span>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [billing, setBilling]   = React.useState<BillingState>(EMPTY_BILLING);
  const [loading, setLoading]   = React.useState(true);
  const [perf, setPerf]         = React.useState<BillingPerformance | null>(null);

  const [prepaidSheet, setPrepaidSheet] = React.useState(false);
  const [paygSheet, setPaygSheet]       = React.useState(false);
  const [addFundsSheet, setAddFunds]    = React.useState(false);
  const [payTabSheet, setPayTab]        = React.useState(false);

  const [toast, setToast] = React.useState<{ msg: string; type?: "success" | "info" | "error" } | null>(null);

  // Load real billing state
  React.useEffect(() => {
    bondFetch<BillingState>(partnerPath("/billing"))
      .then(data => setBilling(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load performance data
  React.useEffect(() => {
    bondFetch<BillingPerformance>(partnerPath("/billing/performance"))
      .then(data => setPerf(data))
      .catch(() => {});
  }, []);

  const track      = trackOf(billing.collection_method);
  const settlement = settlementOf(billing.collection_method);

  async function refreshBilling() {
    const fresh = await bondFetch<BillingState>(partnerPath("/billing"));
    setBilling(fresh);
  }

  // After card setup we refetch to pick up the new card details
  async function handleSetupComplete() {
    try {
      await refreshBilling();
      setToast({ msg: "Card saved.", type: "info" });
    } catch {
      setToast({ msg: "Card saved — refresh to see updated details.", type: "info" });
    }
  }

  async function patchBilling(body: Partial<BillingState & { collection_method: CollectionMethod; auto_pay_threshold_cents: number }>) {
    const updated = await bondFetch<BillingState>(
      partnerPath("/billing"),
      { method: "PATCH", body: JSON.stringify(body) }
    );
    setBilling(updated);
  }

  // Switch to prepaid: PATCH method + settings, then topup
  async function handlePrepaidSuccess(amount: number, config: { low_balance_threshold_cents: number; refill_target_cents: number; prepaid_empty_action: "pause" | "continue" }) {
    try {
      await patchBilling({ collection_method: "prepaid", ...config });
      const r = await bondFetch<{ new_balance_cents: number }>(
        partnerPath("/billing/topup"),
        { method: "POST", body: JSON.stringify({ amount_cents: amount }) }
      );
      setBilling(b => ({ ...b, balance_cents: r.new_balance_cents }));
      setToast({ msg: `${formatCents(amount)} loaded. Switched to Prepaid.` });
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : "Something went wrong.", type: "error" });
      throw e;
    }
  }

  // Switch payg settlement
  async function handlePaygSuccess(s: PaygSettlement, threshold: number) {
    try {
      const method: CollectionMethod = s === "auto_pay" ? "auto_pay" : "net_terms";
      await patchBilling({ collection_method: method, auto_pay_threshold_cents: threshold });
      const labels = { net_terms: "Invoice", auto_pay: "Autopay" };
      setToast({ msg: `Switched to ${labels[s]}.`, type: "info" });
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : "Something went wrong.", type: "error" });
      throw e;
    }
  }

  function handleTrackClick(t: Track) {
    if (t === "prepaid") setPrepaidSheet(true);
    else setPaygSheet(true);
  }

  if (loading) return (
    <div className="flex items-center gap-2 p-8 text-muted-foreground text-sm">
      <Loader2 className="size-4 animate-spin" /> Loading billing…
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Billing" description="Your balance and full transaction history." />

      <StatusBanner
        status={billing.status}
        reason={billing.paused_reason}
        isLive={billing.is_live}
        onLoadFunds={() => setAddFunds(true)}
        onUpdateCard={() => setPaygSheet(true)}
      />

      <HowYouPaySelector track={track} onTrackClick={handleTrackClick} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Balance</CardTitle></CardHeader>
          <CardContent>
            {track === "prepaid"                    && <PrepaidBalanceCard billing={billing} onAddFunds={() => setAddFunds(true)} />}
            {track === "payg" && settlement === "net_terms" && <NetTermsBalanceCard billing={billing} onPayNow={() => setPayTab(true)} />}
            {track === "payg" && settlement === "auto_pay"  && <AutopayBalanceCard billing={billing} onManage={() => setPaygSheet(true)} />}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <PerformanceCard perf={perf} />
          <Ledger />
          {track === "payg" && settlement === "net_terms" && <InvoiceHistory />}
        </div>
      </div>

      <SwitchToPrepaidSheet
        open={prepaidSheet}
        billing={billing}
        isAlreadyPrepaid={track === "prepaid"}
        onClose={() => setPrepaidSheet(false)}
        onSuccess={handlePrepaidSuccess}
        onSetupComplete={handleSetupComplete}
      />
      <PaygSetupSheet
        open={paygSheet}
        billing={billing}
        current={settlement}
        onClose={() => setPaygSheet(false)}
        onSuccess={handlePaygSuccess}
        onSetupComplete={handleSetupComplete}
      />
      <AddFundsSheet
        open={addFundsSheet}
        billing={billing}
        onClose={() => setAddFunds(false)}
        onSuccess={(added, newBalance) => {
          setBilling(b => ({ ...b, balance_cents: newBalance }));
          setToast({ msg: `${formatCents(added)} added to your balance.` });
        }}
      />
      <PayTabSheet
        open={payTabSheet}
        billing={billing}
        onClose={() => setPayTab(false)}
        onSuccess={(paid, remaining) => {
          setBilling(b => ({ ...b, balance_cents: -remaining }));
          setToast({ msg: `${formatCents(paid)} payment submitted.` });
        }}
      />

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
