export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="16" className="fill-teal" />
      <path
        d="M16 26h32M16 34h18"
        stroke="currentColor"
        className="text-mark"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="logo-check text-mark"
        d="M28 38.5 34.5 45 48 26"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark className={compact ? "h-8 w-8" : "h-10 w-10"} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-ink">BAS Check</span>
        {!compact ? (
          <span className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted">
            GST coding risks
          </span>
        ) : null}
      </span>
    </span>
  );
}
