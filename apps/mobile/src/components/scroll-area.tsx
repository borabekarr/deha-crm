import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { ScrollViewProps, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import type { ProgressiveBlurProps } from 'expo-progressive-blur';
import type { ScrollAreaProps } from '@deha/ui-contracts';
import { progressiveBlur } from '../lib/choreography';

// ---------------------------------------------------------------------------
// Animated BlurView
// ---------------------------------------------------------------------------
const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

// Satisfy TS: ProgressiveBlurProps imported for surface compatibility.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ProgressiveBlurCompat = ProgressiveBlurProps;

// ---------------------------------------------------------------------------
// Extended props
// ---------------------------------------------------------------------------
interface ScrollAreaExtendedProps extends ScrollAreaProps {
  progressiveHeader?: boolean | number;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
}

// ---------------------------------------------------------------------------
// Animated ScrollView wrapper type
// ---------------------------------------------------------------------------
type AnimScrollViewProps = ScrollViewProps & {
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
};
const AnimatedScrollView = Animated.createAnimatedComponent(
  ScrollView,
) as React.ComponentType<AnimScrollViewProps>;

// ---------------------------------------------------------------------------
// ScrollArea
// ---------------------------------------------------------------------------
export function ScrollArea({
  progressiveHeader = false,
  reducedMotion,
  style,
  contentContainerStyle,
  horizontal = false,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  children,
}: ScrollAreaExtendedProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const headerHeight =
    typeof progressiveHeader === 'number' ? progressiveHeader : 56;
  const hasProgressiveHeader = Boolean(progressiveHeader);

  const scrollY = useSharedValue(0);
  const blurCalc = progressiveBlur({ reducedMotion: isReduced });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const animatedBlurProps = useAnimatedProps(() => {
    const progress = Math.min(1, scrollY.value / Math.max(1, headerHeight));
    return { intensity: blurCalc(progress) } as { intensity: number };
  });

  return (
    <View style={[styles.root, style]}>
      <AnimatedScrollView
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        horizontal={horizontal}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </AnimatedScrollView>
      {hasProgressiveHeader && (
        <AnimatedBlur
          style={[styles.headerBlur, { height: headerHeight }]}
          animatedProps={animatedBlurProps}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
