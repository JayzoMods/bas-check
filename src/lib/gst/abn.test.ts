import { describe, expect, it } from "vitest";
import { formatAbn, isValidAbn } from "./abn";

describe("isValidAbn", () => {
  it("accepts the ABR worked example 51 824 753 556", () => {
    expect(isValidAbn("51 824 753 556")).toBe(true);
    expect(isValidAbn("51824753556")).toBe(true);
  });

  it("rejects wrong length and all-zero", () => {
    expect(isValidAbn("")).toBe(false);
    expect(isValidAbn("123")).toBe(false);
    expect(isValidAbn("00000000000")).toBe(false);
  });

  it("rejects a checksum miss", () => {
    expect(isValidAbn("51824753557")).toBe(false);
  });

  it("formats 11 digits", () => {
    expect(formatAbn("51824753556")).toBe("51 824 753 556");
  });
});
