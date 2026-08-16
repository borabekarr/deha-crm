/**
 * Contract self-test for the DC support shim
 * (tests/fixtures/pixel-gate/dc-support-shim.js).
 *
 * The shim is an official, maintained part of the pixel-gate harness: Claude
 * Design's real `support.js` (+ its per-workspace-hashed `_ds_bundle.js`) was
 * never part of any export and is confirmed absent repo-wide, so the four
 * DSL-authored raw sources (expandable-screen, expandable-card, picker, toast)
 * only boot because we re-implemented just enough of that runtime. That makes
 * the shim's behavior a CONTRACT, and this spec is its alarm: the moment a
 * supported DSL feature stops rendering correctly, this file fails loudly
 * instead of the pixel gate quietly diffing two equally-wrong pages.
 *
 * Each fixture in tests/fixtures/pixel-gate/dc-contract-fixtures/ is a small
 * DSL snippet loaded through the SAME path the real gate uses: a local HTTP
 * server (not file://) whose `support.js` basename intercept serves
 * dc-support-shim.js as a classic, non-module <script>. That load path is
 * load-bearing — the shim attaches globals to `window` and must not become an
 * ES module.
 *
 * BASENAME COLLISION RISK (shared with pixel-parity.spec.ts): the intercept
 * matches on basename alone, so ANY request ending in `support.js` — at any
 * depth, from any slug — is served the shim. That is deliberate (the raw
 * sources reference it through an unresolvable `_ds/deha-design-system-<hash>/`
 * prefix, so path-based matching is impossible), but it means a future raw
 * source shipping its own unrelated `support.js` would be silently shadowed.
 * If that ever happens, the symptom is a component whose real runtime never
 * runs; the fix is to narrow the intercept to the `_ds/` prefixed form rather
 * than to widen the shim.
 *
 * The last test is a NEGATIVE CONTROL, mirroring the fixture/fixture-shifted
 * pair in pixel-parity.spec.ts (:257/:270): a deliberately broken snippet must
 * be DETECTED (error surface + unresolved bindings). It proves this spec can
 * actually fail, so a green run means something.
 */

import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(__dirname, 'fixtures/pixel-gate/dc-contract-fixtures')
const shimPath = path.resolve(__dirname, 'fixtures/pixel-gate/dc-support-shim.js')

let server: import('node:http').Server
let baseUrl: string

test.beforeAll(async () => {
  const http = await import('node:http')
  server = http.createServer((req, res) => {
    const reqPath = decodeURIComponent((req.url ?? '/').split('?')[0])
    // Same basename intercept as the real gate (see header).
    const file =
      path.basename(reqPath) === 'support.js'
        ? shimPath
        : path.join(fixturesDir, path.basename(reqPath))
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404)
        res.end()
        return
      }
      res.writeHead(200, {
        'Content-Type': file.endsWith('.js')
          ? 'text/javascript; charset=utf-8'
          : 'text/html; charset=utf-8',
      })
      res.end(data)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('failed to determine dc-shim-contract server port')
  }
  baseUrl = `http://127.0.0.1:${address.port}`
})

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
  })
})

// Any shim-side error is a contract breach: collect them and assert emptiness
// in every positive test (the negative control opts out and asserts presence).
function collectShimErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
  })
  return errors
}

test('contract / mustache text, style, ref and onClick bindings + batched setState', async ({
  page,
}) => {
  const errors = collectShimErrors(page)
  await page.goto(`${baseUrl}/bindings.html`)

  // Text bindings: bare and mixed-with-static-text, resolved from props + state.
  await expect(page.locator('#label')).toHaveText('hello')
  // componentDidMount's setState({ total: 3 }) has flushed by now.
  await expect(page.locator('#mixed')).toHaveText('count 0 of 3')
  // Non-structural attribute binding substitutes as a substring.
  await expect(page.locator('#box')).toHaveAttribute('data-echo', 'v-hello')
  // style="{{ obj }}": style OBJECT -> css text, camelCase -> kebab-case.
  const style = await page.locator('#box').getAttribute('style')
  expect(style).toContain('background-color:rgb(16, 185, 129)')
  expect(style).toContain('padding-left:4px')
  // ref="{{ fn }}": called with the element, then the attribute is stripped.
  await expect(page.locator('#measured')).toHaveAttribute('data-ref-called', 'yes')
  expect(await page.locator('#measured').getAttribute('ref')).toBeNull()

  // onClick="{{ fn }}": bound as a click listener, attribute stripped.
  expect(await page.locator('#bump').getAttribute('onClick')).toBeNull()
  await page.locator('#bump').click()
  await expect(page.locator('#mixed')).toHaveText('count 1 of 3')
  // The microtask deferral: componentDidUpdate saw an instance field assigned
  // on the line AFTER setState() returned.
  await expect(page.locator('body')).toHaveAttribute('data-field-visible', 'yes')

  expect(errors, 'shim must not report any error').toEqual([])
})

test('contract / sc-for objects and scalars, nested sc-if, listSignature stability', async ({
  page,
}) => {
  const errors = collectShimErrors(page)
  await page.goto(`${baseUrl}/list-and-if.html`)

  // sc-for over objects, with dotted `{{ it.prop }}` keys per row.
  await expect(page.locator('#rows .row')).toHaveCount(2)
  await expect(page.locator('#rows .row').first()).toHaveAttribute('data-k', 'a')
  await expect(page.locator('#rows .row-label').first()).toHaveText('Alpha')
  // sc-if nested INSIDE an sc-for row: only the truthy row renders its body.
  await expect(page.locator('#rows .row-flag')).toHaveCount(1)
  // The custom elements themselves are gone (replaced by anchor comments), so
  // no stray `display: inline` wrapper distorts the parent's flex/grid layout.
  await expect(page.locator('sc-for')).toHaveCount(0)
  await expect(page.locator('sc-if')).toHaveCount(0)
  // sc-for over SCALARS: the loop variable itself is the value.
  await expect(page.locator('#scalars .word')).toHaveText(['one', 'two', 'three'])

  // Top-level sc-if: absent while falsy, inserted on the truthy transition,
  // removed again on the way back.
  await expect(page.locator('#drawer')).toHaveCount(0)
  await page.locator('#toggle').click()
  await expect(page.locator('#drawer')).toHaveCount(1)
  await page.locator('#toggle').click()
  await expect(page.locator('#drawer')).toHaveCount(0)

  // listSignature: a render whose list DATA is unchanged must leave the exact
  // same row nodes in place (proven by marking them from outside and checking
  // the marks survive) — re-cloning would disturb refs mid-flight.
  await page.evaluate(() => {
    document.querySelectorAll('#rows .row').forEach((el, i) => el.setAttribute('data-mark', String(i)))
  })
  await page.locator('#touch').click()
  await expect(page.locator('#rows .row[data-mark]')).toHaveCount(2)

  // ...and a render whose list data DID change re-expands the rows (marks gone
  // on the rebuilt set, new row present).
  await page.locator('#add').click()
  await expect(page.locator('#rows .row')).toHaveCount(3)
  await expect(page.locator('#rows .row[data-mark]')).toHaveCount(0)

  expect(errors, 'shim must not report any error').toEqual([])
})

test('NEGATIVE CONTROL / a broken DSL snippet must be detected, not silently rendered', async ({
  page,
}) => {
  const errors = collectShimErrors(page)
  await page.goto(`${baseUrl}/broken.html`)
  await page.waitForTimeout(100)

  // 1. The shim reports the failure (this is the surface pixel-parity.spec.ts
  //    now escalates into a hard gate failure).
  expect(
    errors.some((e) => e.includes('[dc-support-shim]')),
    'a broken data-dc-script must produce a [dc-support-shim] error surface',
  ).toBe(true)
  // 2. And the breakage is visible in the DOM: bindings stay literal, so a
  //    silent "looks fine" pass is impossible.
  await expect(page.locator('#label')).toHaveText('{{ label }}')
})
