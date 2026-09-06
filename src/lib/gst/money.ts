/** Nearest-cent rounding used for GST 1/11 checks. Not ATO software. */
export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function gstFromInclusive(totalInclusive: number): number {
  return roundCents(totalInclusive / 11);
}

export function gstFromExclusive(exclusive: number): number {
  return roundCents(exclusive * 0.1);
}

export function centsApart(a: number, b: number): number {
  return Math.abs(roundCents(a) - roundCents(b));
}

export function parseAudAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") {
    return null;
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return null;
  }
  return roundCents(n);
}
