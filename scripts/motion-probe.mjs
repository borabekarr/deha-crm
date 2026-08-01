#!/usr/bin/env node
// motion-probe.mjs — reusable bundled-chromium motion probe.
//
// Works around the broken Playwright MCP `chrome` channel by launching the
// bundled chromium binary directly (no `channel` option). Samples
// getComputedStyle() on a target element over a short window, optionally
// triggering an interaction (hover/press/focus) first, then runs a second
// reduced-motion pass to confirm transitions are suppressed.
//
// Usage:
//   node motion-probe.mjs <URL> <SELECTOR> [ACTION] [SAMPLE_COUNT] [INTERVAL_MS] [NTH]
//
//   URL           page to navigate to (required)
//   SELECTOR      CSS selector of the element to sample (required)
//   ACTION        hover | press | click | focus | none (default: none)
//                 click fires a real mousedown+up -> onClick (press only
//                 holds mousedown and never fires the click handler)
//   SAMPLE_COUNT  number of computed-style samples to take (default: 8)
//   INTERVAL_MS   ms between samples (default: 150)
//   NTH           0-based index into selector matches, for selectors that
//                 resolve to multiple elements (default: 0, first match)
//
// Example:
//   node motion-probe.mjs 'http://localhost:5173/components/buttons' '.btn-apply' hover
//   node motion-probe.mjs 'http://localhost:5173/components/buttons' '.btn-apply' click 28 150

import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const require = createRequire(join(process.cwd(), 'noop.js'));

function resolvePlaywrightCore() {
  const candidates = [
    join(homedir(), 'deha-crm', 'node_modules', 'playwright-core'),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) {
      const req = createRequire(join(dir, 'noop.js'));
      return req(dir);
    }
  }
  throw new Error(
    `Could not resolve playwright-core; checked: ${candidates.join(', ')}`
  );
}

function resolveChromiumExecutable() {
  const fallback =
    '/home/bora/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';
  const cacheDir = join(homedir(), '.cache', 'ms-playwright');
  try {
    const entries = readdirSync(cacheDir).filter((e) =>
      e.startsWith('chromium-') && !e.includes('headless_shell')
    );
    entries.sort();
    for (const entry of entries.reverse()) {
      const candidate = join(cacheDir, entry, 'chrome-linux64', 'chrome');
      if (existsSync(candidate)) return candidate;
    }
  } catch {
    // fall through to fallback path
  }
  if (existsSync(fallback)) return fallback;
  throw new Error(
    `Could not locate a bundled chromium executable under ${cacheDir} ` +
      `(and fallback ${fallback} does not exist either). ` +
      `Run 'npx playwright install chromium' or check the cache path.`
  );
}

async function sampleComputedStyle(page, selector, count, intervalMs, { nth = 0 } = {}) {
  const samples = [];
  for (let i = 0; i < count; i++) {
    const style = await page.$$eval(
      selector,
      (els, idx) => {
        const el = els[idx];
        const cs = window.getComputedStyle(el);
        return {
          width: cs.width,
          backgroundColor: cs.backgroundColor,
          transform: cs.transform,
          transitionDuration: cs.transitionDuration,
          transitionProperty: cs.transitionProperty,
          transitionTimingFunction: cs.transitionTimingFunction,
        };
      },
      nth
    );
    samples.push({ t: i * intervalMs, ...style });
    if (i < count - 1) await page.waitForTimeout(intervalMs);
  }
  return samples;
}

async function performAction(page, selector, action, { nth = 0 } = {}) {
  const locator = page.locator(selector).nth(nth);
  switch (action) {
    case 'hover':
      await locator.hover();
      break;
    case 'press': {
      // Real hover + mouse.down (not a synthetic dispatchEvent('mousedown'))
      // so the browser actually enters the native :active pseudo-class;
      // dispatchEvent bypasses the browser's real pointer state machine and
      // silently never triggers :active-driven CSS.
      await locator.hover();
      const box = await locator.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      }
      await page.mouse.down();
      break;
    }
    case 'click':
      // Real click (mousedown+up -> onClick), unlike 'press' which only
      // holds mousedown and never fires the click handler.
      await locator.click();
      break;
    case 'focus':
      await locator.focus();
      break;
    case 'none':
    default:
      break;
  }
}

function printSamples(label, samples) {
  console.log(`\n--- ${label} ---`);
  for (const s of samples) {
    console.log(
      `  t=${String(s.t).padStart(5)}ms  width=${s.width.padEnd(10)} ` +
        `bg=${s.backgroundColor.padEnd(22)} ` +
        `transform=${s.transform.padEnd(28)} ` +
        `transition-duration=${s.transitionDuration.padEnd(10)} ` +
        `transition-property=${s.transitionProperty.padEnd(20)} ` +
        `transition-timing-function=${s.transitionTimingFunction}`
    );
  }
}

async function main() {
  const url = process.argv[2];
  const selector = process.argv[3];
  const action = process.argv[4] || 'none';
  const sampleCount = Number.parseInt(process.argv[5], 10) || 8;
  const intervalMs = Number.parseInt(process.argv[6], 10) || 150;
  const nth = Number.parseInt(process.argv[7], 10) || 0;
  // Optional: perform the ACTION on SELECTOR but sample a *different*
  // element's computed style (e.g. click a row, sample the sibling
  // .ms-sel-indicator that reacts to the click). Env var keeps the
  // positional CLI signature stable; unset means sample the same selector.
  const sampleSelector = process.env.TARGET_SELECTOR || selector;

  if (!url || !selector) {
    console.error(
      'Usage: node motion-probe.mjs <URL> <SELECTOR> [ACTION=hover|press|click|focus|none] [SAMPLE_COUNT=8] [INTERVAL_MS=150] [NTH=0]\n' +
        '       TARGET_SELECTOR=<selector> env var samples a different element than the one ACTION is performed on.'
    );
    process.exit(1);
  }

  console.log('=== motion-probe ===');
  console.log(`URL:      ${url}`);
  console.log(`Selector: ${selector}`);
  console.log(`Action:   ${action}`);
  console.log(`Samples:  ${sampleCount} @ ${intervalMs}ms interval`);

  let chromium;
  let executablePath;
  try {
    ({ chromium } = resolvePlaywrightCore());
    executablePath = resolveChromiumExecutable();
  } catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath,
    });

    // --- normal pass ---
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForSelector(selector, { timeout: 10000 });
    } catch (err) {
      console.error(
        `FATAL: could not find selector "${selector}" at ${url}: ${err.message}`
      );
      process.exit(1);
    }

    if (action !== 'none') {
      await performAction(page, selector, action, { nth });
    }

    // Sampling nth only applies when sampling the same selector the action
    // targeted; a different TARGET_SELECTOR is assumed unique (nth=0).
    const sampleNth = sampleSelector === selector ? nth : 0;
    await page.waitForSelector(sampleSelector, { timeout: 10000 });
    const samples = await sampleComputedStyle(
      page,
      sampleSelector,
      sampleCount,
      intervalMs,
      { nth: sampleNth }
    );
    printSamples(
      `normal pass (action=${action} on "${selector}", sampling "${sampleSelector}")`,
      samples
    );
    await context.close();

    // --- reduced-motion pass ---
    console.log('\n--- reduced-motion pass ---');
    const rmContext = await browser.newContext({ reducedMotion: 'reduce' });
    const rmPage = await rmContext.newPage();
    try {
      await rmPage.goto(url, { waitUntil: 'load' });
      await rmPage.waitForSelector(selector, { timeout: 10000 });
    } catch (err) {
      console.error(
        `FATAL: could not find selector "${selector}" at ${url} (reduced-motion context): ${err.message}`
      );
      process.exit(1);
    }
    if (action !== 'none') {
      await performAction(rmPage, selector, action, { nth });
    }
    await rmPage.waitForSelector(sampleSelector, { timeout: 10000 });
    const rmSample = await rmPage.$$eval(
      sampleSelector,
      (els, idx) => {
        const cs = window.getComputedStyle(els[idx]);
        return {
          transitionProperty: cs.transitionProperty,
          transitionDuration: cs.transitionDuration,
        };
      },
      sampleNth
    );
    console.log(
      `  transition-property: ${rmSample.transitionProperty}    ` +
        `transition-duration: ${rmSample.transitionDuration}`
    );
    await rmContext.close();
  } catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
