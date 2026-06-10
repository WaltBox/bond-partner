/**
 * Public API surface. Routes to the in-memory mock or bond-api based on
 * NEXT_PUBLIC_USE_MOCK. Screens import only from here.
 */

import { bondFetch, partnerPath, saveSession, clearTokens, USE_MOCK } from "./client";
import * as mock from "./mock";
import type {
  AuthSession,
} from "./client";
import type {
  AuthUser,
  DashboardData,
  Membership,
  Offer,
  Onboarding,
  OnboardingStep,
  Period,
  SettingsData,
  SourceType,
  TicketDetail,
  TicketFilters,
  TicketsResponse,
} from "./types";

export * from "./types";
export {
  USE_MOCK,
  ApiError,
  setActivePartnerId,
  getActivePartnerId,
  hasSession,
  clearTokens,
} from "./client";

// ── Auth (bond-api) ──────────────────────────────────────────────────────────

export async function authLogin(
  email: string,
  password: string
): Promise<{ user: AuthUser; session: AuthSession }> {
  const data = await bondFetch<{ user: AuthUser; session: AuthSession }>(`/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveSession(data.session);
  return data;
}

export function authSignup(body: {
  email: string;
  password: string;
  username?: string;
  phone?: string;
}): Promise<unknown> {
  return bondFetch(`/auth/signup`, { method: "POST", body: JSON.stringify(body) });
}

export function authMe(): Promise<AuthUser> {
  return bondFetch<AuthUser>(`/auth/me`);
}

export async function authLogout(): Promise<void> {
  try {
    await bondFetch(`/auth/logout`, { method: "POST" });
  } catch {
    /* ignore */
  }
  clearTokens();
}

// ── Identity / onboarding (not partner-scoped) ───────────────────────────────

export function getMe(): Promise<{ partners: Membership[] }> {
  if (USE_MOCK) return mock.getMe();
  // Defensive parse — accept partners | companies | memberships.
  return bondFetch<Record<string, unknown>>(`/partner/me`).then((d) => ({
    partners: (d.partners ?? d.companies ?? d.memberships ?? []) as Membership[],
  }));
}

export function joinPartner(token: string): Promise<{ partner_id: string; role: string }> {
  if (USE_MOCK) return mock.joinPartner(token);
  return bondFetch(`/partner/join`, { method: "POST", body: JSON.stringify({ token }) });
}

export function getOnboarding(): Promise<Onboarding> {
  if (USE_MOCK) return mock.getOnboarding();
  return bondFetch<{ onboarding: Onboarding }>(partnerPath(`/onboarding`)).then((d) => d.onboarding);
}

export function patchOnboarding(step: OnboardingStep, complete = true): Promise<Onboarding> {
  if (USE_MOCK) return mock.patchOnboarding(step, complete);
  return bondFetch<{ onboarding: Onboarding }>(partnerPath(`/onboarding`), {
    method: "PATCH",
    body: JSON.stringify({ step, complete }),
  }).then((d) => d.onboarding);
}

export function signAgreement(version?: string): Promise<Onboarding> {
  if (USE_MOCK) return mock.signAgreement(version);
  return bondFetch<{ onboarding: Onboarding }>(partnerPath(`/agreement`), {
    method: "POST",
    body: JSON.stringify(version ? { version } : {}),
  }).then((d) => d.onboarding);
}

// ── Partner-scoped data ──────────────────────────────────────────────────────

export function getDashboard(period: Period): Promise<DashboardData> {
  if (USE_MOCK) return mock.getDashboard(period);
  return bondFetch<{ dashboard: DashboardData }>(partnerPath(`/dashboard?period=${period}`)).then(
    (d) => d.dashboard
  );
}

export function getTickets(filters: TicketFilters = {}): Promise<TicketsResponse> {
  if (USE_MOCK) return mock.getTickets(filters);
  const q = new URLSearchParams();
  if (filters.source) q.set("source", filters.source);
  if (filters.badge) q.set("badge", filters.badge);
  if (filters.withReceipt) q.set("with_receipt", "true");
  if (filters.limit != null) q.set("limit", String(filters.limit));
  if (filters.offset != null) q.set("offset", String(filters.offset));
  const qs = q.toString();
  return bondFetch<TicketsResponse>(partnerPath(`/tickets${qs ? `?${qs}` : ""}`));
}

export function getTicket(redemptionId: string): Promise<TicketDetail> {
  if (USE_MOCK) return mock.getTicket(redemptionId);
  return bondFetch<{ ticket: TicketDetail }>(partnerPath(`/tickets/${redemptionId}`)).then(
    (d) => d.ticket
  );
}

export function getSettings(): Promise<SettingsData> {
  if (USE_MOCK) return mock.getSettings();
  return bondFetch<{ settings: SettingsData }>(partnerPath(`/settings`)).then((d) => d.settings);
}

export type PartnerInfo = SettingsData["partner"];

export function getPartner(): Promise<PartnerInfo> {
  return getSettings().then((s) => s.partner);
}

export function patchOffer(
  offerId: string,
  body: { kind: SourceType; costToMakeCents: number | null }
): Promise<Offer> {
  if (USE_MOCK) return mock.patchOffer(offerId, body);
  return bondFetch<{ offer: Offer }>(partnerPath(`/offers/${offerId}`), {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((d) => d.offer);
}
