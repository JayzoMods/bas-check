import type { Finding } from "@/lib/gst/types";

export function FindingsTable({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return <p>No GST coding flags on this file. That is not a BAS lodgement sign-off.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-2 pr-3 font-medium">Line</th>
            <th className="py-2 pr-3 font-medium">Code</th>
            <th className="py-2 pr-3 font-medium">Description</th>
            <th className="py-2 font-medium">What to look at</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <FindingRow key={`${finding.lineNumber}-${finding.code}`} finding={finding} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const tone = finding.severity === "error" ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300";
  return (
    <tr className="border-b border-zinc-100 align-top dark:border-zinc-900">
      <td className="py-3 pr-3 tabular-nums">{finding.lineNumber}</td>
      <td className={`py-3 pr-3 font-mono text-xs ${tone}`}>{finding.code}</td>
      <td className="py-3 pr-3">{finding.description}</td>
      <td className="py-3">{finding.message}</td>
    </tr>
  );
}
