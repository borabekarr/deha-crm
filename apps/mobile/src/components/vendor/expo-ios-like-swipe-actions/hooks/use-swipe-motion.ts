import { useMemo } from "react";
import { Easing } from "react-native-reanimated";
import {
  IResolvedSwipeTuning,
  ISwipeMotion,
  IUseSwipeMotionParams,
} from "../typings/swipe.interfaces";
import {
  ACTION_CONTENT_TRIGGER_MS,
  CLOSE_VELOCITY,
  COMMIT_OVERSHOOT,
  COMMIT_SNAP_MS,
  COMMIT_TRANSITION_MS,
  ELASTIC_RATIO,
  FULL_SWIPE_EXPANSION_OFFSET,
  FULL_SWIPE_RATIO,
  ICON_TRAVEL_RANGE,
  IOS_SWIPE_EASING_CURVE,
  MIN_OPEN_TRANSLATION,
  RELEASE_TRANSITION_MS,
  VELOCITY_COMMIT,
} from "../utilities/swipe-constants";

function useSwipeMotion({
  motion,
  tuning,
  fullSwipeExpansionOffset,
}: IUseSwipeMotionParams): ISwipeMotion {
  const resolved = useMemo<IResolvedSwipeTuning>(
    () => ({
      easingCurve:
        motion?.easingCurve ?? tuning?.easingCurve ?? IOS_SWIPE_EASING_CURVE,
      releaseDurationMs:
        motion?.releaseDurationMs ??
        tuning?.releaseDurationMs ??
        RELEASE_TRANSITION_MS,
      commitSnapDurationMs:
        motion?.commitSnapDurationMs ??
        tuning?.commitSnapDurationMs ??
        COMMIT_SNAP_MS,
      actionContentDurationMs:
        motion?.actionContentDurationMs ??
        tuning?.actionContentDurationMs ??
        ACTION_CONTENT_TRIGGER_MS,
      iconTravelRange: tuning?.iconTravelRange ?? ICON_TRAVEL_RANGE,
      fullSwipeThreshold: tuning?.fullSwipeThreshold ?? FULL_SWIPE_RATIO,
      commitOvershoot: tuning?.commitOvershoot ?? COMMIT_OVERSHOOT,
      commitDurationMs:
        motion?.commitMorphDurationMs ??
        tuning?.commitDurationMs ??
        COMMIT_TRANSITION_MS,
      fullSwipeExpansionOffset:
        fullSwipeExpansionOffset ??
        tuning?.fullSwipeExpansionOffset ??
        FULL_SWIPE_EXPANSION_OFFSET,
      elasticRatio: tuning?.elasticRatio ?? ELASTIC_RATIO,
      closeVelocity: tuning?.closeVelocity ?? CLOSE_VELOCITY,
      minOpenTranslation:
        tuning?.minOpenTranslation ?? MIN_OPEN_TRANSLATION,
      velocityCommit: tuning?.velocityCommit ?? VELOCITY_COMMIT,
    }),
    [fullSwipeExpansionOffset, motion, tuning],
  );

  const easing = useMemo(
    () =>
      Easing.bezier(
        resolved.easingCurve[0],
        resolved.easingCurve[1],
        resolved.easingCurve[2],
        resolved.easingCurve[3],
      ),
    [resolved.easingCurve],
  );

  const releaseTransition = useMemo(
    () => ({
      duration: resolved.releaseDurationMs,
      easing,
    }),
    [easing, resolved.releaseDurationMs],
  );

  const commitSnapTransition = useMemo(
    () => ({
      duration: resolved.commitSnapDurationMs,
      easing,
    }),
    [easing, resolved.commitSnapDurationMs],
  );

  return {
    tuning: resolved,
    easing,
    releaseTransition,
    commitSnapTransition,
  };
}

export { useSwipeMotion };
