import { type NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode, firstTenantId } from "@/lib/xero/client";
import {
  XERO_SESSION_COOKIE,
  XERO_SESSION_COOKIE_MAX,
  XERO_SESSION_MAX_AGE,
  XERO_STATE_COOKIE,
  XERO_VERIFIER_COOKIE,
  xeroConfigured,
  xeroCookieBase,
} from "@/lib/xero/config";

function redirectHome(request: NextRequest, reason: string) {
  const home = new URL("/", request.url);
  home.searchParams.set("xero", reason);
  const response = NextResponse.redirect(home);
  response.cookies.delete(XERO_STATE_COOKIE);
  response.cookies.delete(XERO_VERIFIER_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  if (!xeroConfigured()) {
    return redirectHome(request, "off");
  }

  if (request.nextUrl.searchParams.get("error")) {
    return redirectHome(request, "denied");
  }

  const code = request.nextUrl.searchParams.get("code")?.trim() ?? "";
  const state = request.nextUrl.searchParams.get("state")?.trim() ?? "";
  const expectedState = request.cookies.get(XERO_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(XERO_VERIFIER_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return redirectHome(request, "error");
  }

  try {
    const accessToken = await exchangeAuthorizationCode(code, verifier);
    const tenantId = await firstTenantId(accessToken);
    const session = JSON.stringify({ accessToken, tenantId });
    if (session.length > XERO_SESSION_COOKIE_MAX) {
      return redirectHome(request, "error");
    }

    const home = new URL("/", request.url);
    home.searchParams.set("xero", "connected");
    const response = NextResponse.redirect(home);
    response.cookies.set(XERO_SESSION_COOKIE, session, {
      ...xeroCookieBase(),
      maxAge: XERO_SESSION_MAX_AGE,
    });
    response.cookies.delete(XERO_STATE_COOKIE);
    response.cookies.delete(XERO_VERIFIER_COOKIE);
    return response;
  } catch {
    return redirectHome(request, "error");
  }
}
