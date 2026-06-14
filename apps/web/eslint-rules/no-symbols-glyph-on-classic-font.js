/**
 * ESLint rule: no-symbols-glyph-on-classic-font
 *
 * Flags a JSXElement whose className contains "material-icons" (classic font)
 * but NOT "material-symbols", when its text child is a Symbols-only glyph
 * such as "neurology".
 *
 * Rationale: Symbols-only glyphs (added after the classic Material Icons font
 * was frozen) are not available on material-icons / material-icons-outlined etc.
 * They MUST be rendered with material-symbols-outlined (or a variant thereof).
 *
 * Extensible denylist: add new Symbols-only glyph names to SYMBOLS_ONLY_GLYPHS.
 */

// ---------------------------------------------------------------------------
// Denylist – Symbols-only glyphs that do NOT exist in the classic icon font.
// ---------------------------------------------------------------------------
const SYMBOLS_ONLY_GLYPHS = new Set([
  'neurology',
]);

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Symbols-only glyphs (e.g. "neurology") inside a classic ' +
        'material-icons element. Use material-symbols-outlined instead.',
    },
    messages: {
      useSymbolsFont:
        '"{{glyph}}" is a Symbols-only glyph and does not exist in the classic ' +
        'Material Icons font. ' +
        'Change the className to "material-symbols-outlined" (or a variant).',
    },
    schema: [],
    fixable: null,
  },

  create(context) {
    return {
      JSXElement(node) {
        const openingEl = node.openingElement;

        // ----------------------------------------------------------------
        // 1. Find the className attribute.
        // ----------------------------------------------------------------
        const classNameAttr = openingEl.attributes.find(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name &&
            attr.name.name === 'className'
        );

        if (!classNameAttr || !classNameAttr.value) return;

        // We only handle string-literal classNames (not expressions).
        if (classNameAttr.value.type !== 'Literal') return;

        const className = String(classNameAttr.value.value);

        // Must contain "material-icons" but NOT "material-symbols".
        if (!className.includes('material-icons')) return;
        if (className.includes('material-symbols')) return;

        // ----------------------------------------------------------------
        // 2. Find a JSXText child whose trimmed value is a banned glyph.
        // ----------------------------------------------------------------
        for (const child of node.children) {
          if (child.type !== 'JSXText') continue;
          const text = child.value.trim();
          if (SYMBOLS_ONLY_GLYPHS.has(text)) {
            context.report({
              node: child,
              messageId: 'useSymbolsFont',
              data: { glyph: text },
            });
          }
        }
      },
    };
  },
};

export default rule;
