import { digitsOnly, formatAbn, isValidAbn } from "./abn";

const ABR_ABN_DETAILS = "https://abr.business.gov.au/json/AbnDetails.aspx";
const ABR_TIMEOUT_MS = 8_000;

export type AbrLookup =
  | { status: "skipped"; reason: "no_guid" | "invalid_abn" }
  | { status: "error"; reason: "network" | "http" | "parse" | "abr"; message: string }
  | {
      status: "found";
      abn: string;
      entityName: string;
      abnStatus: string;
      abnStatusEffectiveFrom: string | null;
      gstFrom: string | null;
      entityTypeName: string;
      state: string;
      postcode: string;
    };

export interface AbrLookupOptions {
  guid?: string | null;
  fetchImpl?: typeof fetch;
}

export function abrGuidFromEnv(env: Record<string, string | undefined> = process.env): string | undefined {
  const guid = env.ABR_GUID?.trim();
  return guid ? guid : undefined;
}

/**
 * ABR JSON is JSONP (`callback({...})`). Do not eval it.
 * Sample shape from https://abr.business.gov.au/json/ opened 7 Sep 2026.
 */
export function parseAbrJsonp(body: string): unknown {
  const trimmed = body.trim();
  const open = trimmed.indexOf("(");
  const close = trimmed.lastIndexOf(")");
  if (open === -1 || close <= open) {
    throw new Error("ABR response was not JSONP");
  }
  return JSON.parse(trimmed.slice(open + 1, close)) as unknown;
}

function asText(value: unknown): string {
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

function optionalDate(value: unknown): string | null {
  const text = asText(value);
  return text === "" ? null : text;
}

const AU_SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatIsoDateAu(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    return iso;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const monthName = AU_SHORT_MONTHS[month - 1];
  if (!monthName || day < 1 || day > 31) {
    return iso;
  }
  return `${day} ${monthName} ${year}`;
}

export function describeAbrLookup(lookup: AbrLookup, formattedAbn: string): string {
  if (lookup.status === "skipped") {
    if (lookup.reason === "no_guid") {
      return `ABN ${formattedAbn} passes the checksum. Live ABR lookup is off until ABR_GUID is set on this deploy.`;
    }
    return `ABN ${formattedAbn} passes the checksum.`;
  }

  if (lookup.status === "error") {
    if (lookup.reason === "abr") {
      return `ABN ${formattedAbn} passes the checksum. ABR: ${lookup.message}`;
    }
    return `ABN ${formattedAbn} passes the checksum. ABR lookup failed (${lookup.message}). Try again.`;
  }

  const name = lookup.entityName || "name not returned";
  const status = lookup.abnStatus || "status unknown";
  const gst = lookup.gstFrom
    ? `GST registered from ${formatIsoDateAu(lookup.gstFrom)}.`
    : "ABR does not show a current GST registration.";
  return `ABR: ${name} (${status}). ${gst}`;
}

export async function lookupAbnDetails(
  value: string,
  options: AbrLookupOptions = {},
): Promise<AbrLookup> {
  const guid = options.guid === undefined ? abrGuidFromEnv() : options.guid?.trim();
  if (!guid) {
    return { status: "skipped", reason: "no_guid" };
  }
  if (!isValidAbn(value)) {
    return { status: "skipped", reason: "invalid_abn" };
  }

  const digits = digitsOnly(value);
  const url = new URL(ABR_ABN_DETAILS);
  url.searchParams.set("abn", digits);
  url.searchParams.set("callback", "callback");
  url.searchParams.set("guid", guid);

  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(ABR_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { status: "error", reason: "http", message: `HTTP ${response.status}` };
    }
    const body = await response.text();
    const payload = parseAbrJsonp(body);
    if (payload == null || typeof payload !== "object") {
      return { status: "error", reason: "parse", message: "unexpected payload" };
    }

    const record = payload as Record<string, unknown>;
    const message = asText(record.Message);
    const entityName = asText(record.EntityName);
    if (message !== "" && entityName === "") {
      return { status: "error", reason: "abr", message };
    }

    return {
      status: "found",
      abn: asText(record.Abn) || formatAbn(digits),
      entityName,
      abnStatus: asText(record.AbnStatus),
      abnStatusEffectiveFrom: optionalDate(record.AbnStatusEffectiveFrom),
      gstFrom: optionalDate(record.Gst),
      entityTypeName: asText(record.EntityTypeName),
      state: asText(record.AddressState),
      postcode: asText(record.AddressPostcode),
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return { status: "error", reason: "network", message: "timed out" };
    }
    if (error instanceof SyntaxError) {
      return { status: "error", reason: "parse", message: "invalid JSONP" };
    }
    return { status: "error", reason: "network", message: "network error" };
  }
}
