import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import PopoverView, { PopoverPlacement } from 'react-native-popover-view';
import type { SelectProps } from '@deha/ui-contracts';
import { windowMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

interface SelectCtx {
  value: string | undefined;
  onValueChange: (v: string) => void;
  setOpen: (v: boolean) => void;
  open: boolean;
  isReduced: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerRef: React.RefObject<any>;
  placeholder: string | undefined;
  disabled: boolean;
}

const SelectContext = createContext<SelectCtx | null>(null);

function useSelectCtx() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select sub-component used outside <Select>');
  return ctx;
}

function SelectRoot({
  value: controlledValue,
  defaultValue,
  onValueChange,
  reducedMotion,
  disabled = false,
  placeholder,
  children,
}: SelectProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpenState] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const triggerRef = useRef<any>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = useCallback(
    (v: string) => {
      if (controlledValue === undefined) setInternalValue(v);
      onValueChange?.(v);
      setOpenState(false);
    },
    [controlledValue, onValueChange],
  );

  const setOpen = useCallback((v: boolean) => {
    if (!disabled) setOpenState(v);
  }, [disabled]);

  const ctxValue = useMemo(
    () => ({ value, onValueChange: handleValueChange, setOpen, open, isReduced, triggerRef, placeholder, disabled }),
    [value, handleValueChange, setOpen, open, isReduced, triggerRef, placeholder, disabled],
  );

  return (
    <SelectContext.Provider value={ctxValue}>
      {children}
    </SelectContext.Provider>
  );
}

function Trigger({ children }: { children?: React.ReactNode }) {
  const { value, setOpen, triggerRef, placeholder, disabled } = useSelectCtx();

  return (
    <View ref={triggerRef} collapsable={false}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[s.trigger, disabled && s.triggerDisabled]}
        accessibilityRole="combobox"
        accessibilityState={{ disabled, expanded: false }}
        disabled={disabled}
      >
        {children ?? (
          <>
            <Text style={[s.triggerText, !value && s.placeholderText]}>
              {value ?? placeholder ?? 'Select…'}
            </Text>
            <Text style={s.chevron}>›</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

interface ItemProps {
  value: string;
  label?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

function Item({ value, label, disabled = false, children }: ItemProps) {
  const { onValueChange, value: selectedValue } = useSelectCtx();
  const isSelected = selectedValue === value;

  const handlePress = useCallback(() => {
    if (!disabled) onValueChange(value);
  }, [disabled, onValueChange, value]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.item,
        isSelected && s.itemSelected,
        pressed && s.itemPressed,
        disabled && s.itemDisabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled }}
      disabled={disabled}
    >
      {children ?? (
        <Text style={[s.itemText, isSelected && s.itemTextSelected, disabled && s.itemTextDisabled]}>
          {label ?? value}
        </Text>
      )}
    </Pressable>
  );
}

interface ContentProps {
  children: React.ReactNode;
}

function Content({ children }: ContentProps) {
  const { open, setOpen, isReduced, triggerRef } = useSelectCtx();
  const opacity = useSharedValue(0);
  const cfg = windowMorph({ reducedMotion: isReduced });

  const handleOpen = useCallback(() => {
    opacity.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
  }, [opacity, cfg.duration, cfg.easing]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
        <View>{children}</View>
      </Animated.View>
    </PopoverView>
  );
}

export const Select = Object.assign(SelectRoot, { Trigger, Content, Item });

const s = StyleSheet.create({
  trigger:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.background, minWidth: 140 },
  triggerDisabled:     { opacity: 0.4 },
  triggerText:         { fontSize: 15, color: colors.foreground, flex: 1 },
  placeholderText:     { color: colors.mutedFg },
  chevron:             { fontSize: 18, color: colors.mutedFg, transform: [{ rotate: '90deg' }] },
  popover:             { borderRadius: 12, overflow: 'hidden', minWidth: 180 },
  contentWrap:         { backgroundColor: colors.background },
  item:                { paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemSelected:        { backgroundColor: colors.primary + '18' },
  itemPressed:         { backgroundColor: colors.border },
  itemDisabled:        { opacity: 0.4 },
  itemText:            { fontSize: 15, color: colors.foreground },
  itemTextSelected:    { color: colors.primary, fontWeight: '600' },
  itemTextDisabled:    { color: colors.mutedFg },
});
