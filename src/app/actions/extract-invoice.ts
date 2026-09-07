"use server";

import { evaluateInvoice, type InvoiceCheck } from "@/app/actions/analyse";
import {
  extractInvoiceFields,
  invoiceAiConfigured,
  invoiceMediaType,
  MAX_INVOICE_FILE_BYTES,
  type ExtractedInvoice,
} from "@/lib/gst/invoice-extract";

export type ExtractInvoiceOk = {
  ok: true;
  skipped: boolean;
  fields: ExtractedInvoice;
  check: InvoiceCheck | null;
  messages: string[];
};
export type ExtractInvoiceResponse = ExtractInvoiceOk | { ok: false; error: string };

const EMPTY_FIELDS: ExtractedInvoice = {
  abn: "",
  totalInclusive: "",
  gstAmount: "",
  supplierName: "",
  notes: "",
};

export async function extractInvoice(formData: FormData): Promise<ExtractInvoiceResponse> {
  if (!invoiceAiConfigured()) {
    return {
      ok: true,
      skipped: true,
      fields: EMPTY_FIELDS,
      check: null,
      messages: [
        "Invoice photo/PDF read is off until AI_GATEWAY_API_KEY is set on this deploy. Type the ABN and amounts instead.",
      ],
    };
  }

  const file = formData.get("invoice");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a photo or PDF of the tax invoice first." };
  }
  if (file.size > MAX_INVOICE_FILE_BYTES) {
    return { ok: false, error: "File is over 3.5 MB. Use a smaller scan or type the figures." };
  }

  const mediaType = invoiceMediaType(file);
  if (!mediaType) {
    return { ok: false, error: "Use a JPEG, PNG, WebP, or PDF. This is not Hubdoc and it does not store the file." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extracted = await extractInvoiceFields({
    bytes,
    mediaType,
    filename: file.name || "invoice",
  });
  if (!extracted.ok) {
    return extracted;
  }

  const check = await evaluateInvoice(
    extracted.fields.abn,
    extracted.fields.totalInclusive,
    extracted.fields.gstAmount,
  );
  const messages = [
    extracted.fields.supplierName
      ? `Read from file: ${extracted.fields.supplierName}.`
      : "Read fields from the file.",
    ...(extracted.fields.notes ? [extracted.fields.notes] : []),
    "Those values are a read of the file, not a lodgement. Checksum and 1/11 still apply.",
    ...check.messages,
  ];

  return {
    ok: true,
    skipped: false,
    fields: extracted.fields,
    check,
    messages,
  };
}
