export const XERO_AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize";
export const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
export const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";
export const XERO_INVOICES_URL = "https://api.xero.com/api.xro/2.0/Invoices";

/** Granular read-only invoices scope (Xero March 2026). No write. No BAS reports. */
export const XERO_SCOPES = "openid accounting.invoices.read";

export const XERO_STATE_COOKIE = "bas_xero_state";
export const XERO_VERIFIER_COOKIE = "bas_xero_verifier";
export const XERO_SESSION_COOKIE = "bas_xero_session";

const MAX_INVOICE_PAGESIZE = 50;
export const XERO_MAX_ROWS = 80;
/** Access tokens last 30 minutes; drop the cookie sooner. No refresh / offline_access. */
export const XERO_SESSION_MAX_AGE = 20 * 60;
/** Browsers cap cookies near 4 KB. Refuse rather than store a truncated token. */
export const XERO_SESSION_COOKIE_MAX = 3800;

export function xeroConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.XERO_CLIENT_ID?.trim() &&
      env.XERO_CLIENT_SECRET?.trim() &&
      env.XERO_REDIRECT_URI?.trim(),
  );
}

export function xeroClientId(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const id = env.XERO_CLIENT_ID?.trim();
  return id ? id : undefined;
}

export function xeroClientSecret(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const secret = env.XERO_CLIENT_SECRET?.trim();
  return secret ? secret : undefined;
}

export function xeroRedirectUri(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const uri = env.XERO_REDIRECT_URI?.trim();
  return uri ? uri : undefined;
}

export function xeroCookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export type XeroSession = {
  accessToken: string;
  tenantId: string;
};

export function parseXeroSession(raw: string | undefined): XeroSession | null {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as unknown;
    if (
      value == null ||
      typeof value !== "object" ||
      !("accessToken" in value) ||
      !("tenantId" in value)
    ) {
      return null;
    }
    const accessToken = String((value as XeroSession).accessToken ?? "").trim();
    const tenantId = String((value as XeroSession).tenantId ?? "").trim();
    if (!accessToken || !tenantId) {
      return null;
    }
    return { accessToken, tenantId };
  } catch {
    return null;
  }
}

export function invoicesQuery(now: Date = new Date()): string {
  const from = new Date(now.getTime());
  from.setUTCDate(from.getUTCDate() - 90);
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth() + 1;
  const d = from.getUTCDate();
  // Xero DateTime() wants unpadded integers. encodeURIComponent so spaces are %20, not +.
  const where = encodeURIComponent(`Date >= DateTime(${y}, ${m}, ${d})`);
  return `${XERO_INVOICES_URL}?page=1&pageSize=${MAX_INVOICE_PAGESIZE}&Statuses=AUTHORISED,PAID&where=${where}`;
}
