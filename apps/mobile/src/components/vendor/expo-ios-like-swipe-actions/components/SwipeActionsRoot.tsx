import React, {
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
} from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SwipeActionsContext } from "../context/swipe-actions-context";
import { useSwipeMotion } from "../hooks/use-swipe-motion";
import type {
  ISwipeAction,
  ISwipeActionPressContext,
  ISwipeActionsRootHandle,
  ISwipeActionsRootProps,
} from "../typings/swipe.interfaces";
import { getSwipeChildren } from "../utilities/swipe-children";
import { PROJECTION_COEF } from "../utilities/swipe-constants";
import {
  commitThreshold,
  getDominantAction,
  shapeTranslation,
} from "../utilities/swipe-math";
import { SwipeActionsLayer } from "./SwipeActionsLayer";

const SwipeActionsRootRender: React.ForwardRefRenderFunction<
  ISwipeActionsRootHandle,
  ISwipeActionsRootProps
> = (
  {
    children,
    actionWidth = 128,
    fullSwipeEnabled = false,
    fullSwipeExpansionOffset,
    onOpen,
    onClose,
    onHapticCue,
    motion,
    tuning,
    style,
  },
  ref,
) => {
  const id = useId();
  const registry = useContext(SwipeActionsContext);
  const {
    tuning: resolvedTuning,
    easing,
    releaseTransition,
    commitSnapTransition,
  } = useSwipeMotion({
    motion,
    tuning,
    fullSwipeExpansionOffset,
  });

  const translateX = useSharedValue(0);
  const cellWidth = useSharedValue(0);
  const startX = useSharedValue(0);
  const isOpen = useSharedValue<0 | 1>(0);
  const hasCrossedReveal = useSharedValue(0);
  const hasCrossedCommit = useSharedValue(0);

  const parsedChildren = useMemo(() => getSwipeChildren(children), [children]);
  const { mainChildren, leftActions, rightActions } = parsedChildren;

  const leftWidth = leftActions.length * actionWidth;
  const rightWidth = rightActions.length * actionWidth;
  const leftDominantDestructive = useSharedValue(
    leftActions[0]?.destructive === true,
  );
  const rightDominantDestructive = useSharedValue(
    rightActions[rightActions.length - 1]?.destructive === true,
  );

  useEffect(() => {
    leftDominantDestructive.value = leftActions[0]?.destructive === true;
    rightDominantDestructive.value =
      rightActions[rightActions.length - 1]?.destructive === true;
  }, [
    leftActions,
    rightActions,
    leftDominantDestructive,
    rightDominantDestructive,
  ]);

  const closeRow = useCallback(
    (animated = true) => {
      cancelAnimation(translateX);
      if (animated) {
        translateX.value = withTiming(0, releaseTransition);
      } else {
        translateX.value = 0;
      }
      isOpen.value = 0;
      hasCrossedReveal.value = 0;
      hasCrossedCommit.value = 0;
    },
    [translateX, releaseTransition, isOpen, hasCrossedReveal, hasCrossedCommit],
  );

  const openRow = useCallback(
    (side: "left" | "right") => {
      cancelAnimation(translateX);
      const target = side === "left" ? leftWidth : -rightWidth;
      translateX.value = withTiming(target, releaseTransition);
      isOpen.value = 1;
    },
    [translateX, releaseTransition, isOpen, leftWidth, rightWidth],
  );

  useImperativeHandle(ref, () => ({ close: closeRow, open: openRow }), [
    closeRow,
    openRow,
  ]);

  useEffect(() => {
    if (!registry) return;
    registry.register(id, () => closeRow(true));
    return () => registry.unregister(id);
  }, [registry, id, closeRow]);

  const handleOpened = useCallback(
    (side: "left" | "right") => {
      registry?.notifyOpen(id);
      onOpen?.(side);
    },
    [onOpen, registry, id],
  );

  const handleClosed = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleCommitted = useCallback(
    (side: "left" | "right") => {
      const dominant = getDominantAction(side, leftActions, rightActions);
      if (dominant) {
        dominant.onPress();
      }
    },
    [leftActions, rightActions],
  );

  const handleBounceCommit = useCallback(
    (side: "left" | "right") => {
      handleCommitted(side);
      handleClosed();
    },
    [handleCommitted, handleClosed],
  );

  const handleHaptic = useCallback(
    (kind: "reveal" | "commit") => {
      onHapticCue?.(kind);
    },
    [onHapticCue],
  );

  const handleInteractionStart = useCallback(() => {
    registry?.closeActive(id);
  }, [registry, id]);

  const handleRowTouchStart = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
  }, []);

  const handleForegroundPressIn = useCallback(() => {
    registry?.closeActive(id);
  }, [registry, id]);

  const handleForegroundPress = useCallback(() => {
    if (Math.abs(translateX.value) > 0.5) {
      closeRow(true);
    }
  }, [closeRow, translateX]);

  const getCommitTarget = useCallback(
    (side: "left" | "right") => {
      const cellTarget = cellWidth.value > 0 ? cellWidth.value : 0;
      const limit = side === "left" ? leftWidth : rightWidth;
      const expansionTarget = limit + resolvedTuning.fullSwipeExpansionOffset;
      const target = Math.max(cellTarget, expansionTarget);
      return side === "left" ? target : -target;
    },
    [cellWidth, leftWidth, rightWidth, resolvedTuning.fullSwipeExpansionOffset],
  );

  const handleActionPress = useCallback(
    (action: ISwipeAction, context: ISwipeActionPressContext) => {
      if (action.destructive && context.isDominant) {
        const target = getCommitTarget(context.side);
        cancelAnimation(translateX);
        translateX.value = withTiming(
          target,
          commitSnapTransition,
          (finished) => {
            if (!finished) return;
            scheduleOnRN(handleCommitted, context.side);
          },
        );
        isOpen.value = 1;
        hasCrossedReveal.value = 0;
        hasCrossedCommit.value = 0;
        return;
      }

      if (action.destructive) {
        action.onPress();
        return;
      }

      closeRow(true);
      setTimeout(() => {
        action.onPress();
        handleClosed();
      }, resolvedTuning.releaseDurationMs);
    },
    [
      closeRow,
      commitSnapTransition,
      getCommitTarget,
      handleClosed,
      handleCommitted,
      hasCrossedCommit,
      hasCrossedReveal,
      isOpen,
      resolvedTuning.releaseDurationMs,
      translateX,
    ],
  );

  const pan = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-12, 12])
      .failOffsetY([-12, 12])
      .onStart(() => {
        scheduleOnRN(handleInteractionStart);
        cancelAnimation(translateX);
        startX.value = translateX.value;
      })
      .onUpdate((event) => {
        const raw = startX.value + event.translationX;
        const cw = cellWidth.value > 0 ? cellWidth.value : 1;
        const limit =
          raw >= 0 ?
            leftActions.length > 0 ?
              leftWidth
            : 0
          : rightActions.length > 0 ? rightWidth
          : 0;
        const shaped = shapeTranslation(
          raw,
          limit,
          cw,
          fullSwipeEnabled,
          resolvedTuning.elasticRatio,
        );
        translateX.value = shaped;

        const abs = shaped < 0 ? -shaped : shaped;
        if (limit > 0 && abs >= limit) {
          if (hasCrossedReveal.value === 0) {
            hasCrossedReveal.value = 1;
            scheduleOnRN(handleHaptic, "reveal");
          }
        } else if (hasCrossedReveal.value === 1 && abs < limit * 0.88) {
          hasCrossedReveal.value = 0;
        }

        if (fullSwipeEnabled && limit > 0) {
          const commitAt = commitThreshold(
            limit,
            cw,
            resolvedTuning.commitOvershoot,
            resolvedTuning.fullSwipeThreshold,
            resolvedTuning.fullSwipeExpansionOffset,
          );
          if (abs >= commitAt) {
            if (hasCrossedCommit.value === 0) {
              hasCrossedCommit.value = 1;
              scheduleOnRN(handleHaptic, "commit");
            }
          } else if (hasCrossedCommit.value === 1 && abs < commitAt - 12) {
            hasCrossedCommit.value = 0;
          }
        }
      })
      .onEnd((event) => {
        const pos = translateX.value;
        const vx = event.velocityX;
        const cw = cellWidth.value > 0 ? cellWidth.value : 0;
        const side: "left" | "right" = pos >= 0 ? "left" : "right";
        const actionsLen =
          side === "left" ? leftActions.length : rightActions.length;
        const limit = side === "left" ? leftWidth : rightWidth;
        const absPos = pos < 0 ? -pos : pos;

        if (actionsLen === 0 || limit === 0 || cw === 0) {
          translateX.value = withTiming(0, releaseTransition);
          isOpen.value = 0;
          return;
        }

        const closingSign = side === "left" ? -1 : 1;
        const closingVelocity = vx * closingSign > resolvedTuning.closeVelocity;
        const absProj =
          absPos +
          (vx * closingSign < 0 ? -vx * closingSign * PROJECTION_COEF : 0);
        const commitAt = commitThreshold(
          limit,
          cw,
          resolvedTuning.commitOvershoot,
          resolvedTuning.fullSwipeThreshold,
          resolvedTuning.fullSwipeExpansionOffset,
        );
        const wantsCommit =
          fullSwipeEnabled &&
          !closingVelocity &&
          (absPos >= commitAt ||
            absProj >= commitAt ||
            (vx * closingSign < -resolvedTuning.velocityCommit &&
              absPos >= limit));

        if (wantsCommit) {
          const target =
            side === "left" ?
              Math.max(cw, limit + resolvedTuning.fullSwipeExpansionOffset)
            : -Math.max(cw, limit + resolvedTuning.fullSwipeExpansionOffset);
          const shouldStayCommitted =
            side === "left" ?
              leftDominantDestructive.value
            : rightDominantDestructive.value;

          if (!shouldStayCommitted) {
            translateX.value = withTiming(0, releaseTransition, (finished) => {
              if (!finished) return;
              scheduleOnRN(handleBounceCommit, side);
            });
            isOpen.value = 0;
            hasCrossedReveal.value = 0;
            hasCrossedCommit.value = 0;
            return;
          }

          translateX.value = withTiming(
            target,
            commitSnapTransition,
            (finished) => {
              if (!finished) return;
              scheduleOnRN(handleCommitted, side);
            },
          );
          isOpen.value = 1;
          hasCrossedReveal.value = 0;
          hasCrossedCommit.value = 0;
          return;
        }

        const shouldOpen =
          absPos >= resolvedTuning.minOpenTranslation && !closingVelocity;

        if (shouldOpen) {
          const target = side === "left" ? limit : -limit;
          translateX.value = withTiming(target, releaseTransition);
          isOpen.value = 1;
          scheduleOnRN(handleOpened, side);
        } else {
          translateX.value = withTiming(0, releaseTransition);
          isOpen.value = 0;
          scheduleOnRN(handleClosed);
        }

        hasCrossedReveal.value = 0;
        hasCrossedCommit.value = 0;
      });
  }, [
    translateX,
    startX,
    cellWidth,
    hasCrossedReveal,
    hasCrossedCommit,
    isOpen,
    leftActions,
    rightActions,
    leftWidth,
    rightWidth,
    leftDominantDestructive,
    rightDominantDestructive,
    releaseTransition,
    commitSnapTransition,
    fullSwipeEnabled,
    handleInteractionStart,
    handleOpened,
    handleClosed,
    handleCommitted,
    handleBounceCommit,
    handleHaptic,
    resolvedTuning,
  ]);

  const foregroundStyle = useAnimatedStyle<
    Required<Pick<ViewStyle, "transform">>
  >(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    cellWidth.value = event.nativeEvent.layout.width;
  };

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.container, style]}
        onLayout={onLayout}
        onTouchStart={handleRowTouchStart}
      >
        {leftActions.length > 0 && (
          <SwipeActionsLayer
            side="left"
            actions={leftActions}
            actionWidth={actionWidth}
            translateX={translateX}
            cellWidth={cellWidth}
            fullSwipeEnabled={fullSwipeEnabled}
            tuning={resolvedTuning}
            easing={easing}
            onActionPress={handleActionPress}
          />
        )}
        {rightActions.length > 0 && (
          <SwipeActionsLayer
            side="right"
            actions={rightActions}
            actionWidth={actionWidth}
            translateX={translateX}
            cellWidth={cellWidth}
            fullSwipeEnabled={fullSwipeEnabled}
            tuning={resolvedTuning}
            easing={easing}
            onActionPress={handleActionPress}
          />
        )}
        <Animated.View style={[styles.foreground, foregroundStyle]}>
          <Pressable
            onPressIn={handleForegroundPressIn}
            onPress={handleForegroundPress}
            style={styles.foregroundPressable}
          >
            {mainChildren}
          </Pressable>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const SwipeActionsRoot = memo(
  forwardRef<ISwipeActionsRootHandle, ISwipeActionsRootProps>(
    SwipeActionsRootRender,
  ),
);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "white",
  },
  foreground: {
    backgroundColor: "white",
  },
  foregroundPressable: {
    alignSelf: "stretch",
  },
});

export { SwipeActionsRoot };
export default SwipeActionsRoot;
