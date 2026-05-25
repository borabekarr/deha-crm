/**
 * Native runtime uses expo-apple-maps-sheet (vendored, EAS-built);
 * this JS fallback drives Reanimated for development/typecheck.
 *
 * Detents: [0.18, 0.50, 0.95] × screen height (snap-to-nearest on release).
 */
import React, {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { SheetProps } from '@deha/ui-contracts';
import { sheetDetent, swipeReveal } from '../lib/choreography';
import { colors } from '../lib/tokens';

const DETENT_RATIOS = [0.18, 0.5, 0.95] as const;

function computeDetents(screenH: number): number[] {
  return DETENT_RATIOS.map((r) => screenH * (1 - r));
}

function snapToNearest(y: number, detents: number[]): number {
  return detents.reduce((prev, curr) =>
    Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev,
  );
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface SheetCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  isReduced: boolean;
}

const SheetContext = createContext<SheetCtx | null>(null);

function useSheetCtx() {
  const ctx = use(SheetContext);
  if (!ctx) throw new Error('Sheet sub-component used outside <Sheet>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function SheetRoot({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  reducedMotion,
  children,
}: SheetProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const [internal, setInternal] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internal;

  const setOpen = useCallback(
    (v: boolean) => {
      if (controlledOpen === undefined) setInternal(v);
      onOpenChange?.(v);
    },
    [controlledOpen, onOpenChange],
  );

  const ctxValue = useMemo(
    () => ({ open, setOpen, isReduced }),
    [open, setOpen, isReduced],
  );

  return (
    <SheetContext.Provider value={ctxValue}>
      {children}
    </SheetContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
interface ContentProps {
  children: React.ReactNode;
}

function Content({ children }: ContentProps) {
  const { open, setOpen, isReduced } = useSheetCtx();
  const { height: SCREEN_H } = useWindowDimensions();
  const DETENTS = useMemo(() => computeDetents(SCREEN_H), [SCREEN_H]);

  const translateY = useSharedValue(SCREEN_H);
  const startY = useSharedValue(0);

  const cfg = sheetDetent({ reducedMotion: isReduced });
  const springCfg = swipeReveal({ reducedMotion: isReduced });

  const dismiss = useCallback(() => {
    translateY.value = withTiming(SCREEN_H, { duration: cfg.duration, easing: cfg.easing }, () => {
      runOnJS(setOpen)(false);
    });
  }, [translateY, cfg, setOpen, SCREEN_H]);

  const snapToDetent = useCallback(
    (toY: number) => {
      if (springCfg.type === 'spring') {
        translateY.value = withSpring(toY, { stiffness: springCfg.stiffness, damping: springCfg.damping });
      } else {
        translateY.value = withTiming(toY, { duration: 0 });
      }
    },
    [translateY, springCfg],
  );

  // Animate in when open flips to true
  const handleShow = useCallback(() => {
    translateY.value = SCREEN_H;
    translateY.value = withTiming(DETENTS[1], { duration: cfg.duration, easing: cfg.easing });
  }, [translateY, cfg, SCREEN_H, DETENTS]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = startY.value + e.translationY;
      translateY.value = Math.max(DETENTS[0], next);
    })
    .onEnd((e) => {
      const candidate = startY.value + e.translationY;
      if (candidate > DETENTS[DETENTS.length - 1] + 60) {
        runOnJS(dismiss)();
        return;
      }
      runOnJS(snapToDetent)(snapToNearest(candidate, DETENTS));
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onShow={handleShow}
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handle} />
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------
export const Sheet = Object.assign(SheetRoot, { Content });

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
});
