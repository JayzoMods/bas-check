import { cookies } from "next/headers";
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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">BAS Check</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          GST coding risks in plain English
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Upload a transaction CSV (or load the demo). The rules engine flags missing tax
          codes, GST that does not match 1/11, GST on GST-free or BAS-excluded lines, and
          ABN checksum failures. This is not a BAS agent and it does not lodge anything.
        </p>
      </header>
      <Checker
        xeroEnabled={xeroEnabled}
        xeroConnected={xeroConnected}
        xeroNotice={xeroNotice(params.xero)}
      />
      <footer className="border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
        <p>
          Jayden O&apos;Grady / OG Digital Designs. ABN checksum follows the ABR modulus-89
          method. The invoice panel asks ABN Lookup for the entity name and GST
          registration when ABR_GUID is set. Photo/PDF read uses AI Gateway when
          configured. Xero invoice read is optional and read-only. GST math uses
          nearest-cent 1/11. Not tax advice.
        </p>
      </footer>
    </div>
  );
}
