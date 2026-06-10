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

// GET /api/partner/:id/tickets/:redemptionId -> data.ticket
export interface TicketDetail extends TicketListItem {
  party: { total: number };
  receiptImageAvailable: boolean;
  receiptImageUrl?: string | null; // populated once the backend exposes a signed URL
  receiptTotalCents: number | null;
  taxCents: number | null;
  tipCents: number | null;
  lineItems: LineItem[];
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

// POST /api/auth/login -> data.user
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  username?: string | null;
  [k: string]: unknown;
}

// GET /api/partner/me -> data  (the companies the logged-in user belongs to)
export interface Membership {
  id: string; // partner/company id
  name: string | null;
  role: string;
  logoUrl?: string | null;
  category?: string | null;
}

export type OnboardingStatus = "draft" | "in_progress" | "complete" | "live";
export type OnboardingStep = "profile" | "locations" | "offers" | "agreement";

// GET /api/partner/:id/onboarding -> data.onboarding
export interface Onboarding {
  status: OnboardingStatus;
  steps: Partial<Record<OnboardingStep, boolean>>;
  remaining: OnboardingStep[];
}
