import { asc, eq } from "drizzle-orm";
import type { Finding, TransactionRow } from "@/lib/gst/types";
import { type AppDb, getDb } from "./client";
import { csvImports, csvRows, findings } from "./schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCheckId(id: string): boolean {
  return UUID_RE.test(id);
}

export interface SavedCheck {
  id: string;
  filename: string;
  rowCount: number;
  createdAt: Date;
  findings: Finding[];
}

export async function persistCheck(
  input: { filename: string; rows: TransactionRow[]; findings: Finding[] },
  db: AppDb | null = getDb(),
): Promise<string | null> {
  if (!db) {
    return null;
  }

  try {
    return await db.transaction(async (tx) => {
      const [imported] = await tx
        .insert(csvImports)
        .values({
          filename: input.filename,
          rowCount: input.rows.length,
        })
        .returning({ id: csvImports.id });

      if (!imported) {
        throw new Error("csv_imports insert returned no row");
      }

      const insertedRows = await tx
        .insert(csvRows)
        .values(
          input.rows.map((row) => ({
            importId: imported.id,
            lineNumber: row.lineNumber,
            date: row.date === "" ? null : row.date,
            description: row.description,
            amount: row.amount,
            taxCode: row.taxCode === "" ? null : row.taxCode,
            gstAmount: row.gstAmount,
            amountKind: row.amountKind,
            abn: row.abn === "" ? null : row.abn,
          })),
        )
        .returning({ id: csvRows.id, lineNumber: csvRows.lineNumber });

      const rowIdByLine = new Map(insertedRows.map((row) => [row.lineNumber, row.id]));

      if (input.findings.length > 0) {
        await tx.insert(findings).values(
          input.findings.map((finding) => ({
            importId: imported.id,
            rowId: rowIdByLine.get(finding.lineNumber) ?? null,
            code: finding.code,
            severity: finding.severity,
            message: finding.message,
          })),
        );
      }

      return imported.id;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown persist error";
    console.error("persistCheck failed; analyse continues without a bookmark.", message);
    return null;
  }
}

export async function loadCheck(
  id: string,
  db: AppDb | null = getDb(),
): Promise<SavedCheck | null> {
  if (!db || !isCheckId(id)) {
    return null;
  }

  const [imported] = await db.select().from(csvImports).where(eq(csvImports.id, id)).limit(1);
  if (!imported) {
    return null;
  }

  const rows = await db
    .select({
      lineNumber: csvRows.lineNumber,
      description: csvRows.description,
      code: findings.code,
      severity: findings.severity,
      message: findings.message,
    })
    .from(findings)
    .leftJoin(csvRows, eq(findings.rowId, csvRows.id))
    .where(eq(findings.importId, id))
    .orderBy(asc(csvRows.lineNumber));

  return {
    id: imported.id,
    filename: imported.filename,
    rowCount: imported.rowCount,
    createdAt: imported.createdAt,
    findings: rows.map((row) => ({
      lineNumber: row.lineNumber ?? 0,
      description: row.description ?? "",
      code: row.code,
      severity: row.severity as Finding["severity"],
      message: row.message,
    })),
  };
}
