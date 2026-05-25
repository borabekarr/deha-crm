/**
 * Fab — Floating Action Button with staggered child entry.
 *
 * Wraps `expo-fab` (vendored FloatingActionButton) and layers:
 *   - fabStaggerOpen() timing config from choreography
 *   - useReducedMotion for accessibility
 *   - Declarative actions API: actions={[{ icon, label, onPress }]}
 *
 * API:
 *   <Fab actions={[{ icon: 'add', label: 'New', onPress: fn }]} onPress={fn} />
 */
import React, { useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fabStaggerOpen } from '../lib/choreography';
import type { FabStagger } from '../lib/choreography';
import { colors } from '../lib/tokens';
import { z } from '../lib/z';

// ---------------------------------------------------------------------------
// Vendor loader — expo-fab (FloatingActionButton)
// ---------------------------------------------------------------------------
type VendorFabProps = { onPress?: () => void };
type VendorFab = React.ComponentType<VendorFabProps>;

function loadVendor(): VendorFab | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-fab') as { Fab?: VendorFab; default?: VendorFab };
    return mod.Fab ?? mod.default ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface FabAction {
  /** Icon name (Ionicons glyph or string for future icon sets) */
  icon: string;
  /** Accessible label for the action */
  label: string;
  onPress: () => void;
}

export interface FabProps {
  actions?: FabAction[];
  /** Called when the FAB is tapped (before menu toggle) */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Override stagger config from choreography */
  staggerConfig?: FabStagger;
}

// ---------------------------------------------------------------------------
// Fallback child item (JS-driven stagger when vendor unavailable)
// ---------------------------------------------------------------------------
interface FallbackItemProps {
  action: FabAction;
  index: number;
  stagger: FabStagger;
  isOpen: SharedValue<boolean>;
}

function FallbackItem({ action, index, stagger, isOpen }: FallbackItemProps) {
  const delay = index * stagger.staggerChildren;

  const animStyle = useAnimatedStyle(() => {
    const show = isOpen.value;
    return {
      opacity: show
        ? withDelay(delay, withTiming(1, { duration: stagger.duration, easing: stagger.easing }))
        : withTiming(0, { duration: 100 }),
      transform: [
        {
          translateY: show
            ? withDelay(delay, withSpring(0, { damping: 14, stiffness: 120 }))
            : withSpring(12, { damping: 14, stiffness: 120 }),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.fallbackItem, animStyle]}>
      <View style={styles.fallbackLabel}>
        <Animated.Text
          style={styles.fallbackLabelText}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          {action.label}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Module-scoped stable default
// ---------------------------------------------------------------------------
const EMPTY_FAB_ACTIONS: FabAction[] = [];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Fab({ actions = EMPTY_FAB_ACTIONS, onPress, style, staggerConfig }: FabProps) {
  const osReduced = useReducedMotion();
  const isOpen = useSharedValue<boolean>(false);

  const resolvedStagger = staggerConfig ?? fabStaggerOpen({ reducedMotion: osReduced ?? false });

  const handlePress = useCallback(() => {
    isOpen.value = !isOpen.value;
    onPress?.();
  }, [isOpen, onPress]);

  const VendorFab = loadVendor();

  // When vendor is available, delegate entirely — it manages its own animation.
  if (VendorFab) {
    return <VendorFab onPress={handlePress} />;
  }

  // JS fallback: Reanimated-driven stagger open/close.
  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Child actions (stagger entry above the FAB button) */}
      <View style={styles.actionsStack} pointerEvents="box-none">
        {[...actions].reverse().map((action, idx) => (
          <FallbackItem
            key={action.label}
            action={action}
            index={idx}
            stagger={resolvedStagger}
            isOpen={isOpen}
          />
        ))}
      </View>

      {/* FAB trigger button */}
      <Animated.View
        style={styles.fab}
        onTouchEnd={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Open actions"
      >
        <Animated.Text style={styles.fabIcon}>+</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
    zIndex: z.fab,
  },
  actionsStack: {
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  fallbackItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLabel: {
    backgroundColor: colors.foreground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fallbackLabelText: {
    color: colors.primaryFg,
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
  },
  fabIcon: {
    color: colors.primaryFg,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});

export type { FabProps as FabComponentProps };
