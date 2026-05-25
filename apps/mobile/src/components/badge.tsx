import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BadgeProps } from '@deha/ui-contracts';
import { colors } from '../lib/tokens';

// Extend the contract with mobile-only variants
export type MobileBadgeVariant =
  | NonNullable<BadgeProps['variant']>
  | 'success'
  | 'warning'
  | 'neutral';

export interface MobileBadgeProps extends Omit<BadgeProps, 'variant'> {
  variant?: MobileBadgeVariant;
}

type VariantStyle = {
  bg: string;
  text: string;
  border: string;
  borderWidth: number;
};

const variantStyles: Record<NonNullable<MobileBadgeVariant>, VariantStyle> = {
  default: {
    bg: colors.foreground,
    text: colors.background,
    border: colors.foreground,
    borderWidth: 0,
  },
  outline: {
    bg: 'transparent',
    text: colors.foreground,
    border: colors.border,
    borderWidth: 1,
  },
  secondary: {
    bg: colors.border,
    text: colors.foreground,
    border: 'transparent',
    borderWidth: 0,
  },
  destructive: {
    bg: colors.danger,
    text: colors.background,
    border: 'transparent',
    borderWidth: 0,
  },
  success: {
    bg: colors.success,
    text: colors.background,
    border: 'transparent',
    borderWidth: 0,
  },
  warning: {
    bg: colors.warning,
    text: colors.background,
    border: 'transparent',
    borderWidth: 0,
  },
  neutral: {
    bg: colors.neutral,
    text: colors.background,
    border: 'transparent',
    borderWidth: 0,
  },
};

export function Badge({ variant = 'default', children }: MobileBadgeProps) {
  const vs = variantStyles[variant];
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border,
          borderWidth: vs.borderWidth,
        },
      ]}
    >
      <Text style={[styles.text, { color: vs.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
});
