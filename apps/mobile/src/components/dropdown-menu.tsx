import React, {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Component } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import PopoverView, { PopoverPlacement } from 'react-native-popover-view';
import type { DropdownMenuProps } from '@deha/ui-contracts';
import { tabPillSlide, windowMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

export interface DropdownMenuItem {
  key: string;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
}

interface DropdownMenuCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  isReduced: boolean;
  triggerRef: React.RefObject<Component>;
}

const DropdownMenuContext = createContext<DropdownMenuCtx | null>(null);

function useDropdownCtx() {
  const ctx = use(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenu sub-component used outside <DropdownMenu>');
  return ctx;
}

function DropdownMenuRoot({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  reducedMotion,
  children,
}: DropdownMenuProps) {
  const osReduced = useReducedMotion();
  const isReduced = reducedMotion === 'reduce' || (reducedMotion !== 'no-preference' && osReduced);
  const [internal, setInternal] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internal;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const triggerRef = useRef<any>(null) as React.RefObject<Component>;

  const setOpen = useCallback(
    (v: boolean) => {
      if (controlledOpen === undefined) setInternal(v);
      onOpenChange?.(v);
    },
    [controlledOpen, onOpenChange],
  );

  const ctxValue = useMemo(
    () => ({ open, setOpen, isReduced, triggerRef }),
    [open, setOpen, isReduced, triggerRef],
  );

  return (
    <DropdownMenuContext.Provider value={ctxValue}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

function Trigger({ children }: { children: React.ReactNode }) {
  const { setOpen, triggerRef } = useDropdownCtx();
  return (
    // @ts-expect-error — RN View ref vs library's Component generic
    <View ref={triggerRef} collapsable={false}>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
        {children}
      </Pressable>
    </View>
  );
}

interface ItemProps { onSelect?: () => void; disabled?: boolean; children: React.ReactNode; }

function Item({ onSelect, disabled = false, children }: ItemProps) {
  const { setOpen, isReduced } = useDropdownCtx();
  const highlight = useSharedValue(0);
  const pillCfg = tabPillSlide({ reducedMotion: isReduced });

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlight.value,
  }));

  const handlePressIn = useCallback(() => {
    highlight.value = withTiming(1, { duration: pillCfg.duration, easing: pillCfg.easing });
  }, [highlight, pillCfg.duration, pillCfg.easing]);

  const handlePressOut = useCallback(() => {
    highlight.value = withTiming(0, { duration: pillCfg.duration, easing: pillCfg.easing });
  }, [highlight, pillCfg.duration, pillCfg.easing]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
  }, [disabled, onSelect, setOpen]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[s.item, disabled && s.itemDisabled]}
      accessibilityRole="menuitem"
      accessibilityState={{ disabled }}
      disabled={disabled}
    >
      <Animated.View style={[StyleSheet.absoluteFill, s.itemHighlight, highlightStyle]} />
      {children}
    </Pressable>
  );
}

interface ContentProps { items?: DropdownMenuItem[]; children?: React.ReactNode; }

function Content({ items, children }: ContentProps) {
  const { open, setOpen, isReduced, triggerRef } = useDropdownCtx();
  const opacity = useSharedValue(0);
  const cfg = windowMorph({ reducedMotion: isReduced });

  const handleOpen = useCallback(() => {
    opacity.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
  }, [opacity, cfg.duration, cfg.easing]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const renderItem = useCallback(
    ({ item }: { item: DropdownMenuItem }) => (
      <Item key={item.key} onSelect={item.onSelect} disabled={item.disabled}><Label disabled={item.disabled}>{item.label}</Label></Item>
    ),
    [],
  );

  return (
    <PopoverView
      isVisible={open}
      from={triggerRef}
      onRequestClose={() => setOpen(false)}
      onOpenComplete={handleOpen}
      placement={PopoverPlacement.BOTTOM}
      animationConfig={isReduced ? { duration: 0 } : { duration: cfg.duration }}
      popoverStyle={s.popover}
    >
      <Animated.View style={[s.contentWrap, animStyle]}>
        {items && items.length > 0 ? (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            scrollEnabled={items.length > 6}
            style={items.length > 6 ? s.listScrollable : undefined}
            accessibilityRole="menu"
          />
        ) : (
          <View accessibilityRole="menu">{children}</View>
        )}
      </Animated.View>
    </PopoverView>
  );
}

// DropdownMenu.Label — renders a styled text label inside a menu item.
function Label({ children, disabled }: { children: string; disabled?: boolean }) {
  return <Text style={[s.itemText, disabled && s.itemTextDisabled]}>{children}</Text>;
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, { Trigger, Content, Item, Label });

const s = StyleSheet.create({
  popover:          { borderRadius: 12, overflow: 'hidden', minWidth: 160 },
  contentWrap:      { backgroundColor: colors.background },
  item:             { paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, overflow: 'hidden' },
  itemHighlight:    { backgroundColor: colors.border },
  itemDisabled:     { opacity: 0.4 },
  itemText:         { fontSize: 15, color: colors.foreground },
  itemTextDisabled: { color: colors.mutedFg },
  listScrollable:   { maxHeight: 280 },
});
