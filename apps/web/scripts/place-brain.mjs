/**
 * place-brain.mjs — pure-Node ESM (node:fs + node:zlib only)
 *
 * Segments the assembled default.png brain into its 9 colour regions and emits
 * cropped region PNGs + brainRegions.ts. The pieces are CUT FROM default.png
 * (not matched against it), so the 9 regions are an exact partition of default's
 * pixels — re-compositing them reproduces default.png pixel-for-pixel with zero
 * misalignment by construction. Each region keeps its organic brain shape, so a
 * hover-lift looks like a real lobe lifting (the orange-selected.png reference).
 *
 * Why segmentation, not template-matching the pieces/ PNGs:
 *   The pieces/piece-*.png assets are a SEPARATE illustration (own outlines,
 *   gaps — see pieces-separated.png). They never pixel-match default.png, so
 *   sliding them can't align. Cutting regions out of default.png is exact.
 *
 * Classification = nearest section colour + a position prior toward each
 * region's 3x3 grid cell (the brain is a clean 3x3 grid in SECTION_IDS reading
 * order). The prior disambiguates near-duplicate hues (red vs pink, orange vs
 * yellow). Dark seam / outline / highlight pixels are deferred and flood-filled
 * to the nearest classified region, splitting shared seams down the middle.
 *
 * Usage:  node apps/web/scripts/place-brain.mjs
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_PNG = path.join(REPO, 'apps/web/public/brain-ref/default.png');
const OUT_DIR     = path.join(REPO, 'apps/web/public/brain-ref/regions');
const TS_OUT      = path.join(REPO, 'apps/web/src/components/design-system/leads-table/brainRegions.ts');

fs.mkdirSync(OUT_DIR, { recursive: true });

// Position-prior weight (RGB-dist² units per px²). Tuned so colour dominates for
// distinct hues while position breaks ties between near-duplicate hues.
const POS_WEIGHT = 0.25;
const BRAIN_HIT_N = 160;

// ─── Section order = paint order (index 0 = bottom) = BRAIN_SECTIONS order ─────
// Layout is a clean 3x3 grid in reading order: row = idx/3, col = idx%3.
const SECTION_IDS = [
  'aspirations', 'challenges', 'values',
  'fears', 'preferences', 'dislikes',
  'influencers', 'keywords', 'purchase_factors',
];

// Canonical region hues sampled from default.png (match leadMetrics BRAIN_SECTIONS).
const SECTION_RGB = {
  aspirations:      [0xfd, 0x59, 0x69],
  challenges:       [0xfd, 0xd0, 0x2c],
  values:           [0xfe, 0x8a, 0x01],
  fears:            [0xb0, 0xe7, 0x31],
  preferences:      [0x35, 0xe8, 0x95],
  dislikes:         [0x14, 0xaa, 0xfe],
  influencers:      [0xa4, 0x37, 0xeb],
  keywords:         [0xfc, 0x6d, 0x99],
  purchase_factors: [0x4a, 0x65, 0xf2],
};

// ─── CRC32 ────────────────────────────────────────────────────────────────────
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

// ─── PNG DECODE (colortype 2=RGB and 6=RGBA, bitdepth 8) ─────────────────────
function decodePNG(buf) {
  let pos = 8; // skip 8-byte signature
  const idatChunks = [];
  let width = 0, height = 0, colortype = 2;

  while (pos < buf.length) {
    const len  = buf.readUInt32BE(pos);     pos += 4;
    const type = buf.slice(pos, pos + 4).toString('ascii'); pos += 4;
    const data = buf.slice(pos, pos + len); pos += len;
    pos += 4; // skip CRC

    if (type === 'IHDR') {
      width     = data.readUInt32BE(0);
      height    = data.readUInt32BE(4);
      const bd  = data[8];
      colortype = data[9];
      if (bd !== 8 || (colortype !== 2 && colortype !== 6)) {
        throw new Error(`Unsupported PNG: bitdepth=${bd} colortype=${colortype}`);
      }
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = colortype === 6 ? 4 : 3;
  const stride = width * bpp;
  const raster = Buffer.alloc(width * height * 4, 0); // always RGBA out

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

// ─── ENCODE RGBA PNG ──────────────────────────────────────────────────────────
function encodeRGBAPNG(width, height, rgbaData) {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  const rawRows = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowBase = y * (width * 4 + 1);
    rawRows[rowBase] = 0; // filter None
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

// ─── MAIN ─────────────────────────────────────────────────────────────────────
console.log('Reading default.png…');
const { width: W, height: H, raster } = decodePNG(fs.readFileSync(DEFAULT_PNG));
console.log(`Default canvas: ${W}x${H} RGBA`);

// Brain bbox (opaque region) → 3x3 grid-cell centres for the position prior.
let bx0 = W, by0 = H, bx1 = 0, by1 = 0;
for (let i = 0; i < W * H; i++) {
  if (raster[i * 4 + 3] <= 16) continue;
  const x = i % W, y = (i / W) | 0;
  if (x < bx0) bx0 = x; if (x > bx1) bx1 = x;
  if (y < by0) by0 = y; if (y > by1) by1 = y;
}
const bw = bx1 - bx0, bh = by1 - by0;
const COL_F = [1 / 6, 1 / 2, 5 / 6], ROW_F = [1 / 6, 1 / 2, 5 / 6];
const centers = SECTION_IDS.map((_, k) => [
  bx0 + COL_F[k % 3] * bw,
  by0 + ROW_F[(k / 3) | 0] * bh,
]);
console.log(`Brain bbox: (${bx0},${by0})–(${bx1},${by1})`);

// ─── Classify every opaque pixel ──────────────────────────────────────────────
// label: -1 transparent, -2 ink (deferred), 0..8 region index.
const label = new Int16Array(W * H).fill(-1);
const queue = [];
let confident = 0, ink = 0;

for (let i = 0; i < W * H; i++) {
  const r = raster[i * 4], g = raster[i * 4 + 1], b = raster[i * 4 + 2], a = raster[i * 4 + 3];
  if (a <= 16) continue;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  // Dark seam/outline or near-grey highlight → defer to flood fill.
  if (mx < 70 || (mx - mn) < 38) { label[i] = -2; ink++; continue; }
  const x = i % W, y = (i / W) | 0;
  let best = 0, bestD = Infinity;
  for (let k = 0; k < SECTION_IDS.length; k++) {
    const c = SECTION_RGB[SECTION_IDS[k]];
    const dr = r - c[0], dg = g - c[1], db = b - c[2];
    const cx = x - centers[k][0], cy = y - centers[k][1];
    const d = (dr * dr + dg * dg + db * db) + POS_WEIGHT * (cx * cx + cy * cy);
    if (d < bestD) { bestD = d; best = k; }
  }
  label[i] = best;
  confident++;
  queue.push(i);
}
console.log(`Classified: ${confident} confident, ${ink} ink (deferred)`);

// ─── Flood ink pixels to nearest classified region (multi-source BFS) ──────────
let qi = 0;
while (qi < queue.length) {
  const p = queue[qi++];
  const lp = label[p];
  const px = p % W;
  // 4-neighbourhood
  if (px > 0       && label[p - 1] === -2) { label[p - 1] = lp; queue.push(p - 1); }
  if (px < W - 1   && label[p + 1] === -2) { label[p + 1] = lp; queue.push(p + 1); }
  if (p - W >= 0    && label[p - W] === -2) { label[p - W] = lp; queue.push(p - W); }
  if (p + W < W * H && label[p + W] === -2) { label[p + W] = lp; queue.push(p + W); }
}
let orphan = 0;
for (let i = 0; i < W * H; i++) if (label[i] === -2) { label[i] = -1; orphan++; }
if (orphan) console.log(`  ${orphan} isolated ink px left transparent`);

// ─── Cut each region from default + build the gapless composite check ──────────
const bboxes = {};
const palette = {};
const composite = Buffer.alloc(W * H * 4, 0);

for (let k = 0; k < SECTION_IDS.length; k++) {
  const id = SECTION_IDS[k];
  let minX = W, minY = H, maxX = -1, maxY = -1, cnt = 0;
  for (let i = 0; i < W * H; i++) {
    if (label[i] !== k) continue;
    composite[i * 4]     = raster[i * 4];
    composite[i * 4 + 1] = raster[i * 4 + 1];
    composite[i * 4 + 2] = raster[i * 4 + 2];
    composite[i * 4 + 3] = raster[i * 4 + 3];
    const x = i % W, y = (i / W) | 0;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    cnt++;
  }
  if (maxX < 0) { console.warn(`  WARNING: region ${id} is empty`); continue; }
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  bboxes[id] = { x: minX, y: minY, w: cw, h: ch };

  // crop region pixels into a cw×ch RGBA buffer
  const crop = Buffer.alloc(cw * ch * 4, 0);
  for (let i = 0; i < W * H; i++) {
    if (label[i] !== k) continue;
    const x = i % W, y = (i / W) | 0;
    const d = ((y - minY) * cw + (x - minX)) * 4;
    crop[d]     = raster[i * 4];
    crop[d + 1] = raster[i * 4 + 1];
    crop[d + 2] = raster[i * 4 + 2];
    crop[d + 3] = raster[i * 4 + 3];
  }
  fs.writeFileSync(path.join(OUT_DIR, `region-${id}.png`), encodeRGBAPNG(cw, ch, crop));
  palette[id] = `#${SECTION_RGB[id].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  console.log(`  ${id.padEnd(18)} x=${String(minX).padStart(3)} y=${String(minY).padStart(3)} w=${String(cw).padStart(3)} h=${String(ch).padStart(3)} px=${cnt}`);
}

// Composite must equal default.png over opaque pixels (partition ⇒ exact).
let diffSum = 0, diffMax = 0, nOpaque = 0, nBad = 0;
for (let i = 0; i < W * H; i++) {
  if (raster[i * 4 + 3] <= 16) continue;
  nOpaque++;
  const dr = Math.abs(composite[i * 4] - raster[i * 4]);
  const dg = Math.abs(composite[i * 4 + 1] - raster[i * 4 + 1]);
  const db = Math.abs(composite[i * 4 + 2] - raster[i * 4 + 2]);
  const d = dr + dg + db;
  diffSum += d; if (d > diffMax) diffMax = d;
  if (d > 12) nBad++;
}
console.log(`Composite vs default: mean ${(diffSum / nOpaque).toFixed(3)}, max ${diffMax}, bad ${nBad}/${nOpaque}`);

// ─── Hit grid: downsample the label map to BRAIN_HIT_N² ────────────────────────
const gridChars = [];
for (let gy = 0; gy < BRAIN_HIT_N; gy++) {
  for (let gx = 0; gx < BRAIN_HIT_N; gx++) {
    const cx = Math.min(W - 1, Math.floor((gx + 0.5) / BRAIN_HIT_N * W));
    const cy = Math.min(H - 1, Math.floor((gy + 0.5) / BRAIN_HIT_N * H));
    const lab = label[cy * W + cx];
    gridChars.push(lab >= 0 ? String(lab) : '.');
  }
}
const hitGrid = gridChars.join('');
const opaqueCells = hitGrid.split('').filter(c => c !== '.').length;
console.log(`Hit grid: ${hitGrid.length} cells, ${opaqueCells} opaque`);

// ─── Emit brainRegions.ts ─────────────────────────────────────────────────────
const tsEntries = SECTION_IDS.map(id => {
  const bb = bboxes[id];
  return `  ${id}: { x: ${bb.x}, y: ${bb.y}, w: ${bb.w}, h: ${bb.h} },`;
}).join('\n');

const tsContent = `// AUTO-GENERATED by scripts/place-brain.mjs — do not edit by hand
export const BRAIN_CANVAS = ${W};
export const BRAIN_CANVAS_H = ${H};
export const BRAIN_HIT_N = ${BRAIN_HIT_N};
export const BRAIN_HIT_GRID = "${hitGrid}";

export const BRAIN_REGION_BOXES: Record<string, { x: number; y: number; w: number; h: number }> = {
${tsEntries}
};
`;
fs.writeFileSync(TS_OUT, tsContent);
console.log(`\nWrote ${TS_OUT}`);
console.log('\n═══ SUMMARY ═══');
for (const id of SECTION_IDS) {
  const bb = bboxes[id];
  console.log(`  ${id.padEnd(18)} x=${String(bb.x).padStart(3)} y=${String(bb.y).padStart(3)} w=${String(bb.w).padStart(3)} h=${String(bb.h).padStart(3)}  color=${palette[id]}`);
}
console.log('\nAll done.');
