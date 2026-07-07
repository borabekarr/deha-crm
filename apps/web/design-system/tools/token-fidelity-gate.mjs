#!/usr/bin/env node
/* =========================================================================
   token-fidelity-gate.mjs

   Scans a component source file for hard-coded color literals and checks
   each one against the canonical design-token manifest. A color passes when
   it is a sanctioned overlay, a pure white/black overlay, fully transparent,
   or lands within deltaEok <= 0.02 of a manifest color in OKLab space.
   Anything else is an off-palette color and fails the gate.

   Color math (sRGB -> OKLab, oklch -> OKLab) mirrors build-design-tokens.mjs
   in this same directory. No npm dependencies.

   Usage:
     node token-fidelity-gate.mjs <componentFile> [--tokens <manifest>]

   Exit 0 = every color matched. Exit 1 = at least one off-palette color.
   ========================================================================= */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Default manifest resolves next to this script, never against cwd.
const DEFAULT_TOKENS = resolve(__dirname, '../design-tokens.json');

// deltaEok threshold: euclidean distance in OKLab (L, a, b).
const DELTA_EOK_MAX = 0.02;

/* ---------------------------------------------------------------------------
   Color math: sRGB -> OKLab and OKLCH -> OKLab (Björn Ottosson's matrices).
   We keep L, a, b (no polar C/H) because the gate compares in that space.
--------------------------------------------------------------------------- */
function srgbChannelToLinear(c8) {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklab(r8, g8, b8) {
  const r = srgbChannelToLinear(r8);
  const g = srgbChannelToLinear(g8);
  const b = srgbChannelToLinear(b8);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

function oklchToOklab(L, C, H) {
  const rad = (H * Math.PI) / 180;
  return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
}

function deltaEok(x, y) {
  const dL = x.L - y.L;
  const da = x.a - y.a;
  const db = x.b - y.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/* ---------------------------------------------------------------------------
   HSL -> sRGB (0..255), so hsl()/hsla() literals fold into the rgb path.
--------------------------------------------------------------------------- */
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/* ---------------------------------------------------------------------------
   Literal parsing. Each parser returns a normalized color:
     { lab: {L,a,b}, alpha, kind: 'oklch'|'rgb'|'hex'|'hsl', rgb?: {r,g,b} }
   rgb is present for sRGB-origin colors (used for sanctioned-overlay match).
--------------------------------------------------------------------------- */
function num(token) {
  // Accept plain numbers and percentages.
  const t = token.trim();
  if (t.endsWith('%')) return parseFloat(t) / 100;
  return parseFloat(t);
}

function parseAlpha(token) {
  if (token === undefined) return 1;
  const t = token.trim();
  if (t === 'none') return 1;
  return t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t);
}

// Split "L C H" or "L C H / A" (space-separated, slash before alpha).
function splitModern(inside) {
  const [main, alphaPart] = inside.split('/');
  const parts = main.trim().split(/\s+/).filter(Boolean);
  return { parts, alpha: parseAlpha(alphaPart) };
}

function parseLiteral(raw) {
  const v = raw.trim();
  const lower = v.toLowerCase();

  if (lower.startsWith('oklch(')) {
    const inside = v.slice(v.indexOf('(') + 1, v.lastIndexOf(')'));
    const { parts, alpha } = splitModern(inside);
    if (parts.length < 3) return null;
    const L = num(parts[0]);
    const C = num(parts[1]);
    const H = parseFloat(parts[2]); // strips an optional 'deg' suffix
    return { lab: oklchToOklab(L, C, H), alpha, kind: 'oklch' };
  }

  if (lower.startsWith('hsl')) {
    const inside = v.slice(v.indexOf('(') + 1, v.lastIndexOf(')'));
    // hsl supports both comma and modern space syntax.
    let parts, alpha;
    if (inside.includes(',')) {
      const seg = inside.split(',').map((s) => s.trim());
      parts = seg.slice(0, 3);
      alpha = parseAlpha(seg[3]);
    } else {
      ({ parts, alpha } = splitModern(inside));
    }
    if (parts.length < 3) return null;
    const h = parseFloat(parts[0]);
    const s = num(parts[1]);
    const l = num(parts[2]);
    const rgb = hslToRgb(h, s, l);
    return { lab: rgbToOklab(rgb.r, rgb.g, rgb.b), alpha, kind: 'hsl', rgb };
  }

  if (lower.startsWith('rgb')) {
    const inside = v.slice(v.indexOf('(') + 1, v.lastIndexOf(')'));
    let parts, alpha;
    if (inside.includes(',')) {
      const seg = inside.split(',').map((s) => s.trim());
      parts = seg.slice(0, 3);
      alpha = parseAlpha(seg[3]);
    } else {
      ({ parts, alpha } = splitModern(inside));
    }
    if (parts.length < 3) return null;
    const chan = (t) => (t.endsWith('%') ? Math.round((parseFloat(t) / 100) * 255) : Math.round(parseFloat(t)));
    const rgb = { r: chan(parts[0]), g: chan(parts[1]), b: chan(parts[2]) };
    return { lab: rgbToOklab(rgb.r, rgb.g, rgb.b), alpha, kind: 'rgb', rgb };
  }

  if (v.startsWith('#')) {
    let h = v.slice(1);
    let alpha = 1;
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length === 8) {
      alpha = parseInt(h.slice(6, 8), 16) / 255;
      h = h.slice(0, 6);
    }
    if (h.length !== 6) return null;
    const rgb = {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
    return { lab: rgbToOklab(rgb.r, rgb.g, rgb.b), alpha, kind: 'hex', rgb };
  }

  return null;
}

/* ---------------------------------------------------------------------------
   White / black detection in OKLab: near-zero chroma at the extremes of L.
--------------------------------------------------------------------------- */
function isPureWhite(lab) {
  return lab.L >= 0.99 && Math.hypot(lab.a, lab.b) <= 0.02;
}
function isPureBlack(lab) {
  return lab.L <= 0.02 && Math.hypot(lab.a, lab.b) <= 0.02;
}

/* ---------------------------------------------------------------------------
   Nearest canonical token. On distance ties, prefer the canonical brand
   token so shared-oklch aliases (e.g. --bg-accent) do not mask --brand-primary.
--------------------------------------------------------------------------- */
function tokenPriority(name) {
  if (name === '--brand-primary') return 0;
  if (name.startsWith('--brand-primary')) return 1;
  if (name.includes('brand')) return 2;
  return 3;
}

function nearestToken(lab, manifestColors) {
  let best = null;
  for (const c of manifestColors) {
    const d = deltaEok(lab, c.lab);
    if (
      best === null ||
      d < best.dist - 1e-9 ||
      (Math.abs(d - best.dist) <= 1e-9 && tokenPriority(c.name) < tokenPriority(best.name))
    ) {
      best = { name: c.name, raw: c.raw, dist: d };
    }
  }
  return best;
}

/* ---------------------------------------------------------------------------
   Sanctioned-overlay match: compare integer rgb + rounded alpha against the
   manifest's sanctionedOverlays[] strings ("rgba(r,g,b,a)").
--------------------------------------------------------------------------- */
function overlayKey(rgb, alpha) {
  // Trim trailing zeros the way the builder emits alpha (e.g. 0.5 not 0.50).
  const a = parseFloat(alpha.toFixed(4)).toString();
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

/* ---------------------------------------------------------------------------
   Main.
--------------------------------------------------------------------------- */
function main() {
  const args = process.argv.slice(2);
  let componentFile = null;
  let tokensPath = DEFAULT_TOKENS;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tokens') {
      tokensPath = resolve(process.cwd(), args[++i]);
    } else if (!componentFile) {
      componentFile = args[i];
    }
  }

  if (!componentFile) {
    console.error('usage: token-fidelity-gate.mjs <componentFile> [--tokens <manifest>]');
    process.exit(2);
  }

  const componentAbs = resolve(process.cwd(), componentFile);
  const source = readFileSync(componentAbs, 'utf8');
  const manifest = JSON.parse(readFileSync(tokensPath, 'utf8'));

  const manifestColors = manifest.colors.map((c) => ({
    name: c.name,
    raw: c.raw,
    lab: oklchToOklab(c.oklch.L, c.oklch.C, c.oklch.H),
  }));
  const sanctioned = new Set(manifest.sanctionedOverlays || []);

  // Extract every color literal. Longest hex forms first so 6-hex is not
  // clipped to a 3-hex. Function forms are non-greedy up to the first ')'.
  const LITERAL_RE =
    /oklch\([^)]*\)|hsla?\([^)]*\)|rgba?\([^)]*\)|#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b/gi;

  const counts = new Map(); // literal text -> occurrence count
  let m;
  while ((m = LITERAL_RE.exec(source)) !== null) {
    const lit = m[0];
    counts.set(lit, (counts.get(lit) || 0) + 1);
  }

  const offenders = [];
  let checked = 0;

  for (const [literal, count] of counts) {
    const parsed = parseLiteral(literal);
    if (!parsed) continue; // not a real color (shouldn't happen post-regex)
    checked++;

    // 1. Fully transparent -> allowed.
    if (parsed.alpha === 0) continue;

    // 2. Pure white/black (any alpha) -> overlay usage, allowed.
    if (isPureWhite(parsed.lab) || isPureBlack(parsed.lab)) continue;

    // 3. Sanctioned overlay match (rgb + alpha) for sRGB-origin colors.
    if (parsed.rgb && sanctioned.has(overlayKey(parsed.rgb, parsed.alpha))) continue;

    // 4. Canonical token match within deltaEok. Alpha is ignored here: for a
    //    non-overlay color with alpha we match the base color's hue/chroma.
    const nearest = nearestToken(parsed.lab, manifestColors);
    if (nearest && nearest.dist <= DELTA_EOK_MAX) continue;

    offenders.push({ literal, count, nearest });
  }

  // Report.
  const relComp = relative(process.cwd(), componentAbs) || componentFile;
  if (offenders.length === 0) {
    console.log(`PASS  token-fidelity  ${relComp}`);
    console.log(`  ${checked} distinct color literal(s) checked, all on-palette.`);
    process.exit(0);
  }

  // Stable, readable ordering: worst drift first.
  offenders.sort((a, b) => (b.nearest?.dist ?? 0) - (a.nearest?.dist ?? 0));

  console.log(`FAIL  token-fidelity  ${relComp}`);
  console.log(`  ${offenders.length} off-palette color(s) of ${checked} checked:`);
  console.log('');
  for (const o of offenders) {
    const n = o.nearest;
    const near = n
      ? `nearest ${n.name} (${n.raw})  deltaEok=${n.dist.toFixed(4)}`
      : 'no manifest colors to compare';
    console.log(`  ${o.literal}   x${o.count}`);
    console.log(`      ${near}`);
  }
  console.log('');
  console.log(`  threshold deltaEok <= ${DELTA_EOK_MAX}`);
  process.exit(1);
}

main();
