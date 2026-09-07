import {
  xeroClientId,
  xeroClientSecret,
  xeroRedirectUri,
  XERO_CONNECTIONS_URL,
  XERO_TOKEN_URL,
  invoicesQuery,
  type XeroSession,
} from "./config";
import { invoicesToRows, type XeroInvoice } from "./invoices";

export type XeroFetch = (url: string, init?: RequestInit) => Promise<Response>;

export async function exchangeAuthorizationCode(
  code: string,
  verifier: string,
  fetchImpl: XeroFetch = fetch,
): Promise<string> {
  const clientId = xeroClientId();
  const clientSecret = xeroClientSecret();
  const redirectUri = xeroRedirectUri();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Xero is not configured.");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetchImpl(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Xero token exchange failed.");
  }
  const payload = (await response.json()) as { access_token?: unknown };
  const token = typeof payload.access_token === "string" ? payload.access_token.trim() : "";
  if (!token) {
    throw new Error("Xero token exchange failed.");
  }
  return token;
}

export async function firstTenantId(
  accessToken: string,
  fetchImpl: XeroFetch = fetch,
): Promise<string> {
  const response = await fetchImpl(XERO_CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not list Xero organisations.");
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("No Xero organisation is connected.");
  }
  const tenantId = String((payload[0] as { tenantId?: unknown }).tenantId ?? "").trim();
  if (!tenantId) {
    throw new Error("No Xero organisation is connected.");
  }
  return tenantId;
}

export async function fetchInvoiceRows(
  session: XeroSession,
  fetchImpl: XeroFetch = fetch,
) {
  const response = await fetchImpl(invoicesQuery(), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/json",
      "Xero-tenant-id": session.tenantId,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not read Xero invoices.");
  }
  const payload = (await response.json()) as { Invoices?: XeroInvoice[] };
  const invoices = Array.isArray(payload.Invoices) ? payload.Invoices : [];
  return invoicesToRows(invoices);
}
