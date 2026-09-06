import { Checker } from "./checker";

export default function Home() {
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
      <Checker />
      <footer className="border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
        <p>
          Jayden O&apos;Grady / OG Digital Designs. ABN checksum follows the ABR modulus-89
          method. GST math uses nearest-cent 1/11. Not tax advice.
        </p>
      </footer>
    </div>
  );
}
