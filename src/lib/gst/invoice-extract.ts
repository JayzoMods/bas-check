import { generateText, Output } from "ai";
import { z } from "zod";

/** Cheap vision+PDF model for a public demo. Listed on AI Gateway 7 Sep 2026. */
export const INVOICE_EXTRACT_MODEL = "google/gemini-3.5-flash-lite";

/** Under the 4mb Server Action cap, with room for multipart headers. */
export const MAX_INVOICE_FILE_BYTES = 3_500_000;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const invoiceExtractSchema = z.object({
  abn: z
    .string()
    .describe("Australian ABN as printed, digits and spaces only. Empty if not visible. Do not invent."),
  totalInclusive: z
    .string()
    .describe("GST-inclusive total in AUD as printed. Empty if not visible. Do not invent."),
  gstAmount: z
    .string()
    .describe("GST amount in AUD as printed. Empty if not visible. Do not invent."),
  supplierName: z.string().describe("Supplier or entity name if visible. Empty otherwise."),
  notes: z.string().describe("What was unclear or missing. Empty if the read was straightforward."),
});

export type ExtractedInvoice = z.infer<typeof invoiceExtractSchema>;

export function invoiceAiConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.AI_GATEWAY_API_KEY?.trim());
}

export function invoiceMediaType(file: { type: string; name: string }): string | null {
  const type = file.type.trim().toLowerCase();
  if (ALLOWED_TYPES.has(type)) {
    return type;
  }
  const name = file.name.trim().toLowerCase();
  if (name.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (name.endsWith(".png")) {
    return "image/png";
  }
  if (name.endsWith(".webp")) {
    return "image/webp";
  }
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  return null;
}

export type InvoiceGenerateFn = (input: {
  mediaType: string;
  data: Uint8Array;
  filename: string;
}) => Promise<ExtractedInvoice | null>;

export async function defaultInvoiceGenerate(input: {
  mediaType: string;
  data: Uint8Array;
  filename: string;
}): Promise<ExtractedInvoice | null> {
  const { output } = await generateText({
    model: INVOICE_EXTRACT_MODEL,
    instructions:
      "Read an Australian tax invoice. Extract only what is visible. Empty string if a field is not on the page. Not tax advice. Not a BAS lodgement.",
    output: Output.object({
      name: "TaxInvoiceFields",
      schema: invoiceExtractSchema,
    }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract ABN, GST-inclusive total, and GST amount from this invoice file.",
          },
          {
            type: "file",
            mediaType: input.mediaType,
            data: input.data,
            filename: input.filename,
          },
        ],
      },
    ],
  });
  return output ?? null;
}

export async function extractInvoiceFields(
  file: { bytes: Uint8Array; mediaType: string; filename: string },
  generate: InvoiceGenerateFn = defaultInvoiceGenerate,
): Promise<{ ok: true; fields: ExtractedInvoice } | { ok: false; error: string }> {
  try {
    const fields = await generate({
      mediaType: file.mediaType,
      data: file.bytes,
      filename: file.filename,
    });
    if (!fields) {
      return { ok: false, error: "Could not read fields from that file. Try a clearer photo or type them in." };
    }
    return {
      ok: true,
      fields: {
        abn: fields.abn.trim(),
        totalInclusive: fields.totalInclusive.trim(),
        gstAmount: fields.gstAmount.trim(),
        supplierName: fields.supplierName.trim(),
        notes: fields.notes.trim(),
      },
    };
  } catch {
    return { ok: false, error: "Invoice read failed. Type the ABN and amounts, or try again." };
  }
}
