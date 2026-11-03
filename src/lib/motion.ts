/**
 * Reads a CSS time custom property (e.g. --dropdown-close-dur) as milliseconds.
 * The production CSS minifier rewrites "150ms" as ".15s", so both units are handled.
 */
export function cssTimeMs(el: Element, name: string, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  if (raw.endsWith("ms")) return n;
  if (raw.endsWith("s")) return n * 1000;
  return n;
}

/** Same for unit-less or px custom properties (e.g. --reel-spin-blur). */
export function cssNumber(el: Element, name: string, fallback: number): number {
  const n = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(n) ? n : fallback;
}
