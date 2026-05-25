import type { ISwipeAction } from "../typings/swipe.interfaces";
import { FULL_SWIPE_RESISTANCE, RUBBER_COEF } from "./swipe-constants";

function rubberBand(overflow: number, dim: number, c = RUBBER_COEF) {
  "worklet";
  if (overflow <= 0 || dim <= 0) return 0;
  return (1 - 1 / ((overflow * c) / dim + 1)) * dim;
}

function shapeTranslation(
  raw: number,
  limit: number,
  cellWidth: number,
  fullSwipe: boolean,
  elasticRatio: number,
) {
  "worklet";
  if (raw === 0) return 0;
  const sign = raw < 0 ? -1 : 1;
  const abs = raw < 0 ? -raw : raw;
  const cw = cellWidth > 0 ? cellWidth : 1;

  if (limit <= 0) {
    return sign * rubberBand(abs, cw);
  }

  if (abs <= limit) {
    return raw;
  }

  const overflow = abs - limit;

  if (fullSwipe) {
    if (abs <= cw) {
      const remaining = Math.max(cw - limit, 1);
      const progress = Math.min(1, overflow / remaining);
      const easedProgress =
        progress *
        (FULL_SWIPE_RESISTANCE + (1 - FULL_SWIPE_RESISTANCE) * progress);
      return sign * (limit + remaining * easedProgress);
    }

    const pastCw = abs - cw;
    const refDim = cw * 0.25;
    return sign * (cw + rubberBand(pastCw, refDim));
  }

  const elasticPeak = limit + (cw - limit) * elasticRatio;

  if (abs <= cw) {
    return sign * (limit + overflow * elasticRatio);
  }

  const refDim = Math.max(cw - elasticPeak, cw * 0.2);
  const pastCw = abs - cw;
  return sign * (elasticPeak + rubberBand(pastCw, refDim));
}

function commitThreshold(
  limit: number,
  cw: number,
  overshoot: number,
  ratio: number,
  expansionOffset?: number,
) {
  "worklet";
  const ratioPoint = cw * ratio;
  const offsetPoint =
    expansionOffset === undefined ? ratioPoint : limit + expansionOffset;
  return Math.max(limit + overshoot, Math.min(ratioPoint, offsetPoint));
}

function getDominantAction(
  side: "left" | "right",
  leftActions: ISwipeAction[],
  rightActions: ISwipeAction[],
) {
  const actions = side === "left" ? leftActions : rightActions;
  return side === "left" ? actions[0] : actions[actions.length - 1];
}

export { commitThreshold, getDominantAction, rubberBand, shapeTranslation };
