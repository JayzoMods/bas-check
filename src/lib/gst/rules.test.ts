import { describe, expect, it } from "vitest";
import { DEMO_CSV } from "../../data/demo-csv";
import { parseCsv } from "./csv";
import { analyseRows } from "./rules";

describe("analyseRows on the demo CSV", () => {
  it("flags the known demo problems and leaves the clean Bunnings line", () => {
    const result = analyseRows(parseCsv(DEMO_CSV));
    const codes = result.findings.map((f) => `${f.lineNumber}:${f.code}`);

    expect(result.rowCount).toBe(8);
    expect(codes).toContain("3:likely_bas_excluded_coded_gst");
    expect(codes).toContain("5:likely_bas_excluded_coded_gst");
    expect(codes).toContain("4:gst_math_mismatch");
    expect(codes).toContain("6:missing_tax_code");
    expect(codes).toContain("7:gst_on_non_taxable");
    expect(codes).toContain("8:gst_on_non_taxable");
    expect(codes).toContain("9:invalid_abn");
    expect(codes.some((c) => c.startsWith("2:"))).toBe(false);
  });
});

describe("parseCsv", () => {
  it("keeps commas inside quotes", () => {
    const csv = `description,amount
"Bunnings Warehouse, Auburn",10.00
`;
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("Bunnings Warehouse, Auburn");
    expect(rows[0].amount).toBe(10);
  });

  it("throws without required columns", () => {
    expect(() => parseCsv("foo,bar\n1,2\n")).toThrow(/description and amount/);
  });
});
