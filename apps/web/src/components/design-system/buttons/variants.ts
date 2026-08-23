/**
 * variants.ts — Button variant → CSS class map + prop types.
 *
 * React Fast Refresh isolation: this file holds constants/types only, no
 * component. Buttons.tsx imports from here and stays component-only.
 */
import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant =
  | 'primary'
  | 'inverse'
  | 'glass'
  | 'text'
  | 'green'
  | 'yellow'
  | 'red'
  | 'task'
  | 'cta'
  | 'discuss'
  | 'delete'
  | 'apply'

export const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  inverse: 'btn-inverse',
  glass: 'btn-glass',
  text: 'btn-text',
  green: 'btn-green',
  yellow: 'btn-yellow',
  red: 'btn-red',
  task: 'btn-task',
  cta: 'btn-cta',
  discuss: 'btn-discuss',
  delete: 'btn-delete',
  apply: 'btn-apply',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Primary look-up into BUTTON_VARIANT_CLASS. */
  variant: ButtonVariant
  /** Optional second variant class, for compounds like "btn-green btn-apply". */
  variant2?: ButtonVariant
}
