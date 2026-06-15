/**
 * API contract types — mirror the live backend's response shapes.
 * Money is always integer cents. `null` money = "not yet known" (render as —).
 */

export type Period = "this_month" | "all_time";
export type SourceType = "promo" | "super_perk";
export type Badge = "redeemed" | "pending_review" | "disputed" | "expired";

export interface SourceBreakdown {
  ticketCount: number;
  salesCents: number;
  owedCents: number;
}

// GET /api/partner/:id/dashboard?period=  -> data.dashboard
export interface DashboardData {
  period: Period;
  salesDrivenCents: number;
  owedToBondCents: number;
  trueCostCents: number | null; // null until cost-to-make is set in Settings
  keptCents: number | null; // null until trueCost is known
  roi: number | null; // sales / owed; null if owed is 0
  ticketCount: number;
  bySource: {
    promo: SourceBreakdown;
    super_perk: SourceBreakdown;
  };
}

// GET /api/partner/:id/tickets  -> data
export interface TicketListItem {
  redemptionId: string;
  sourceType: SourceType;
  offerName: string | null;
  status: string; // raw redemption status
  badge: Badge;
  createdAt: string; // ISO 8601 UTC
  partySize: number; // count only — never names
  salesCents: number | null; // null when no receipt was scanned
  owedCents: number;
  trueCostCents: number | null;
  keptCents: number | null;
  hasReceipt: boolean;
}

export interface TicketsResponse {
  tickets: TicketListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface LineItem {
  qty: number;
  name: string;
  unitCents: number | null;
  lineCents: number | null;
  qualifies: boolean; // is the KIND of item the promo rewards
  paidBack: boolean; // were units of this line actually comped
  paidBackQty: number;
}

export type SettlementMode = "single_payer" | "separate_checks";

// One per-person check, populated only when settlementMode === "separate_checks".
export interface TicketReceipt {
  receiptId: string;
  uploadedBy: string; // opaque user id; not surfaced (portal is counts-only)
  imageUrl: string | null; // signed URL — render directly
  totalCents: number | null;
  lineItems: LineItem[];
}

// GET /api/partner/:id/tickets/:redemptionId -> data.ticket
export interface TicketDetail extends TicketListItem {
  party: { total: number };
  receiptImageAvailable: boolean;
  receiptImageUrl?: string | null; // populated once the backend exposes a signed URL
  receiptTotalCents: number | null;
  taxCents: number | null;
  tipCents: number | null;
  lineItems: LineItem[]; // combined ledger (aggregated across receipts when separate checks)
  // Multi-receipt (separate checks). Absent/`single_payer` → the single-receipt view above.
  settlementMode?: SettlementMode;
  receipts?: TicketReceipt[];
}

export interface Offer {
  id: string;
  kind: SourceType;
  name: string | null;
  active: boolean;
  rewardSummary: string; // "$5.00 cash back", "Free item", "50% off item"
  paybackCents: number | null; // flat $ payback when knowable; null for %/free
  costToMakeCents: number | null; // EDITABLE — drives True Cost
}

// GET /api/partner/:id/settings -> data.settings
export interface SettingsData {
  partner: {
    id: string;
    name: string | null;
    category: string | null;
    logoUrl: string | null;
  };
  offers: Offer[];
}

export interface TicketFilters {
  source?: SourceType;
  badge?: Badge;
  withReceipt?: boolean;
  limit?: number;
  offset?: number;
}

// GET /api/partner/:id/moments -> data { moments, next_cursor }
// Diner photos taken at the restaurant. Anonymized — no crib/user identity.
export interface MomentPhoto {
  id: string;
  url: string; // public URL — render directly
  order: number; // 1–3
}
export interface Moment {
  id: string;
  caption: string | null;
  likeCount: number;
  createdAt: string; // ISO
  photos: MomentPhoto[];
}
export interface MomentsResponse {
  moments: Moment[];
  next_cursor: string | null; // pass back as ?cursor= for the next page; null = end
}

// POST /api/auth/login -> data.user
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  username?: string | null;
  [k: string]: unknown;
}

// GET /api/partner/me -> data.memberships  (companies the user belongs to)
export interface Membership {
  partnerId: string; // ← use as :id in every /api/partner/:id/* call
  role: string;
  partnerName: string | null;
  onboardingStatus?: OnboardingStatus;
  onboardingSteps?: Record<string, boolean>;
}

export interface MeResponse {
  user: AuthUser;
  memberships: Membership[];
}

export type OnboardingStatus = "draft" | "in_progress" | "complete" | "live";
export type OnboardingStep = "profile" | "locations" | "offers" | "agreement";

// GET /api/partner/:id/onboarding -> data.onboarding
export interface Onboarding {
  status: OnboardingStatus;
  steps: Partial<Record<OnboardingStep, boolean>>;
  remaining: OnboardingStep[];
}
