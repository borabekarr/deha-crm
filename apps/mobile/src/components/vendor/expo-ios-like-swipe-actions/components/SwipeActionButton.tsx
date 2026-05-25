import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { ISwipeActionButtonProps } from "../typings/swipe.interfaces";

const SwipeActionButton: React.FC<ISwipeActionButtonProps> &
  React.MemoExoticComponent<React.FC<ISwipeActionButtonProps>> = memo(
  ({
    action,
    side,
    isDominant,
    actionWidth,
    total,
    translateX,
    cellWidth,
    fullSwipeEnabled,
    commitTransition,
    actionContentTriggerProgress,
    onActionPress,
  }: ISwipeActionButtonProps) => {
    const overlapWidth = 1;

    const BASE_W = actionWidth + overlapWidth;

    const outerStyle = useAnimatedStyle(() => {
      const raw = side === "left" ? translateX.value : -translateX.value;
      const visibleW = Math.max(0, raw);
      const layerW = Math.max(total, visibleW);
      const extraW = Math.max(0, layerW - total);

      if (!fullSwipeEnabled) {
        const targetW = (isDominant ? actionWidth + extraW : actionWidth) + overlapWidth;
        const ratio = BASE_W > 0 ? targetW / BASE_W : 1;
        return {
          transform: [{ scaleX: ratio }],
          transformOrigin: side === "left" ? "left center" : "right center",
          opacity: 1,
        };
      }

      const p = commitTransition.value;
      if (isDominant) {
        const restingW = actionWidth + extraW;
        const targetW = restingW + (layerW - restingW) * p + overlapWidth;
        const ratio = BASE_W > 0 ? targetW / BASE_W : 1;
        return {
          transform: [{ scaleX: ratio }],
          transformOrigin: side === "left" ? "left center" : "right center",
          opacity: 1,
        };
      }

      const targetW = actionWidth * (1 - p) + overlapWidth;
      const ratio = BASE_W > 0 ? targetW / BASE_W : 1;
      return {
        transform: [{ scaleX: ratio }],
        transformOrigin: side === "left" ? "left center" : "right center",
        opacity: 1 - p,
      };
    });

    const contentStyle = useAnimatedStyle(() => {
      if (!fullSwipeEnabled) return { transform: [{ scale: 1 }] };

      if (isDominant) {
        const cw = cellWidth.value || 0;
        const raw = side === "left" ? translateX.value : -translateX.value;
        const visibleW = Math.max(0, raw);
        const travelW = cw > 0 ? Math.min(visibleW, cw) : visibleW;
        const targetShift = Math.max(0, travelW - actionWidth);
        const magnitude = targetShift * actionContentTriggerProgress.value;
        const tx = side === "right" ? -magnitude : magnitude;
        return { transform: [{ translateX: tx }, { scale: 1 }] };
      }

      const p = commitTransition.value;
      const s = interpolate(p, [0, 1], [1, 0.65], Extrapolation.CLAMP);
      return { transform: [{ scale: s }] };
    });

    const innerAlign =
      side === "left" ?
        isDominant ? styles.alignStart
        : styles.alignCenter
      : isDominant ? styles.alignEnd
      : styles.alignCenter;

    return (
      <Animated.View style={[styles.actionButton, action.style, { width: BASE_W }, outerStyle]}>
        <Pressable
          onPress={() => onActionPress(action, { side, isDominant })}
          style={styles.pressable}
        >
          <View
            style={[styles.actionInner, { width: actionWidth }, innerAlign]}
          >
            <Animated.View style={[styles.actionContent, contentStyle]}>
              {action.children}
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>
    );
  },
);

const SwipeActionButtonMemo = React.memo(SwipeActionButton);
SwipeActionButtonMemo.displayName = "SwipeActionButton";

const styles = StyleSheet.create({
  actionButton: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: -1,
  },
  pressable: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "stretch",
  },
  actionInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionContent: {
    alignSelf: "stretch",
  },
  alignStart: {
    alignSelf: "flex-start",
  },
  alignCenter: {
    alignSelf: "center",
  },
  alignEnd: {
    alignSelf: "flex-end",
  },
});

export { SwipeActionButtonMemo as SwipeActionButton };
export default SwipeActionButtonMemo;
