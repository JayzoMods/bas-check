import { describe, expect, it, vi } from "vitest";
import {
  extractInvoiceFields,
  invoiceAiConfigured,
  invoiceMediaType,
  MAX_INVOICE_FILE_BYTES,
} from "./invoice-extract";

describe("invoiceAiConfigured", () => {
  it("treats a blank key as off", () => {
    expect(invoiceAiConfigured({})).toBe(false);
    expect(invoiceAiConfigured({ AI_GATEWAY_API_KEY: "  " })).toBe(false);
    expect(invoiceAiConfigured({ AI_GATEWAY_API_KEY: "vk-test" })).toBe(true);
    expect(invoiceAiConfigured({ VERCEL: "1" })).toBe(false);
  });
});

describe("invoiceMediaType", () => {
  it("accepts jpeg png webp pdf", () => {
    expect(invoiceMediaType({ type: "image/jpeg", name: "a.jpg" })).toBe("image/jpeg");
    expect(invoiceMediaType({ type: "image/png", name: "a.png" })).toBe("image/png");
    expect(invoiceMediaType({ type: "image/webp", name: "a.webp" })).toBe("image/webp");
    expect(invoiceMediaType({ type: "application/pdf", name: "a.pdf" })).toBe("application/pdf");
  });

  it("falls back to the filename when the browser omits a type", () => {
    expect(invoiceMediaType({ type: "", name: "tax-invoice.PDF" })).toBe("application/pdf");
    expect(invoiceMediaType({ type: "", name: "scan.jpeg" })).toBe("image/jpeg");
  });

  it("rejects csv and empty name", () => {
    expect(invoiceMediaType({ type: "text/csv", name: "rows.csv" })).toBeNull();
    expect(invoiceMediaType({ type: "", name: "" })).toBeNull();
  });
});

describe("extractInvoiceFields", () => {
  it("does not invent values when the model returns blanks", async () => {
    const generate = vi.fn(async () => ({
      abn: "  ",
      totalInclusive: "",
      gstAmount: "",
      supplierName: "",
      notes: "No ABN visible",
    }));
    const result = await extractInvoiceFields(
      { bytes: new Uint8Array([1, 2, 3]), mediaType: "image/jpeg", filename: "blank.jpg" },
      generate,
    );
    expect(result).toEqual({
      ok: true,
      fields: {
        abn: "",
        totalInclusive: "",
        gstAmount: "",
        supplierName: "",
        notes: "No ABN visible",
      },
    });
  });

  it("trims a successful read", async () => {
    const result = await extractInvoiceFields(
      { bytes: new Uint8Array([1]), mediaType: "application/pdf", filename: "inv.pdf" },
      async () => ({
        abn: " 51 824 753 556 ",
        totalInclusive: "110.00",
        gstAmount: "10.00",
        supplierName: " Example Pty Ltd ",
        notes: "",
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fields.abn).toBe("51 824 753 556");
      expect(result.fields.supplierName).toBe("Example Pty Ltd");
    }
  });

  it("returns a generic error when generate throws, without the throw text", async () => {
    const result = await extractInvoiceFields(
      { bytes: new Uint8Array([1]), mediaType: "image/png", filename: "x.png" },
      async () => {
        throw new Error("AI_GATEWAY_API_KEY vk-secret failed");
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/vk-secret/);
      expect(result.error).toMatch(/Type the ABN/);
    }
  });
});

describe("MAX_INVOICE_FILE_BYTES", () => {
  it("stays under the 4mb action cap", () => {
    expect(MAX_INVOICE_FILE_BYTES).toBeLessThan(4_000_000);
    expect(MAX_INVOICE_FILE_BYTES).toBeGreaterThan(1_000_000);
  });
});
