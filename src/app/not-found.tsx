import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal">404</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">That check is not here</h1>
      <p className="max-w-xl text-muted">
        The bookmark may have expired, or this deploy has no database. Run a new check from the home
        page.
      </p>
      <Link className="btn btn-primary w-fit" href="/">
        Back to BAS Check
      </Link>
    </div>
  );
}
