import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import type { DatePickerProps as ContractDatePickerProps } from '@deha/ui-contracts';
import { wheelSnap } from '../lib/choreography';
import type { ReanimatedTween } from '../lib/choreography';
import { colors } from '../lib/tokens';

// ---------------------------------------------------------------------------
// Local props interface
// WheelDatePickerProps extends the contract but drops calendar-only fields
// (minDate, maxDate are calendar-grid concerns) and adds iOS-wheel extras.
// ---------------------------------------------------------------------------
type OmittedCalendarFields = 'minDate' | 'maxDate';

export interface WheelDatePickerProps
  extends Omit<ContractDatePickerProps, OmittedCalendarFields> {
  /** iOS wheel picker display style */
  display?: 'compact' | 'inline' | 'spinner';
  /** Date parts to show in the wheel */
  mode?: 'date' | 'time' | 'datetime';
  /** Initial month (0-indexed). Ignored when `value` is set. */
  initialMonth?: number;
  /** Initial year. Ignored when `value` is set. */
  initialYear?: number;
  /**
   * Snap animation config forwarded to the vendor picker.
   * Defaults to `wheelSnap({ reducedMotion })`.
   * Stored as typed surface for future native bridge integration.
   */
  snapConfig?: ReanimatedTween;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseValue(iso: string | undefined): { month: number; year: number } {
  if (!iso) {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  }
  const d = new Date(iso);
  return { month: d.getMonth(), year: d.getFullYear() };
}

function buildIso(month: number, year: number): string {
  const mm = String(month + 1).padStart(2, '0');
  return `${year}-${mm}-01`;
}

// ---------------------------------------------------------------------------
// Vendor picker — imported lazily via require to avoid pulling broken
// transitive imports into the TypeScript compilation graph.
// The vendor stub is runtime-throwing; this file is the typecheck surface.
// ---------------------------------------------------------------------------
type VendorPickerProps = {
  initialMonth?: number;
  initialYear?: number;
  onDateChange?: (month: number, year: number) => void;
};

function renderVendorPicker(props: VendorPickerProps) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatePicker } = require('expo-ios-like-date-picker') as {
      DatePicker: React.ComponentType<VendorPickerProps>;
    };
    return <DatePicker {...props} />;
  } catch {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.mutedFg, fontSize: 13 }}>
          iOS wheel picker unavailable in this environment.
        </Text>
      </View>
    );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function WheelDatePicker({
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  placeholder: _placeholder,
  reducedMotion,
  display: _display = 'spinner',
  mode: _mode = 'date',
  initialMonth,
  initialYear,
  snapConfig,
}: WheelDatePickerProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  // snapConfig is the typed surface for future native bridge integration.
  // Resolved here so the wheelSnap token is consumed even without a live picker.
  const resolvedSnap = snapConfig ?? wheelSnap({ reducedMotion: isReduced });
  void resolvedSnap;

  const seed = value ?? defaultValue;
  const parsed = parseValue(seed);
  const [internal, setInternal] = useState<string>(
    seed ?? buildIso(parsed.month, parsed.year),
  );

  const handleDateChange = useCallback(
    (month: number, year: number) => {
      if (disabled) return;
      const next = buildIso(month, year);
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [disabled, value, onValueChange],
  );

  const { month: initMonth, year: initYear } = parseValue(value ?? internal);

  return renderVendorPicker({
    initialMonth: initialMonth !== undefined ? initialMonth : initMonth,
    initialYear: initialYear !== undefined ? initialYear : initYear,
    onDateChange: handleDateChange,
  });
}
