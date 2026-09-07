import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FindingsTable } from "@/app/findings-table";
import { isCheckId, loadCheck } from "@/db/checks";

export const metadata: Metadata = {
  title: "Saved check",
};

export default async function CheckPage({ params }: PageProps<"/checks/[id]">) {
  const { id } = await params;
  if (!isCheckId(id)) {
    notFound();
  }

  const check = await loadCheck(id);
  if (!check) {
    notFound();
  }

  const clear = check.findings.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6 sm:py-14">
      <header className="rise flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal">Saved check</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">GST coding snapshot</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted">
          {check.filename}. Bookmark this URL. This is not a BAS agent and it does not lodge
          anything.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-foam px-3 py-1 text-sm font-medium">{check.rowCount} rows</span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              clear ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"
            }`}
          >
            {check.findings.length} findings
          </span>
        </div>
      </header>
      <div className="card rise-2 p-6">
        <FindingsTable findings={check.findings} />
      </div>
      <p>
        <Link className="btn btn-primary" href="/">
          Run another check
        </Link>
      </p>
    </div>
  );
}
