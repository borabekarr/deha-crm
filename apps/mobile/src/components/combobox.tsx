import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import PopoverView, { PopoverPlacement } from 'react-native-popover-view';
import type { ComboboxProps } from '@deha/ui-contracts';
import { windowMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

interface ComboboxCtx {
  value: string | undefined;
  inputValue: string;
  onValueChange: (v: string) => void;
  onInputChange: (text: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  isReduced: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerRef: React.RefObject<any>;
}

const ComboboxContext = createContext<ComboboxCtx | null>(null);

function useComboboxCtx() {
  const ctx = useContext(ComboboxContext);
  if (!ctx) throw new Error('Combobox sub-component used outside <Combobox>');
  return ctx;
}

function ComboboxRoot({
  value: controlledValue,
  defaultValue,
  onValueChange,
  onInputChange,
  open: controlledOpen,
  onOpenChange,
  reducedMotion,
  children,
}: ComboboxProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [internalOpen, setInternalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const triggerRef = useRef<any>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (v: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [controlledOpen, onOpenChange],
  );

  const handleValueChange = useCallback(
    (v: string) => {
      if (controlledValue === undefined) setInternalValue(v);
      onValueChange?.(v);
      setOpen(false);
    },
    [controlledValue, onValueChange, setOpen],
  );

  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text);
      onInputChange?.(text);
      if (!open) setOpen(true);
    },
    [onInputChange, open, setOpen],
  );

  return (
    <ComboboxContext.Provider
      value={{ value, inputValue, onValueChange: handleValueChange, onInputChange: handleInputChange, open, setOpen, isReduced, triggerRef }}
    >
      {children}
    </ComboboxContext.Provider>
  );
}

interface TriggerProps {
  placeholder?: string;
}

function Trigger({ placeholder = 'Search…' }: TriggerProps) {
  const { value, inputValue, onInputChange, setOpen, triggerRef, open } = useComboboxCtx();

  return (
    <View ref={triggerRef} collapsable={false}>
      <Pressable
        style={s.triggerWrap}
        onPress={() => setOpen(true)}
        accessibilityRole="combobox"
        accessibilityState={{ expanded: open }}
      >
        <TextInput
          style={s.input}
          value={inputValue || value}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedFg}
          onChangeText={onInputChange}
          onFocus={() => setOpen(true)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Text style={s.chevron}>›</Text>
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
  const { onValueChange, value: selectedValue } = useComboboxCtx();
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
  const { open, setOpen, isReduced, triggerRef } = useComboboxCtx();
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

export const Combobox = Object.assign(ComboboxRoot, { Trigger, Content, Item });

const s = StyleSheet.create({
  triggerWrap:         { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.background, paddingHorizontal: 14, paddingVertical: 4, minWidth: 180 },
  input:               { flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 8 },
  chevron:             { fontSize: 18, color: colors.mutedFg, transform: [{ rotate: '90deg' }] },
  popover:             { borderRadius: 12, overflow: 'hidden', minWidth: 220 },
  contentWrap:         { backgroundColor: colors.background },
  item:                { paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemSelected:        { backgroundColor: colors.primary + '18' },
  itemPressed:         { backgroundColor: colors.border },
  itemDisabled:        { opacity: 0.4 },
  itemText:            { fontSize: 15, color: colors.foreground },
  itemTextSelected:    { color: colors.primary, fontWeight: '600' },
  itemTextDisabled:    { color: colors.mutedFg },
});
