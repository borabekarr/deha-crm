/**
 * adjust-timeframe-shared.ts
 *
 * Pure date/format helpers, month-strip types, and the range reducer.
 * No React import: safe to use from the controller hook and both render
 * siblings without pulling any component code into a "helper" module
 * (keeps `AdjustTimeframe.tsx` a components-only export).
 */

export const MS = 86400000

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const floorDay = (d: Date): Date => {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}
export const addDays = (d: Date, n: number): Date => {
  const x = floorDay(d); x.setDate(x.getDate() + n); return x
}
export const diffDays = (a: Date, b: Date): number =>
  Math.round((floorDay(b).getTime() - floorDay(a).getTime()) / MS)
export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
export const fmtDate = (d: Date): string => `${MONTHS[d.getMonth()]} ${d.getDate()}`

export interface MonthInfo { label: string; startIdx: number; days: number }

export function buildMonths(domainStart: Date, totalDays: number): MonthInfo[] {
  const out: MonthInfo[] = []
  let cursor = floorDay(domainStart)
  while (diffDays(domainStart, cursor) < totalDays) {
    const startIdx = diffDays(domainStart, cursor)
    const dim = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    out.push({ label: MONTHS[cursor.getMonth()], startIdx, days: dim })
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }
  return out
}

export const dayWord = (n: number): string => `${n}D`

/* F2b: zoom pill — fixed levels, default 50%. Higher % = more zoomed in
   (fewer days visible); level 100 -> MIN_DAYS, level 25 -> near totalDays. */
export const ZOOM_LEVELS = [25, 50, 75, 100]

/* F2c: startIdx/endIdx/zoomLevel/daysVisible/anim are updated together by the
   same handlers (apply-preset, zoom step, drag), so they live in one
   reducer rather than five separate useState calls. */
export type RangeState = {
  startIdx: number
  endIdx: number
  zoomLevel: number
  daysVisible: number
  anim: boolean
}
export type RangeAction =
  | { type: 'startIdx'; value: number }
  | { type: 'endIdx'; value: number }
  | { type: 'zoomLevel'; value: number }
  | { type: 'daysVisible'; value: number }
  | { type: 'anim'; value: boolean }

export function rangeReducer(state: RangeState, action: RangeAction): RangeState {
  switch (action.type) {
    case 'startIdx':    return { ...state, startIdx: action.value }
    case 'endIdx':      return { ...state, endIdx: action.value }
    case 'zoomLevel':   return { ...state, zoomLevel: action.value }
    case 'daysVisible': return { ...state, daysVisible: action.value }
    case 'anim':        return { ...state, anim: action.value }
    default:            return state
  }
}
