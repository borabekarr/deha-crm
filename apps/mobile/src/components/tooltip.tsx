import React, {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Popover as ExpoPopover } from 'expo-ios-popover';
import type { TooltipProps } from '@deha/ui-contracts';
import { popoverScaleFromAnchor, windowMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface TooltipCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  isReduced: boolean;
}

const TooltipContext = createContext<TooltipCtx | null>(null);

function useTooltipCtx() {
  const ctx = use(TooltipContext);
  if (!ctx) throw new Error('Tooltip sub-component used outside <Tooltip>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Root (Tooltip compound)
// ---------------------------------------------------------------------------
function TooltipRoot({
  content,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 700,
  reducedMotion,
  children,
}: TooltipProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const [internal, setInternal] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internal;
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setOpen = useCallback(
    (v: boolean) => {
      if (controlledOpen === undefined) setInternal(v);
      onOpenChange?.(v);
    },
    [controlledOpen, onOpenChange],
  );

  const handlePressIn = useCallback(() => {
    delayRef.current = setTimeout(() => {
      setOpen(true);
    }, delayDuration);
  }, [setOpen, delayDuration]);

  const handlePressOut = useCallback(() => {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    setOpen(false);
  }, [setOpen]);

  const ctxValue = useMemo(
    () => ({ open, setOpen, isReduced }),
    [open, setOpen, isReduced],
  );

  return (
    <TooltipContext.Provider value={ctxValue}>
      <ExpoPopover animated={!isReduced} onVisibilityChange={setOpen}>
        <ExpoPopover.Trigger>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole="button"
          >
            {children}
          </Pressable>
        </ExpoPopover.Trigger>

        <TooltipContent isReduced={isReduced} setOpen={setOpen}>
          {content}
        </TooltipContent>
      </ExpoPopover>
    </TooltipContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Internal Content — not exported as compound sub-component
// ---------------------------------------------------------------------------
interface InternalContentProps {
  children: React.ReactNode;
  isReduced: boolean;
  setOpen: (v: boolean) => void;
}

function TooltipContent({ children, isReduced, setOpen }: InternalContentProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const cfg = windowMorph({ reducedMotion: isReduced });
  const scaleCfg = popoverScaleFromAnchor({ reducedMotion: isReduced });

  const handleShow = useCallback(() => {
    opacity.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
    scale.value = withTiming(1, { duration: scaleCfg.duration, easing: scaleCfg.easing });
  }, [opacity, scale, cfg.duration, cfg.easing, scaleCfg.duration, scaleCfg.easing]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <ExpoPopover.Content
      style={styles.contentWrap}
      onDismiss={handleDismiss}
    >
      <Animated.View style={[styles.bubble, animStyle]} onLayout={handleShow}>
        <View style={styles.childWrap}>{children}</View>
      </Animated.View>
    </ExpoPopover.Content>
  );
}

// Tooltip.Text — convenience subcomponent for plain-text content.
function TooltipText({ children }: { children: string }) {
  return (
    <Text style={styles.text} numberOfLines={0}>
      {children}
    </Text>
  );
}

export const Tooltip = Object.assign(TooltipRoot, { Text: TooltipText });

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  contentWrap: {
    backgroundColor: colors.foreground,
    borderRadius: 8,
  },
  bubble: {
    maxWidth: 280,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  text: {
    color: colors.background,
    fontSize: 13,
    lineHeight: 18,
  },
  childWrap: {
    maxWidth: 280,
  },
});
