import Link from "next/link";
import { notFound } from "next/navigation";
import { FindingsTable } from "@/app/findings-table";
import { isCheckId, loadCheck } from "@/db/checks";

export default async function CheckPage({ params }: PageProps<"/checks/[id]">) {
  const { id } = await params;
  if (!isCheckId(id)) {
    notFound();
  }

  const check = await loadCheck(id);
  if (!check) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">BAS Check</p>
        <h1 className="text-3xl font-semibold tracking-tight">Saved GST coding check</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {check.filename}: {check.rowCount} rows, {check.findings.length} findings. Bookmark this
          URL. This is not a BAS agent and it does not lodge anything.
        </p>
      </header>
      <FindingsTable findings={check.findings} />
      <p>
        <Link className="text-sm underline underline-offset-2" href="/">
          Run another check
        </Link>
      </p>
    </div>
  );
}
