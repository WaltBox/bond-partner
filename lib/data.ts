/**
 * ──────────────────────────────────────────────────────────────────────────
 *  MOCK DATA — single source of truth for the whole portal.
 *  Everything in the UI is driven by the objects below. Edit here to tweak.
 *  No backend, no fetch, no auth. All money is in integer cents.
 * ──────────────────────────────────────────────────────────────────────────
 */

export type TicketStatus = "redeemed" | "pending_review" | "disputed" | "expired";

export type Ticket = {
  id: string;
  date: string;
  location: string;
  party: number;
  promo: string;
  status: TicketStatus;
  salesCents: number;
  owedCents: number;
  trueCostCents: number;
  keptCents: number;
};

export type LineItem = {
  qty: number;
  name: string;
  unitCents: number;
  totalCents: number;
  paidBack: boolean;
  paidBackQty?: number;
};

// ── Partner identity ───────────────────────────────────────────────────────

export const partner = {
  name: "Rusty Taco",
  location: "Deep Ellum, Dallas TX",
  locations: ["Deep Ellum, Dallas TX", "Bishop Arts, Dallas TX", "Fort Worth, TX"],
};

export const periods = ["This month", "All time"] as const;
export type Period = (typeof periods)[number];

/** Multiplier applied to a monthly figure to approximate its all-time total.
 *  Mock-only — real data would come from distinct API responses. */
export const ALL_TIME_FACTOR = 8.4;

// ── Screen 1 · Dashboard ─────────────────────────────────────────────────────

export const dashboard = {
  partner: { name: "Rusty Taco", location: "Deep Ellum, Dallas TX" },
  period: "This month" as Period,
  metrics: {
    salesDrivenCents: 1245000, // $12,450
    owedToBondCents: 231000, // $2,310
    trueCostCents: 48000, // $480
    keptCents: 966000, // $9,660
    roi: 5.39, // $5.39 sales per $1 paid back
    deltas: { salesDriven: 0.12, owed: 0.08, trueCost: 0.05, kept: 0.14 },
  },
  insights: {
    totalDiners: 388,
    repeatRate: 0.41,
    avgPartySize: 2.7,
    avgTicketCents: 3340, // $33.40
    newVsReturning: { new: 229, returning: 159 },
  },
  salesOverTime: [
    ["Jun 1", 38000], ["Jun 2", 41000], ["Jun 3", 52000], ["Jun 4", 33000],
    ["Jun 5", 29000], ["Jun 6", 61000], ["Jun 7", 58000], ["Jun 8", 44000],
    ["Jun 9", 47000], ["Jun 10", 39000], ["Jun 11", 55000], ["Jun 12", 62000],
  ] as [string, number][],
  visitsByDayOfWeek: [
    ["Sun", 84], ["Mon", 79], ["Tue", 66], ["Wed", 51],
    ["Thu", 38], ["Fri", 31], ["Sat", 39],
  ] as [string, number][],
};

// ── Screen 2 · Tickets ───────────────────────────────────────────────────────

export const tickets: Ticket[] = [
  {
    id: "tkt_1042", date: "Jun 12, 2026 · 7:24 PM", location: "Deep Ellum",
    party: 3, promo: "Buy 3 Tacos, Get 1 Paid Back", status: "redeemed",
    salesCents: 3500, owedCents: 1500, trueCostCents: 300, keptCents: 1700,
  },
  {
    id: "tkt_1041", date: "Jun 12, 2026 · 1:02 PM", location: "Deep Ellum",
    party: 2, promo: "Buy 3 Tacos, Get 1 Paid Back", status: "redeemed",
    salesCents: 2400, owedCents: 1000, trueCostCents: 200, keptCents: 1200,
  },
  {
    id: "tkt_1038", date: "Jun 11, 2026 · 8:15 PM", location: "Deep Ellum",
    party: 4, promo: "Free Queso w/ Entree", status: "redeemed",
    salesCents: 5200, owedCents: 1600, trueCostCents: 400, keptCents: 3200,
  },
  {
    id: "tkt_1035", date: "Jun 11, 2026 · 12:48 PM", location: "Deep Ellum",
    party: 2, promo: "Buy 3 Tacos, Get 1 Paid Back", status: "disputed",
    salesCents: 2900, owedCents: 1000, trueCostCents: 200, keptCents: 1700,
  },
  {
    id: "tkt_1031", date: "Jun 10, 2026 · 6:30 PM", location: "Deep Ellum",
    party: 5, promo: "Free Queso w/ Entree", status: "pending_review",
    salesCents: 6800, owedCents: 2000, trueCostCents: 500, keptCents: 4300,
  },
  {
    id: "tkt_1029", date: "Jun 9, 2026 · 7:55 PM", location: "Deep Ellum",
    party: 3, promo: "Buy 3 Tacos, Get 1 Paid Back", status: "redeemed",
    salesCents: 3300, owedCents: 1500, trueCostCents: 300, keptCents: 1500,
  },
];

// Per-ticket detail. Keyed by id; tkt_1042 is the fully-specified example.
export const ticketDetail = {
  id: "tkt_1042",
  date: "Jun 12, 2026 · 7:24 PM",
  location: "Deep Ellum",
  status: "redeemed" as TicketStatus,
  party: { total: 3, repeat: 1, new: 2 },
  salesCents: 3500,
  owedCents: 1500,
  trueCostCents: 300,
  keptCents: 1700,
  promo: "Buy 3 Tacos, Get 1 Paid Back",
  lineItems: [
    { qty: 9, name: "Street Taco", unitCents: 350, totalCents: 3150, paidBack: true, paidBackQty: 3 },
    { qty: 3, name: "Fountain Drink", unitCents: 250, totalCents: 750, paidBack: false },
    { qty: 1, name: "Chips & Queso", unitCents: 600, totalCents: 600, paidBack: false },
  ] as LineItem[],
  receiptTotalCents: 4500, // pre-discount printed total
};

/**
 * Build a detail object for any ticket. tkt_1042 returns the rich example;
 * others are synthesized from the row so every row in the table is clickable.
 */
export function getTicketDetail(id: string) {
  if (id === ticketDetail.id) return ticketDetail;
  const t = tickets.find((x) => x.id === id);
  if (!t) return null;
  const repeat = Math.max(0, Math.round(t.party * 0.35));
  return {
    id: t.id,
    date: t.date,
    location: t.location,
    status: t.status,
    party: { total: t.party, repeat, new: t.party - repeat },
    salesCents: t.salesCents,
    owedCents: t.owedCents,
    trueCostCents: t.trueCostCents,
    keptCents: t.keptCents,
    promo: t.promo,
    lineItems: [
      {
        qty: t.party * 3,
        name: t.promo.includes("Queso") ? "Entree" : "Street Taco",
        unitCents: 350,
        totalCents: t.party * 3 * 350,
        paidBack: true,
        paidBackQty: t.party,
      },
      { qty: t.party, name: "Fountain Drink", unitCents: 250, totalCents: t.party * 250, paidBack: false },
    ] as LineItem[],
    receiptTotalCents: t.salesCents + t.owedCents,
  };
}

// ── Screen 3 · Billing / Statement ───────────────────────────────────────────

export const statement = {
  period: "June 2026",
  totalOwedCents: 231000,
  lines: tickets.map((t) => ({
    id: t.id,
    date: t.date,
    promo: t.promo,
    owedCents: t.owedCents,
  })),
};

// ── Screen 4 · Settings · Promotions ─────────────────────────────────────────

export type Promo = {
  name: string;
  paybackCents: number;
  costToMakeCents: number;
};

export const promos: Promo[] = [
  { name: "Buy 3 Tacos, Get 1 Paid Back", paybackCents: 500, costToMakeCents: 100 },
  { name: "Free Queso w/ Entree", paybackCents: 600, costToMakeCents: 150 },
];
