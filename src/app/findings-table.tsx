import type { Finding } from "@/lib/gst/types";

export function FindingsTable({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <p className="rounded-2xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm leading-6">
        No GST coding flags on this file. That is not a BAS lodgement sign-off.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-muted">
            <th className="py-2 pr-3 font-medium">Line</th>
            <th className="py-2 pr-3 font-medium">Code</th>
            <th className="py-2 pr-3 font-medium">Description</th>
            <th className="py-2 font-medium">What to look at</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding, index) => (
            <FindingRow
              key={`${finding.lineNumber}-${finding.code}`}
              finding={finding}
              index={index}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FindingRow({ finding, index }: { finding: Finding; index: number }) {
  const error = finding.severity === "error";
  return (
    <tr
      className="finding-row border-b border-line align-top"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <td className="py-3 pr-3 font-mono tabular-nums text-muted">{finding.lineNumber}</td>
      <td className="py-3 pr-3">
        <span
          className={`inline-block rounded-full px-2 py-0.5 font-mono text-[0.7rem] ${
            error ? "bg-error/15 text-error" : "bg-warn/15 text-warn"
          }`}
        >
          {finding.code}
        </span>
      </td>
      <td className="py-3 pr-3">{finding.description}</td>
      <td className="py-3 text-muted">{finding.message}</td>
    </tr>
  );
}
