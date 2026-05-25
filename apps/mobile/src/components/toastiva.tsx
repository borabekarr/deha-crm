/**
 * toastiva.tsx
 *
 * Thin contract-matching wrapper around the `toastiva` package.
 *
 * Exports:
 *   ToastivaProvider  — drop-in provider (wraps toastiva's ToastivaProvider).
 *   showToastiva      — maps ToastProps → toastiva API call.
 */
import React from 'react';
import { ToastivaProvider as _ToastivaProvider, toastiva } from 'toastiva';
import type { IToastivaProviderProps } from 'toastiva';
import type { ToastProps } from '@deha/ui-contracts';

// ---------------------------------------------------------------------------
// Variant → toastiva type mapping
// ---------------------------------------------------------------------------

const VARIANT_MAP = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const satisfies Record<NonNullable<ToastProps['variant']>, string>;

// ---------------------------------------------------------------------------
// ToastivaProvider
// ---------------------------------------------------------------------------

export interface ToastivaProviderProps extends Omit<IToastivaProviderProps, 'children'> {
  children: React.ReactNode;
}

/**
 * Wraps toastiva's provider with sensible Deha CRM defaults.
 * Place this inside GestureHandlerRootView + SafeAreaProvider.
 */
export function ToastivaProvider({ children, ...props }: ToastivaProviderProps) {
  return (
    <_ToastivaProvider
      position="top-center"
      mode="morph"
      animationPreset="smooth"
      {...props}
    >
      {children}
    </_ToastivaProvider>
  );
}

// ---------------------------------------------------------------------------
// showToastiva
// ---------------------------------------------------------------------------

/**
 * Maps a contract ToastProps object to a toastiva() call.
 * Returns the toast id string produced by toastiva.
 */
export function showToastiva(props: ToastProps): string {
  const { title = '', description, variant = 'default', duration, onOpenChange } = props;

  const options = {
    description,
    duration,
    onAutoClose: onOpenChange ? () => onOpenChange(false) : undefined,
    onDismiss: onOpenChange ? () => onOpenChange(false) : undefined,
  };

  switch (VARIANT_MAP[variant]) {
    case 'success':
      return toastiva.success(title, options);
    case 'warning':
      return toastiva.warning(title, options);
    case 'error':
      return toastiva.error(title, options);
    default:
      return toastiva(title, options);
  }
}
