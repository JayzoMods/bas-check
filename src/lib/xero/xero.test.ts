import { afterEach, describe, expect, it, vi } from "vitest";
import { exchangeAuthorizationCode, fetchInvoiceRows, firstTenantId } from "./client";
import { invoicesQuery, parseXeroSession, xeroConfigured } from "./config";
import { invoicesToRows } from "./invoices";
import { createPkce } from "./pkce";
import { xeroTaxTypeToCode } from "./tax";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("xeroConfigured", () => {
  it("needs client id, secret, and redirect URI", () => {
    expect(xeroConfigured({})).toBe(false);
    expect(xeroConfigured({ XERO_CLIENT_ID: "id" })).toBe(false);
    expect(
      xeroConfigured({
        XERO_CLIENT_ID: "id",
        XERO_CLIENT_SECRET: "secret",
        XERO_REDIRECT_URI: "http://localhost:3000/api/xero/callback",
      }),
    ).toBe(true);
  });
});

describe("parseXeroSession", () => {
  it("rejects empty and junk", () => {
    expect(parseXeroSession(undefined)).toBeNull();
    expect(parseXeroSession("")).toBeNull();
    expect(parseXeroSession("{")).toBeNull();
    expect(parseXeroSession(JSON.stringify({ accessToken: "", tenantId: "t" }))).toBeNull();
  });

  it("accepts a token plus tenant", () => {
    expect(parseXeroSession(JSON.stringify({ accessToken: "tok", tenantId: "ten" }))).toEqual({
      accessToken: "tok",
      tenantId: "ten",
    });
  });
});

describe("createPkce", () => {
  it("returns url-safe verifier, challenge, and state", () => {
    const pkce = createPkce();
    expect(pkce.verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.state).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.verifier).not.toBe(pkce.challenge);
  });
});

describe("xeroTaxTypeToCode", () => {
  it("maps AU GST, free, excluded, and input-taxed", () => {
    expect(xeroTaxTypeToCode("INPUT")).toBe("GST");
    expect(xeroTaxTypeToCode("OUTPUT")).toBe("GST");
    expect(xeroTaxTypeToCode("CAPEXINPUT")).toBe("GST");
    expect(xeroTaxTypeToCode("GSTFREEEXPENSES")).toBe("GST_FREE");
    expect(xeroTaxTypeToCode("EXEMPTOUTPUT")).toBe("GST_FREE");
    expect(xeroTaxTypeToCode("BASEXCLUDED")).toBe("BAS_EXCLUDED");
    expect(xeroTaxTypeToCode("INPUTTAXED")).toBe("INPUT_TAXED");
    expect(xeroTaxTypeToCode("NONE")).toBe("");
    expect(xeroTaxTypeToCode("")).toBe("");
  });
});

describe("invoicesToRows", () => {
  it("flattens authorised line items and skips drafts", () => {
    const rows = invoicesToRows([
      {
        Status: "DRAFT",
        Contact: { Name: "Skip" },
        LineItems: [{ Description: "Nope", LineAmount: 10, TaxAmount: 1, TaxType: "INPUT" }],
      },
      {
        Status: "AUTHORISED",
        InvoiceNumber: "BILL-1",
        DateString: "2026-07-03T00:00:00",
        LineAmountTypes: "Inclusive",
        Contact: { Name: "Bunnings Warehouse Auburn", TaxNumber: "51824753556" },
        LineItems: [
          { Description: "Timber", LineAmount: 110, TaxAmount: 10, TaxType: "INPUT" },
          { Description: "Wages?", LineAmount: 2400, TaxAmount: 218.18, TaxType: "INPUT" },
        ],
      },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      lineNumber: 1,
      amount: 110,
      gstAmount: 10,
      taxCode: "GST",
      amountKind: "inclusive",
      abn: "51824753556",
    });
    expect(rows[0].description).toContain("Bunnings");
    expect(rows[1].description).toContain("Wages");
  });

  it("maps Exclusive line amounts", () => {
    const rows = invoicesToRows([
      {
        Status: "PAID",
        LineAmountTypes: "Exclusive",
        Contact: { Name: "Supplier" },
        LineItems: [{ Description: "Hire", LineAmount: 100, TaxAmount: 10, TaxType: "INPUT" }],
      },
    ]);
    expect(rows[0]?.amountKind).toBe("exclusive");
    expect(rows[0]?.amount).toBe(100);
  });

  it("skips lines without an amount", () => {
    const rows = invoicesToRows([
      {
        Status: "PAID",
        Contact: { Name: "Example" },
        LineItems: [{ Description: "Empty", TaxType: "NONE" }],
      },
    ]);
    expect(rows).toHaveLength(0);
  });
});

describe("invoicesQuery", () => {
  it("encodes DateTime and uses status filters", () => {
    const url = invoicesQuery(new Date("2026-09-07T00:00:00Z"));
    expect(url).toContain("pageSize=50");
    expect(url).toContain("Statuses=AUTHORISED,PAID");
    expect(url).toContain("where=");
    expect(url).toContain(encodeURIComponent("Date >= DateTime(2026, 6, 9)"));
    expect(url).not.toContain("+");
  });
});

describe("Xero HTTP helpers", () => {
  it("exchanges a code with Basic auth and PKCE verifier", async () => {
    vi.stubEnv("XERO_CLIENT_ID", "id");
    vi.stubEnv("XERO_CLIENT_SECRET", "secret");
    vi.stubEnv("XERO_REDIRECT_URI", "http://localhost:3000/api/xero/callback");

    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = String(init?.body ?? "");
      expect(body).toContain("grant_type=authorization_code");
      expect(body).toContain("code_verifier=abc");
      expect(String(init?.headers && (init.headers as Record<string, string>).Authorization)).toMatch(
        /^Basic /,
      );
      return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
    });

    await expect(exchangeAuthorizationCode("code", "abc", fetchImpl)).resolves.toBe("tok");
  });

  it("uses the first tenant id", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify([{ tenantId: "ten-1" }, { tenantId: "ten-2" }]), { status: 200 }),
    );
    await expect(firstTenantId("tok", fetchImpl)).resolves.toBe("ten-1");
  });

  it("maps invoice JSON through fetchInvoiceRows", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            Invoices: [
              {
                Status: "AUTHORISED",
                Contact: { Name: "Example", TaxNumber: "51824753556" },
                LineItems: [{ Description: "Paint", LineAmount: 55, TaxAmount: 5, TaxType: "INPUT" }],
              },
            ],
          }),
          { status: 200 },
        ),
    );
    const rows = await fetchInvoiceRows({ accessToken: "tok", tenantId: "ten" }, fetchImpl);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.taxCode).toBe("GST");
    const init = fetchImpl.mock.calls[0]?.[1];
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.["Xero-tenant-id"]).toBe("ten");
  });
});
