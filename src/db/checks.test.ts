import { describe, expect, it } from "vitest";
import { DEMO_CSV } from "../data/demo-csv";
import { parseCsv } from "../lib/gst/csv";
import { analyseRows } from "../lib/gst/rules";
import { isCheckId, loadCheck, persistCheck } from "./checks";

describe("isCheckId", () => {
  it("accepts a UUID and rejects junk", () => {
    expect(isCheckId("3fa85f64-5717-4562-b3fc-2c963f66afa6")).toBe(true);
    expect(isCheckId("not-a-uuid")).toBe(false);
    expect(isCheckId("")).toBe(false);
  });
});

describe("persistCheck without a database", () => {
  it("returns null when the db client is missing", async () => {
    const rows = parseCsv(DEMO_CSV);
    const result = analyseRows(rows);
    await expect(persistCheck({ filename: "demo-transactions.csv", rows, findings: result.findings }, null)).resolves.toBeNull();
  });
});

const describeDb = process.env.DATABASE_URL?.trim() ? describe : describe.skip;

describeDb("persistCheck with Postgres", () => {
  it("writes import, rows, and findings and reloads them", async () => {
    const rows = parseCsv(DEMO_CSV);
    const analysed = analyseRows(rows);
    const id = await persistCheck({
      filename: "demo-transactions.csv",
      rows,
      findings: analysed.findings,
    });

    expect(id).toEqual(expect.any(String));
    expect(isCheckId(id ?? "")).toBe(true);

    const loaded = await loadCheck(id!);
    expect(loaded).not.toBeNull();
    expect(loaded?.filename).toBe("demo-transactions.csv");
    expect(loaded?.rowCount).toBe(8);
    expect(loaded?.findings).toHaveLength(7);
    expect(loaded?.findings.map((f) => `${f.lineNumber}:${f.code}`)).toContain("9:invalid_abn");
    expect(loaded?.findings.find((f) => f.code === "invalid_abn")?.description).toBe("Unknown supplier");
  });

  it("returns null for an unknown id", async () => {
    await expect(loadCheck("3fa85f64-5717-4562-b3fc-2c963f66afa6")).resolves.toBeNull();
  });
});
