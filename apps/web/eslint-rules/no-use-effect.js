/**
 * ESLint rule: no-use-effect
 *
 * Flags direct `useEffect` calls inside React component bodies. Per the
 * no-use-effect convention (see .claude/skills/no-use-effect/SKILL.md),
 * `useEffect` is only permitted inside reusable custom hooks (functions whose
 * name starts with `use`). Components must encapsulate side effects in a
 * named hook helper instead.
 *
 * Allowed: useInterval, useUnmountEffect, useEdgeMeasure, useTween, etc.
 * Flagged: any direct useEffect call inside PascalCase component functions.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the identifier looks like a React component (PascalCase). */
function isPascalCase(name) {
  return typeof name === 'string' && /^[A-Z]/.test(name);
}

/** Returns true if the identifier looks like a custom hook (useXxx). */
function isHookName(name) {
  return typeof name === 'string' && /^use[A-Za-z]/.test(name);
}

/**
 * Walk up the ancestor chain from a `useEffect(...)` call and determine
 * whether we are directly inside a React component body (as opposed to inside
 * a custom hook body).
 *
 * Returns the enclosing function name, or null when the call site is inside a
 * hook (allowed) or module scope (not a component).
 */
function getEnclosingComponentName(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    const parent = ancestors[i - 1];

    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
      let name = null;

      if (node.type === 'FunctionDeclaration' && node.id) {
        name = node.id.name;
      } else if (node.type === 'FunctionExpression' && node.id) {
        name = node.id.name;
      } else if (parent) {
        if (
          parent.type === 'VariableDeclarator' &&
          parent.id &&
          parent.id.type === 'Identifier'
        ) {
          name = parent.id.name;
        } else if (
          parent.type === 'AssignmentExpression' &&
          parent.left &&
          parent.left.type === 'Identifier'
        ) {
          name = parent.left.name;
        } else if (
          parent.type === 'Property' &&
          parent.key &&
          parent.key.type === 'Identifier'
        ) {
          name = parent.key.name;
        }
      }

      if (name) {
        // Custom hook — allowed; stop walking.
        if (isHookName(name)) return null;
        // Component — flagged.
        if (isPascalCase(name)) return name;
      }

      // Unnamed or non-component/hook function boundary — not a render path.
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow direct useEffect calls inside React component bodies. ' +
        'Encapsulate effects in a custom hook (useXxx) instead. ' +
        'See .claude/skills/no-use-effect/SKILL.md.',
    },
    messages: {
      noDirectUseEffect:
        'Do not call useEffect directly in component "{{name}}". ' +
        'Move the effect into a named custom hook (e.g. useInterval, useUnmountEffect).',
    },
    schema: [],
    fixable: null,
  },

  create(context) {
    return {
      CallExpression(node) {
        // Match useEffect(...) calls only.
        if (
          node.callee.type !== 'Identifier' ||
          node.callee.name !== 'useEffect'
        ) {
          return;
        }

        const ancestors = context.getAncestors
          ? context.getAncestors()
          : context.sourceCode.getAncestors(node);

        const componentName = getEnclosingComponentName(ancestors);
        if (componentName) {
          context.report({
            node,
            messageId: 'noDirectUseEffect',
            data: { name: componentName },
          });
        }
      },
    };
  },
};

export default rule;
