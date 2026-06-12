/**
 * In-memory mock backend. Returns the SAME shapes as the live API so the UI is
 * wired exactly as it will be in production — only the transport differs.
 *
 * It's stateful: editing an offer's cost-to-make (PATCH) flips True Cost / Kept
 * between known and `null` on the dashboard and tickets, exactly like the real
 * dependency. State resets on full page reload.
 */

import type {
  DashboardData,
  MeResponse,
  Offer,
  Onboarding,
  OnboardingStep,
  Period,
  SettingsData,
  SourceType,
  TicketDetail,
  TicketFilters,
  TicketListItem,
  TicketsResponse,
} from "./types";

const ALL_TIME = 8.4;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Offers (drive owed + true cost) ──────────────────────────────────────────
interface MockOffer extends Offer {
  paybacksThisMonth: number; // # paybacks delivered this month
  salesThisMonthCents: number;
  ticketsThisMonth: number;
}

const offers: MockOffer[] = [
  {
    id: "off_promo_taco",
    kind: "promo",
    name: "Buy 3 Tacos, Get 1 Paid Back",
    active: true,
    rewardSummary: "$5.00 cash back",
    paybackCents: 500,
    costToMakeCents: 100,
    paybacksThisMonth: 390,
    salesThisMonthCents: 980000,
    ticketsThisMonth: 312,
  },
  {
    id: "off_perk_queso",
    kind: "super_perk",
    name: "Free Queso w/ Entree",
    active: true,
    rewardSummary: "Free item",
    paybackCents: 600,
    costToMakeCents: 150,
    paybacksThisMonth: 60,
    salesThisMonthCents: 265000,
    ticketsThisMonth: 76,
  },
  {
    // demonstrates a %-off perk: payback value isn't a flat $, cost unset
    id: "off_perk_halfoff",
    kind: "super_perk",
    name: "50% Off Your Entrée",
    active: true,
    rewardSummary: "50% off item",
    paybackCents: null,
    costToMakeCents: null,
    paybacksThisMonth: 0,
    salesThisMonthCents: 0,
    ticketsThisMonth: 0,
  },
];

const offerById = (id: string) => offers.find((o) => o.id === id);
const offerByKind = (kind: SourceType) => offers.find((o) => o.kind === kind && o.paybacksThisMonth > 0);

/** True cost is known only when every delivering offer has a cost-to-make. */
function trueCostKnown() {
  return offers.filter((o) => o.paybacksThisMonth > 0).every((o) => o.costToMakeCents != null);
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export async function getDashboard(period: Period): Promise<DashboardData> {
  await sleep(120);
  const factor = period === "all_time" ? ALL_TIME : 1;
  const delivering = offers.filter((o) => o.paybacksThisMonth > 0);

  const salesDrivenCents = Math.round(offers.reduce((s, o) => s + o.salesThisMonthCents, 0) * factor);
  const owedToBondCents = Math.round(
    delivering.reduce((s, o) => s + o.paybacksThisMonth * (o.paybackCents ?? 0), 0) * factor
  );
  const known = trueCostKnown();
  const trueCostCents = known
    ? Math.round(delivering.reduce((s, o) => s + o.paybacksThisMonth * (o.costToMakeCents ?? 0), 0) * factor)
    : null;
  const keptCents = trueCostCents == null ? null : salesDrivenCents - owedToBondCents - trueCostCents;
  const roi = owedToBondCents > 0 ? Math.round((salesDrivenCents / owedToBondCents) * 100) / 100 : null;

  const bySourceFor = (kind: SourceType) => {
    const group = offers.filter((o) => o.kind === kind);
    return {
      ticketCount: Math.round(group.reduce((s, o) => s + o.ticketsThisMonth, 0) * factor),
      salesCents: Math.round(group.reduce((s, o) => s + o.salesThisMonthCents, 0) * factor),
      owedCents: Math.round(group.reduce((s, o) => s + o.paybacksThisMonth * (o.paybackCents ?? 0), 0) * factor),
    };
  };

  return {
    period,
    salesDrivenCents,
    owedToBondCents,
    trueCostCents,
    keptCents,
    roi,
    ticketCount: Math.round(offers.reduce((s, o) => s + o.ticketsThisMonth, 0) * factor),
    bySource: { promo: bySourceFor("promo"), super_perk: bySourceFor("super_perk") },
  };
}

// ── Tickets ──────────────────────────────────────────────────────────────────
interface RawTicket {
  redemptionId: string;
  sourceType: SourceType;
  offerName: string;
  status: string;
  badge: TicketListItem["badge"];
  createdAt: string;
  partySize: number;
  hasReceipt: boolean;
  salesCents: number | null;
  owedCents: number;
  trueCostBaseCents: number; // before null-gating on cost-to-make
}

const rawTickets: RawTicket[] = [
  { redemptionId: "tkt_1042", sourceType: "promo", offerName: "Buy 3 Tacos, Get 1 Paid Back", status: "completed", badge: "redeemed", createdAt: "2026-06-12T19:24:00Z", partySize: 3, hasReceipt: true, salesCents: 3500, owedCents: 1500, trueCostBaseCents: 300 },
  { redemptionId: "tkt_1041", sourceType: "promo", offerName: "Buy 3 Tacos, Get 1 Paid Back", status: "completed", badge: "redeemed", createdAt: "2026-06-12T13:02:00Z", partySize: 2, hasReceipt: true, salesCents: 2400, owedCents: 1000, trueCostBaseCents: 200 },
  { redemptionId: "tkt_1038", sourceType: "super_perk", offerName: "Free Queso w/ Entree", status: "completed", badge: "redeemed", createdAt: "2026-06-11T20:15:00Z", partySize: 4, hasReceipt: true, salesCents: 5200, owedCents: 1600, trueCostBaseCents: 400 },
  { redemptionId: "tkt_1035", sourceType: "promo", offerName: "Buy 3 Tacos, Get 1 Paid Back", status: "disputed", badge: "disputed", createdAt: "2026-06-11T12:48:00Z", partySize: 2, hasReceipt: true, salesCents: 2900, owedCents: 1000, trueCostBaseCents: 200 },
  { redemptionId: "tkt_1031", sourceType: "super_perk", offerName: "Free Queso w/ Entree", status: "pending", badge: "pending_review", createdAt: "2026-06-10T18:30:00Z", partySize: 5, hasReceipt: true, salesCents: 6800, owedCents: 2000, trueCostBaseCents: 500 },
  { redemptionId: "tkt_1029", sourceType: "promo", offerName: "Buy 3 Tacos, Get 1 Paid Back", status: "completed", badge: "redeemed", createdAt: "2026-06-09T19:55:00Z", partySize: 3, hasReceipt: true, salesCents: 3300, owedCents: 1500, trueCostBaseCents: 300 },
  // no-receipt examples (salesCents null)
  { redemptionId: "tkt_1024", sourceType: "promo", offerName: "Buy 3 Tacos, Get 1 Paid Back", status: "completed", badge: "redeemed", createdAt: "2026-06-08T20:10:00Z", partySize: 2, hasReceipt: false, salesCents: null, owedCents: 1000, trueCostBaseCents: 200 },
  { redemptionId: "tkt_1019", sourceType: "super_perk", offerName: "Free Queso w/ Entree", status: "pending", badge: "pending_review", createdAt: "2026-06-07T18:40:00Z", partySize: 4, hasReceipt: false, salesCents: null, owedCents: 1600, trueCostBaseCents: 400 },
];

function toListItem(r: RawTicket): TicketListItem {
  const costKnown = offerByKind(r.sourceType)?.costToMakeCents != null;
  const trueCostCents = r.hasReceipt && costKnown ? r.trueCostBaseCents : null;
  const keptCents =
    r.salesCents != null && trueCostCents != null ? r.salesCents - r.owedCents - trueCostCents : null;
  return {
    redemptionId: r.redemptionId,
    sourceType: r.sourceType,
    offerName: r.offerName,
    status: r.status,
    badge: r.badge,
    createdAt: r.createdAt,
    partySize: r.partySize,
    salesCents: r.salesCents,
    owedCents: r.owedCents,
    trueCostCents,
    keptCents,
    hasReceipt: r.hasReceipt,
  };
}

export async function getTickets(filters: TicketFilters = {}): Promise<TicketsResponse> {
  await sleep(120);
  let rows = rawTickets.slice();
  if (filters.source) rows = rows.filter((r) => r.sourceType === filters.source);
  if (filters.badge) rows = rows.filter((r) => r.badge === filters.badge);
  if (filters.withReceipt) rows = rows.filter((r) => r.hasReceipt);

  const total = rows.length;
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 50;
  const tickets = rows.slice(offset, offset + limit).map(toListItem);
  return { tickets, total, limit, offset };
}

export async function getTicket(redemptionId: string): Promise<TicketDetail> {
  await sleep(120);
  const r = rawTickets.find((t) => t.redemptionId === redemptionId);
  if (!r) throw new Error(`Ticket ${redemptionId} not found`);
  const base = toListItem(r);

  // Rich ledger for the flagship ticket; synthesized for the rest.
  const lineItems =
    redemptionId === "tkt_1042"
      ? [
          { qty: 9, name: "Street Taco", unitCents: 350, lineCents: 3150, qualifies: true, paidBack: true, paidBackQty: 3 },
          { qty: 2, name: "Breakfast Taco", unitCents: 350, lineCents: 700, qualifies: true, paidBack: false, paidBackQty: 0 },
          { qty: 3, name: "Fountain Drink", unitCents: 250, lineCents: 750, qualifies: false, paidBack: false, paidBackQty: 0 },
          { qty: 1, name: "Chips & Queso", unitCents: 600, lineCents: 600, qualifies: false, paidBack: false, paidBackQty: 0 },
        ]
      : r.hasReceipt
        ? [
            { qty: r.partySize * 3, name: r.sourceType === "super_perk" ? "Entrée" : "Street Taco", unitCents: 350, lineCents: r.partySize * 3 * 350, qualifies: true, paidBack: true, paidBackQty: r.partySize },
            { qty: r.partySize, name: "Fountain Drink", unitCents: 250, lineCents: r.partySize * 250, qualifies: false, paidBack: false, paidBackQty: 0 },
          ]
        : [];

  const receiptTotalCents = r.hasReceipt && r.salesCents != null ? r.salesCents + r.owedCents : null;
  return {
    ...base,
    party: { total: r.partySize },
    receiptImageAvailable: r.hasReceipt,
    receiptTotalCents,
    taxCents: r.hasReceipt && r.salesCents != null ? Math.round(r.salesCents * 0.0825) : null,
    tipCents: r.hasReceipt && r.salesCents != null ? Math.round(r.salesCents * 0.18) : null,
    lineItems,
  };
}

// ── Settings ─────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<SettingsData> {
  await sleep(120);
  return {
    partner: { id: "demo-partner-uuid", name: "Rusty Taco", category: "Mexican · Fast casual", logoUrl: null },
    offers: offers.map(({ paybacksThisMonth, salesThisMonthCents, ticketsThisMonth, ...o }) => o),
  };
}

export async function patchOffer(
  offerId: string,
  body: { kind: SourceType; costToMakeCents: number | null }
): Promise<Offer> {
  await sleep(120);
  const o = offerById(offerId);
  if (!o) throw new Error(`Offer ${offerId} not found`);
  o.costToMakeCents = body.costToMakeCents;
  const { paybacksThisMonth, salesThisMonthCents, ticketsThisMonth, ...rest } = o;
  return rest;
}

// ── Identity / onboarding ────────────────────────────────────────────────────

const ALL_STEPS: OnboardingStep[] = ["profile", "locations", "offers", "agreement"];

// Default to a partially-complete state so the wizard is demoable on the mock.
const onboardingState: Onboarding = {
  status: "in_progress",
  steps: { profile: true, locations: true, offers: false, agreement: false },
  remaining: ["offers", "agreement"],
};

function recomputeOnboarding() {
  onboardingState.remaining = ALL_STEPS.filter((s) => !onboardingState.steps[s]);
  onboardingState.status = onboardingState.remaining.length === 0 ? "complete" : "in_progress";
}

export async function getMe(): Promise<MeResponse> {
  await sleep(80);
  return {
    user: { id: "mock", email: "demo@bond.app" },
    memberships: [
      {
        partnerId: "demo-partner-uuid",
        role: "member",
        partnerName: "Rusty Taco",
        onboardingStatus: onboardingState.status,
        onboardingSteps: onboardingState.steps as Record<string, boolean>,
      },
    ],
  };
}

export async function partnerJoin(body: {
  token: string;
  email: string;
  password: string;
  username?: string;
}) {
  await sleep(120);
  return {
    user: { id: "mock", email: body.email, role: "owner", username: body.username },
    session: { access_token: "mock-access", refresh_token: "mock-refresh" },
  };
}

export async function getOnboarding(): Promise<Onboarding> {
  await sleep(80);
  return { ...onboardingState, steps: { ...onboardingState.steps }, remaining: [...onboardingState.remaining] };
}

export async function patchOnboarding(step: OnboardingStep, complete: boolean): Promise<Onboarding> {
  await sleep(120);
  onboardingState.steps[step] = complete;
  recomputeOnboarding();
  return getOnboarding();
}

export async function signAgreement(_version?: string): Promise<Onboarding> {
  await sleep(120);
  onboardingState.steps.agreement = true;
  recomputeOnboarding();
  return getOnboarding();
}
