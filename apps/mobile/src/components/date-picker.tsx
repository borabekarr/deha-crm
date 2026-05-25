import React, { createContext, useCallback, useContext, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { DatePickerProps } from '@deha/ui-contracts';
import { Calendar } from './calendar';
import { Popover } from './popover';
import { windowMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface DatePickerCtx {
  value: string;
  setValue: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  placeholder: string;
  disabled: boolean;
}

const DatePickerContext = createContext<DatePickerCtx | null>(null);

function useDatePickerCtx() {
  const ctx = useContext(DatePickerContext);
  if (!ctx) throw new Error('DatePicker sub-component used outside <DatePicker>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function DatePickerRoot({
  value: controlled,
  defaultValue = '',
  onValueChange,
  disabled = false,
  placeholder = 'Pick a date',
  minDate,
  maxDate,
  reducedMotion,
  children,
}: DatePickerProps & { children: React.ReactNode }) {
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const value = controlled !== undefined ? controlled : internal;

  const setValue = useCallback(
    (v: string) => {
      if (controlled === undefined) setInternal(v);
      onValueChange?.(v);
      setOpen(false);
    },
    [controlled, onValueChange],
  );

  return (
    <DatePickerContext.Provider
      value={{ value, setValue, open, setOpen, placeholder, disabled }}
    >
      <Popover
        open={open}
        onOpenChange={setOpen}
        reducedMotion={reducedMotion}
      >
        {children}
      </Popover>
    </DatePickerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------
function Trigger() {
  const { value, placeholder, disabled, setOpen } = useDatePickerCtx();

  return (
    <Popover.Trigger>
      <Pressable
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value || placeholder}
      >
        <Text style={[styles.triggerText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
      </Pressable>
    </Popover.Trigger>
  );
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
function Content({ reducedMotion }: Pick<DatePickerProps, 'reducedMotion'>) {
  const { value, setValue, minDate, maxDate } = useDatePickerCtx() as DatePickerCtx & {
    minDate?: string;
    maxDate?: string;
  };

  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);
  const cfg = windowMorph({ reducedMotion: isReduced });

  const handleShow = useCallback(() => {
    opacity.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
    scale.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
  }, [opacity, scale, cfg.duration, cfg.easing]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Popover.Content>
      <Animated.View style={animStyle} onLayout={handleShow}>
        <View style={styles.content}>
          <Calendar
            value={value}
            onValueChange={setValue}
            minDate={minDate}
            maxDate={maxDate}
            reducedMotion={reducedMotion}
          />
        </View>
      </Animated.View>
    </Popover.Content>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------
export const DatePicker = Object.assign(DatePickerRoot, { Trigger, Content });

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  content: {
    minWidth: 300,
  },
  placeholderText: {
    color: colors.mutedFg,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    color: colors.foreground,
    fontSize: 14,
  },
});
