import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { AnimatedChipProps } from "./Chip.types";

export const AnimatedChip = ({
  label,
  icon,
  isActive,
  onPress,
  activeColor,
  labelColor,
  inActiveBackgroundColor,
}: AnimatedChipProps) => {
  const progress = useSharedValue<number>(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring<number>(isActive ? 1 : 0, {});
  }, [isActive, progress]);

  const animatedContainerStyle = useAnimatedStyle<
    Required<
      Partial<
        Pick<ViewStyle, "width" | "paddingHorizontal" | "backgroundColor">
      >
    >
  >(() => {
    return {
      width: withSpring<number>(isActive ? 160 : 50, {}),
      paddingHorizontal: 12,
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [inActiveBackgroundColor ?? "#333333", activeColor!],
      ),
    };
  });

  const animatedContentStyle = useAnimatedStyle<
    Partial<Required<Pick<ViewStyle, "transform">>>
  >(() => {
    return {
      transform: [
        {
          scale: withTiming(isActive ? 1 : 0.98, {
            duration: 260,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  });

  const animatedTextStyle = useAnimatedStyle<
    Required<
      Partial<Pick<ViewStyle, "opacity" | "transform" | "width" | "marginLeft">>
    >
  >(() => {
    return {
      opacity: withTiming<number>(isActive ? 1 : 0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      width: withTiming(isActive ? 82 : 0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      marginLeft: withTiming(isActive ? 10 : 0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      transform: [
        {
          translateX: withTiming(isActive ? 0 : -8, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
        {
          scale: withTiming(isActive ? 1 : 0.85, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  });

  const iconStyle = useAnimatedStyle<
    Partial<Required<Pick<ViewStyle, "transform" | "marginLeft">>>
  >(() => {
    return {
      transform: [
        {
          scale: withTiming(isActive ? 1 : 0.96, {
            duration: 260,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
      marginLeft: withTiming(isActive ? 10 : 0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    };
  });

  const handlePress = () => {
    impactAsync(ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.chip, animatedContainerStyle]}>
        <Animated.View
          style={[styles.content, animatedContentStyle]}
          pointerEvents="none"
        >
          <Animated.View style={[styles.iconWrapper, iconStyle]}>
            {icon()}
          </Animated.View>
          <Animated.View
            style={[styles.labelWrapper, animatedTextStyle]}
            pointerEvents={isActive ? "auto" : "none"}
          >
            <Animated.Text
              style={[styles.label, { color: labelColor ?? "#FFFFFF" }]}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  chip: {
    height: 40,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  labelWrapper: {
    overflow: "hidden",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
