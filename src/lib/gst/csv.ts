import { parseAudAmount } from "./money";
import {
  parseAmountKind,
  parseTaxCode,
  type TransactionRow,
} from "./types";

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function headerIndex(headers: string[], ...aliases: string[]): number {
  const normalised = headers.map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  for (const alias of aliases) {
    const i = normalised.indexOf(alias);
    if (i !== -1) {
      return i;
    }
  }
  return -1;
}

export function parseCsv(text: string): TransactionRow[] {
  const normalised = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalised.split("\n").filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]);
  const dateI = headerIndex(headers, "date");
  const descI = headerIndex(headers, "description", "narration", "memo");
  const amountI = headerIndex(headers, "amount", "total");
  const taxI = headerIndex(headers, "tax_code", "taxcode", "gst_code");
  const gstI = headerIndex(headers, "gst_amount", "gst", "tax_amount");
  const kindI = headerIndex(headers, "amount_kind", "kind");
  const abnI = headerIndex(headers, "abn");

  if (descI === -1 || amountI === -1) {
    throw new Error("CSV needs at least description and amount columns.");
  }

  const rows: TransactionRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const amount = parseAudAmount(cells[amountI] ?? "");
    if (amount === null) {
      throw new Error(`Line ${i + 1}: amount is not a number.`);
    }
    const gstRaw = gstI === -1 ? "" : (cells[gstI] ?? "");
    rows.push({
      lineNumber: i + 1,
      date: dateI === -1 ? "" : (cells[dateI] ?? ""),
      description: cells[descI] ?? "",
      amount,
      taxCode: taxI === -1 ? "" : parseTaxCode(cells[taxI] ?? ""),
      gstAmount: gstI === -1 ? null : parseAudAmount(gstRaw),
      amountKind: kindI === -1 ? "inclusive" : parseAmountKind(cells[kindI] ?? ""),
      abn: abnI === -1 ? "" : (cells[abnI] ?? ""),
    });
  }

  return rows;
}
