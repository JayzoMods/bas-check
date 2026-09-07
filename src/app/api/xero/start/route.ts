import { NextResponse } from "next/server";
import {
  XERO_AUTHORIZE_URL,
  XERO_SCOPES,
  XERO_STATE_COOKIE,
  XERO_VERIFIER_COOKIE,
  xeroClientId,
  xeroConfigured,
  xeroCookieBase,
  xeroRedirectUri,
} from "@/lib/xero/config";
import { createPkce } from "@/lib/xero/pkce";

export async function GET(request: Request) {
  const home = new URL("/", request.url);
  if (!xeroConfigured()) {
    home.searchParams.set("xero", "off");
    return NextResponse.redirect(home);
  }

  const clientId = xeroClientId();
  const redirectUri = xeroRedirectUri();
  if (!clientId || !redirectUri) {
    home.searchParams.set("xero", "off");
    return NextResponse.redirect(home);
  }

  const pkce = createPkce();
  const authorize = new URL(XERO_AUTHORIZE_URL);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", XERO_SCOPES);
  authorize.searchParams.set("state", pkce.state);
  authorize.searchParams.set("code_challenge", pkce.challenge);
  authorize.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorize);
  const cookie = { ...xeroCookieBase(), maxAge: 600 };
  response.cookies.set(XERO_STATE_COOKIE, pkce.state, cookie);
  response.cookies.set(XERO_VERIFIER_COOKIE, pkce.verifier, cookie);
  return response;
}
