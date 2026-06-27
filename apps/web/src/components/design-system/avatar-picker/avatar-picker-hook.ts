/**
 * AvatarPicker hook utilities — pure helpers, no DOM side-effects.
 *
 * No useEffect anywhere in AvatarPicker.tsx. The swap animation is fully
 * CSS-driven (keyframe apSwap triggered by React `key` prop remount on
 * `.ap-big-art`). This module exports the username validation logic so the
 * component stays declarative and the rules are testable in isolation.
 */

export interface UsernameValidation {
  /** True when the username is acceptable for submission (>= 3 chars after trim). */
  isValid: boolean
  /** True when the field has content but is still too short — show error message. */
  showError: boolean
  /** True when approaching the max length (>= 18 of 20 chars). */
  nearLimit: boolean
  /** The trimmed value ready for submission. */
  trimmed: string
}

/**
 * Pure username validation. Call inside the component body with the current
 * raw input value; returns a plain object — no hooks, no effects.
 *
 * Rules (mirrors the source JSX):
 *  - trimmed.length >= 3 → valid
 *  - trimmed.length > 0 && < 3 → showError (user started typing but isn't there yet)
 *  - raw.length >= 18 → nearLimit (character counter turns amber)
 */
export function validateUsername(raw: string): UsernameValidation {
  const trimmed = raw.trim()
  return {
    isValid: trimmed.length >= 3,
    showError: trimmed.length > 0 && trimmed.length < 3,
    nearLimit: raw.length >= 18,
    trimmed,
  }
}
