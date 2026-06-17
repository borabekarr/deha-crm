/**
 * feather-brain.mjs — pure-Node ESM (node:fs + node:zlib only)
 *
 * Post-processes the WRITTEN region-<id>.png pieces so the section-colour
 * CSS drop-shadow glow (.ldx-brain-piece.is-hovered / .is-active) traces a
 * SMOOTH alpha gradient instead of the 1px staircase left by the BFS-flood
 * segmentation. That staircase is what made the hover rim look pixelated and
 * gave the orange piece its glitchy left-edge glow.
 *
 * Strategy — inward-only alpha feather, RGB untouched:
 *   1. mask  = alpha > 16             (binary present/absent; matches the
 *                                       verifier's cutoff → stable + idempotent)
 *   2. cov   = box-blur(mask, RADIUS) (separable, coverage in [0,1])
 *   3. alpha = mask ? min(origAlpha, max(round(255*cov), MINEDGE)) : 0
 *
 *   min(origAlpha, …) makes the pass strictly INWARD: interior 255 ramps down
 *   toward seams (smoothing the staircase the glow traces), while the brain's
 *   outer anti-aliased silhouette is never boosted (preserved as-is). MINEDGE
 *   keeps every present pixel above the verifier's alpha>16 cutoff (no holes)
 *   and, with the binary mask, makes re-runs idempotent. RGB bytes are never
 *   modified.
 *
 * Why pixel-perfect-safe: at rest each piece sits over default.png
 * (.ldx-brain-base, z-0). A feathered edge pixel keeps its original RGB (= base
 * RGB at that spot), so a*base + (1-a)*base = base. The at-rest brain and the
 * CI visual baselines are unchanged. verify-brain-placement.mjs copies region
 * RGB for every alpha>16 pixel and diffs RGB only → mean diff ≈ 0, 0 holes.
 *
 * Usage:  node apps/web/scripts/feather-brain.mjs   (then run verify-brain-placement.mjs)
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO        = path.resolve(__dirname, '..', '..', '..');
const REGIONS_DIR = path.join(REPO, 'apps/web/public/brain-ref/regions');

const SECTION_IDS = [
  'aspirations', 'challenges', 'values',
  'fears', 'preferences', 'dislikes',
  'influencers', 'keywords', 'purchase_factors',
];

// Feather radius (px) of the separable box blur and the minimum present-pixel alpha.
const RADIUS  = 2;   // smooths the ~1–2px segmentation staircase
const MINEDGE = 24;  // keep every present pixel above the verifier's alpha>16 cutoff

// ─── CRC32 + PNG chunk helpers (same codec as place-brain.mjs) ────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function writeUint32BE(val) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(val >>> 0, 0);
  return b;
}
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const crcInput  = Buffer.concat([typeBytes, data]);
  return Buffer.concat([writeUint32BE(data.length), typeBytes, data, writeUint32BE(crc32(crcInput))]);
}

// ─── PNG DECODE (colortype 2/6, bitdepth 8) ──────────────────────────────────
function decodePNG(buf) {
  let pos = 8;
  const idatChunks = [];
  let width = 0, height = 0, colortype = 2;
  while (pos < buf.length) {
    const len  = buf.readUInt32BE(pos);     pos += 4;
    const type = buf.slice(pos, pos + 4).toString('ascii'); pos += 4;
    const data = buf.slice(pos, pos + len); pos += len;
    pos += 4;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      const bd = data[8]; colortype = data[9];
      if (bd !== 8 || (colortype !== 2 && colortype !== 6)) {
        throw new Error(`Unsupported PNG: bitdepth=${bd} colortype=${colortype}`);
      }
    } else if (type === 'IDAT') idatChunks.push(data);
    else if (type === 'IEND') break;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = colortype === 6 ? 4 : 3;
  const stride = width * bpp;
  const raster = Buffer.alloc(width * height * 4, 0);
  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filterType = raw[rowStart];
    const decoded = Buffer.alloc(stride);
    const prevRow = new Uint8Array(stride);
    if (y > 0) {
      for (let x = 0; x < width; x++) {
        const rOff = ((y - 1) * width + x) * 4;
        prevRow[x * bpp]     = raster[rOff];
        prevRow[x * bpp + 1] = raster[rOff + 1];
        prevRow[x * bpp + 2] = raster[rOff + 2];
        if (bpp === 4) prevRow[x * bpp + 3] = raster[rOff + 3];
      }
    }
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? decoded[i - bpp] : 0;
      const b = y > 0 ? prevRow[i] : 0;
      const c = (y > 0 && i >= bpp) ? prevRow[i - bpp] : 0;
      const s = raw[rowStart + 1 + i];
      let val;
      switch (filterType) {
        case 0: val = s; break;
        case 1: val = (s + a) & 0xFF; break;
        case 2: val = (s + b) & 0xFF; break;
        case 3: val = (s + Math.floor((a + b) / 2)) & 0xFF; break;
        case 4: val = (s + paeth(a, b, c)) & 0xFF; break;
        default: throw new Error(`Unknown filter type: ${filterType}`);
      }
      decoded[i] = val;
    }
    for (let x = 0; x < width; x++) {
      const dOff = x * bpp;
      const rOff = (y * width + x) * 4;
      raster[rOff]     = decoded[dOff];
      raster[rOff + 1] = decoded[dOff + 1];
      raster[rOff + 2] = decoded[dOff + 2];
      raster[rOff + 3] = bpp === 4 ? decoded[dOff + 3] : 255;
    }
  }
  return { width, height, raster };
}

// ─── ENCODE RGBA PNG ─────────────────────────────────────────────────────────
function encodeRGBAPNG(width, height, rgbaData) {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  const rawRows = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowBase = y * (width * 4 + 1);
    rawRows[rowBase] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = rowBase + 1 + x * 4;
      rawRows[dst]     = rgbaData[src];
      rawRows[dst + 1] = rgbaData[src + 1];
      rawRows[dst + 2] = rgbaData[src + 2];
      rawRows[dst + 3] = rgbaData[src + 3];
    }
  }
  const compressed = zlib.deflateSync(rawRows, { level: 6 });
  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdrData),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Separable box blur of a Float32 coverage plane ───────────────────────────
function boxBlur(plane, w, h, radius) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const win = radius * 2 + 1;
  // horizontal
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        sum += plane[row + xx];
      }
      tmp[row + x] = sum / win;
    }
  }
  // vertical
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        sum += tmp[yy * w + x];
      }
      out[y * w + x] = sum / win;
    }
  }
  return out;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
let totalEdge = 0;
for (const id of SECTION_IDS) {
  const file = path.join(REGIONS_DIR, `region-${id}.png`);
  const { width: w, height: h, raster } = decodePNG(fs.readFileSync(file));

  // binary present/absent mask (matches verifier cutoff) → idempotent across re-runs
  const mask = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = raster[i * 4 + 3] > 16 ? 1 : 0;

  const cov = boxBlur(mask, w, h, RADIUS);

  let edge = 0;
  for (let i = 0; i < w * h; i++) {
    if (mask[i] < 0.5) {
      raster[i * 4 + 3] = 0; // absent stays fully transparent (RGB irrelevant)
      continue;
    }
    const orig = raster[i * 4 + 3];
    let a = Math.round(255 * cov[i]);
    if (a < MINEDGE) a = MINEDGE;        // never drop a present pixel below the cutoff
    if (a > orig) a = orig;              // inward only: never boost (preserves outer anti-alias)
    if (a < orig) edge++;
    raster[i * 4 + 3] = a;               // RGB bytes untouched
  }

  fs.writeFileSync(file, encodeRGBAPNG(w, h, raster));
  totalEdge += edge;
  console.log(`  ${id.padEnd(18)} ${String(w).padStart(3)}x${String(h).padStart(3)}  feathered edge px=${edge}`);
}
console.log(`\nFeathered 9 regions (radius=${RADIUS}, minEdge=${MINEDGE}), ${totalEdge} edge px softened.`);
console.log('Next: node apps/web/scripts/verify-brain-placement.mjs');
