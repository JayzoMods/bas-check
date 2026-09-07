"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  analyseCsvFile,
  analyseDemo,
  checkInvoice,
  type AnalyseResponse,
} from "@/app/actions/analyse";
import { extractInvoice } from "@/app/actions/extract-invoice";
import { analyseXero } from "@/app/actions/xero";
import { FindingsTable } from "@/app/findings-table";
import { FileField } from "@/components/file-field";

interface InvoiceState {
  messages: string[];
}

interface CheckerProps {
  xeroEnabled: boolean;
  xeroConnected: boolean;
  xeroNotice: string | null;
}

export function Checker({ xeroEnabled, xeroConnected, xeroNotice }: CheckerProps) {
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const [invoice, setInvoice] = useState<InvoiceState | null>(null);
  const [pending, setPending] = useState<"demo" | "csv" | "invoice" | "extract" | "xero" | null>(
    null,
  );
  const [abn, setAbn] = useState("");
  const [total, setTotal] = useState("");
  const [gst, setGst] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result || !resultsRef.current) {
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [result]);

  async function handleDemo() {
    setPending("demo");
    setResult(await analyseDemo());
    setPending(null);
  }

  async function handleCsv(formData: FormData) {
    setPending("csv");
    setResult(await analyseCsvFile(formData));
    setPending(null);
  }

  async function handleInvoice(formData: FormData) {
    setPending("invoice");
    const next = await checkInvoice(formData);
    if (!next.ok) {
      setInvoice({ messages: [next.error] });
    } else {
      setInvoice({ messages: next.messages });
    }
    setPending(null);
  }

  async function handleXero() {
    setPending("xero");
    setResult(await analyseXero());
    setPending(null);
  }

  async function handleExtract(formData: FormData) {
    setPending("extract");
    const next = await extractInvoice(formData);
    if (!next.ok) {
      setInvoice({ messages: [next.error] });
    } else {
      if (!next.skipped) {
        setAbn(next.fields.abn);
        setTotal(next.fields.totalInclusive);
        setGst(next.fields.gstAmount);
      }
      setInvoice({ messages: next.messages });
    }
    setPending(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 md:grid-cols-2">
        <form
          action={handleCsv}
          className="card rise flex scroll-mt-24 flex-col gap-4 p-6"
          id="check"
          aria-busy={pending === "csv"}
        >
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-gold">CSV</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Upload a CSV</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Columns: description, amount. Optional: date, tax_code, gst_amount, amount_kind, abn.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium" id="csv-file-label">
              CSV file
            </span>
            <FileField
              name="csv"
              accept=".csv,text/csv"
              required
              labelledBy="csv-file-label"
            />
          </div>
          <button className="btn btn-primary self-start" type="submit" disabled={pending !== null}>
            {pending === "csv" ? "Checking…" : "Check CSV"}
          </button>
        </form>

        <div className="card rise-2 flex scroll-mt-24 flex-col gap-4 p-6" id="demo">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-gold">DEMO</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Try the demo ledger</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Eight sample lines with known GST coding mistakes. No login. A bookmarkable URL is
              created only when this deploy has a database.
            </p>
          </div>
          <button
            className="btn btn-ghost self-start"
            type="button"
            onClick={() => void handleDemo()}
            disabled={pending !== null}
          >
            {pending === "demo" ? "Checking…" : "Load demo CSV"}
          </button>
          <a className="btn-link w-fit text-sm" href="/demo-transactions.csv" download>
            Download demo-transactions.csv
          </a>
        </div>
      </section>

      <section className="card rise-3 scroll-mt-24 p-6" id="xero">
        <p className="font-mono text-xs tracking-[0.18em] text-gold">XERO</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Check Xero invoices</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Read-only. Pulls authorised and paid invoices from the last 90 days (up to 80 lines) and
          runs the same GST rules as a CSV. This app does not write to Xero and does not lodge a
          BAS.
        </p>
        {xeroNotice ? (
          <p
            className="mt-4 rounded-2xl border border-line bg-paper/60 px-4 py-3 text-sm"
            role="status"
          >
            {xeroNotice}
          </p>
        ) : null}
        {xeroEnabled ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {xeroConnected ? (
              <>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => void handleXero()}
                  disabled={pending !== null}
                >
                  {pending === "xero" ? "Checking…" : "Check connected org"}
                </button>
                <a className="btn-link text-sm" href="/api/xero/disconnect">
                  Disconnect
                </a>
              </>
            ) : (
              <a className="btn btn-primary" href="/api/xero/start">
                Connect Xero (read-only)
              </a>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Off until this deploy has XERO_CLIENT_ID, XERO_CLIENT_SECRET, and XERO_REDIRECT_URI.
          </p>
        )}
      </section>

      {result ? (
        <div ref={resultsRef} className="scroll-mt-24">
          <ResultPanel result={result} />
        </div>
      ) : null}

      <section className="card rise-4 scroll-mt-24 p-6" id="invoice">
        <p className="font-mono text-xs tracking-[0.18em] text-gold">INVOICE</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Check one tax invoice</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          ABN checksum plus 1/11 GST on an inclusive total. Live ABR name and GST registration only
          when this deploy has ABR_GUID. Photo/PDF read only when AI Gateway is configured. The file
          is not stored. This is not Hubdoc.
        </p>
        <form action={handleExtract} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-medium" id="invoice-file-label">
              Photo or PDF
            </span>
            <FileField
              name="invoice"
              accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
              labelledBy="invoice-file-label"
            />
          </div>
          <button className="btn btn-ghost" type="submit" disabled={pending !== null}>
            {pending === "extract" ? "Reading…" : "Read photo or PDF"}
          </button>
        </form>
        <form action={handleInvoice} className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            ABN
            <input
              className="field"
              name="abn"
              value={abn}
              onChange={(event) => setAbn(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="51 824 753 556"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Inclusive total (AUD)
            <input
              className="field"
              name="total"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              inputMode="decimal"
              placeholder="110.00"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            GST on invoice (AUD)
            <input
              className="field"
              name="gst"
              value={gst}
              onChange={(event) => setGst(event.target.value)}
              inputMode="decimal"
              placeholder="10.00"
            />
          </label>
          <button className="btn btn-primary self-start" type="submit" disabled={pending !== null}>
            {pending === "invoice" ? "Checking…" : "Check invoice"}
          </button>
        </form>
        {invoice ? (
          <ul className="mt-5 flex flex-col gap-2">
            {invoice.messages.map((message) => (
              <li
                key={message}
                className="rounded-2xl border border-line bg-paper/70 px-4 py-3 text-sm leading-6"
              >
                {message}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function ResultPanel({ result }: { result: AnalyseResponse }) {
  if (!result.ok) {
    return (
      <p
        className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
        role="alert"
      >
        {result.error}
      </p>
    );
  }

  const clear = result.findingCount === 0;

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-gold">RESULT</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">{result.source}</h2>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-paper px-3 py-1 text-sm font-medium">
            {result.rowCount} rows
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              clear ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"
            }`}
          >
            {result.findingCount} findings
          </span>
        </div>
      </div>
      {result.checkId ? (
        <p className="mt-4 text-sm">
          <Link className="btn-link" href={`/checks/${result.checkId}`}>
            Bookmark this check
          </Link>
        </p>
      ) : null}
      <div className="mt-5">
        <FindingsTable findings={result.findings} />
      </div>
    </section>
  );
}
