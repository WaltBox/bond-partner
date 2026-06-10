/**
 * HTTP client for bond-api. Auth is the Supabase access token sent as
 * `Authorization: Bearer <token>`. The partner id is discovered at runtime
 * (GET /api/partner/me) and set via setActivePartnerId — there's no env id.
 *
 *   NEXT_PUBLIC_API_BASE_URL   base of bond-api
 *   NEXT_PUBLIC_USE_MOCK       "true" to run on the in-memory mock (no Supabase)
 */

import { supabase } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// Active partner id, set after GET /api/partner/me resolves the user's company.
let activePartnerId: string | null = null;
export const setActivePartnerId = (id: string | null) => {
  activePartnerId = id;
};
export const getActivePartnerId = () => activePartnerId;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  if (USE_MOCK || !supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Fetch `${BASE}/api${path}` with the bearer token, unwrap `{ data }`,
 *  throw ApiError on `{ error }` or non-2xx. */
export async function bondFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
      ...(init?.headers ?? {}),
    },
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  const body = (json ?? {}) as { data?: T; error?: string; details?: unknown };
  if (!res.ok || body.error) {
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body.details);
  }
  return body.data as T;
}

/** Build a partner-scoped path, requiring an active partner id. */
export function partnerPath(suffix: string): string {
  if (!activePartnerId) throw new ApiError("No active partner selected", 0);
  return `/partner/${activePartnerId}${suffix}`;
}
