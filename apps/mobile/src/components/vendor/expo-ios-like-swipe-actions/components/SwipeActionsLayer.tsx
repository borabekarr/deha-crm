import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ISwipeActionsLayerProps } from "../typings/swipe.interfaces";
import { SwipeActionButton } from "./SwipeActionButton";

const SwipeActionsLayer: React.FC<ISwipeActionsLayerProps> = ({
  side,
  actions,
  actionWidth,
  translateX,
  cellWidth,
  fullSwipeEnabled,
  tuning,
  easing,
  onActionPress,
}) => {
  const total = actions.length * actionWidth;
  const commitTransition = useSharedValue(0);
  const actionContentTriggerProgress = useSharedValue(0);

  const layerStyle = useAnimatedStyle(() => {
    const raw = side === "left" ? translateX.value : -translateX.value;
    const visible = Math.max(0, raw);
    return {
      width: Math.ceil(Math.max(total, visible)),
      opacity: raw > 0 ? 1 : 0,
    };
  });

  useAnimatedReaction(
    () => {
      if (!fullSwipeEnabled) return 0;
      const raw = side === "left" ? translateX.value : -translateX.value;
      if (raw <= 0) return 0;
      const expansionAt = total + tuning.fullSwipeExpansionOffset;
      return raw >= expansionAt ? 1 : 0;
    },
    (curr, prev) => {
      if (prev === null || curr === prev) return;
      commitTransition.value = withTiming(curr, {
        duration: tuning.commitDurationMs,
        easing,
      });
      actionContentTriggerProgress.value = withTiming(curr, {
        duration: tuning.actionContentDurationMs,
        easing,
      });
    },
  );

  const dominantIndex = side === "left" ? 0 : actions.length - 1;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.actionsLayer,
        side === "left" ? styles.left : styles.right,
        layerStyle,
      ]}
    >
      {actions.map((action, index) => (
        <SwipeActionButton
          key={action.key}
          action={action}
          side={side}
          isDominant={index === dominantIndex}
          actionWidth={actionWidth}
          total={total}
          translateX={translateX}
          cellWidth={cellWidth}
          fullSwipeEnabled={fullSwipeEnabled}
          commitTransition={commitTransition}
          actionContentTriggerProgress={actionContentTriggerProgress}
          onActionPress={onActionPress}
        />
      ))}
    </Animated.View>
  );
};

const SwipeActionsLayerMemo = React.memo(SwipeActionsLayer);
SwipeActionsLayerMemo.displayName = "SwipeActionsLayer";

const styles = StyleSheet.create({
  actionsLayer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    flexDirection: "row",
    overflow: "hidden",
  },
  left: {
    left: 0,
    justifyContent: "flex-start",
  },
  right: {
    right: 0,
    justifyContent: "flex-end",
  },
});

export { SwipeActionsLayerMemo as SwipeActionsLayer };
export default SwipeActionsLayerMemo;
