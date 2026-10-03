/**
 * Gate-harness shim for `support.js` — OFFICIAL, MAINTAINED HARNESS CONTRACT.
 *
 * This file is not a stopgap: Claude Design's real `support.js` (plus its
 * per-workspace-hashed `_ds_bundle.js`) was never part of any export and is
 * confirmed absent repo-wide, so this re-implementation IS the runtime for
 * every DSL-authored raw source, permanently. Its behavior is therefore a
 * contract, enforced by `apps/web/tests/dc-shim-contract.spec.ts` (run it
 * after ANY edit here) and escalated to a hard failure by the DSL-slug error
 * listeners in `apps/web/tests/pixel-parity.spec.ts`. Shipped React ports stay
 * fully self-contained and depend on none of this.
 *
 * SUPPORTED (each item has a test in dc-shim-contract.spec.ts):
 *   - `{{ key }}` text-node bindings, bare or mixed with static text.
 *   - Attribute bindings: plain attributes substitute as substrings;
 *     `style="{{ obj }}"` takes a style OBJECT (camelCase -> kebab-case css
 *     text), `ref="{{ fn }}"` calls fn with the element, `on*="{{ fn }}"`
 *     (onClick and any other `on`-prefixed attr) attaches a DOM listener once.
 *     All three structural forms require an exact, whole-value match and have
 *     their nonstandard attribute stripped after application.
 *   - Dotted keys (`{{ a.i }}`, `{{ c.icon }}`) for per-row bindings inside an
 *     `<sc-for>` template.
 *   - `<sc-for list="{{ key }}" as="name">` list repeaters over objects OR
 *     scalars, re-expanded only when the bound list's DATA changes
 *     (listSignature), so fixed lists expand exactly once and refs survive.
 *   - `<sc-if value="{{ key }}">` conditional bodies, rebuilt from the template
 *     on each transition into the shown state; nests with `<sc-for>` either way.
 *   - `setState(patchOrFn, cb?)`: shallow-merged into `this.state` SYNCHRONOUSLY,
 *     with render + `componentDidUpdate` + callbacks deferred to a microtask
 *     (coalescing every setState in one tick), matching React's handler batching.
 *   - `this.state` as a plain own property (never an accessor pair) and
 *     `this.props` filled from the `data-props` schema's declared defaults.
 *   - `componentDidMount` / `componentDidUpdate` lifecycle hooks; `renderVals()`
 *     as the single source of bound values.
 *
 * OUT OF SCOPE (deliberately unimplemented — do not assume these work):
 *   - `onChange` and other value-semantics form bindings: the attribute is
 *     attached as a raw DOM `change` listener with no value plumbing, so
 *     controlled-input patterns do not round-trip.
 *   - Conditional rendering beyond `<sc-if>` insert/remove and style-driven
 *     `display: none` — no keyed reconciliation, no diffing, no partial
 *     subtree updates.
 *   - Nested setState batches: a setState called FROM the microtask flush
 *     (inside componentDidUpdate or a callback) schedules a fresh, separate
 *     flush rather than joining the current one.
 *   - Anything else in Claude Design's real DSL. The contract is this shim's
 *     own semantics, not upstream's; the gate's job is regression detection.
 *
 * A handful of raw/<slug>/<slug>.html prototypes (confirmed: expandable-card,
 * expandable-screen, picker, toast) are authored in Claude Design's internal
 * `<x-dc>` / `class Component extends DCLogic` mustache-template DSL instead
 * of the plain React-via-Babel-standalone pattern most raw prototypes use.
 * That DSL is compiled at authoring time by `support.js` plus a per-workspace
 * `_ds_bundle.js` (referenced as `_ds/deha-design-system-<hash>/_ds_bundle.js`)
 * — neither file was ever vendored into claude-design/raw/ (confirmed absent
 * repo-wide), so `<script type="text/x-dc">` blocks sit inert: browsers never
 * execute a script whose `type` isn't a recognized JS MIME type, and every
 * `{{ expr }}` mustache binding in the markup stays literal, unresolved text.
 *
 * This shim is a minimal, slug-agnostic re-implementation of just enough of
 * that DSL to boot these prototypes for the pixel gate:
 *   1. Define `window.DCLogic`, a base class exposing `this.props`,
 *      `this.state` (a plain own property — NOT an accessor pair; a
 *      subclass's `state = {...}` class-field initializer uses
 *      [[DefineOwnProperty]] semantics and would silently shadow a
 *      prototype accessor forever, see the NOTE above DCLogic below), and
 *      `setState(patch)` (function-or-object patch, shallow-merged into
 *      `this.state` synchronously, but with the actual re-render +
 *      `componentDidUpdate` deferred to a microtask so multiple
 *      synchronous instance-field writes made by the SAME event handler
 *      after calling setState — e.g. expandable-screen's `expand()` sets
 *      `this._pendingOpen = true` on the line right after `this.setState(...)`
 *      — are visible by the time componentDidUpdate actually runs, matching
 *      real React's event-handler batching that these prototypes' lifecycle
 *      methods assume; see the NOTE above `setState` below for how this was
 *      confirmed empirically).
 *   2. Once the document has parsed, find `<script data-dc-script>`, eval its
 *      literal source text (`class Component extends DCLogic { ... }` is
 *      plain modern JS — no JSX, no framework — so it runs unmodified via
 *      `new Function('DCLogic', src + '; return Component;')`), and
 *      instantiate it with the `data-props` schema's declared defaults.
 *   3. Walk the DOM under `<x-dc>` (skipping `<helmet>`, which is these
 *      prototypes' own convention for `<head>`-bound tags left in `<body>` —
 *      harmless to leave in place, since `<link>`/`<style>` apply wherever
 *      they sit) once, collecting every `{{ key }}` binding found in text
 *      nodes or attribute values. Re-applying those bindings against
 *      `instance.renderVals()`'s return object on every render reproduces
 *      what `support.js` would have done: `style="{{ x }}"` sets the style
 *      attribute from a style object, `ref="{{ x }}"` / `onClick="{{ x }}"`
 *      call the bound function (as a DOM ref / click listener respectively),
 *      and any other attribute or text-node binding is substituted as a
 *      plain string.
 *   4. `<sc-for list="{{ key }}" as="name">` (expandable-card's attendees/
 *      conditions/forecast rows, step ds-rebuild-w2 step-4) is a list
 *      repeater: pulled out of the tree at collection time and replaced
 *      with an anchor comment, its single root child kept detached as a
 *      per-row template, then expanded into cloned rows inserted before the
 *      anchor, each row's own `{{ asName.prop }}` bindings resolved against
 *      that row's item. Re-expanded on any render where the bound list's
 *      DATA changed (see listSignature() below), so a state-driven list
 *      (toast's live toast stack, ds-rebuild-w3 step-2) tracks its state
 *      instead of freezing at whatever the list held on first render. A
 *      list whose data never changes (expandable-card's attendees/
 *      conditions/forecast) produces an identical signature on every
 *      render and is therefore still expanded exactly once, refs included.
 *      See the `sc-for` handling in collectBindings()/renderForBinding()
 *      below for the exact mechanics.
 *   5. `<sc-if value="{{ key }}">` (toast's optional message line / action
 *      pill / expandable drawer, ds-rebuild-w3 step-2) is a conditional
 *      block: same pull-out-and-anchor treatment as `<sc-for>` (an
 *      unregistered custom element defaults to `display: inline` and would
 *      otherwise wrap its children in an extra inline box, which breaks a
 *      flex row's direct-child layout), its children kept detached as the
 *      template, cloned in before the anchor while the bound value is
 *      truthy and removed again when it goes falsy. Without this, every
 *      `<sc-if>` body rendered unconditionally: toast's semantic toasts
 *      would each show an empty message line and an empty action pill.
 *      Both `<sc-for>` rows and `<sc-if>` bodies are collected recursively,
 *      so the two nest in either order (toast nests `<sc-if>` inside
 *      `<sc-for>`).
 *
 * Loaded as a classic (non-module, non-babel) <script src="./support.js">,
 * so it must not rely on ES module scoping — globals attach to `window`
 * explicitly, matching the tweaks-panel shim's convention.
 */

(function () {
  'use strict';

  // NOTE: `state` is deliberately a plain own property, not an accessor
  // pair. A subclass's `state = {...}` public class-field initializer uses
  // [[DefineOwnProperty]] semantics (CreateDataPropertyOrThrow per the
  // class-fields spec), not [[Set]] — it creates its own instance-level
  // data property that permanently shadows any getter/setter defined on
  // DCLogic.prototype, so a prototype-accessor approach silently never
  // fires past construction (confirmed empirically: setState updated an
  // internal `_state` field via the setter, but nothing ever read it back,
  // since `this.state` resolved to the class field's own shadowing
  // property instead). Writing `this.state` directly in setState works
  // correctly either way: before the field initializer runs it's a normal
  // own-property assignment on `this`; after it runs it's a normal
  // overwrite of that same own property. No accessor needed.
  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  // setState merges `this.state` synchronously (so code reading `this.state`
  // later in the SAME synchronous block, e.g. a subsequent setState's own
  // patch function, sees the merged result) but defers the actual
  // render + componentDidUpdate to a microtask, coalescing every setState
  // call made within the same synchronous tick into a single flush. This
  // mirrors React's real event-handler batching, which these prototypes'
  // own lifecycle methods assume: e.g. expand() calls `this.setState(...)`
  // and only THEN sets `this._pendingOpen = true` on the next line —
  // instance fields assigned after `.setState()` returns, not observable to
  // the reactive machinery. Under real (batched) React, componentDidUpdate
  // never runs until the whole handler has finished, so `_pendingOpen` is
  // already true by the time it does; a fully-synchronous setState (running
  // componentDidUpdate immediately, inline) breaks that ordering and was
  // confirmed empirically to leave the component stuck in its initial
  // state forever (componentDidUpdate's `_pendingOpen` check firing one
  // statement too early, every time).
  DCLogic.prototype.setState = function setState(patch, callback) {
    if (!this.__dcFlushScheduled) {
      this.__dcFlushScheduled = true;
      this.__dcPrevState = this.state;
      this.__dcPrevProps = this.props;
      this.__dcCallbacks = [];
      var instance = this;
      Promise.resolve().then(function () {
        instance.__dcFlushScheduled = false;
        var prevState = instance.__dcPrevState;
        var prevProps = instance.__dcPrevProps;
        var callbacks = instance.__dcCallbacks;
        render(instance);
        if (typeof instance.componentDidUpdate === 'function') instance.componentDidUpdate(prevProps, prevState);
        callbacks.forEach(function (cb) {
          cb();
        });
      });
    }
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    if (typeof callback === 'function') this.__dcCallbacks.push(callback);
  };
  window.DCLogic = DCLogic;

  // ---------------------------------------------------------------------
  // Binding collection + application
  // ---------------------------------------------------------------------

  // Two separate RegExp instances (not one shared/reused object): a global
  // regex's `lastIndex` persists across calls, so a single shared instance
  // used for both `.test()`/`.exec()` (single-match checks) and
  // `.replace()` (all-match substitution) would silently start scanning
  // from the wrong offset on the next call. Kept as a factory so every call
  // site gets a fresh, zero-state instance.
  //
  // The captured key allows dots (`a.i`, `c.icon`, ...) so `<sc-for>` item
  // templates (see below) can bind a nested property off the loop
  // variable — expandable-card's attendees/conditions/forecast rows use
  // exactly this (`{{ a.i }}`, `{{ c.icon }}`, `{{ d.pct }}`). Top-level
  // renderVals() bindings never contain a literal `.` in their key names,
  // so widening the charset is backward compatible with every binding
  // already exercised by dropdown/blur-carousel/expandable-screen.
  var BINDING_SRC = '\\{\\{\\s*([a-zA-Z0-9_$.]+)\\s*\\}\\}';
  function bindingRe(global) {
    return new RegExp(BINDING_SRC, global ? 'g' : '');
  }
  // Attributes whose bound value is consumed as an object/function, not a
  // plain string, and therefore require an exact `{{ key }}` match (no
  // surrounding static text) rather than substring replacement.
  var STRUCTURAL_ATTRS = { style: true, ref: true };

  function isEventAttr(name) {
    return name.length > 2 && name.slice(0, 2) === 'on';
  }

  function styleObjectToCssText(styleObj) {
    var parts = [];
    Object.keys(styleObj).forEach(function (key) {
      var value = styleObj[key];
      if (value === undefined || value === null || value === '') return;
      var prop = key.replace(/([A-Z])/g, function (m) {
        return '-' + m.toLowerCase();
      });
      parts.push(prop + ':' + value);
    });
    return parts.join(';');
  }

  // `<sc-for list="{{ key }}" as="name" hint-placeholder-count="N">` is a
  // list-repeater custom element expandable-card's raw source uses for its
  // attendees/conditions/forecast rows (never exercised by
  // dropdown/blur-carousel/expandable-screen, which have no list data).
  // collectBindings() pulls each `<sc-for>` out of the tree and replaces it
  // with an anchor comment so the surrounding flex/grid layout sees direct
  // children once the row clones are inserted (an unregistered custom
  // element defaults to `display: inline` and would otherwise wrap the
  // clones in an extra inline box, breaking layouts like the attendee
  // avatar row's negative-margin stacking). The removed element's single
  // root child is kept, detached, as the per-row template.
  function collectBindings(root) {
    var textBindings = []; // { node, template }
    var attrBindings = []; // { el, attr, template, structural, key }
    var forBindings = []; // { anchor, listKey, asName, template, nodes, sig }
    var ifBindings = []; // { anchor, valueKey, template, nodes, shown }

    function visit(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (bindingRe(false).test(node.nodeValue)) {
          textBindings.push({ node: node, template: node.nodeValue });
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      var tag = node.tagName;
      if (tag === 'HELMET' || tag === 'SCRIPT') return;

      if (tag === 'SC-FOR') {
        var listAttr = node.getAttribute('list') || '';
        var listMatch = bindingRe(false).exec(listAttr);
        var listKey = listMatch ? listMatch[1] : null;
        var asName = node.getAttribute('as') || 'item';
        var template = node.firstElementChild;
        var anchor = document.createComment('sc-for:' + listKey);
        if (node.parentNode) node.parentNode.replaceChild(anchor, node);
        if (listKey && template) {
          // `nodes` collects the rows currently inserted for this binding, so
          // a later data change can remove exactly them; `sig` is the data
          // fingerprint that decides whether that re-expansion is needed.
          forBindings.push({
            anchor: anchor,
            listKey: listKey,
            asName: asName,
            template: template,
            nodes: [],
            sig: null,
          });
        }
        return; // sc-for's own subtree is a template, not literal bindings
      }

      if (tag === 'SC-IF') {
        var valueAttr = node.getAttribute('value') || '';
        var valueMatch = bindingRe(false).exec(valueAttr);
        var valueKey = valueMatch ? valueMatch[1] : null;
        // Children (not a single root child like sc-for): an sc-if body can
        // hold several siblings, and all of them are conditional together.
        var ifTemplate = document.createDocumentFragment();
        while (node.firstChild) ifTemplate.appendChild(node.firstChild);
        var ifAnchor = document.createComment('sc-if:' + valueKey);
        if (node.parentNode) node.parentNode.replaceChild(ifAnchor, node);
        if (valueKey) {
          ifBindings.push({ anchor: ifAnchor, valueKey: valueKey, template: ifTemplate, nodes: [], shown: false });
        }
        return; // sc-if's own subtree is a template, not literal bindings
      }

      Array.prototype.forEach.call(node.attributes || [], function (attr) {
        var name = attr.name;
        var value = attr.value;
        var match = bindingRe(false).exec(value);
        if (!match) return;
        var exactMatch = match[0] === value.trim();
        var structural = (STRUCTURAL_ATTRS[name] || isEventAttr(name)) && exactMatch;
        attrBindings.push({
          el: node,
          attr: name,
          template: value,
          structural: structural,
          key: structural ? match[1] : null,
        });
      });

      Array.prototype.forEach.call(node.childNodes, visit);
    }

    // An `<sc-if>` body template is a DocumentFragment (nodeType 11), which
    // visit() itself ignores — it dispatches on TEXT_NODE/ELEMENT_NODE only.
    // Walk a fragment's children directly so the bindings inside a
    // conditional body are collected like any others; without this they stay
    // literal `{{ ... }}` text forever (observed as toast's expand drawer
    // rendering fully open, because its `style="{{ t.expandStyle }}"` — the
    // max-height:0 collapse — was never applied).
    if (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      Array.prototype.forEach.call(root.childNodes, visit);
    } else {
      visit(root);
    }
    return {
      textBindings: textBindings,
      attrBindings: attrBindings,
      forBindings: forBindings,
      ifBindings: ifBindings,
    };
  }

  function substitute(template, vals) {
    return template.replace(bindingRe(true), function (whole, key) {
      var v = vals[key];
      return v === undefined || v === null ? '' : String(v);
    });
  }

  function applyBinding(binding, vals) {
    if (!binding.structural) {
      binding.el.setAttribute(binding.attr, substitute(binding.template, vals));
      return;
    }
    var val = vals[binding.key];
    if (binding.attr === 'ref') {
      if (typeof val === 'function') val(binding.el);
      binding.el.removeAttribute('ref');
      return;
    }
    if (binding.attr === 'style') {
      if (val && typeof val === 'object') {
        binding.el.setAttribute('style', styleObjectToCssText(val));
      } else if (typeof val === 'string') {
        binding.el.setAttribute('style', val);
      } else {
        binding.el.removeAttribute('style');
      }
      return;
    }
    // Event attrs (onClick, onChange, ...): attach once, then strip the
    // nonstandard camelCase attribute so it doesn't linger as dead markup.
    var eventName = binding.attr.slice(2).toLowerCase();
    if (typeof val === 'function' && !binding._bound) {
      binding.el.addEventListener(eventName, function (e) {
        val(e);
      });
      binding._bound = true;
    }
    binding.el.removeAttribute(binding.attr);
  }

  // Expands one `<sc-for>` binding's list into cloned template rows,
  // inserted directly before its anchor comment. Each row's own bindings
  // (collected fresh per clone, since a detached template has no bindings
  // collected yet) are resolved against a flat, dotted-key vals object —
  // `{ i: 'AK', bg: '#10B981' }` with `asName: 'a'` becomes
  // `{ 'a.i': 'AK', 'a.bg': '#10B981' }`, which the widened BINDING_SRC
  // charset (see comment above) lets `{{ a.i }}` resolve against directly.
  function renderForBinding(fb, vals) {
    var list = vals[fb.listKey];
    if (!Array.isArray(list) || !fb.anchor.parentNode) return;
    var parent = fb.anchor.parentNode;
    list.forEach(function (item) {
      var clone = fb.template.cloneNode(true);
      var itemVals = {};
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(function (k) {
          itemVals[fb.asName + '.' + k] = item[k];
        });
      } else {
        // Scalar list items (picker's four wheels: arrays of strings, bound as
        // the loop variable itself -- `<sc-for list="{{ days }}" as="d">…{{ d }}…`).
        // Without this the row clones render with empty text: `itemVals` stayed
        // `{}` and substitute() resolved `{{ d }}` to ''. Additive only -- the
        // object path above is untouched, and every previously-gated slug
        // (toast, expandable-card) iterates objects, so none of them reach
        // this branch.
        itemVals[fb.asName] = item;
      }
      applyTemplateBindings(clone, itemVals);
      fb.nodes.push(clone);
      parent.insertBefore(clone, fb.anchor);
    });
  }

  // Resolves every binding inside a freshly cloned template (an sc-for row or
  // an sc-if body) against `vals`, including any nested sc-for/sc-if the
  // clone itself contains — a detached template has no bindings collected
  // yet, so each clone collects its own. toast nests sc-if inside sc-for;
  // handling both here (rather than only in render()) is what lets the two
  // compose in any order and to any depth.
  function applyTemplateBindings(clone, vals) {
    var bindings = collectBindings(clone);
    bindings.textBindings.forEach(function (b) {
      b.node.nodeValue = substitute(b.template, vals);
    });
    bindings.attrBindings.forEach(function (b) {
      applyBinding(b, vals);
    });
    bindings.forBindings.forEach(function (fb) {
      fb.sig = listSignature(vals[fb.listKey]);
      renderForBinding(fb, vals);
    });
    bindings.ifBindings.forEach(function (ib) {
      renderIfBinding(ib, vals);
    });
  }

  // Inserts (or removes) one `<sc-if>` body according to the truthiness of
  // its bound value. Content is rebuilt from the template on each transition
  // into the shown state, so its own bindings resolve against the current
  // `vals` rather than whatever they held the first time it was shown.
  function renderIfBinding(ib, vals) {
    var shouldShow = !!vals[ib.valueKey];
    if (shouldShow === ib.shown) return;
    if (!ib.anchor.parentNode) return;
    if (!shouldShow) {
      ib.nodes.forEach(function (n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
      ib.nodes = [];
      ib.shown = false;
      return;
    }
    var clone = ib.template.cloneNode(true);
    applyTemplateBindings(clone, vals);
    // A DocumentFragment empties into the DOM on insert, so capture the
    // nodes it carried while they are still reachable — they are what a
    // later falsy transition has to remove.
    ib.nodes = Array.prototype.slice.call(clone.childNodes);
    ib.anchor.parentNode.insertBefore(clone, ib.anchor);
    ib.shown = true;
  }

  // Data fingerprint of a bound list, used to decide whether an `<sc-for>`
  // needs re-expanding. Functions (per-row event handlers) stringify to a
  // constant so two renders of the same data compare equal even though each
  // render() call produces fresh closures; everything a row actually renders
  // from (text, style objects, flags) is part of the signature. Returns null
  // for a non-array or an unserializable value, which forces a re-expand
  // rather than silently freezing the list.
  function listSignature(list) {
    if (!Array.isArray(list)) return null;
    try {
      return JSON.stringify(list, function (key, value) {
        return typeof value === 'function' ? '[fn]' : value;
      });
    } catch (e) {
      return null;
    }
  }

  function render(instance) {
    if (typeof instance.renderVals !== 'function') return;
    var vals = instance.renderVals() || {};
    instance.__bindings.textBindings.forEach(function (b) {
      b.node.nodeValue = substitute(b.template, vals);
    });
    instance.__bindings.attrBindings.forEach(function (b) {
      applyBinding(b, vals);
    });
    // sc-for rows are re-expanded whenever the bound list's DATA changes,
    // and left untouched when it doesn't. A fixed list (expandable-card's
    // attendees/conditions/forecast, baked into renderVals() and never
    // reactive) yields the same signature on every render, so it is still
    // expanded exactly once — no wasted re-cloning, and its ref'd
    // measurement element is never disturbed mid-flight. A state-driven list
    // (toast's live toast stack) changes signature as toasts are pushed,
    // re-stacked and dismissed, so the rendered rows follow the state.
    instance.__bindings.forBindings.forEach(function (fb) {
      var sig = listSignature(vals[fb.listKey]);
      if (sig !== null && sig === fb.sig) return;
      fb.sig = sig;
      fb.nodes.forEach(function (n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
      fb.nodes = [];
      renderForBinding(fb, vals);
    });
    instance.__bindings.ifBindings.forEach(function (ib) {
      renderIfBinding(ib, vals);
    });
  }

  // ---------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------

  function collectPropsDefaults(schema) {
    var props = {};
    if (!schema) return props;
    Object.keys(schema).forEach(function (key) {
      var def = schema[key];
      if (def && Object.prototype.hasOwnProperty.call(def, 'default')) props[key] = def['default'];
    });
    return props;
  }

  function boot() {
    var scriptEl = document.querySelector('script[data-dc-script]');
    if (!scriptEl) return;
    var root = document.querySelector('x-dc') || document.body;

    var schema;
    try {
      schema = JSON.parse(scriptEl.getAttribute('data-props') || '{}');
    } catch (e) {
      schema = {};
    }

    var ComponentClass;
    try {
       
      ComponentClass = new Function('DCLogic', scriptEl.textContent + '\nreturn Component;')(DCLogic);
    } catch (err) {
      console.error('[dc-support-shim] failed to evaluate data-dc-script:', err);
      return;
    }
    if (typeof ComponentClass !== 'function') {
      console.error('[dc-support-shim] data-dc-script did not define a Component class');
      return;
    }

    var instance;
    try {
      instance = new ComponentClass(collectPropsDefaults(schema));
    } catch (err) {
      console.error('[dc-support-shim] failed to construct Component:', err);
      return;
    }
    instance.props = collectPropsDefaults(schema);
    instance.__bindings = collectBindings(root);

    render(instance);
    if (typeof instance.componentDidMount === 'function') {
      try {
        instance.componentDidMount();
      } catch (err) {
        console.error('[dc-support-shim] componentDidMount threw:', err);
      }
    }

    window.__dcInstance = instance; // debugging aid only, not consumed by the gate
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
