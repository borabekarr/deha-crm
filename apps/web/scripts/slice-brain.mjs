/**
 * slice-brain.mjs — pure-Node ESM (node:fs + node:zlib only)
 * Slices apps/web/public/brain-ref/default.png into 9 region PNGs + brainRegions.ts
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..', '..');
const SRC  = path.join(REPO, 'apps/web/public/brain-ref/default.png');
const OUT_DIR = path.join(REPO, 'apps/web/public/brain-ref/regions');
const TS_OUT  = path.join(REPO, 'apps/web/src/components/design-system/leads-table/brainRegions.ts');

fs.mkdirSync(OUT_DIR, { recursive: true });

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

// ─── PNG CHUNK WRITE ──────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const crcInput  = Buffer.concat([typeBytes, data]);
  return Buffer.concat([writeUint32BE(data.length), typeBytes, data, writeUint32BE(crc32(crcInput))]);
}

// ─── PNG DECODE ───────────────────────────────────────────────────────────────
function decodePNG(buf) {
  // skip 8-byte signature
  let pos = 8;
  const idatChunks = [];
  let width = 0, height = 0;

  while (pos < buf.length) {
    const len  = buf.readUInt32BE(pos);     pos += 4;
    const type = buf.slice(pos, pos + 4).toString('ascii'); pos += 4;
    const data = buf.slice(pos, pos + len); pos += len;
    pos += 4; // skip CRC

    if (type === 'IHDR') {
      width  = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitdepth  = data[8];
      const colortype = data[9];
      if (bitdepth !== 8 || colortype !== 2) throw new Error(`Unexpected PNG format: bitdepth=${bitdepth} colortype=${colortype}`);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const compressed = Buffer.concat(idatChunks);
  const raw = zlib.inflateSync(compressed);

  // un-filter scanlines
  const bytesPerPixel = 3; // RGB
  const stride = width * bytesPerPixel;
  const raster = Buffer.alloc(width * height * bytesPerPixel);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filterType = raw[rowStart];
    const srcRow = raw.slice(rowStart + 1, rowStart + 1 + stride);
    const dstRow = raster.slice(y * stride, y * stride + stride);

    // Previous reconstructed row (or zeros for first row)
    const prevRow = y > 0 ? raster.slice((y - 1) * stride, (y - 1) * stride + stride) : null;

    function recon_a(i) { return i >= bytesPerPixel ? dstRow[i - bytesPerPixel] : 0; }
    function recon_b(i) { return prevRow ? prevRow[i] : 0; }
    function recon_c(i) { return (prevRow && i >= bytesPerPixel) ? prevRow[i - bytesPerPixel] : 0; }

    function paeth(a, b, c) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      if (pa <= pb && pa <= pc) return a;
      if (pb <= pc) return b;
      return c;
    }

    for (let i = 0; i < stride; i++) {
      let val;
      switch (filterType) {
        case 0: val = srcRow[i]; break;
        case 1: val = (srcRow[i] + recon_a(i)) & 0xFF; break;
        case 2: val = (srcRow[i] + recon_b(i)) & 0xFF; break;
        case 3: val = (srcRow[i] + Math.floor((recon_a(i) + recon_b(i)) / 2)) & 0xFF; break;
        case 4: val = (srcRow[i] + paeth(recon_a(i), recon_b(i), recon_c(i))) & 0xFF; break;
        default: throw new Error(`Unknown filter type: ${filterType}`);
      }
      dstRow[i] = val;
    }
  }

  return { width, height, raster };
}

// ─── SECTION DEFINITIONS ─────────────────────────────────────────────────────
// 9 sections in 3×3 grid order (row-major): row0=top, row2=bottom
const SECTIONS = [
  { id: 'aspirations',       r: 0xFF, g: 0x6B, b: 0x9D, gridRow: 0, gridCol: 0 },
  { id: 'challenges',        r: 0xFF, g: 0xD4, b: 0x3B, gridRow: 0, gridCol: 1 },
  { id: 'values',            r: 0x38, g: 0xD9, b: 0xA9, gridRow: 0, gridCol: 2 },
  { id: 'fears',             r: 0x82, g: 0xC9, b: 0x1E, gridRow: 1, gridCol: 0 },
  { id: 'preferences',       r: 0x51, g: 0xCF, b: 0x66, gridRow: 1, gridCol: 1 },
  { id: 'dislikes',          r: 0x4D, g: 0xAB, b: 0xF7, gridRow: 1, gridCol: 2 },
  { id: 'influencers',       r: 0x97, g: 0x75, b: 0xFA, gridRow: 2, gridCol: 0 },
  { id: 'keywords',          r: 0xCC, g: 0x5D, b: 0xE8, gridRow: 2, gridCol: 1 },
  { id: 'purchase_factors',  r: 0x84, g: 0x5E, b: 0xF7, gridRow: 2, gridCol: 2 },
];

function colorDist2(r1, g1, b1, r2, g2, b2) {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

// ─── ENCODE RGBA PNG ──────────────────────────────────────────────────────────
function encodeRGBAPNG(width, height, rgbaData) {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8]  = 8;  // bit depth
  ihdrData[9]  = 6;  // color type: RGBA
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace

  // Build raw scanlines (filter byte 0 per row)
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
  const ihdrChunk  = pngChunk('IHDR', ihdrData);
  const idatChunk  = pngChunk('IDAT', compressed);
  const iendChunk  = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([PNG_SIG, ihdrChunk, idatChunk, iendChunk]);
}

// ─── CONNECTED COMPONENTS ────────────────────────────────────────────────────
function largestCC(width, height, mask) {
  // BFS flood fill to find largest connected component in mask (Uint8Array bool)
  const visited = new Uint8Array(width * height);
  let bestLabel = -1;
  let bestSize  = 0;
  const labels  = new Int32Array(width * height).fill(-1);
  let labelCount = 0;

  const queue = new Int32Array(width * height);

  for (let idx = 0; idx < width * height; idx++) {
    if (!mask[idx] || visited[idx]) continue;
    // BFS
    let head = 0, tail = 0;
    queue[tail++] = idx;
    visited[idx]  = 1;
    labels[idx]   = labelCount;
    let size = 0;
    while (head < tail) {
      const cur = queue[head++];
      size++;
      const cx = cur % width;
      const cy = Math.floor(cur / width);
      const neighbors = [
        cy > 0          ? cur - width : -1,
        cy < height - 1 ? cur + width : -1,
        cx > 0          ? cur - 1     : -1,
        cx < width - 1  ? cur + 1     : -1,
      ];
      for (const nb of neighbors) {
        if (nb >= 0 && mask[nb] && !visited[nb]) {
          visited[nb] = 1;
          labels[nb]  = labelCount;
          queue[tail++] = nb;
        }
      }
    }
    if (size > bestSize) { bestSize = size; bestLabel = labelCount; }
    labelCount++;
  }

  // Return mask with only best label
  const result = new Uint8Array(width * height);
  if (bestLabel >= 0) {
    for (let i = 0; i < width * height; i++) {
      if (labels[i] === bestLabel) result[i] = 1;
    }
  }
  return result;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
console.log('Reading', SRC);
const buf = fs.readFileSync(SRC);
const { width, height, raster } = decodePNG(buf);
console.log(`Decoded ${width}x${height} RGB`);

// Background threshold
const BG_THRESH = 235;

// Find brain bounding box (non-background pixels)
let bbMinX = width, bbMinY = height, bbMaxX = 0, bbMaxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const off = (y * width + x) * 3;
    const r = raster[off], g = raster[off + 1], b = raster[off + 2];
    if (!(r >= BG_THRESH && g >= BG_THRESH && b >= BG_THRESH)) {
      if (x < bbMinX) bbMinX = x;
      if (x > bbMaxX) bbMaxX = x;
      if (y < bbMinY) bbMinY = y;
      if (y > bbMaxY) bbMaxY = y;
    }
  }
}
console.log(`Brain bbox: (${bbMinX},${bbMinY}) -> (${bbMaxX},${bbMaxY})`);

const brainW = bbMaxX - bbMinX + 1;
const brainH = bbMaxY - bbMinY + 1;
const cellW  = brainW / 3;
const cellH  = brainH / 3;

// Build section lookup by grid cell (gridRow*3+gridCol -> section index)
const gridToSection = new Array(9);
for (let s = 0; s < SECTIONS.length; s++) {
  const sec = SECTIONS[s];
  gridToSection[sec.gridRow * 3 + sec.gridCol] = s;
}

// Build label map: for each pixel -> section index (-1 if background)
// Primary: spatial grid assignment (grid cell maps 1:1 to section)
// Secondary: for ambiguous border pixels between cells, color distance breaks ties
// Lambda blending: score = colorDist2 * SPATIAL_WEIGHT + gridPenalty * COLOR_WEIGHT
// But since image colors are gradients (not exact section colors), we use PURE SPATIAL:
// each pixel gets the section for the 3x3 cell it falls in.
const labelMap = new Int32Array(width * height).fill(-1);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const off = (y * width + x) * 3;
    const r = raster[off], g = raster[off + 1], b = raster[off + 2];

    // Background check
    if (r >= BG_THRESH && g >= BG_THRESH && b >= BG_THRESH) continue;

    // Determine pixel's grid cell relative to brain bbox
    const localX = x - bbMinX;
    const localY = y - bbMinY;
    const pixelCol = Math.min(2, Math.floor(localX / cellW));
    const pixelRow = Math.min(2, Math.floor(localY / cellH));
    const cellIdx  = pixelRow * 3 + pixelCol;

    labelMap[y * width + x] = gridToSection[cellIdx];
  }
}

// Per-section: find largest CC and emit PNG
const bboxes = {};

for (let s = 0; s < SECTIONS.length; s++) {
  const sec = SECTIONS[s];
  console.log(`Processing section: ${sec.id}`);

  // Build section mask
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    mask[i] = labelMap[i] === s ? 1 : 0;
  }

  // Keep only largest connected component
  const ccMask = largestCC(width, height, mask);

  // Compute tight bbox
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasPixels = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (ccMask[y * width + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasPixels = true;
      }
    }
  }

  if (!hasPixels) {
    console.warn(`  WARNING: no pixels for ${sec.id}`);
    bboxes[sec.id] = { x: 0, y: 0, w: 0, h: 0 };
    continue;
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  bboxes[sec.id] = { x: minX, y: minY, w: cropW, h: cropH };
  console.log(`  bbox: (${minX},${minY}) ${cropW}x${cropH}`);

  // Build RGBA crop
  const rgba = Buffer.alloc(cropW * cropH * 4, 0);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (ccMask[y * width + x]) {
        const srcOff  = (y * width + x) * 3;
        const dstOff  = ((y - minY) * cropW + (x - minX)) * 4;
        rgba[dstOff]     = raster[srcOff];
        rgba[dstOff + 1] = raster[srcOff + 1];
        rgba[dstOff + 2] = raster[srcOff + 2];
        rgba[dstOff + 3] = 255;
      }
    }
  }

  const pngBuf = encodeRGBAPNG(cropW, cropH, rgba);
  const outPath = path.join(OUT_DIR, `region-${sec.id}.png`);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`  wrote ${outPath} (${pngBuf.length} bytes)`);
}

// ─── Emit brainRegions.ts ─────────────────────────────────────────────────────
const tsEntries = SECTIONS.map(sec => {
  const bb = bboxes[sec.id];
  return `  ${sec.id}: { x: ${bb.x}, y: ${bb.y}, w: ${bb.w}, h: ${bb.h} },`;
}).join('\n');

const tsContent = `// AUTO-GENERATED by scripts/slice-brain.mjs — do not edit by hand
export const BRAIN_CANVAS = ${width};

export const BRAIN_REGION_BOXES: Record<string, { x: number; y: number; w: number; h: number }> = {
${tsEntries}
};
`;

fs.writeFileSync(TS_OUT, tsContent);
console.log(`\nWrote ${TS_OUT}`);
console.log('\nAll done.');
