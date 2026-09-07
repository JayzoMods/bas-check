const STEPS = [
  {
    n: "01",
    title: "Bring a ledger",
    body: "Upload a CSV, load the demo, or connect Xero read-only. No account.",
  },
  {
    n: "02",
    title: "Rules run first",
    body: "Missing tax codes, 1/11 GST math, GST on GST-free or BAS-excluded lines, and ABN checksum.",
  },
  {
    n: "03",
    title: "Plain-English flags",
    body: "Each finding names the line and what to look at. Bookmark it when this deploy has a database.",
  },
  {
    n: "04",
    title: "You still decide",
    body: "A clean file is not a BAS lodgement sign-off. This is a coding-risk check, not advice.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="rise-3 scroll-mt-24">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">How it works</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight">Four steps. No lodgement.</h2>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((step) => (
          <li key={step.n} className="card p-5">
            <p className="font-mono text-xs font-medium tracking-widest text-gold">{step.n}</p>
            <h3 className="mt-2 font-display text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
