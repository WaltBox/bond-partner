/**
 * HTTP client for bond-api. Auth is a bond-api access token (from
 * POST /api/auth/login) stored client-side and sent as `Authorization: Bearer`.
 * On a 401 we transparently try POST /api/auth/refresh once.
 *
 *   NEXT_PUBLIC_API_BASE_URL   base of bond-api  (the only required env var)
 *   NEXT_PUBLIC_USE_MOCK       "true" to run on the in-memory mock
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const ACCESS_KEY = "bond.access_token";
const REFRESH_KEY = "bond.refresh_token";
const store = (): Storage | null => (typeof window === "undefined" ? null : window.localStorage);

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  [k: string]: unknown;
}

export function saveSession(session: AuthSession | null | undefined) {
  const s = store();
  if (!s || !session) return;
  if (session.access_token) s.setItem(ACCESS_KEY, session.access_token);
  if (session.refresh_token) s.setItem(REFRESH_KEY, session.refresh_token);
}
export function clearTokens() {
  const s = store();
  s?.removeItem(ACCESS_KEY);
  s?.removeItem(REFRESH_KEY);
}
export const getAccessToken = () => store()?.getItem(ACCESS_KEY) ?? null;
const getRefreshToken = () => store()?.getItem(REFRESH_KEY) ?? null;
export const hasSession = () => !!getAccessToken();

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

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const json = await res.json();
    const session = (json?.data?.session ?? json?.data) as AuthSession;
    saveSession(session);
    return !!session?.access_token;
  } catch {
    return false;
  }
}

/** Fetch `${BASE}/api${path}`, attach the bearer token, refresh once on 401,
 *  unwrap `{ data }`, throw ApiError on `{ error }` or non-2xx. */
export async function bondFetch<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401 && !retried && !path.startsWith("/auth/") && getRefreshToken()) {
    if (await tryRefresh()) return bondFetch<T>(path, init, true);
  }

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
