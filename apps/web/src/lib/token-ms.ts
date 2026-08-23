/**
 * token-ms.ts — shared CSS-custom-property duration reader.
 *
 * House rule: always read the token live at call time (never cache the
 * result at module scope, never wrap the call in useEffect) so a runtime
 * `--anim-mult` toggle is honoured on every read.
 */
export function tokenMs(name: string, fallback: number, el: Element = document.documentElement): number {
  if (typeof document === 'undefined') return fallback
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  if (!raw) return fallback
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return raw.endsWith('s') && !raw.endsWith('ms') ? n * 1000 : n
}
