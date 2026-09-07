"use client";

import Link from "next/link";
import { useState } from "react";
import {
  analyseCsvFile,
  analyseDemo,
  checkInvoice,
  type AnalyseResponse,
} from "@/app/actions/analyse";
import { FindingsTable } from "@/app/findings-table";

interface InvoiceState {
  messages: string[];
}

export function Checker() {
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const [invoice, setInvoice] = useState<InvoiceState | null>(null);
  const [pending, setPending] = useState<"demo" | "csv" | "invoice" | null>(null);

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

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-6 md:grid-cols-2">
        <form action={handleCsv} className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h2 className="text-lg font-semibold">Upload a CSV</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Columns: description, amount. Optional: date, tax_code, gst_amount, amount_kind, abn.
            </p>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium">
            CSV file
            <input
              className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-white dark:file:bg-zinc-100 dark:file:text-zinc-900"
              type="file"
              name="csv"
              accept=".csv,text/csv"
              required
            />
          </label>
          <button
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            type="submit"
            disabled={pending !== null}
          >
            {pending === "csv" ? "Checking…" : "Check CSV"}
          </button>
        </form>

        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h2 className="text-lg font-semibold">Try the demo ledger</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Eight sample lines with known GST coding mistakes. No login. A bookmarkable URL is
              created only when this deploy has a database.
            </p>
          </div>
          <button
            className="self-start rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
            type="button"
            onClick={() => void handleDemo()}
            disabled={pending !== null}
          >
            {pending === "demo" ? "Checking…" : "Load demo CSV"}
          </button>
          <a className="text-sm underline underline-offset-2" href="/demo-transactions.csv" download>
            Download demo-transactions.csv
          </a>
        </div>
      </section>

      {result ? <ResultPanel result={result} /> : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Check one tax invoice</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          ABN checksum plus 1/11 GST on an inclusive total. Live ABR name and GST
          registration only when this deploy has ABR_GUID.
        </p>
        <form action={handleInvoice} className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            ABN
            <input
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
              name="abn"
              inputMode="numeric"
              autoComplete="off"
              placeholder="51 824 753 556"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Inclusive total (AUD)
            <input
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
              name="total"
              inputMode="decimal"
              placeholder="110.00"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            GST on invoice (AUD)
            <input
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
              name="gst"
              inputMode="decimal"
              placeholder="10.00"
            />
          </label>
          <button
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            type="submit"
            disabled={pending !== null}
          >
            {pending === "invoice" ? "Checking…" : "Check invoice"}
          </button>
        </form>
        {invoice ? (
          <ul className="mt-4 flex flex-col gap-1 text-sm">
            {invoice.messages.map((message) => (
              <li key={message}>{message}</li>
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
      <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100" role="alert">
        {result.error}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {result.source}: {result.rowCount} rows, {result.findingCount} findings.
      </p>
      {result.checkId ? (
        <p className="text-sm">
          <Link className="underline underline-offset-2" href={`/checks/${result.checkId}`}>
            Bookmark this check
          </Link>
        </p>
      ) : null}
      <FindingsTable findings={result.findings} />
    </section>
  );
}
