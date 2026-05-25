import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { PopoverProps } from '@deha/ui-contracts';
import { windowMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

type VendorPopoverProps = {
  children?: React.ReactNode;
  animated?: boolean;
  onVisibilityChange?: (open: boolean) => void;
};
type VendorPopoverComponent = React.ComponentType<VendorPopoverProps> & {
  Trigger?: React.ComponentType<{ children: React.ReactNode }>;
  Content?: React.ComponentType<{
    children: React.ReactNode;
    style?: unknown;
    onDismiss?: () => void;
  }>;
};
type VendorPopoverNS = {
  Popover?: VendorPopoverComponent;
  default?: unknown;
};

function loadVendor(): VendorPopoverComponent | null {
  try {
    const mod = require('expo-ios-popover') as VendorPopoverNS;
    return mod.Popover ?? null;
  } catch {
    return null;
  }
}

const VendorPopover = loadVendor();

interface PopoverCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  isReduced: boolean;
}

const PopoverContext = createContext<PopoverCtx | null>(null);

function usePopoverCtx() {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('Popover sub-component used outside <Popover>');
  return ctx;
}

function PopoverRoot({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  reducedMotion,
  children,
}: PopoverProps) {
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

  return (
    <PopoverContext.Provider value={{ open, setOpen, isReduced }}>
      {children}
    </PopoverContext.Provider>
  );
}

function Trigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = usePopoverCtx();
  if (VendorPopover?.Trigger) {
    return <VendorPopover.Trigger>{children}</VendorPopover.Trigger>;
  }
  return (
    <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
      {children}
    </Pressable>
  );
}

interface ContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onDismiss?: () => void;
}

function Content({ children, style, onDismiss }: ContentProps) {
  const { open, isReduced, setOpen } = usePopoverCtx();
  const opacity = useSharedValue(0);
  const cfg = windowMorph({ reducedMotion: isReduced });

  const handleDismiss = useCallback(() => {
    setOpen(false);
    onDismiss?.();
  }, [setOpen, onDismiss]);

  const handleShow = useCallback(() => {
    opacity.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
  }, [opacity, cfg.duration, cfg.easing]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (VendorPopover?.Content) {
    return (
      <VendorPopover.Content
        style={[styles.content, { backgroundColor: colors.background }, style]}
        onDismiss={handleDismiss}
      >
        <Animated.View style={backdropStyle} onLayout={handleShow}>
          <View style={styles.inner}>{children}</View>
        </Animated.View>
      </VendorPopover.Content>
    );
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.scrim} onPress={handleDismiss}>
        <Animated.View
          style={[
            styles.fallbackCard,
            { backgroundColor: colors.background },
            style,
            backdropStyle,
          ]}
          onLayout={handleShow}
        >
          <View style={styles.inner}>{children}</View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function PopoverComposite(props: PopoverProps) {
  if (VendorPopover) {
    return (
      <PopoverRoot {...props}>
        <VendorPopover animated onVisibilityChange={props.onOpenChange}>
          {props.children}
        </VendorPopover>
      </PopoverRoot>
    );
  }
  return <PopoverRoot {...props}>{props.children}</PopoverRoot>;
}

export const Popover = Object.assign(PopoverComposite, { Trigger, Content });

const styles = StyleSheet.create({
  content: {
    borderRadius: 12,
  },
  inner: {
    padding: 12,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackCard: {
    borderRadius: 12,
    minWidth: 240,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
});
