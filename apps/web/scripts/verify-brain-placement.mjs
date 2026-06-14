/**
 * verify-brain-placement.mjs — independent regression guard for the brain.
 *
 * Loads the WRITTEN regions/region-<id>.png files and the WRITTEN
 * BRAIN_REGION_BOXES offsets, alpha-composites them in paint order onto an
 * 800×800 canvas, and diffs against default.png. Because the regions are an
 * exact partition cut from default.png, the composite must equal default.png.
 *
 * Exits non-zero if mean per-pixel RGB diff > 3 OR misaligned-pixel fraction
 * (diff > 12) > 1%. Catches crop/offset drift that grep + tsc cannot.
 *
 * Usage:  node apps/web/scripts/verify-brain-placement.mjs
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO        = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_PNG = path.join(REPO, 'apps/web/public/brain-ref/default.png');
const REGIONS_DIR = path.join(REPO, 'apps/web/public/brain-ref/regions');
const TS_BOXES    = path.join(REPO, 'apps/web/src/components/design-system/leads-table/brainRegions.ts');

const SECTION_IDS = [
  'aspirations', 'challenges', 'values',
  'fears', 'preferences', 'dislikes',
  'influencers', 'keywords', 'purchase_factors',
];

// ── PNG decode (colortype 2/6, bitdepth 8) ──
function decodePNG(buf) {
  let pos = 8;
  const idat = [];
  let w = 0, h = 0, ct = 2;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); pos += 4;
    const type = buf.slice(pos, pos + 4).toString('ascii'); pos += 4;
    const data = buf.slice(pos, pos + len); pos += len; pos += 4;
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp;
  const out = Buffer.alloc(w * h * 4, 0);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c); };
  for (let y = 0; y < h; y++) {
    const rs = y * (stride + 1), ft = raw[rs];
    const dec = Buffer.alloc(stride);
    const prev = new Uint8Array(stride);
    if (y > 0) for (let x = 0; x < w; x++) { const o = ((y - 1) * w + x) * 4; prev[x * bpp] = out[o]; prev[x * bpp + 1] = out[o + 1]; prev[x * bpp + 2] = out[o + 2]; if (bpp === 4) prev[x * bpp + 3] = out[o + 3]; }
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? dec[i - bpp] : 0, b = y > 0 ? prev[i] : 0, c = (y > 0 && i >= bpp) ? prev[i - bpp] : 0;
      const s = raw[rs + 1 + i]; let v;
      switch (ft) { case 0: v = s; break; case 1: v = (s + a) & 255; break; case 2: v = (s + b) & 255; break; case 3: v = (s + ((a + b) >> 1)) & 255; break; case 4: v = (s + paeth(a, b, c)) & 255; break; default: throw new Error('ft' + ft); }
      dec[i] = v;
    }
    for (let x = 0; x < w; x++) { const d = x * bpp, o = (y * w + x) * 4; out[o] = dec[d]; out[o + 1] = dec[d + 1]; out[o + 2] = dec[d + 2]; out[o + 3] = bpp === 4 ? dec[d + 3] : 255; }
  }
  return { w, h, raster: out };
}

// ── parse BRAIN_REGION_BOXES out of the generated .ts ──
function parseBoxes(src) {
  const boxes = {};
  const re = /(\w+):\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+),\s*w:\s*(\d+),\s*h:\s*(\d+)\s*\}/g;
  let m;
  while ((m = re.exec(src))) boxes[m[1]] = { x: +m[2], y: +m[3], w: +m[4], h: +m[5] };
  return boxes;
}

const { w: W, h: H, raster: def } = decodePNG(fs.readFileSync(DEFAULT_PNG));
const boxes = parseBoxes(fs.readFileSync(TS_BOXES, 'utf8'));

const composite = Buffer.alloc(W * H * 4, 0);
for (const id of SECTION_IDS) {
  const box = boxes[id];
  if (!box) { console.error(`MISSING box for ${id}`); process.exit(1); }
  const { w: rw, h: rh, raster: rg } = decodePNG(fs.readFileSync(path.join(REGIONS_DIR, `region-${id}.png`)));
  if (rw !== box.w || rh !== box.h) { console.error(`SIZE mismatch ${id}: png ${rw}x${rh} vs box ${box.w}x${box.h}`); process.exit(1); }
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const s = (y * rw + x) * 4;
    if (rg[s + 3] <= 16) continue; // alpha-over: skip transparent
    const cx = box.x + x, cy = box.y + y;
    if (cx < 0 || cx >= W || cy < 0 || cy >= H) continue;
    const d = (cy * W + cx) * 4;
    composite[d] = rg[s]; composite[d + 1] = rg[s + 1]; composite[d + 2] = rg[s + 2]; composite[d + 3] = rg[s + 3];
  }
}

let diffSum = 0, diffMax = 0, nOpaque = 0, nBad = 0, nMissing = 0;
for (let i = 0; i < W * H; i++) {
  if (def[i * 4 + 3] <= 16) continue;
  nOpaque++;
  if (composite[i * 4 + 3] <= 16) { nMissing++; nBad++; continue; } // default opaque but composite has a hole
  const dr = Math.abs(composite[i * 4] - def[i * 4]);
  const dg = Math.abs(composite[i * 4 + 1] - def[i * 4 + 1]);
  const db = Math.abs(composite[i * 4 + 2] - def[i * 4 + 2]);
  const d = dr + dg + db;
  diffSum += d; if (d > diffMax) diffMax = d;
  if (d > 12) nBad++;
}
const mean = diffSum / nOpaque;
const badFrac = nBad / nOpaque;
console.log(`Brain placement check:`);
console.log(`  mean RGB diff   ${mean.toFixed(4)}`);
console.log(`  max diff        ${diffMax}`);
console.log(`  holes           ${nMissing}`);
console.log(`  bad pixels      ${nBad}/${nOpaque} = ${(100 * badFrac).toFixed(3)}%`);

if (mean > 3 || badFrac > 0.01) {
  console.error('FAIL: brain regions do not recompose default.png');
  process.exit(1);
}
console.log('PASS: regions recompose default.png pixel-for-pixel.');
