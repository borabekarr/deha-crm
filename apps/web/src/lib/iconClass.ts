// Symbols-only glyphs absent from the classic Material Icons font; they MUST
// render under material-symbols-outlined or they show as tofu. Keep this set in
// sync with eslint-rules/no-symbols-glyph-on-classic-font.js (SYMBOLS_ONLY_GLYPHS).
export const SYMBOLS_ONLY_GLYPHS = new Set<string>(['neurology'])

/** Returns the correct Material font class for an icon ligature name. */
export function iconClass(name: string): string {
  return SYMBOLS_ONLY_GLYPHS.has(name) ? 'material-symbols-outlined' : 'material-icons'
}
