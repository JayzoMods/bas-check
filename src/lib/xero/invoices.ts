import { parseAmountKind, type TransactionRow } from "../gst/types";
import { XERO_MAX_ROWS } from "./config";
import { xeroTaxTypeToCode } from "./tax";

export interface XeroLineItem {
  Description?: unknown;
  LineAmount?: unknown;
  TaxAmount?: unknown;
  TaxType?: unknown;
}

export interface XeroInvoice {
  Type?: unknown;
  InvoiceNumber?: unknown;
  DateString?: unknown;
  Date?: unknown;
  Status?: unknown;
  LineAmountTypes?: unknown;
  Contact?: { Name?: unknown; TaxNumber?: unknown };
  LineItems?: XeroLineItem[];
}

function asText(value: unknown): string {
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

function asAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(Math.abs(value) * 100) / 100;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return Math.round(Math.abs(n) * 100) / 100;
    }
  }
  return null;
}

function invoiceDate(invoice: XeroInvoice): string {
  const raw = asText(invoice.DateString) || asText(invoice.Date);
  return raw.slice(0, 10);
}

export function invoicesToRows(invoices: XeroInvoice[]): TransactionRow[] {
  const rows: TransactionRow[] = [];
  let lineNumber = 1;

  for (const invoice of invoices) {
    const status = asText(invoice.Status).toUpperCase();
    if (status !== "AUTHORISED" && status !== "PAID") {
      continue;
    }
    const contact = asText(invoice.Contact?.Name) || "Xero contact";
    const number = asText(invoice.InvoiceNumber);
    const abn = asText(invoice.Contact?.TaxNumber);
    const amountKind = parseAmountKind(asText(invoice.LineAmountTypes));
    const items = Array.isArray(invoice.LineItems) ? invoice.LineItems : [];

    for (const item of items) {
      const amount = asAmount(item.LineAmount);
      if (amount === null) {
        continue;
      }
      const detail = asText(item.Description);
      const label = [contact, number, detail].filter(Boolean).join(" — ");
      rows.push({
        lineNumber,
        date: invoiceDate(invoice),
        description: label,
        amount,
        taxCode: xeroTaxTypeToCode(asText(item.TaxType)),
        gstAmount: asAmount(item.TaxAmount),
        amountKind,
        abn,
      });
      lineNumber += 1;
      if (rows.length >= XERO_MAX_ROWS) {
        return rows;
      }
    }
  }

  return rows;
}
