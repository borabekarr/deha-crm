/**
 * ESLint rule: no-nondeterministic-render
 *
 * Flags Date.now(), Math.random(), and argument-less new Date() when they
 * appear lexically inside a React component or hook render path.
 *
 * Rationale: react19-hoist-nondeterministic-render lesson — non-deterministic
 * values computed during render cause hydration mismatches in React 19 and
 * break memoization on every re-render.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the identifier looks like a React component (PascalCase). */
function isPascalCase(name) {
  return typeof name === 'string' && /^[A-Z]/.test(name);
}

/** Returns true if the identifier looks like a React hook (useXxx). */
function isHookName(name) {
  return typeof name === 'string' && /^use[A-Z]/.test(name);
}

/**
 * Returns true if a JSX attribute name is an event handler (starts with "on"
 * followed by an uppercase letter, e.g. onClick, onChange).
 */
function isJsxEventHandlerProp(name) {
  return typeof name === 'string' && /^on[A-Z]/.test(name);
}

/**
 * The list of hook names whose first argument is a callback that we treat as
 * "not render path" (i.e. deferred / side-effect).
 */
const DEFERRED_HOOKS = new Set([
  'useEffect',
  'useLayoutEffect',
  'useInsertionEffect',
  'useMemo',
  'useCallback',
]);

/**
 * Returns true when `node` is a non-deterministic call we want to flag.
 * Covered patterns:
 *   - Date.now()
 *   - Math.random()
 *   - new Date()  (no arguments)
 */
function isNondeterministicCall(node) {
  // new Date() with no arguments
  if (
    node.type === 'NewExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'Date' &&
    node.arguments.length === 0
  ) {
    return true;
  }

  // Date.now() or Math.random()
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.object.type === 'Identifier' &&
    node.callee.property.type === 'Identifier'
  ) {
    const obj = node.callee.object.name;
    const prop = node.callee.property.name;
    if ((obj === 'Date' && prop === 'now') || (obj === 'Math' && prop === 'random')) {
      return true;
    }
  }

  return false;
}

/**
 * Walk up the ancestor chain and determine whether this call site is inside an
 * exclusion zone (useEffect callback, useMemo callback, onClick JSX prop, etc).
 *
 * @param {import('eslint').Rule.NodeParentExtension[]} ancestors - from context.getAncestors()
 * @returns {{ inComponent: boolean, excluded: boolean, componentName: string|null }}
 */
function analyzeAncestors(ancestors) {
  let inComponent = false;
  let excluded = false;
  let componentName = null;

  // Walk from innermost ancestor outward. We stop at the first function
  // boundary that tells us we are (or are not) in a render path.
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    const parent = ancestors[i - 1]; // may be undefined

    // -----------------------------------------------------------------------
    // 1. JSX event-handler prop  — <Button onClick={() => Date.now()} />
    //    The function at ancestors[i+1] is the arrow/function expression.
    //    We detect it by checking if the *parent of the function* is a
    //    JSXExpressionContainer whose parent is a JSXAttribute with an event
    //    name.
    // -----------------------------------------------------------------------
    if (
      node.type === 'JSXAttribute' &&
      node.name &&
      isJsxEventHandlerProp(node.name.name || node.name.value)
    ) {
      excluded = true;
      break;
    }

    // -----------------------------------------------------------------------
    // 2. Deferred hook callback  — useEffect(() => { ... }, [])
    //    Pattern: CallExpression whose callee is one of the DEFERRED_HOOKS,
    //    and the current node (i+1 level up from the call site) is the first
    //    argument.
    // -----------------------------------------------------------------------
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      DEFERRED_HOOKS.has(node.callee.name)
    ) {
      // The first argument of the hook call is the callback.
      // The candidate function must be node.arguments[0].
      const callbackArg = node.arguments[0];
      // The immediate child we came from is ancestors[i+1] — but since we
      // iterate from the inside out, the node *below* this one in the walk is
      // ancestors[i+1] (if it exists).
      const childNode = ancestors[i + 1];
      if (callbackArg && childNode && callbackArg === childNode) {
        excluded = true;
        break;
      }
    }

    // -----------------------------------------------------------------------
    // 3. useRef(initializer) — useRef(Date.now())  — NOT excluded for
    //    argument-less form, but typically fine. We do NOT exclude it here
    //    because a `useRef(Date.now())` call runs on every render (the arg
    //    is evaluated even though ref only uses the initial value on mount).
    //    Marking it excluded would hide a real bug. Keep the flag.
    // -----------------------------------------------------------------------

    // -----------------------------------------------------------------------
    // 4. .then(callback) / setTimeout(callback, ...) / Promise handler
    // -----------------------------------------------------------------------
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      if (
        // .then(...) / .catch(...) / .finally(...)
        (callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.property.type === 'Identifier' &&
          ['then', 'catch', 'finally'].includes(callee.property.name)) ||
        // setTimeout / setInterval
        (callee.type === 'Identifier' &&
          ['setTimeout', 'setInterval', 'queueMicrotask', 'requestAnimationFrame'].includes(
            callee.name
          ))
      ) {
        const childNode = ancestors[i + 1];
        // We are inside the callback argument (first arg for setTimeout,
        // first arg for .then). Check if childNode is one of the arguments.
        if (childNode && node.arguments.includes(childNode)) {
          excluded = true;
          break;
        }
      }
    }

    // -----------------------------------------------------------------------
    // 5. Component / hook boundary — FunctionDeclaration, FunctionExpression,
    //    ArrowFunctionExpression with PascalCase or useXxx name.
    // -----------------------------------------------------------------------
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
      // Determine the name of this function.
      let name = null;

      if (node.type === 'FunctionDeclaration' && node.id) {
        name = node.id.name;
      } else if (node.type === 'FunctionExpression' && node.id) {
        name = node.id.name;
      } else if (parent) {
        // Arrow or anonymous function expression assigned to a variable.
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

      if (name && (isPascalCase(name) || isHookName(name))) {
        // We are inside a component/hook render body.
        inComponent = true;
        componentName = name;
        break;
      } else {
        // We hit a function boundary that is NOT a component/hook. If we
        // haven't already found a component, this is just a nested helper
        // inside module scope — not a render path.
        break;
      }
    }
  }

  return { inComponent, excluded, componentName };
}

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow non-deterministic calls (Date.now, Math.random, new Date) in the React render path. See lesson react19-hoist-nondeterministic-render.',
      url: 'https://github.com/deha-crm/.claude/lessons/react19-hoist-nondeterministic-render.md',
    },
    messages: {
      noNondeterministicRender:
        'Hoist {{call}} out of the render path or compute it in an event handler / effect; ' +
        'non-deterministic values in render break determinism. ' +
        'See react19-hoist-nondeterministic-render.',
    },
    schema: [],
    fixable: null,
  },

  create(context) {
    function check(node) {
      if (!isNondeterministicCall(node)) return;

      const ancestors = context.getAncestors ? context.getAncestors() : context.sourceCode.getAncestors(node);
      const { inComponent, excluded } = analyzeAncestors(ancestors);

      if (inComponent && !excluded) {
        // Build a human-readable call name for the message.
        let call = 'this call';
        if (node.type === 'NewExpression') {
          call = 'new Date()';
        } else if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
          call = `${node.callee.object.name}.${node.callee.property.name}()`;
        }

        context.report({
          node,
          messageId: 'noNondeterministicRender',
          data: { call },
        });
      }
    }

    return {
      CallExpression: check,
      NewExpression: check,
    };
  },
};

export default rule;
