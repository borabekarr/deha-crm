import React, { createContext, use, useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';
import type { ContextMenuProps } from '@deha/ui-contracts';
import { windowMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

// --- types ---
interface Anchor { x: number; y: number; width: number; height: number; }
interface Ctx {
  open: boolean; setOpen: (v: boolean) => void; isReduced: boolean;
  anchor: Anchor | null; setAnchor: (pos: Anchor) => void;
}
interface ContentProps { children: React.ReactNode; }
interface ItemProps {
  onSelect?: () => void; disabled?: boolean; destructive?: boolean;
  children: React.ReactNode;
}

const ContextMenuContext = createContext<Ctx | null>(null);
function useCtx() {
  const ctx = use(ContextMenuContext);
  if (!ctx) throw new Error('ContextMenu sub-component used outside <ContextMenu>');
  return ctx;
}

const MENU_WIDTH = 200;
const MENU_MARGIN = 8;

// --- Root ---
function ContextMenuRoot({ open: ctrl, onOpenChange, reducedMotion, children }: ContextMenuProps) {
  const osReduced = useReducedMotion();
  const isReduced = reducedMotion === 'reduce' || (reducedMotion !== 'no-preference' && osReduced);
  const [internal, setInternal] = useState(false);
  const open = ctrl !== undefined ? ctrl : internal;
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const setOpen = useCallback((v: boolean) => {
    if (ctrl === undefined) setInternal(v);
    onOpenChange?.(v);
  }, [ctrl, onOpenChange]);
  const ctxValue = useMemo(
    () => ({ open, setOpen, isReduced, anchor, setAnchor }),
    [open, setOpen, isReduced, anchor, setAnchor],
  );
  return (
    <ContextMenuContext.Provider value={ctxValue}>
      {children}
    </ContextMenuContext.Provider>
  );
}

// --- Trigger ---
function Trigger({ children }: { children: React.ReactNode }) {
  const { setOpen, setAnchor } = useCtx();
  const ref = useRef<View>(null);
  const handleLongPress = useCallback(() => {
    ref.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setAnchor({ x: pageX, y: pageY, width, height });
      setOpen(true);
    });
  }, [setOpen, setAnchor]);
  return (
    <View ref={ref} collapsable={false}>
      <Pressable onLongPress={handleLongPress} delayLongPress={400}>{children}</Pressable>
    </View>
  );
}

// --- Content ---
function Content({ children }: ContentProps) {
  const { open, setOpen, isReduced, anchor } = useCtx();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const cfg = windowMorph({ reducedMotion: isReduced });
  const dismiss = useCallback(() => setOpen(false), [setOpen]);
  const handleShow = useCallback(() => {
    opacity.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
    scale.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
  }, [opacity, scale, cfg.duration, cfg.easing]);
  const menuStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const menuTop = anchor ? anchor.y + anchor.height + MENU_MARGIN : 100;
  const menuLeft = anchor ? Math.max(MENU_MARGIN, anchor.x) : MENU_MARGIN;
  if (!open) return null;
  return (
    <Modal visible={open} transparent animationType="none"
      onShow={handleShow} onRequestClose={dismiss} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      <Animated.View style={[styles.menu, { top: menuTop, left: menuLeft, width: MENU_WIDTH }, menuStyle]}>
        {children}
      </Animated.View>
    </Modal>
  );
}

// --- Item ---
function Item({ onSelect, disabled = false, destructive = false, children }: ItemProps) {
  const { setOpen } = useCtx();
  const handlePress = useCallback(() => {
    if (disabled) return;
    setOpen(false);
    onSelect?.();
  }, [disabled, onSelect, setOpen]);
  return (
    <Pressable onPress={handlePress} disabled={disabled}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="menuitem" accessibilityState={{ disabled }}>
      <Text style={[styles.itemText, destructive && styles.itemDestructive, disabled && styles.itemDisabled]}>
        {children}
      </Text>
    </Pressable>
  );
}

// --- Compound export ---
export const ContextMenu = Object.assign(ContextMenuRoot, { Trigger, Content, Item });

// --- Styles ---
const styles = StyleSheet.create({
  menu: {
    position: 'absolute', backgroundColor: colors.background, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', overflow: 'hidden',
  },
  item: { paddingVertical: 11, paddingHorizontal: 16 },
  itemPressed: { backgroundColor: colors.border },
  itemText: { fontSize: 15, color: colors.foreground },
  itemDestructive: { color: colors.danger },
  itemDisabled: { color: colors.mutedFg },
});
