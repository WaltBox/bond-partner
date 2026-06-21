"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Send, Check, Loader2, Info, CheckCircle2, Clock, XCircle, CircleDot, Megaphone, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { bondFetch, partnerPath } from "@/lib/api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchType  = "keyword" | "exact";
type Basis      = "per_head" | "per_table" | "per_n_heads";
type RewardKind = "free_item" | "percent_off_item" | "percent_back";

interface Requirement {
  name:        string;
  match_type:  MatchType;
  match_value: string;
  quantity:    number;
  per:         "person" | "table";
}

interface Reward {
  name:        string;
  kind:        RewardKind;
  match_type:  MatchType;
  match_value: string;
  basis:       Basis;
  n?:          number;
  percent?:    number;
}

interface PricingItem {
  label:            string;
  role:             "reward" | "requirement";
  needs_menu_price: boolean;
  needs_cogs:       boolean;
}

interface ParsedForm {
  confirmation_message:   string;
  title_suggestion:       string;
  description_suggestion: string;
  requirements:           Requirement[];
  reward:                 Reward;
  pricing_items:          PricingItem[];
  inferred_basis_note:    string | null;
}

interface Message {
  role:    "user" | "assistant";
  content: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseDollars(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-white">
        <Sparkles className="size-4" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Promotion listing type ───────────────────────────────────────────────────

interface PromotionListing {
  id:                    string;
  name:                  string;
  description:           string;
  type:                  string;
  active:                boolean;
  review_status:         "pending_review" | "approved" | "rejected" | null;
  rejection_reason:      string | null;
  planned_budget_cents:  number;
  created_at:            string;
}

// ─── Rating types + panel ─────────────────────────────────────────────────────

type RatingLabel = "weak" | "fair" | "good" | "strong" | "exceptional";

interface RatingResult {
  score:        number;
  label:        RatingLabel;
  verdict:      string;
  drivers:      string[];
  improvements: string[];
  cached?:      boolean;
}

const LABEL_COLOR: Record<RatingLabel, string> = {
  exceptional: "text-green-600",
  strong:      "text-green-600",
  good:        "text-amber-500",
  fair:        "text-orange-500",
  weak:        "text-red-500",
};

const LABEL_BG: Record<RatingLabel, string> = {
  exceptional: "bg-green-50 border-green-200/60",
  strong:      "bg-green-50 border-green-200/60",
  good:        "bg-amber-50 border-amber-200/60",
  fair:        "bg-orange-50 border-orange-200/60",
  weak:        "bg-red-50 border-red-200/60",
};

function Stars({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const full = score >= i + 0.75;
        const half = !full && score >= i + 0.25;
        return (
          <svg key={i} viewBox="0 0 20 20" className="size-4 shrink-0" fill="none">
            {full ? (
              <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27 5.22 15.7l.91-5.32L2.27 6.62l5.34-.78z" fill="currentColor" />
            ) : half ? (
              <>
                <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27V1z" fill="currentColor" />
                <path d="M10 1L7.61 5.84l-5.34.78 3.86 3.76-.91 5.32L10 13.27V1z" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </>
            ) : (
              <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27 5.22 15.7l.91-5.32L2.27 6.62l5.34-.78z" fill="none" stroke="currentColor" strokeWidth="1.2" />
            )}
          </svg>
        );
      })}
    </span>
  );
}

function RatingPanel({
  form,
  pricing,
  onApplySuggestion,
}: {
  form:               ParsedForm;
  pricing:            Record<string, { menu_price: string; cogs: string }>;
  onApplySuggestion:  (text: string) => void;
}) {
  const SESSION_KEY = "bond_promo_rating";

  const [result, setResult]   = React.useState<RatingResult | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
  });
  const [fetching, setFetching] = React.useState(false);
  const [stale, setStale]       = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const rewardItem    = form.pricing_items.find(f => f.role === "reward");
  const reqItems      = form.pricing_items.filter(f => f.role === "requirement");
  const rewardValue   = rewardItem ? parseDollars(pricing[rewardItem.label]?.menu_price ?? "") : 0;
  const requiredValue = reqItems.reduce((sum, f) => sum + parseDollars(pricing[f.label]?.menu_price ?? ""), 0);

  React.useEffect(() => {
    if (!rewardValue) { setResult(null); return; }

    setStale(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const res = await bondFetch<{ rating: RatingResult; cached: boolean }>(
          partnerPath("/promotions/rating"),
          {
            method: "POST",
            body: JSON.stringify({
              form,
              reward_value_cents:   rewardValue,
              required_value_cents: requiredValue || undefined,
            }),
          }
        );
        setResult(res.rating);
        setStale(false);
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.rating)); } catch {}
      } catch { /* keep last result */ }
      finally { setFetching(false); }
    }, 500);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [form, rewardValue, requiredValue]);

  if (!rewardValue) return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground/60">Finish pricing to see your user score.</p>
      </CardContent>
    </Card>
  );

  const color = result ? LABEL_COLOR[result.label] : "text-muted-foreground/40";

  return (
    <Card className={stale && result ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          How users will respond
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score row — skeleton only when no prior result to show */}
        {fetching && !result ? (
          <div className="space-y-2 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-5 w-8 rounded bg-muted" />
            </div>
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ) : result ? (
          <>
            <div className="space-y-1">
              <div className={`flex items-center gap-2 ${color}`}>
                <Stars score={result.score} />
                <span className="text-xl font-black tabular-nums">{result.score.toFixed(1)}</span>
              </div>
              <p className={`text-xs font-bold capitalize ${color}`}>{result.label}</p>
            </div>

            {/* Verdict */}
            <div className={`rounded-lg border px-3 py-2.5 ${LABEL_BG[result.label]}`}>
              <p className="text-xs leading-relaxed text-foreground">"{result.verdict}"</p>
            </div>

            {/* Drivers */}
            {result.drivers.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">What's working</p>
                <ul className="space-y-1">
                  {result.drivers.map((d, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="mt-0.5 text-green-500 shrink-0">•</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">💡 Make it even better</p>
                <ul className="space-y-1.5">
                  {result.improvements.map((imp, i) => (
                    <li key={i}>
                      <button
                        onClick={() => onApplySuggestion(imp)}
                        className="flex items-start gap-1.5 text-left text-xs text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <span className="mt-0.5 text-amber-500 shrink-0">•</span>
                        <span className="group-hover:underline underline-offset-2">{imp}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─── ROI types ────────────────────────────────────────────────────────────────

interface RoiRequest {
  budget_cents:                number;
  reward_menu_price_cents:     number;
  reward_cogs_cents:           number;
  reward_basis:                Basis;
  reward_n:                    number | null;
  required_menu_prices_cents:  number[];
}

interface RoiResult {
  avg_group_size:          number;
  group_size_source:       "history" | "default";
  people_per_reward:       number;
  redemptions_funded:      number;
  guaranteed_sales_cents:  number;
  real_cost_cents:         number;
  minimum_return_cents:    number;
}

// ─── ROI Panel ────────────────────────────────────────────────────────────────

function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function ROIPanel({
  form,
  pricing,
  budgetInput,
  onBudgetChange,
  canSubmit,
  submitting,
  onSubmit,
}: {
  form: ParsedForm;
  pricing: Record<string, { menu_price: string; cogs: string }>;
  budgetInput: string;
  onBudgetChange: (v: string) => void;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const [result, setResult]           = React.useState<RoiResult | null>(null);
  const [fetching, setFetching]       = React.useState(false);
  const [zeroBudget, setZeroBudget]   = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildPayload(): RoiRequest | null {
    const rewardItem = form.pricing_items.find(f => f.role === "reward");
    const reqItems   = form.pricing_items.filter(f => f.role === "requirement");

    const budgetCents      = parseDollars(budgetInput);
    const rewardMenuPrice  = rewardItem ? parseDollars(pricing[rewardItem.label]?.menu_price ?? "") : 0;
    const reqPrices        = reqItems.map(f => parseDollars(pricing[f.label]?.menu_price ?? "")).filter(v => v > 0);

    if (!budgetCents || !rewardMenuPrice || reqPrices.length === 0) return null;

    return {
      budget_cents:               budgetCents,
      reward_menu_price_cents:    rewardMenuPrice,
      reward_cogs_cents:          rewardItem ? parseDollars(pricing[rewardItem.label]?.cogs ?? "") : 0,
      reward_basis:               form.reward.basis,
      reward_n:                   form.reward.basis === "per_n_heads" ? (form.reward.n ?? null) : null,
      required_menu_prices_cents: reqPrices,
    };
  }

  React.useEffect(() => {
    if (form.reward.kind === "percent_back") return;

    const payload = buildPayload();
    if (!payload) { setResult(null); return; }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setFetching(true);
      setZeroBudget(false);
      try {
        const res = await bondFetch<RoiResult>(partnerPath("/promotions/roi"), {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.redemptions_funded === 0) { setZeroBudget(true); setResult(null); }
        else setResult(res);
      } catch { /* keep last result */ }
      finally { setFetching(false); }
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [budgetInput, pricing, form]);

  const dash = <span className="text-muted-foreground/30">—</span>;

  function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Your guaranteed return
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget input */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Put in</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1.5 text-sm text-muted-foreground">$</span>
            <Input
              className="h-8 pl-6 text-sm font-semibold"
              type="number"
              min={0}
              value={budgetInput}
              onChange={e => onBudgetChange(e.target.value)}
            />
          </div>
        </div>

        <div className="h-px bg-border/60" />

        {/* Results */}
        {form.reward.kind === "percent_back" ? (
          <p className="text-xs text-muted-foreground">ROI preview isn't available for percent-back rewards yet.</p>
        ) : zeroBudget ? (
          <p className="text-xs text-amber-600 font-medium">Increase your budget to fund at least one reward.</p>
        ) : (
          <>
            <Row label="Guaranteed sales"  value={result ? fmtCents(result.guaranteed_sales_cents) : dash} />
            <Row label="Your real cost"    value={result ? `− ${fmtCents(result.real_cost_cents)}` : dash} />
            <div className="h-px bg-border/60" />

            {/* Hero number */}
            <div className="space-y-0.5">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Minimum return</p>
              <p className={`text-3xl font-black tabular-nums tracking-tight ${fetching ? "opacity-40" : ""}`}>
                {result ? fmtCents(result.minimum_return_cents) : "—"}
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-snug">
              {result?.group_size_source === "history"
                ? `That's the floor — based on your average table of ${result.avg_group_size}. It only goes up as guests order more.`
                : "That's the floor using a conservative estimate — your real numbers will likely be higher once you have redemption data."}
            </p>

            {result && !pricing[form.pricing_items.find(f => f.role === "reward")?.label ?? ""]?.cogs && (
              <p className="text-[11px] text-amber-600">Fill in cost-to-make for the reward to see your accurate real cost.</p>
            )}

            <div className="h-px bg-border/60" />

            <button
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#FFC93C] px-4 py-3 text-sm font-black text-[#1a1a1a] shadow-[3px_3px_0_0_#1a1a1a] transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_0_#1a1a1a]"
            >
              {submitting
                ? <><Loader2 className="size-4 animate-spin" /> Submitting…</>
                : <>Lock it in &amp; submit for review →</>
              }
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Pricing form ─────────────────────────────────────────────────────────────

function PricingForm({
  form,
  pricing,
  onChange,
}: {
  form: ParsedForm;
  pricing: Record<string, { menu_price: string; cogs: string }>;
  onChange: (label: string, v: { menu_price: string; cogs: string }) => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      {form.inferred_basis_note && (
        <div className="flex gap-2.5 rounded-xl border border-blue-200/70 bg-blue-50/60 p-3.5">
          <Info className="size-4 shrink-0 text-blue-500 mt-0.5" />
          <p className="text-sm leading-relaxed text-blue-900">{form.inferred_basis_note}</p>
        </div>
      )}
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Pricing — kept private, used for your ROI
      </p>
      {form.pricing_items.map(item => {
        const vals = pricing[item.label] ?? { menu_price: "", cogs: "" };
        return (
          <div key={item.label} className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold">{item.label}</p>
            <div className="grid grid-cols-2 gap-3">
              {item.needs_menu_price && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Menu price</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1.5 text-sm text-muted-foreground">$</span>
                    <Input
                      className="h-8 pl-6 text-sm"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={vals.menu_price}
                      onChange={e => onChange(item.label, { ...vals, menu_price: e.target.value })}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">What you charge</p>
                </div>
              )}
              {item.needs_cogs && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cost to make</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1.5 text-sm text-muted-foreground">$</span>
                    <Input
                      className="h-8 pl-6 text-sm"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={vals.cogs}
                      onChange={e => onChange(item.label, { ...vals, cogs: e.target.value })}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Your COGS (private)</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Inspiration cards ────────────────────────────────────────────────────────

const INSPIRATION = [
  { emoji: "🍔", category: "Burger joint",       quote: "Free shareable fries when everyone at the table orders a burger and a drink",      why: "Rewards the whole group showing up together — not just one big spender"      },
  { emoji: "☕", category: "Coffee shop",         quote: "$2 back on lattes when two or more people order together",                         why: "Turns a solo habit into a social ritual — pairs, coworkers, study groups"    },
  { emoji: "🍕", category: "Pizzeria",            quote: "Everyone gets $3 back when the table orders two or more large pizzas",             why: "Makes group ordering the obvious move — and lifts the whole check"           },
  { emoji: "🌮", category: "Taco spot",           quote: "Buy 2 tacos and a drink, get a third taco free — for every person at the table",  why: "Low food cost per reward, high perceived value across the whole group"       },
  { emoji: "🍺", category: "Bar",                 quote: "Free shareable app when a group of 4+ each orders a drink",                       why: "Keeps groups staying longer and spending more per visit"                     },
  { emoji: "🥗", category: "Fast casual",         quote: "Everyone gets $2 back when three or more people order bowls",                      why: "Turns a lunch run into a team ritual — rewards the group, not just one"      },
  { emoji: "🍦", category: "Dessert / ice cream", quote: "Free topping upgrade for everyone when the group orders 3+ scoops",               why: "Tiny cost to you, feels like a treat — great for families and friend groups" },
  { emoji: "🍜", category: "Sit-down restaurant", quote: "Free shareable appetizer for every 2 guests on parties of 4 or more",             why: "Turns a normal dinner into a group occasion and lifts the whole check"       },
];

function InspirationCards() {
  const [selected, setSelected] = React.useState<number | null>(null);
  const card = selected !== null ? INSPIRATION[selected] : null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Not sure where to start?
      </p>

      {/* Pills */}
      <div className="flex flex-wrap gap-2">
        {INSPIRATION.map((c, i) => {
          const active = selected === i;
          return (
            <button
              key={i}
              onClick={() => setSelected(active ? null : i)}
              className={[
                "flex items-center gap-1.5 rounded-full border-[2px] px-3 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "border-[#1a1a1a] bg-[#FFC93C] text-[#1a1a1a] shadow-[2px_2px_0_0_#1a1a1a]"
                  : "border-[#1a1a1a]/15 bg-secondary/60 text-foreground/70 hover:border-[#1a1a1a]/30 hover:text-foreground",
              ].join(" ")}
            >
              <span>{c.emoji}</span>
              {c.category}
            </button>
          );
        })}
      </div>

      {/* Revealed card */}
      <div
        className={[
          "overflow-hidden transition-all duration-300 ease-out",
          card ? "max-h-48 opacity-100 translate-y-0" : "max-h-0 opacity-0 translate-y-2",
        ].join(" ")}
        style={{ transform: card ? "translateY(0)" : "translateY(8px)" }}
      >
        {card && (
          <div className="rounded-2xl border-[2px] border-[#1a1a1a] bg-card p-5 shadow-[3px_3px_0_0_#1a1a1a]">
            <p className="text-sm font-bold leading-snug text-foreground" style={{ letterSpacing: "-0.01em" }}>
              "{card.quote}"
            </p>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{card.why}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Promotions list ──────────────────────────────────────────────────────────

function StatusBadge({ p }: { p: PromotionListing }) {
  if (p.review_status === "pending_review")
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"><Clock className="size-3" />In review</span>;
  if (p.review_status === "rejected")
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"><XCircle className="size-3" />Needs changes</span>;
  if (p.review_status === "approved" && !p.active)
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"><CircleDot className="size-3" />Approved</span>;
  if (p.active)
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"><CheckCircle2 className="size-3" />Live</span>;
  return null;
}

function PromotionsList({ promotions, onEdit }: { promotions: PromotionListing[]; onEdit: (p: PromotionListing) => void }) {
  if (promotions.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Your promotions</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {promotions.map(p => (
          <Link
            key={p.id}
            href={`/promotions/${p.id}`}
            className="group flex flex-col rounded-2xl border-[2.5px] border-[#1a1a1a] bg-card p-4 shadow-[4px_4px_0_0_#1a1a1a] transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_#1a1a1a]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border-[2.5px] border-[#1a1a1a] bg-[#FFC93C] text-[#1a1a1a] shadow-[2.5px_2.5px_0_0_#1a1a1a]">
                <Megaphone className="size-[18px]" />
              </div>
              <StatusBadge p={p} />
            </div>

            <p className="mt-3 text-base font-bold leading-snug text-[#1a1a1a]">{p.name}</p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground line-clamp-2">{p.description}</p>

            {p.review_status === "rejected" && p.rejection_reason && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200/60 px-3 py-2">
                <p className="text-xs text-red-700 leading-snug">{p.rejection_reason}</p>
                <button
                  onClick={e => { e.preventDefault(); onEdit(p); }}
                  className="mt-1.5 text-xs font-semibold text-red-700 underline underline-offset-2"
                >
                  Edit &amp; resubmit
                </button>
              </div>
            )}
            {p.review_status === "approved" && !p.active && (
              <p className="mt-3 text-xs font-medium text-blue-700">Approved — load funds to go live.</p>
            )}

            <div className="mt-3 flex items-center gap-1 border-t border-border pt-3 text-xs font-bold text-[#1a1a1a]">
              View details and edit
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [messages, setMessages]       = React.useState<Message[]>([]);
  const [currentForm, setCurrentForm] = React.useState<ParsedForm | null>(null);
  const [confirmed, setConfirmed]     = React.useState(false);
  const [loading, setLoading]         = React.useState(false);
  const [input, setInput]             = React.useState("");
  const [pricing, setPricing]         = React.useState<Record<string, { menu_price: string; cogs: string }>>({});
  const [error, setError]             = React.useState<string | null>(null);
  const [budget, setBudget]           = React.useState("500");
  const [submitting, setSubmitting]   = React.useState(false);
  const [submitted, setSubmitted]     = React.useState<{ message: string; id: string } | null>(null);
  const [promotions, setPromotions]   = React.useState<PromotionListing[]>([]);

  const bottomRef  = React.useRef<HTMLDivElement>(null);
  const inputRef   = React.useRef<HTMLTextAreaElement>(null);
  const listRef    = React.useRef<HTMLDivElement>(null);
  const hasStarted = messages.length > 0;

  React.useEffect(() => {
    bondFetch<{ promotions: PromotionListing[] }>(partnerPath("/promotions"))
      .then(r => setPromotions(r.promotions))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, confirmed]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", content: text };
    const history: Message[] = currentForm
      ? [...messages, { role: "assistant", content: currentForm.confirmation_message }, userMsg]
      : [...messages, userMsg];

    setMessages(history.filter(m => m.role === "user"));
    setLoading(true);

    try {
      const res = await bondFetch<{ form: ParsedForm }>(
        partnerPath("/promotions/parse"),
        { method: "POST", body: JSON.stringify({ messages: history }) }
      );
      setCurrentForm(res.form);
      setPricing(prev => {
        const next = { ...prev };
        for (const f of res.form.pricing_items) {
          if (!next[f.label]) next[f.label] = { menu_price: "", cogs: "" };
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // Gate: reward needs menu_price + COGS, at least one requirement needs menu_price
  function canSubmit(): boolean {
    if (!currentForm || !confirmed) return false;
    const rewardItem = currentForm.pricing_items.find(f => f.role === "reward");
    const reqItems   = currentForm.pricing_items.filter(f => f.role === "requirement");
    if (!rewardItem) return false;
    const rv = pricing[rewardItem.label];
    if (!rv?.menu_price || (rewardItem.needs_cogs && !rv.cogs)) return false;
    return reqItems.some(f => !!pricing[f.label]?.menu_price);
  }

  async function submit() {
    if (!currentForm || !canSubmit() || submitting) return;

    const pricingBody: Record<string, { menu_price_cents: number; cogs_cents?: number }> = {};
    for (const item of currentForm.pricing_items) {
      const v = pricing[item.label];
      const entry: { menu_price_cents: number; cogs_cents?: number } = {
        menu_price_cents: parseDollars(v?.menu_price ?? ""),
      };
      if (item.needs_cogs && v?.cogs) entry.cogs_cents = parseDollars(v.cogs);
      pricingBody[item.label] = entry;
    }

    setSubmitting(true);
    try {
      const res = await bondFetch<{ promotion: PromotionListing; message: string }>(
        partnerPath("/promotions"),
        {
          method: "POST",
          body: JSON.stringify({
            form:         currentForm,
            pricing:      pricingBody,
            budget_cents: parseDollars(budget),
          }),
        }
      );
      setSubmitted({ message: res.message, id: res.promotion.id });
      setPromotions(prev => [res.promotion, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetBuilder() {
    setMessages([]);
    setCurrentForm(null);
    setConfirmed(false);
    setInput("");
    setPricing({});
    setError(null);
    setSubmitted(null);
    setBudget("500");
  }

  const userMessages = messages.filter(m => m.role === "user");

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Promotion builder"
        description="Describe your idea — we'll turn it into a ready-to-launch promotion."
      />

      {/* ── Success state ── */}
      {submitted ? (
        <div className="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-card p-8 shadow-[4px_4px_0_0_#1a1a1a] flex flex-col items-center text-center gap-4 max-w-lg mx-auto">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#FFC93C] border-[2px] border-[#1a1a1a]">
            <CheckCircle2 className="size-6 text-[#1a1a1a]" />
          </div>
          <div>
            <p className="text-lg font-black">Submitted for review</p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-sm">{submitted.message}</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={resetBuilder}
              className="rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C] px-4 py-2 text-sm font-bold text-[#1a1a1a] shadow-[3px_3px_0_0_#1a1a1a] transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Build another
            </button>
            <Link
              href={`/promotions/${submitted.id}`}
              className="rounded-xl border-[2px] border-[#1a1a1a] bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-80"
            >
              Add photos &amp; details →
            </Link>
            <button
              onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl border-[2px] border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              View my promotions
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Important note */}
          <div className="rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C] px-4 py-3 shadow-[3px_3px_0_0_#1a1a1a]">
            <p className="text-sm text-[#1a1a1a]">
              <span className="font-black">Important note: </span>
              Specify whether everyone gets cashback on their own order (e.g. "$2 back on each person's latte") or the group receives one shared item (e.g. "free fries for the table"). The AI needs to know which.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            {/* Left — chat + pricing */}
            <div className="space-y-4">

              {/* Chat thread */}
              {hasStarted && (
                <div className="space-y-4">
                  {userMessages.map((msg, i) => (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#1a1a1a] px-4 py-3 text-sm text-white">
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {loading && <TypingIndicator />}

                  {!loading && currentForm && (
                    <div className="flex items-end gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-white">
                        <Sparkles className="size-4" />
                      </div>
                      <div className="max-w-[85%] space-y-3">
                        <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-sm leading-relaxed">
                          {currentForm.confirmation_message}
                        </div>
                        {!confirmed && (
                          <button
                            onClick={() => setConfirmed(true)}
                            className="flex items-center gap-2 rounded-xl border-[2px] border-[#1a1a1a] bg-[#FFC93C] px-4 py-2 text-sm font-bold text-[#1a1a1a] shadow-[3px_3px_0_0_#1a1a1a] transition-all hover:bg-[#FFD966] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                          >
                            <Check className="size-4" /> Looks good
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              {/* Input */}
              <div className="rounded-2xl border-[2px] border-[#1a1a1a] bg-card shadow-[3px_3px_0_0_#1a1a1a] overflow-hidden">
                <Textarea
                  ref={inputRef}
                  rows={3}
                  className="resize-none border-0 shadow-none focus-visible:ring-0 rounded-none text-sm px-4 pt-4 pb-2"
                  placeholder={hasStarted ? "Type a change, or ask to adjust anything…" : "Describe your promotion idea…"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={loading}
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <p className="text-[11px] text-muted-foreground">
                    {hasStarted ? "Shift+Enter for new line · Enter to send" : "Enter to generate"}
                  </p>
                  <button
                    onClick={send}
                    disabled={!input.trim() || loading}
                    className="flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-80"
                  >
                    {loading
                      ? <><Loader2 className="size-3.5 animate-spin" /> Thinking…</>
                      : hasStarted
                      ? <><Send className="size-3.5" /> Send</>
                      : <><Sparkles className="size-3.5" /> Generate</>
                    }
                  </button>
                </div>
              </div>

              {/* Inspiration — shown until conversation starts */}
              {!hasStarted && <InspirationCards />}

              {/* Pricing form — slides in after confirm */}
              {confirmed && currentForm && (
                <PricingForm
                  form={currentForm}
                  pricing={pricing}
                  onChange={(label, v) => setPricing(p => ({ ...p, [label]: v }))}
                />
              )}

              <div ref={bottomRef} />
            </div>

            {/* Right — Rating + ROI panels */}
            {confirmed && currentForm && (
              <div className="space-y-4">
                <ROIPanel
                  form={currentForm}
                  pricing={pricing}
                  budgetInput={budget}
                  onBudgetChange={setBudget}
                  canSubmit={canSubmit()}
                  submitting={submitting}
                  onSubmit={submit}
                />
                <RatingPanel
                  form={currentForm}
                  pricing={pricing}
                  onApplySuggestion={text => {
                    setInput(text);
                    inputRef.current?.focus();
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Promotions list */}
      <div ref={listRef}>
        <PromotionsList
          promotions={promotions}
          onEdit={() => resetBuilder()}
        />
      </div>
    </div>
  );
}
