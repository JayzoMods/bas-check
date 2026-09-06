export const TAX_CODES = [
  "GST",
  "GST_FREE",
  "BAS_EXCLUDED",
  "INPUT_TAXED",
] as const;

export type TaxCode = (typeof TAX_CODES)[number];

export type AmountKind = "inclusive" | "exclusive";

export type FindingSeverity = "error" | "warning";

export interface TransactionRow {
  lineNumber: number;
  date: string;
  description: string;
  amount: number;
  taxCode: TaxCode | "";
  gstAmount: number | null;
  amountKind: AmountKind;
  abn: string;
}

export interface Finding {
  lineNumber: number;
  code: string;
  severity: FindingSeverity;
  message: string;
  description: string;
}

export interface AnalyseResult {
  rowCount: number;
  findingCount: number;
  findings: Finding[];
}

const TAX_CODE_SET = new Set<string>(TAX_CODES);

export function parseTaxCode(raw: string): TaxCode | "" {
  const normalised = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (normalised === "") {
    return "";
  }
  if (TAX_CODE_SET.has(normalised)) {
    return normalised as TaxCode;
  }
  if (normalised === "FRE" || normalised === "GST_FREE") {
    return "GST_FREE";
  }
  if (normalised === "NTER" || normalised === "BAS_EXCLUDED" || normalised === "OUT_OF_SCOPE") {
    return "BAS_EXCLUDED";
  }
  return "";
}

export function parseAmountKind(raw: string): AmountKind {
  const normalised = raw.trim().toLowerCase();
  return normalised === "exclusive" || normalised === "ex" ? "exclusive" : "inclusive";
}
