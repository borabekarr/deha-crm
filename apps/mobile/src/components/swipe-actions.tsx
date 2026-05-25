/**
 * SwipeActions — Reanimated-driven swipeable row with haptic feedback.
 * Wraps `ios-like-swipe-actions` vendor; fires Haptics.impactAsync at commit.
 */
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { runOnJS, useReducedMotion } from 'react-native-reanimated';
import { swipeReveal } from '../lib/choreography';

// Vendor surface — typed subset (vendor excluded from tsc).
type VendorSwipeActionItem = {
  key: string;
  side: 'left' | 'right';
  children: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
};

type VendorSwipeActionsRootProps = {
  children: React.ReactNode;
  actionWidth?: number;
  fullSwipeEnabled?: boolean;
  onOpen?: (side: 'left' | 'right') => void;
  onClose?: () => void;
  onHapticCue?: (kind: 'reveal' | 'commit') => void;
  motion?: {
    easingCurve?: readonly [number, number, number, number];
    releaseDurationMs?: number;
  };
  tuning?: {
    stiffness?: number;
    damping?: number;
  };
  style?: StyleProp<ViewStyle>;
};

type VendorSwipeActionsMainProps = { children: React.ReactNode; style?: StyleProp<ViewStyle> };
type VendorSwipeActionsContainerProps = {
  children: React.ReactNode;
  onPress: () => void;
  side?: 'left' | 'right';
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
};

type VendorSwipeActionsNamespace = {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  Root: React.ComponentType<VendorSwipeActionsRootProps>;
  Main: React.ComponentType<VendorSwipeActionsMainProps>;
  Container: React.ComponentType<VendorSwipeActionsContainerProps>;
};

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface SwipeActionDef {
  key: string;
  label?: string;
  side: 'left' | 'right';
  children: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeActionDef[];
  rightActions?: SwipeActionDef[];
  /** Called when a commit gesture (full-swipe) fires */
  onCommit?: (side: 'left' | 'right') => void;
  actionWidth?: number;
  fullSwipeEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Haptic helper — runs on the JS thread via runOnJS from gesture worklets
// ---------------------------------------------------------------------------
function fireHaptic(kind: 'reveal' | 'commit') {
  if (kind === 'commit') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

// ---------------------------------------------------------------------------
// Vendor loader
// ---------------------------------------------------------------------------
function loadVendor(): VendorSwipeActionsNamespace | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('ios-like-swipe-actions') as VendorSwipeActionsNamespace;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  onCommit,
  actionWidth = 80,
  fullSwipeEnabled = false,
  style,
}: SwipeActionsProps) {
  const osReduced = useReducedMotion();
  const springCfg = swipeReveal({ reducedMotion: osReduced ?? false });

  // runOnJS-wrapped haptic so gesture worklet can cross the thread boundary.
  const hapticOnJS = useCallback(
    (kind: 'reveal' | 'commit') => {
      runOnJS(fireHaptic)(kind);
    },
    [],
  );

  const handleHapticCue = useCallback(
    (kind: 'reveal' | 'commit') => {
      hapticOnJS(kind);
    },
    [hapticOnJS],
  );

  const handleOpen = useCallback(
    (side: 'left' | 'right') => {
      if (fullSwipeEnabled) onCommit?.(side);
    },
    [fullSwipeEnabled, onCommit],
  );

  const vendor = loadVendor();

  if (!vendor) {
    // Fallback: render children without swipe actions in environments where
    // the native vendor is unavailable (e.g. web typecheck).
    return <>{children}</>;
  }

  const { Root, Main, Container, Provider } = vendor;

  // Build motion config from choreography spring (map to vendor's tuning shape)
  const motionProps =
    springCfg.type === 'spring'
      ? { tuning: { stiffness: springCfg.stiffness, damping: springCfg.damping } }
      : { motion: { releaseDurationMs: 0 } };

  const allActions: VendorSwipeActionItem[] = [
    ...leftActions.map((a) => ({
      key: a.key,
      side: 'left' as const,
      children: a.children,
      onPress: a.onPress,
      destructive: a.destructive,
      style: a.style,
    })),
    ...rightActions.map((a) => ({
      key: a.key,
      side: 'right' as const,
      children: a.children,
      onPress: a.onPress,
      destructive: a.destructive,
      style: a.style,
    })),
  ];

  return (
    <Provider>
      <Root
        actionWidth={actionWidth}
        fullSwipeEnabled={fullSwipeEnabled}
        onOpen={handleOpen}
        onHapticCue={handleHapticCue}
        style={style}
        {...motionProps}
      >
        <Main>{children}</Main>
        {allActions.map((action) => (
          <Container
            key={action.key}
            side={action.side}
            onPress={action.onPress}
            destructive={action.destructive}
            style={action.style}
          >
            {action.children}
          </Container>
        ))}
      </Root>
    </Provider>
  );
}

export type { SwipeActionsProps as SwipeActionsComponentProps };
