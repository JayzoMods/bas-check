import { describe, expect, it } from "vitest";
import {
  gstFromExclusive,
  gstFromInclusive,
  parseAudAmount,
  roundCents,
} from "./money";

describe("GST cents", () => {
  it("takes 1/11 of an inclusive $110", () => {
    expect(gstFromInclusive(110)).toBe(10);
  });

  it("takes 10% of exclusive $100", () => {
    expect(gstFromExclusive(100)).toBe(10);
  });

  it("rounds 1/11 of 12.50 to the nearest cent", () => {
    expect(gstFromInclusive(12.5)).toBe(1.14);
  });

  it("parses amounts with commas", () => {
    expect(parseAudAmount("2,950.00")).toBe(2950);
    expect(parseAudAmount("")).toBeNull();
    expect(parseAudAmount("nope")).toBeNull();
  });

  it("roundCents is nearest cent", () => {
    expect(roundCents(1.006)).toBe(1.01);
    expect(roundCents(1.004)).toBe(1);
  });
});
