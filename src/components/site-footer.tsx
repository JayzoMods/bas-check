export function SiteFooter() {
  return (
    <footer id="about" className="mt-auto border-t border-line bg-foam/70">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="font-display text-xl font-semibold">Not a BAS agent. Not tax advice.</p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
            Jayden O&apos;Grady / OG Digital Designs. ABN checksum follows the ABR modulus-89 method.
            Live name and GST registration only when ABR_GUID is set. Photo/PDF read only when AI
            Gateway is configured. Xero invoice read is optional and read-only. GST math uses
            nearest-cent 1/11. This app does not lodge with the ATO.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <a className="btn-link w-fit" href="https://ogdigitaldesigns.com.au">
            ogdigitaldesigns.com.au
          </a>
          <a className="btn-link w-fit" href="https://github.com/JayzoMods/bas-check">
            Source on GitHub
          </a>
          <a className="btn-link w-fit" href="/demo-transactions.csv" download>
            Download demo CSV
          </a>
        </div>
      </div>
    </footer>
  );
}
