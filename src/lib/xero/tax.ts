import type { TaxCode } from "../gst/types";

/**
 * Map Xero AU TaxType codes onto BAS Check tax codes.
 * INPUTTAXED is checked before INPUT. Unknown types stay blank so the rule engine flags them.
 */
export function xeroTaxTypeToCode(raw: string): TaxCode | "" {
  const type = raw.trim().toUpperCase();
  if (type === "" || type === "NONE") {
    return "";
  }
  if (type.includes("INPUTTAXED")) {
    return "INPUT_TAXED";
  }
  if (type === "BASEXCLUDED" || type.startsWith("GSTONIMPORT")) {
    return "BAS_EXCLUDED";
  }
  if (type.includes("EXEMPT") || type.includes("GSTFREE") || type.includes("ZERORATED")) {
    return "GST_FREE";
  }
  if (type.includes("OUTPUT") || type.includes("INPUT") || type.includes("CAPEX")) {
    return "GST";
  }
  return "";
}
