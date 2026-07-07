#!/usr/bin/env node
/* =========================================================================
   build-design-tokens.mjs

   Parses the design-system source CSS and emits a deterministic token
   manifest (design-tokens.json). Color-valued tokens carry an OKLCH
   equivalent computed inline (sRGB -> linear -> LMS -> OKLab -> OKLCH),
   with no npm dependencies. Output is byte-identical on re-run: no
   timestamps, all arrays sorted stably.

   Usage:
     node apps/web/design-system/tools/build-design-tokens.mjs
   ========================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Paths are expressed relative to the repo root so meta + I/O stay stable.
const REPO_ROOT = resolve(__dirname, '../../../..');
const SOURCE_REL = 'apps/web/design-system/colors_and_type.css';
const OUTPUT_REL = 'apps/web/design-system/design-tokens.json';
const COMMAND = 'node apps/web/design-system/tools/build-design-tokens.mjs';

const SOURCE_ABS = resolve(REPO_ROOT, SOURCE_REL);
const OUTPUT_ABS = resolve(REPO_ROOT, OUTPUT_REL);

/* ---------------------------------------------------------------------------
   Color math: sRGB -> OKLab -> OKLCH (Björn Ottosson's reference matrices).
--------------------------------------------------------------------------- */
function srgbChannelToLinear(c8) {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklch(r8, g8, b8) {
  const r = srgbChannelToLinear(r8);
  const g = srgbChannelToLinear(g8);
  const b = srgbChannelToLinear(b8);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return {
    L: round(L, 3),
    C: round(C, 3),
    H: C < 1e-6 ? 0 : round(H, 1),
  };
}

function round(n, places) {
  const f = Math.pow(10, places);
  // +0 normalizes -0 to 0 for byte-stable output.
  return Math.round(n * f) / f + 0;
}

/* ---------------------------------------------------------------------------
   Color parsing / detection.
--------------------------------------------------------------------------- */
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RGB_RE = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/;

function parseColor(raw) {
  const v = raw.trim();

  const hm = v.match(HEX_RE);
  if (hm) {
    let h = hm[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b, a: 1, hex: h.toUpperCase() };
  }

  const rm = v.match(RGB_RE);
  if (rm) {
    const r = Math.round(parseFloat(rm[1]));
    const g = Math.round(parseFloat(rm[2]));
    const b = Math.round(parseFloat(rm[3]));
    const a = rm[4] === undefined ? 1 : parseFloat(rm[4]);
    const hex = [r, g, b]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return { r, g, b, a, hex };
  }

  return null;
}

/* ---------------------------------------------------------------------------
   CSS block extraction. We only read the plain :root block and the dark
   block (`:root[data-theme="dark"], .dark`). Multi-line values are handled
   by splitting declarations on `;`.
--------------------------------------------------------------------------- */
function extractBlock(css, startIndex) {
  const open = css.indexOf('{', startIndex);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return null;
}

function findPlainRootBlock(css) {
  // Match `:root` that is NOT followed by `[` (attribute selector).
  const re = /:root\s*\{/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    return extractBlock(css, m.index);
  }
  return null;
}

function findDarkBlock(css) {
  const idx = css.indexOf('[data-theme="dark"]');
  if (idx === -1) return null;
  return extractBlock(css, idx);
}

function parseDeclarations(blockText) {
  // Strip `/* ... */` comments up front so a trailing comment cannot bleed
  // into the next declaration's name when we split on `;`.
  const clean = blockText.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  for (const chunk of clean.split(';')) {
    const colon = chunk.indexOf(':');
    if (colon === -1) continue;
    const name = chunk.slice(0, colon).trim();
    if (!name.startsWith('--')) continue;
    const value = chunk.slice(colon + 1).replace(/\s+/g, ' ').trim();
    out.push({ name, raw: value });
  }
  return out;
}

/* ---------------------------------------------------------------------------
   Sanctioned overlays: every pure white / pure black rgba()/rgb() that
   appears anywhere in the stylesheet (shadow tokens, inset stacks,
   text-shadows). These are the overlays the fidelity gate must allow.
--------------------------------------------------------------------------- */
function collectSanctionedOverlays(css) {
  const set = new Set();
  const re = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const r = parseFloat(m[1]);
    const g = parseFloat(m[2]);
    const b = parseFloat(m[3]);
    const isWhite = r === 255 && g === 255 && b === 255;
    const isBlack = r === 0 && g === 0 && b === 0;
    if (!isWhite && !isBlack) continue;
    const a = m[4] === undefined ? 1 : parseFloat(m[4]);
    set.add(`rgba(${r},${g},${b},${a})`);
  }
  return [...set].sort();
}

/* ---------------------------------------------------------------------------
   Classification of non-color tokens into sections.
--------------------------------------------------------------------------- */
function classify(name) {
  if (name.startsWith('--radius')) return 'radii';
  if (name.startsWith('--space')) return 'spacing';
  if (name.startsWith('--shadow')) return 'shadows';
  if (name.startsWith('--blur')) return 'blur';
  if (
    name.startsWith('--type') ||
    name.startsWith('--weight') ||
    name.startsWith('--leading') ||
    name.startsWith('--tracking') ||
    name.startsWith('--font')
  ) {
    return 'typography';
  }
  return 'misc';
}

function typographyGroup(name) {
  if (name.startsWith('--font')) return 'fonts';
  if (name.startsWith('--type')) return 'sizes';
  if (name.startsWith('--weight')) return 'weights';
  if (name.startsWith('--leading')) return 'leading';
  return 'tracking';
}

function byName(a, b) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

/* ---------------------------------------------------------------------------
   Main build.
--------------------------------------------------------------------------- */
function build() {
  const css = readFileSync(SOURCE_ABS, 'utf8');

  const lightBlock = findPlainRootBlock(css);
  const darkBlock = findDarkBlock(css);
  if (!lightBlock) throw new Error('Could not locate :root block in source CSS');
  if (!darkBlock) throw new Error('Could not locate dark block in source CSS');

  const modes = [
    { mode: 'light', decls: parseDeclarations(lightBlock) },
    { mode: 'dark', decls: parseDeclarations(darkBlock) },
  ];

  const colors = [];
  const radii = [];
  const spacing = [];
  const shadows = [];
  const blur = [];
  const misc = [];
  const typography = { fonts: [], sizes: [], weights: [], leading: [], tracking: [] };

  // Non-color tokens are only meaningfully defined in the light block; the
  // dark block overrides colors + border-hairline. We dedupe non-color names
  // so a token appearing in both modes is not double-listed.
  const seenNonColor = new Set();

  for (const { mode, decls } of modes) {
    for (const { name, raw } of decls) {
      const color = parseColor(raw);
      if (color) {
        const entry = {
          name,
          raw,
          hex: color.hex,
          oklch: rgbToOklch(color.r, color.g, color.b),
          mode,
        };
        if (color.a !== 1) entry.alpha = color.a;
        colors.push(entry);
        continue;
      }

      if (seenNonColor.has(name)) continue;
      seenNonColor.add(name);

      const section = classify(name);
      const item = { name, raw };
      switch (section) {
        case 'radii': radii.push(item); break;
        case 'spacing': spacing.push(item); break;
        case 'shadows': shadows.push(item); break;
        case 'blur': blur.push(item); break;
        case 'typography': typography[typographyGroup(name)].push(item); break;
        default: misc.push(item); break;
      }
    }
  }

  // Stable sort: colors by name then mode; every section by name.
  colors.sort((a, b) => byName(a, b) || (a.mode < b.mode ? -1 : a.mode > b.mode ? 1 : 0));
  radii.sort(byName);
  spacing.sort(byName);
  shadows.sort(byName);
  blur.sort(byName);
  misc.sort(byName);
  for (const k of Object.keys(typography)) typography[k].sort(byName);

  return {
    meta: {
      source: SOURCE_REL,
      command: COMMAND,
    },
    colors,
    radii,
    spacing,
    typography,
    shadows,
    blur,
    misc,
    sanctionedOverlays: collectSanctionedOverlays(css),
  };
}

const manifest = build();
writeFileSync(OUTPUT_ABS, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
