"use server";

import { cookies } from "next/headers";
import { analyseTransactionRows, type AnalyseResponse } from "@/app/actions/analyse";
import { fetchInvoiceRows } from "@/lib/xero/client";
import { parseXeroSession, XERO_SESSION_COOKIE, xeroConfigured } from "@/lib/xero/config";

export async function analyseXero(): Promise<AnalyseResponse> {
  if (!xeroConfigured()) {
    return {
      ok: false,
      error:
        "Xero is off until XERO_CLIENT_ID, XERO_CLIENT_SECRET, and XERO_REDIRECT_URI are set on this deploy.",
    };
  }

  const session = parseXeroSession((await cookies()).get(XERO_SESSION_COOKIE)?.value);
  if (!session) {
    return { ok: false, error: "Connect Xero first. Access is read-only and lasts about 20 minutes." };
  }

  try {
    const rows = await fetchInvoiceRows(session);
    if (rows.length === 0) {
      return {
        ok: false,
        error: "No authorised or paid invoices in the last 90 days (up to 80 lines).",
      };
    }
    return analyseTransactionRows(rows, "Xero invoices");
  } catch {
    return { ok: false, error: "Could not read Xero invoices. Connect again." };
  }
}
