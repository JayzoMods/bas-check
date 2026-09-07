import { type NextRequest, NextResponse } from "next/server";
import {
  XERO_SESSION_COOKIE,
  XERO_STATE_COOKIE,
  XERO_VERIFIER_COOKIE,
} from "@/lib/xero/config";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(XERO_SESSION_COOKIE);
  response.cookies.delete(XERO_STATE_COOKIE);
  response.cookies.delete(XERO_VERIFIER_COOKIE);
  return response;
}
