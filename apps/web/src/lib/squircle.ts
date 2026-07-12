// squircle.ts -- Apple/Figma-style corner-smoothed rounded-rect path generator.
//
// Ported from the corner-smoothing skill reference:
// .agents/skills/gabrielobholz-corner-smoothing/references/implementation.md
// Two branches, exactly as the reference specifies:
//   - smoothing <= 0.001: exact circular corner, one cubic bezier per corner
//     (kappa = 0.5522847498307936, the standard circle-via-bezier constant).
//   - smoothing > 0.001: superellipse corner (exponent = 2 + smoothing * 3.35),
//     sampled at 22 line segments per corner -- the Apple/Figma "squircle" curve.
// Reversal and ring composition are built generically on top of both branches
// (segment list -> reversed segment list) rather than re-deriving math per case.
//
// Formula note: the concentric/ring radius is the parallel-curve offset of the
// corner -- inner radius = max(outerRadius - inset, 0) -- the same offset used
// for a plain circular corner, applied identically here since inner and outer
// corners share the same corner-center construction.
//
// Rollout note: any card carrying a real (non-inset) box-shadow must move that
// shadow to `filter: drop-shadow(...)` before adopting clip-path -- box-shadow
// is clipped away by clip-path, drop-shadow follows the clipped silhouette.

type Point = [number, number];
type Segment = { type: 'L'; to: Point } | { type: 'C'; c1: Point; c2: Point; to: Point };
interface Shape {
  start: Point;
  segments: Segment[];
}

const STEPS_PER_CORNER = 22;
const KAPPA = 0.5522847498307936;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function round(v: number): number {
  return +v.toFixed(3);
}

function rectShape(w: number, h: number): Shape {
  return {
    start: [0, 0],
    segments: [
      { type: 'L', to: [w, 0] },
      { type: 'L', to: [w, h] },
      { type: 'L', to: [0, h] },
    ],
  };
}

function circularCornerShape(w: number, h: number, r: number): Shape {
  const c = r * KAPPA;
  return {
    start: [r, 0],
    segments: [
      { type: 'L', to: [w - r, 0] },
      { type: 'C', c1: [w - r + c, 0], c2: [w, r - c], to: [w, r] },
      { type: 'L', to: [w, h - r] },
      { type: 'C', c1: [w, h - r + c], c2: [w - r + c, h], to: [w - r, h] },
      { type: 'L', to: [r, h] },
      { type: 'C', c1: [r - c, h], c2: [0, h - r + c], to: [0, h - r] },
      { type: 'L', to: [0, r] },
      { type: 'C', c1: [0, r - c], c2: [r - c, 0], to: [r, 0] },
    ],
  };
}

function superellipseCornerPoints(
  cx: number,
  cy: number,
  r: number,
  exponent: number,
  a0: number,
  a1: number
): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= STEPS_PER_CORNER; i += 1) {
    const a = a0 + (a1 - a0) * (i / STEPS_PER_CORNER);
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const x = cx + r * Math.sign(cos) * Math.abs(cos) ** (2 / exponent);
    const y = cy + r * Math.sign(sin) * Math.abs(sin) ** (2 / exponent);
    pts.push([round(x), round(y)]);
  }
  return pts;
}

function superellipseShape(w: number, h: number, r: number, smoothing: number): Shape {
  const exponent = 2 + smoothing * 3.35;
  const raw: Point[] = [];
  raw.push([r, 0], [w - r, 0]);
  raw.push(...superellipseCornerPoints(w - r, r, r, exponent, -Math.PI / 2, 0));
  raw.push([w, h - r]);
  raw.push(...superellipseCornerPoints(w - r, h - r, r, exponent, 0, Math.PI / 2));
  raw.push([r, h]);
  raw.push(...superellipseCornerPoints(r, h - r, r, exponent, Math.PI / 2, Math.PI));
  raw.push([0, r]);
  raw.push(...superellipseCornerPoints(r, r, r, exponent, Math.PI, Math.PI * 1.5));

  const deduped = raw.filter((point, index, all) => {
    if (index === 0) return true;
    const prev = all[index - 1];
    return point[0] !== prev[0] || point[1] !== prev[1];
  });

  return {
    start: deduped[0] ?? [r, 0],
    segments: deduped.slice(1).map((to) => ({ type: 'L', to }) as Segment),
  };
}

function buildShape(width: number, height: number, radius: number, smoothing: number): Shape {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  if (!w || !h) return { start: [0, 0], segments: [] };

  const r = clamp(radius, 0, Math.min(w, h) / 2);
  if (!r) return rectShape(w, h);

  const s = clamp(smoothing, 0, 1);
  if (s <= 0.001) return circularCornerShape(w, h, r);
  return superellipseShape(w, h, r, s);
}

// Generic winding-order reversal: walk the anchor list backwards, swapping
// each cubic segment's control-point order. Works for either branch above.
function reverseShape(shape: Shape): Shape {
  const { start, segments } = shape;
  if (segments.length === 0) return shape;

  const anchors: Point[] = [start, ...segments.map((seg) => seg.to)];
  const n = segments.length;
  const reversed: Segment[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const seg = segments[i];
    const to = anchors[i];
    reversed.push(seg.type === 'L' ? { type: 'L', to } : { type: 'C', c1: seg.c2, c2: seg.c1, to });
  }
  return { start: anchors[n], segments: reversed };
}

function shapeToPath(shape: Shape, origin: Point = [0, 0]): string {
  if (shape.segments.length === 0) return '';
  const [ox, oy] = origin;
  const fmt = ([x, y]: Point) => `${round(x + ox)} ${round(y + oy)}`;
  let d = `M${fmt(shape.start)}`;
  for (const seg of shape.segments) {
    d += seg.type === 'L' ? `L${fmt(seg.to)}` : `C${fmt(seg.c1)} ${fmt(seg.c2)} ${fmt(seg.to)}`;
  }
  return `${d}Z`;
}

/** Corner-smoothed rounded-rect outline, forward winding. */
export function squirclePath(width: number, height: number, radius: number, smoothing = 0.6): string {
  return shapeToPath(buildShape(width, height, radius, smoothing));
}

/** Same outline as squirclePath, opposite winding -- for nonzero-rule ring composition. */
export function squirclePathReversed(width: number, height: number, radius: number, smoothing = 0.6): string {
  return shapeToPath(reverseShape(buildShape(width, height, radius, smoothing)));
}

/** Parallel-curve offset of a corner radius: inner = max(outer - inset, 0). */
export function concentricRadius(outer: number, inset: number, min = 0): number {
  return Math.max(outer - inset, min);
}

/**
 * Outer path (forward winding) + reversed inner path, inset by `inset` on all
 * sides with a concentric radius -- a single nonzero-fill-rule path that
 * renders as a ring (no evenodd dependency).
 * `origin` shifts both boundaries together, for composing a ring that itself
 * sits inset within a larger box (e.g. a hairline ring starting 1px in).
 */
export function squircleRingPath(
  width: number,
  height: number,
  radius: number,
  inset: number,
  smoothing = 0.6,
  origin: Point = [0, 0]
): string {
  const outer = shapeToPath(buildShape(width, height, radius, smoothing), origin);
  const innerW = Math.max(0, width - inset * 2);
  const innerH = Math.max(0, height - inset * 2);
  const innerR = concentricRadius(radius, inset);
  const inner = shapeToPath(reverseShape(buildShape(innerW, innerH, innerR, smoothing)), [
    origin[0] + inset,
    origin[1] + inset,
  ]);
  return inner ? `${outer} ${inner}` : outer;
}
