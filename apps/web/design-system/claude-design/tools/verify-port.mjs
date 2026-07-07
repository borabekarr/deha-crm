#!/usr/bin/env node
/**
 * verify-port.mjs — Playwright smoke check for a ported Deha design-system
 * component page (used before/after a claude.ai/design push).
 *
 * IMPORTANT: must be run with cwd = apps/web so the `playwright` import
 * resolves against apps/web/node_modules. Example:
 *
 *   cd apps/web
 *   node design-system/claude-design/tools/verify-port.mjs <slug> --base http://localhost:PORT
 *
 * This script does NOT start an HTTP server itself — start one first
 * (e.g. `npx http-server . -p PORT &` run with Bash run_in_background: true)
 * and pass its base URL via --base.
 *
 * Usage:
 *   node tools/verify-port.mjs <slug> --base <url> [--component <Name>] [--shots <dir>]
 *
 * Checks performed:
 *   1. Page loads preview/done/html/components-<slug>.html with zero
 *      console errors / pageerrors.
 *   2. window.<ComponentName> is defined.
 *   3. #<slug>-root mounts children with nonzero rendered height (not just
 *      present in the DOM — probes actual render, per
 *      grep-verifies-structure-not-render lesson).
 *   4. Dark mode toggle (#dm-toggle pill from _darkmode.js) flips
 *      html.dark and the root's rendered height stays nonzero.
 *   5. Saves light + dark screenshots to the shots dir.
 *
 * Exit 0 if all checks pass, non-zero otherwise. Prints one verdict line
 * per check (PASS/FAIL).
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

function printHelp() {
  console.log(`verify-port.mjs — Playwright smoke check for a ported DS component page

Usage:
  node tools/verify-port.mjs <slug> --base <url> [--component <Name>] [--shots <dir>]

Options:
  --base <url>        Base URL of a running static server (required unless --help)
  --component <Name>  Global name to assert on window (default: PascalCase of slug)
  --shots <dir>        Screenshot output dir (default: /tmp/claude-1000/-home-bora-deha-crm/5281aba5-91b3-4011-86cf-904e043a8542/scratchpad/port-shots)
  --help               Print this usage and exit 0

Must be run with cwd apps/web (playwright resolves from apps/web/node_modules).`);
}

function toPascalCase(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      args.help = true;
    } else if (a === '--base') {
      args.base = argv[++i];
    } else if (a === '--component') {
      args.component = argv[++i];
    } else if (a === '--shots') {
      args.shots = argv[++i];
    } else {
      args._.push(a);
    }
  }
  return args;
}

const DEFAULT_SHOTS_DIR =
  '/tmp/claude-1000/-home-bora-deha-crm/5281aba5-91b3-4011-86cf-904e043a8542/scratchpad/port-shots';

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const slug = args._[0];
  if (!slug || !args.base) {
    console.error('FAIL: missing required arguments (<slug> and --base <url>)');
    printHelp();
    process.exit(1);
  }

  const componentName = args.component || toPascalCase(slug);
  const shotsDir = args.shots || DEFAULT_SHOTS_DIR;
  const url = `${args.base.replace(/\/$/, '')}/preview/done/html/components-${slug}.html`;
  const rootSelector = `#${slug}-root`;

  await mkdir(shotsDir, { recursive: true });

  const consoleErrors = [];
  const pageErrors = [];
  let failed = false;

  function verdict(label, ok, detail) {
    console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ` — ${detail}` : ''}`);
    if (!ok) failed = true;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto(url, { waitUntil: 'load' });

    // 1. window.<ComponentName> defined
    const componentDefined = await page.evaluate(
      (name) => typeof window[name] !== 'undefined',
      componentName
    );
    verdict(`window.${componentName} is defined`, componentDefined);

    // 2. root mounts children with nonzero rendered height (probes real render)
    const rootHandle = await page.$(rootSelector);
    let rootRendered = false;
    let rootDetail = `selector ${rootSelector} not found`;
    if (rootHandle) {
      const box = await rootHandle.boundingBox();
      const childCount = await rootHandle.evaluate((el) => el.children.length);
      rootRendered = !!box && box.height > 0 && childCount > 0;
      rootDetail = box
        ? `height=${box.height}px, children=${childCount}`
        : `no bounding box (not rendered), children=${childCount}`;
    }
    verdict(`${rootSelector} mounts with nonzero rendered height`, rootRendered, rootDetail);

    // 3. light screenshot
    await page.screenshot({ path: path.join(shotsDir, `${slug}-light.png`) });

    // 4. toggle dark mode via the _darkmode.js pill (#dm-toggle), sequential
    const toggle = await page.$('#dm-toggle');
    let darkToggled = false;
    let darkDetail = '#dm-toggle not found';
    if (toggle) {
      await toggle.click();
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      darkToggled = isDark;
      darkDetail = isDark ? 'html.dark set' : 'html.dark NOT set after click';
    }
    verdict('dark mode toggled via #dm-toggle onto html.dark', darkToggled, darkDetail);

    // 5. root still renders with nonzero height in dark mode
    let rootRenderedDark = false;
    let rootDarkDetail = `selector ${rootSelector} not found`;
    if (rootHandle) {
      const boxDark = await rootHandle.boundingBox();
      rootRenderedDark = !!boxDark && boxDark.height > 0;
      rootDarkDetail = boxDark
        ? `height=${boxDark.height}px`
        : 'no bounding box (not rendered) in dark mode';
    }
    verdict(`${rootSelector} still renders in dark mode`, rootRenderedDark, rootDarkDetail);

    // 6. dark screenshot
    await page.screenshot({ path: path.join(shotsDir, `${slug}-dark.png`) });

    // 7. zero console errors / pageerrors
    verdict(
      'zero console errors',
      consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors.join(' | ') : undefined
    );
    verdict(
      'zero page errors',
      pageErrors.length === 0,
      pageErrors.length ? pageErrors.join(' | ') : undefined
    );

    console.log(`Screenshots saved to: ${shotsDir} (${slug}-light.png, ${slug}-dark.png)`);
  } catch (err) {
    console.error(`FAIL: unexpected error — ${err.message}`);
    failed = true;
  } finally {
    await browser.close();
  }

  process.exit(failed ? 1 : 0);
}

main();
