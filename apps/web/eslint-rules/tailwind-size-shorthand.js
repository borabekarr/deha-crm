/**
 * ESLint rule: tailwind-size-shorthand
 *
 * Collapses matched `w-<x> h-<x>` Tailwind pairs into `size-<x>` with autofix.
 * Handles variant prefixes (e.g. md:w-4 md:h-4 → md:size-4) and arbitrary values.
 *
 * Sources scanned:
 *   - JSX className / class string literals and template expressions
 *   - Arguments to clsx / cn / cva / twMerge calls
 */

const HELPER_NAMES = new Set(['clsx', 'cn', 'cva', 'twMerge']);

/**
 * Parse a class string into tokens (split on whitespace).
 * Returns { tokens, pairs } where pairs is an array of
 * { wIndex, hIndex, size } for each matched w+h pair.
 */
function findPairs(classString) {
  const tokens = classString.split(/\s+/).filter(Boolean);
  const pairs = [];

  // Build a map from "variant:value" → index in tokens array
  // token format: [variant:]w-<val> or [variant:]h-<val>
  // We want to find matching variant+value across w and h.

  /** @type {Map<string, {index: number, val: string}>} */
  const wMap = new Map(); // key = `${variant}:${val}` → index
  const hMap = new Map();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    // Split on last occurrence of 'w-' or 'h-' respecting variant prefix
    // Token structure: (prefix:)?[wh]-value
    const wMatch = token.match(/^((?:[a-zA-Z0-9_-]+:)*)w-(.+)$/);
    const hMatch = token.match(/^((?:[a-zA-Z0-9_-]+:)*)h-(.+)$/);

    if (wMatch) {
      const prefix = wMatch[1]; // e.g. "md:" or ""
      const val = wMatch[2];    // e.g. "4" or "[3px]"
      const key = `${prefix}${val}`;
      wMap.set(key, { index: i, val });
    } else if (hMatch) {
      const prefix = hMatch[1];
      const val = hMatch[2];
      const key = `${prefix}${val}`;
      hMap.set(key, { index: i, val });
    }
  }

  // Find intersections
  for (const [key, wEntry] of wMap) {
    if (hMap.has(key)) {
      const hEntry = hMap.get(key);
      // Extract variant prefix from key
      // key = `${prefix}${val}` — we need to recover prefix
      // We can get it from the token itself
      const wToken = tokens[wEntry.index];
      const prefixMatch = wToken.match(/^((?:[a-zA-Z0-9_-]+:)*)w-/);
      const variant = prefixMatch ? prefixMatch[1] : '';
      pairs.push({
        wIndex: wEntry.index,
        hIndex: hEntry.index,
        size: `${variant}size-${wEntry.val}`,
      });
    }
  }

  return { tokens, pairs };
}

/**
 * Given the original raw string value and the computed pairs+tokens,
 * produce the fixed string.
 */
function applyFix(classString, tokens, pairs) {
  if (pairs.length === 0) return classString;

  // Sort pairs by wIndex descending so index removals don't shift earlier indices
  const sortedPairs = [...pairs].sort((a, b) => {
    const maxA = Math.max(a.wIndex, a.hIndex);
    const maxB = Math.max(b.wIndex, b.hIndex);
    return maxB - maxA;
  });

  const result = [...tokens];
  for (const { wIndex, hIndex, size } of sortedPairs) {
    // Replace the w- token with size-x, mark h- token for removal
    result[wIndex] = size;
    result[hIndex] = null;
  }

  return result.filter(t => t !== null).join(' ');
}

const rule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Collapse matched w-<x> h-<x> Tailwind pairs into size-<x>.',
      recommended: false,
    },
    messages: {
      useSizeShorthand:
        'Use `{{size}}` instead of `{{w}}` + `{{h}}` (Tailwind size shorthand).',
    },
    schema: [],
  },

  create(context) {
    /**
     * Report pairs found in a string node (Literal or TemplateElement).
     * `getRaw` returns the full source text for the node so we can produce a fixer.
     */
    function checkClassString(classString, node, getFixerFn) {
      const { tokens, pairs } = findPairs(classString);
      if (pairs.length === 0) return;

      for (const pair of pairs) {
        const wToken = tokens[pair.wIndex];
        const hToken = tokens[pair.hIndex];
        context.report({
          node,
          messageId: 'useSizeShorthand',
          data: { size: pair.size, w: wToken, h: hToken },
          fix(fixer) {
            const fixed = applyFix(classString, tokens, [pair]);
            return getFixerFn(fixer, fixed);
          },
        });
      }
    }

    /**
     * Check a Literal node that is a class string.
     */
    function checkLiteralNode(node) {
      if (typeof node.value !== 'string') return;
      checkClassString(node.value, node, (fixer, fixed) =>
        fixer.replaceText(node, `"${fixed}"`)
      );
    }

    /**
     * Check a TemplateLiteral's quasi elements (static parts).
     */
    function checkTemplateLiteral(node) {
      for (const quasi of node.quasis) {
        const raw = quasi.value.cooked ?? quasi.value.raw;
        if (!raw) continue;
        checkClassString(raw, quasi, (fixer, fixed) => {
          // Replace just the cooked text inside the template element
          const src = context.getSourceCode().getText(quasi);
          // src looks like `foo bar` or `}foo bar${` — preserve the backtick/brace edges
          const inner = quasi.value.raw;
          const newSrc = src.replace(inner, fixed.replace(/\\/g, '\\\\'));
          return fixer.replaceText(quasi, newSrc);
        });
      }
    }

    /**
     * Decide whether a JSX attribute is className or class.
     */
    function isClassAttribute(attr) {
      if (attr.type !== 'JSXAttribute') return false;
      const name =
        attr.name.type === 'JSXNamespacedName'
          ? attr.name.name.name
          : attr.name.name;
      return name === 'className' || name === 'class';
    }

    return {
      JSXAttribute(node) {
        if (!isClassAttribute(node)) return;
        if (!node.value) return;

        if (node.value.type === 'Literal') {
          checkLiteralNode(node.value);
        } else if (
          node.value.type === 'JSXExpressionContainer' &&
          node.value.expression.type === 'Literal'
        ) {
          checkLiteralNode(node.value.expression);
        } else if (
          node.value.type === 'JSXExpressionContainer' &&
          node.value.expression.type === 'TemplateLiteral'
        ) {
          checkTemplateLiteral(node.value.expression);
        }
      },

      CallExpression(node) {
        // callee can be Identifier (cn(...)) or MemberExpression (obj.cn(...))
        const calleeName =
          node.callee.type === 'Identifier'
            ? node.callee.name
            : node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier'
            ? node.callee.property.name
            : null;

        if (!calleeName || !HELPER_NAMES.has(calleeName)) return;

        for (const arg of node.arguments) {
          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            checkLiteralNode(arg);
          } else if (arg.type === 'TemplateLiteral') {
            checkTemplateLiteral(arg);
          }
        }
      },
    };
  },
};

export default rule;
