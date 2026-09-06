"use server";

import { DEMO_CSV } from "@/data/demo-csv";
import { persistCheck } from "@/db/checks";
import { formatAbn, isValidAbn } from "@/lib/gst/abn";
import { parseCsv } from "@/lib/gst/csv";
import { gstFromInclusive, parseAudAmount } from "@/lib/gst/money";
import { analyseRows } from "@/lib/gst/rules";
import type { AnalyseResult } from "@/lib/gst/types";

export type AnalyseOk = AnalyseResult & { ok: true; source: string; checkId: string | null };
export type AnalyseErr = { ok: false; error: string };
export type AnalyseResponse = AnalyseOk | AnalyseErr;

export async function analyseCsvFile(formData: FormData): Promise<AnalyseResponse> {
  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a CSV file first." };
  }
  if (file.size > 1_000_000) {
    return { ok: false, error: "CSV is over 1 MB. Split it and try again." };
  }
  const text = await file.text();
  return runAnalyse(text, file.name || "upload.csv");
}

export async function analyseDemo(): Promise<AnalyseResponse> {
  return runAnalyse(DEMO_CSV, "demo-transactions.csv");
}

async function runAnalyse(text: string, source: string): Promise<AnalyseResponse> {
  try {
    const rows = parseCsv(text);
    if (rows.length === 0) {
      return { ok: false, error: "No data rows. Need a header plus at least one transaction." };
    }
    const result = analyseRows(rows);
    const checkId = await persistCheck({ filename: source, rows, findings: result.findings });
    return { ok: true, source, checkId, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read that CSV.";
    return { ok: false, error: message };
  }
}

export interface InvoiceCheck {
  ok: true;
  validAbn: boolean;
  formattedAbn: string;
  expectedGst: number | null;
  gstMatches: boolean | null;
  messages: string[];
}

export async function checkInvoice(formData: FormData): Promise<InvoiceCheck | AnalyseErr> {
  const abnRaw = String(formData.get("abn") ?? "");
  const totalRaw = String(formData.get("total") ?? "");
  const gstRaw = String(formData.get("gst") ?? "");

  const messages: string[] = [];
  const validAbn = isValidAbn(abnRaw);
  const digits = abnRaw.replace(/\D/g, "");
  if (abnRaw.trim() === "") {
    messages.push("Enter an 11-digit ABN.");
  } else if (!validAbn) {
    messages.push("ABN fails the ABR checksum.");
  } else {
    messages.push(`ABN ${formatAbn(digits)} passes the checksum. This is not an ABR live lookup.`);
  }

  const total = parseAudAmount(totalRaw);
  const gst = parseAudAmount(gstRaw);
  let expectedGst: number | null = null;
  let gstMatches: boolean | null = null;

  if (total === null) {
    messages.push("Enter a GST-inclusive total.");
  } else {
    expectedGst = gstFromInclusive(total);
    if (gst === null) {
      messages.push(`1/11 of $${total.toFixed(2)} is $${expectedGst.toFixed(2)}.`);
    } else {
      gstMatches = Math.abs(gst - expectedGst) <= 0.01;
      messages.push(
        gstMatches
          ? `GST $${gst.toFixed(2)} matches 1/11 of the inclusive total.`
          : `GST on the invoice is $${gst.toFixed(2)}; 1/11 is $${expectedGst.toFixed(2)}.`,
      );
    }
  }

  return {
    ok: true,
    validAbn,
    formattedAbn: digits.length === 11 ? formatAbn(digits) : abnRaw,
    expectedGst,
    gstMatches,
    messages,
  };
}
