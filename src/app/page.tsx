import { cookies } from "next/headers";
import { HowItWorks } from "@/components/how-it-works";
import { parseXeroSession, XERO_SESSION_COOKIE, xeroConfigured } from "@/lib/xero/config";
import { Checker } from "./checker";

function xeroNotice(flag: string | undefined): string | null {
  if (flag === "off") {
    return "Xero is off until client id, secret, and redirect URI are set on this deploy.";
  }
  if (flag === "denied") {
    return "Xero access was not granted.";
  }
  if (flag === "error") {
    return "Could not connect to Xero. Try again.";
  }
  if (flag === "connected") {
    return "Xero is connected for about 20 minutes. Read-only — this app does not write invoices or lodge a BAS.";
  }
  return null;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ xero?: string }>;
}) {
  const params = await searchParams;
  const jar = await cookies();
  const xeroEnabled = xeroConfigured();
  const xeroConnected = parseXeroSession(jar.get(XERO_SESSION_COOKIE)?.value) !== null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-5 py-10 sm:px-6 sm:py-14">
      <header className="rise grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
        <div className="flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal">Australian GST coding</p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
            GST coding risks, <span className="italic text-teal">in plain English</span>
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Upload a transaction CSV, load the demo, or read Xero invoices. The rules engine flags
            missing tax codes, GST that does not match 1/11, GST on GST-free or BAS-excluded lines,
            and ABN checksum failures. This is not a BAS agent and it does not lodge anything.
          </p>
          <div className="flex flex-wrap gap-3">
            <a className="btn btn-primary" href="#check">
              Check a CSV
            </a>
            <a className="btn btn-ghost" href="#demo">
              Try the demo
            </a>
          </div>
        </div>
        <aside className="card rise-2 p-5">
          <p className="font-mono text-xs tracking-[0.18em] text-gold">LIVE DEMO</p>
          <p className="mt-3 font-display text-2xl font-semibold">8 rows. 7 findings.</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Seeded ledger with known mistakes. No login. Recruiter-ready in one click.
          </p>
        </aside>
      </header>
      <HowItWorks />
      <Checker
        xeroEnabled={xeroEnabled}
        xeroConnected={xeroConnected}
        xeroNotice={xeroNotice(params.xero)}
      />
    </div>
  );
}
