import React, { useCallback, useState } from 'react';
import { Calendar as RNCalendar } from 'react-native-calendars';
import type { CalendarProps as RNCalendarProps, DateData } from 'react-native-calendars';
import { useReducedMotion } from 'react-native-reanimated';
import type { CalendarProps } from '@deha/ui-contracts';
import { colors } from '../lib/tokens';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toMarkedDates(
  value: string | undefined,
): RNCalendarProps['markedDates'] {
  if (!value) return {};
  return { [value]: { selected: true, selectedColor: colors.primary } };
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------
export function Calendar({
  value,
  defaultValue,
  onValueChange,
  mode = 'single',
  disabled = false,
  minDate,
  maxDate,
  reducedMotion,
}: CalendarProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const [internal, setInternal] = useState(defaultValue ?? '');
  const selected = value !== undefined ? value : internal;

  const handleDayPress = useCallback(
    (date: DateData) => {
      if (disabled) return;
      const next = date.dateString;
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [disabled, value, onValueChange],
  );

  return (
    <RNCalendar
      current={selected || undefined}
      minDate={minDate}
      maxDate={maxDate}
      markedDates={toMarkedDates(selected)}
      onDayPress={handleDayPress}
      enableSwipeMonths={!isReduced}
      disabledByDefault={disabled}
      hideExtraDays
      theme={{
        backgroundColor: colors.background,
        calendarBackground: colors.background,
        textSectionTitleColor: colors.mutedFg,
        selectedDayBackgroundColor: colors.primary,
        selectedDayTextColor: colors.primaryFg,
        todayTextColor: colors.primary,
        dayTextColor: colors.foreground,
        textDisabledColor: colors.border,
        arrowColor: colors.primary,
        monthTextColor: colors.foreground,
      }}
    />
  );
}
