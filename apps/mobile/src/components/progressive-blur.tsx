/**
 * ProgressiveBlur — scroll-progress-driven blur overlay.
 *
 * Wraps `expo-progressive-blur` (vendored stub; native EAS build pending).
 * Falls back to expo-blur's BlurView driven by useAnimatedProps, interpolating
 * scrollProgress (0..1) → blur intensity via the progressiveBlur() helper from
 * choreography.
 *
 * API:
 *   <ProgressiveBlur scrollProgress={0..1} style={...} />
 */
import { BlurView } from 'expo-blur';
import React, { useCallback } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { progressiveBlur } from '../lib/choreography';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// ---------------------------------------------------------------------------
// Vendor loader — expo-progressive-blur (native stub; may throw at runtime)
// ---------------------------------------------------------------------------
type VendorProgressiveBlurProps = {
  children?: React.ReactNode;
  intensity?: number;
  style?: object;
};
type VendorProgressiveBlur = React.ComponentType<VendorProgressiveBlurProps>;

function loadVendor(): VendorProgressiveBlur | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-progressive-blur') as {
      ProgressiveBlur?: VendorProgressiveBlur;
      default?: VendorProgressiveBlur;
    };
    return mod.ProgressiveBlur ?? mod.default ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface ProgressiveBlurProps {
  /** 0 = fully transparent, 1 = fully blurred */
  scrollProgress: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Maximum blur intensity (0..100). Default: 40. */
  maxIntensity?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ProgressiveBlur({
  scrollProgress,
  children,
  style,
  maxIntensity = 40,
}: ProgressiveBlurProps) {
  const osReduced = useReducedMotion();

  // progressiveBlur returns a plain object with an `intensity` interpolator.
  // We use useSharedValue to drive BlurView intensity via useAnimatedProps.
  const intensityVal = useSharedValue(0);

  // Derive target intensity from scrollProgress using choreography helper.
  const resolveIntensity = useCallback((): number => {
    const cfg = progressiveBlur({ reducedMotion: osReduced ?? false });
    // cfg.intensity is a function: (progress: number) => number (0..100 scale)
    if (typeof cfg === 'function') return cfg(scrollProgress) * maxIntensity;
    if (typeof cfg === 'object' && cfg !== null && 'intensity' in cfg) {
      const intensityFn = (cfg as { intensity: (p: number) => number }).intensity;
      if (typeof intensityFn === 'function') return intensityFn(scrollProgress) * maxIntensity;
    }
    // Fallback: linear
    return Math.min(1, Math.max(0, scrollProgress)) * maxIntensity;
  }, [scrollProgress, maxIntensity, osReduced]);

  // Drive shared value toward target on each render (no useEffect).
  const targetIntensity = resolveIntensity();
  intensityVal.value = withTiming(osReduced ? 0 : targetIntensity, { duration: 150 });

  const animatedProps = useAnimatedProps(() => ({
    intensity: intensityVal.value,
  }));

  // Attempt native vendor — falls back silently to expo-blur.
  const VendorBlur = loadVendor();
  if (VendorBlur) {
    try {
      return (
        <VendorBlur intensity={targetIntensity} style={StyleSheet.flatten(style) ?? {}}>
          {children}
        </VendorBlur>
      );
    } catch {
      // vendor threw (native stub not built yet) — fall through to BlurView
    }
  }

  return (
    <AnimatedBlurView
      tint="light"
      animatedProps={animatedProps}
      style={[styles.blurContainer, style]}
    >
      {children}
    </AnimatedBlurView>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
});

export type { ProgressiveBlurProps as ProgressiveBlurComponentProps };
