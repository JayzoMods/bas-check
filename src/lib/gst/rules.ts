import { isValidAbn } from "./abn";
import { centsApart, gstFromExclusive, gstFromInclusive } from "./money";
import type { AnalyseResult, Finding, TransactionRow } from "./types";

const LIKELY_BAS_EXCLUDED = [
  "bank fee",
  "loan repayment",
  "wages",
  "salary",
  "superannuation",
  "payg",
  "stamp duty",
  "bas payment",
  "ato integrated",
] as const;

const GST_TOLERANCE = 0.01;

function expectedGst(row: TransactionRow): number {
  return row.amountKind === "exclusive"
    ? gstFromExclusive(row.amount)
    : gstFromInclusive(row.amount);
}

function descriptionLooksBasExcluded(description: string): boolean {
  const haystack = description.toLowerCase();
  return LIKELY_BAS_EXCLUDED.some((needle) => haystack.includes(needle));
}

export function analyseRows(rows: TransactionRow[]): AnalyseResult {
  const findings: Finding[] = [];

  for (const row of rows) {
    if (row.taxCode === "") {
      findings.push({
        lineNumber: row.lineNumber,
        code: "missing_tax_code",
        severity: "error",
        description: row.description,
        message:
          "No tax code. Before BAS, this line needs GST, GST-free, input-taxed, or BAS excluded.",
      });
    }

    if (row.taxCode === "GST") {
      const expected = expectedGst(row);
      if (row.gstAmount === null) {
        findings.push({
          lineNumber: row.lineNumber,
          code: "missing_gst_amount",
          severity: "warning",
          description: row.description,
          message: `Coded GST but no GST amount. 1/11 of this ${row.amountKind} total is $${expected.toFixed(2)}.`,
        });
      } else if (centsApart(row.gstAmount, expected) > GST_TOLERANCE) {
        findings.push({
          lineNumber: row.lineNumber,
          code: "gst_math_mismatch",
          severity: "error",
          description: row.description,
          message: `GST on the row is $${row.gstAmount.toFixed(2)}; 1/11 (or 10% exclusive) is $${expected.toFixed(2)}.`,
        });
      }
    }

    if (
      (row.taxCode === "GST_FREE" || row.taxCode === "BAS_EXCLUDED") &&
      row.gstAmount !== null &&
      row.gstAmount > 0
    ) {
      findings.push({
        lineNumber: row.lineNumber,
        code: "gst_on_non_taxable",
        severity: "error",
        description: row.description,
        message: `Coded ${row.taxCode.replace(/_/g, " ")} but GST of $${row.gstAmount.toFixed(2)} is recorded.`,
      });
    }

    if (row.taxCode === "GST" && descriptionLooksBasExcluded(row.description)) {
      findings.push({
        lineNumber: row.lineNumber,
        code: "likely_bas_excluded_coded_gst",
        severity: "warning",
        description: row.description,
        message:
          "This description often sits outside GST (bank fees, wages, super, ATO). Check the code with your BAS agent — this is not tax advice.",
      });
    }

    if (row.abn.trim() !== "" && !isValidAbn(row.abn)) {
      findings.push({
        lineNumber: row.lineNumber,
        code: "invalid_abn",
        severity: "error",
        description: row.description,
        message: "ABN fails the ABR checksum (11 digits, modulus 89).",
      });
    }
  }

  return {
    rowCount: rows.length,
    findingCount: findings.length,
    findings,
  };
}
