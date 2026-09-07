"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/logo";

const NAV = [
  { href: "/#check", label: "CSV" },
  { href: "/#demo", label: "Demo" },
  { href: "/#xero", label: "Xero" },
  { href: "/#invoice", label: "Invoice" },
  { href: "/#how", label: "How it works" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-foam/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
        <Link
          href="/"
          className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
          onClick={close}
        >
          <BrandLockup compact />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/#check" className="btn btn-primary ml-2 py-2">
            Run a check
          </Link>
        </nav>
        <button
          className="btn btn-ghost px-3 py-2 md:hidden"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div className="nav-overlay border-t border-line bg-foam px-5 py-4 md:hidden" id="mobile-nav">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3 text-base font-medium"
                onClick={close}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/#check" className="btn btn-primary mt-2" onClick={close}>
              Run a check
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
