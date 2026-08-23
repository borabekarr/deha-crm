// Non-component values shared between DynamicCalendar.tsx and its split
// render components, split out so the component file only exports its
// component (react-doctor/only-export-components -- value exports
// alongside a component defeat Fast Refresh).
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const DOW_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
export const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const sameDay = (a: Date | null, b: Date | null) =>
  a != null && b != null &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
export const fmtRange = (s: Date, e: Date) => `${fmtTime(s)} – ${fmtTime(e)}`
