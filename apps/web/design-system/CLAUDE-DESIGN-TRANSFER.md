# Transferring a component into Claude Design (claude.ai/design)

A runbook for pushing a Deha UI-library component into our web design project so it can be
iterated on visually in Claude Design, then ported back. Written after transferring
`pipeline-card`, which took two false starts before landing the right approach. Follow this and
the next transfer is one clean pass.

The agent does this with the `DesignSync` tool. This doc is the procedure it follows.

---

## 1. What to transfer (source of truth)

The canonical implementation of every component is the **`.tsx`** at:

```
apps/web/src/components/design-system/<slug>/<Component>.tsx
apps/web/src/components/design-system/<slug>/<component>-hook.ts   (if present)
```

Do **not** transfer `apps/web/design-system/preview/components-<slug>.html`. Those HTML
prototypes are a retired pipeline and are stale. The registry says so directly
(`apps/web/src/lib/component-registry.ts` header):

> The HTML prototypes referenced by `sourceHtml` are historical artifacts from an earlier
> pipeline that has been retired. They are NOT the source of truth. The `.tsx` file for each
> entry is the authoritative implementation.

Transferring the prototype is exactly how the first attempt shipped an old version.

---

## 2. Target project

| Field | Value |
|---|---|
| Name | Deha Design System |
| projectId | `019e20c5-e924-7a08-8c5f-c6f6f6a87d66` | <!-- example: non-secret DesignSync project identifier (UUIDv7), not a credential -->

Confirm with `DesignSync list_projects` (writable projects only). The first call may prompt to
grant design-system access to the claude.ai login.

---

## 3. Remote folder layout

The remote project uses a **nested** layout that differs from our flat local
`design-system/preview/`. Files land here:

| Artifact | Remote path |
|---|---|
| Harness HTML | `preview/done/html/components-<slug>.html` |
| Browser JSX | `preview/done/jsx/_<slug>.jsx` |
| Component CSS | `preview/done/jsx/_<slug>.css` |
| Shared base | `preview/_base.css` |
| Shared feedback | `preview/_shared-feedback.css` |
| Dark-mode CSS | `preview/_darkmode.css` |
| Dark-mode JS | `preview/_darkmode.js` |
| Tokens + type | `colors_and_type.css` (project root) |

Because the HTML sits two levels deep, its links must climb back up. Bare-sibling hrefs (correct
for our flat local folder) **404 on the remote and render unstyled**. Use these exact paths from
the harness HTML:

```html
<link rel="stylesheet" href="../../_base.css">
<link rel="stylesheet" href="../../_shared-feedback.css">
<link rel="stylesheet" href="../jsx/_<slug>.css">
<link rel="stylesheet" href="../../_darkmode.css">
...
<script src="../../_darkmode.js"></script>
<script type="text/babel" src="../jsx/_<slug>.jsx"></script>
```

Note: CSS `@import` resolves relative to the CSS file, not the HTML. So `_base.css`'s
`@import url('../colors_and_type.css')` correctly reaches the root `colors_and_type.css` from
`preview/_base.css`. No action needed; just do not move those files.

---

## 4. Port the `.tsx` to a browser-loadable `.jsx`

Claude Design renders React components the same way our `_funnel-chart.jsx` does: plain JSX
transpiled in the browser by Babel standalone. Mirror that file's shape.

Rules for converting `<Component>.tsx` (+ its hook) into `_<slug>.jsx`:

1. Wrap everything in an IIFE: `(function () { ... })();`
2. Pull hooks off the global: `const { useState, useRef, useCallback } = React;`
3. **Strip all TypeScript.** No `interface` / `type` declarations, no `: Type` annotations, no
   generics (`useState<T>` to `useState`), no `as` casts, no `React.CSSProperties` /
   `React.MouseEvent` / `Record<...>` types, no non-null `!`. Optional chaining (`?.`) and
   nullish (`??`) are plain JS and stay.
4. **Inline the hook module.** Copy every function from `<component>-hook.ts` into the IIFE
   (also TS-stripped). Do not keep the `import` line.
5. Drop the CSS `import` lines (the harness links CSS instead).
6. End with `window.<Component> = <Component>;` exposing the root component.

Keep all literal content verbatim, including Turkish characters and HTML entities
(`&apos;`, `&ldquo;`).

---

## 5. Write the harness HTML

Model it on `preview/done/jsx/_funnel-chart.jsx`'s companion HTML. Required pieces:

```html
<!doctype html>
<!-- @dsCard group="Brand" name="<Name>" subtitle="<one-line>" viewport="700x1500" --><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../_base.css">
<link rel="stylesheet" href="../../_shared-feedback.css">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../jsx/_<slug>.css">
<link rel="stylesheet" href="../../_darkmode.css">
<style>
  body { margin: 0; background: #F1F5F9; }
  html.dark body { background: #0B1220; }
</style>
</head>
<body>
<div id="<slug>-root"></div>
<script src="../../_darkmode.js"></script>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>
<script type="text/babel" src="../jsx/_<slug>.jsx"></script>
<script type="text/babel" data-presets="react">
  ReactDOM.createRoot(document.getElementById('<slug>-root')).render(React.createElement(window.<Component>));
</script>
</body></html>
```

The `@dsCard` marker is how the Design System pane builds its card (group, name, subtitle,
viewport). The integrity hashes from `_funnel-chart.html` can be copied over for the unpkg
scripts if you want SRI; they are stable for those pinned versions.

---

## 6. Dark mode

Dark mode keys on the `dark` class on `<html>` (`html.dark ...`), not `[data-theme]`.
`_darkmode.js` is self-contained: it injects its own toggle pill and toggles `html.dark`,
persisting the choice in localStorage. Just link it; no extra markup.

---

## 7. Gotchas

- **The display font (Montserrat) must be linked in the harness.** `colors_and_type.css` sets `--font-display: 'Montserrat', ...` but deliberately ships NO `@font-face` / `@import` (avoids render-blocking FOUT). So the web font only loads if the harness HTML includes `<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`. Omit it and every Montserrat-900 label falls back to system-ui and the component "looks off". A local Playwright probe can mask this (chromium may have a passable fallback installed), so add the link from the template above, do not rely on the probe to catch a missing font.
- **`.icon-badge` lives in `_shared-feedback.css`.** Components that use it (popover section
  icons, the `icon-badge--sm` chips) need that file on the remote. It was missing during the
  pipeline-card transfer and the popover icons rendered unstyled until it was pushed. Push it.
- **The pushed `.jsx` is a point-in-time port.** Edits made in Claude Design live only there.
  They do not flow back into the repo `.tsx`. Porting changes back is a separate manual step.
- **`colors_and_type.css` and the shared CSS already exist on the remote.** Only re-push them if
  they changed locally. Most transfers push three files: the JSX, the harness HTML, and (first
  time) `_shared-feedback.css`.

---

## 8. Procedure (DesignSync)

1. `DesignSync list_projects` to confirm the target projectId.
2. Read `<Component>.tsx` and its hook.
3. Write `_<slug>.jsx` and `components-<slug>.html` into a temp dir (e.g. `/tmp/ds-<slug>/`).
4. **Verify locally** (section 9) before pushing.
5. `DesignSync finalize_plan` with:
   - `projectId`
   - `localDir`: the temp dir
   - `writes`: the remote paths from the table in section 3
6. `DesignSync write_files` with the returned `planId`, each file as
   `{ path: "<remote path>", localPath: "<file in localDir>" }`. Contents upload from disk and
   never enter the model context.

---

## 9. Local verification harness

Render the port over HTTP before pushing (Babel fetches the external JSX, so `file://` is
blocked by CORS).

1. Mirror the remote layout under `/tmp/ds-verify/`:
   - `preview/done/html/components-<slug>.html`
   - `preview/done/jsx/_<slug>.jsx`, `preview/done/jsx/_<slug>.css`
   - `preview/_base.css`, `preview/_shared-feedback.css`, `preview/_darkmode.css`,
     `preview/_darkmode.js`
   - `colors_and_type.css` (mirror root)
2. Serve it: `python3 -m http.server 8791` rooted at `/tmp/ds-verify`. Start it as a **Bash
   background process** (`run_in_background: true`); a plain `&` job dies between tool calls.
3. Probe with Playwright, run **from inside `apps/web`** so `@playwright/test` resolves. Assert:
   - `window.<Component>` is defined
   - the root element mounts children
   - zero `console` errors and zero `pageerror`
   - interactive bits work (open the detail popover, etc.)
   - capture light and dark screenshots (toggle by adding `dark` to `<html>`)

A clean probe (no errors, correct card count and titles, popover opens) is the gate. Only push
after it passes.

---

## Reference

- Working example on the remote: `preview/done/jsx/_funnel-chart.jsx` and its harness HTML.
- First transfer write-up: pipeline-card (`PipelineCard.tsx` + `pipeline-card-hook.ts`), pushed
  2026-06-21.
