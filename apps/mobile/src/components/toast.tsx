/**
 * toast.tsx
 *
 * Minimal RN toast primitives.
 *
 * ToastItem      — single animated toast card.
 * ToastViewport  — subscribes to the store and renders current toasts
 *                  at the top of the screen.
 */
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import type { ToastProps } from '@deha/ui-contracts';
import { windowMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';
import { z } from '../lib/z';
import { useToast, dismiss as dismissToast, type ToastEntry } from '../hooks/use-toast';

// ---------------------------------------------------------------------------
// Variant colours
// ---------------------------------------------------------------------------

const BG: Record<NonNullable<ToastProps['variant']>, string> = {
  default: colors.foreground,
  success: colors.success,
  warning: colors.warning,
  error: colors.danger,
};

const FG: Record<NonNullable<ToastProps['variant']>, string> = {
  default: colors.background,
  success: colors.background,
  warning: colors.foreground,
  error: colors.background,
};

// ---------------------------------------------------------------------------
// ToastItem
// ---------------------------------------------------------------------------

interface ToastItemProps {
  entry: ToastEntry;
}

function ToastItem({ entry }: ToastItemProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);

  // Animate in on mount via initialising shared values with withTiming.
  // We do NOT use useEffect — the animation starts when the component
  // renders for the first time by driving values from their initial state.
  opacity.value = withTiming(1, windowMorph({ reducedMotion: reduced ?? false }));
  translateY.value = withTiming(0, windowMorph({ reducedMotion: reduced ?? false }));

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleDismiss = useCallback(() => {
    const cfg = windowMorph({ reducedMotion: reduced ?? false });
    opacity.value = withTiming(0, cfg, (finished) => {
      if (finished) {
        runOnJS(dismissToast)(entry.id);
        if (entry.onOpenChange) runOnJS(entry.onOpenChange)(false);
      }
    });
    translateY.value = withTiming(-12, cfg);
  }, [entry.id, entry.onOpenChange, opacity, translateY, reduced]);

  const bg = BG[entry.variant];
  const fg = FG[entry.variant];

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg }, animatedStyle]}>
      <View style={styles.content}>
        {!!entry.title && (
          <Text style={[styles.title, { color: fg }]} numberOfLines={2}>
            {entry.title}
          </Text>
        )}
        {!!entry.description && (
          <Text style={[styles.description, { color: fg }]} numberOfLines={3}>
            {entry.description}
          </Text>
        )}
      </View>
      <Text
        style={[styles.dismiss, { color: fg }]}
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss toast"
      >
        ✕
      </Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// ToastViewport
// ---------------------------------------------------------------------------

export function ToastViewport() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.viewport} pointerEvents="box-none">
      {toasts.map((entry) => (
        <ToastItem key={entry.id} entry={entry} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: z.toast,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
  },
  dismiss: {
    fontSize: 16,
    paddingLeft: 12,
    opacity: 0.7,
  },
});
