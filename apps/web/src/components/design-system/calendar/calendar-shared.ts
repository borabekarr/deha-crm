/**
 * calendar-shared.ts
 *
 * Pure data/date helpers, colors, and types shared by Calendar.tsx and its
 * render siblings (CalendarHeader, CalendarGrid, CalendarEventsPanel,
 * CalendarNewEventPopover). No React import: kept out of the .tsx files so
 * `only-export-components` never has to see a component file exporting a
 * plain const/function/type alongside a component.
 */

export const B = '#3B82F6'
export const O = '#F97316'
export const P = '#EC4899'

export interface EventInfo {
  badge: string
  icon: string
  color: string
  titles: string[]
  times: string[]
  descriptions?: string[]
}

export const INFO: Record<string, EventInfo> = {
  [B]: {
    badge: 'Meeting',
    icon: 'group',
    color: '#3B82F6',
    titles: ['Team standup', 'Client call', 'Weekly sync', 'Strategy review', 'Product meeting', 'Investor call', 'Sprint planning'],
    times: ['9:00', '9:30', '10:00', '11:00', '14:00', '15:00', '16:30'],
    descriptions: [
      'Daily sync to surface blockers and align the team on today\'s priorities.',
      'Review project deliverables and confirm next steps with the client.',
      'Align on weekly goals, surface blockers, and update the sprint board.',
      'Deep-dive into Q3 strategy to lock in priorities and owner assignments.',
      'Product team check-in covering roadmap, backlog grooming, and release dates.',
      'Investor update covering traction, pipeline, and 90-day milestones.',
      'Plan the upcoming sprint, estimate stories, and assign ownership.',
    ],
  },
  [O]: {
    badge: 'Review',
    icon: 'rate_review',
    color: '#F97316',
    titles: ['Property visit', 'Site inspection', 'Listing review', 'Market analysis', 'Buyer showing', 'Lease signing', 'Portfolio review'],
    times: ['10:00', '10:30', '11:30', '13:00', '14:00', '15:30', '16:00'],
  },
  [P]: {
    badge: 'Personal',
    icon: 'self_improvement',
    color: '#EC4899',
    titles: ['Yoga class', 'Gym session', 'Dinner out', 'Evening run', 'Coffee break', 'Personal errand', 'Family time'],
    times: ['7:30', '8:00', '18:00', '18:30', '19:00', '19:30', '20:00'],
  },
}

// May 2026 predefined dot data
const MAY_DOTS: Record<number, string[]> = {
  1: [B, B, P], 2: [P], 3: [P], 4: [B, O, P, B, O], 5: [B, O], 6: [B, O], 7: [B, B, O], 8: [B, O], 9: [O],
  10: [P], 11: [B, O, P], 12: [B, O, P], 13: [O, B], 14: [B, B, O], 15: [B, O, O], 16: [P],
  17: [P], 18: [B, O], 19: [B, P], 20: [P, O, B], 21: [B, B, O], 22: [P], 23: [P],
  24: [P], 25: [B, O], 26: [B, B, P], 27: [O, B], 28: [O, B, B], 29: [B, P, O], 30: [P], 31: [P],
}

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// ── Helpers ────────────────────────────────────────────────────────────────

export function getDots(year: number, month: number, day: number): string[] {
  if (year === 2026 && month === 4) return MAY_DOTS[day] ?? []
  const h = (year * 1200 + month * 100 + day) % 19
  if (h < 4) return []
  if (h < 7) return [P]
  if (h < 10) return [B]
  if (h < 13) return [O, P]
  if (h < 16) return [B, O]
  return [B, O, P]
}

export interface Cell {
  d: number
  m: 'p' | 'c' | 'n'
}

export function buildCells(year: number, month: number): Cell[] {
  const firstDOW = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const cells: Cell[] = []
  for (let i = firstDOW - 1; i >= 0; i--) cells.push({ d: prevDays - i, m: 'p' })
  for (let d = 1; d <= daysInMon; d++) cells.push({ d, m: 'c' })
  while (cells.length < 42) cells.push({ d: cells.length - firstDOW - daysInMon + 1, m: 'n' })
  return cells
}

export interface CalEvent {
  time: string
  title: string
  dot: string
  badge: string
  icon: string
  color: string
  description?: string
}

export function getEvents(year: number, month: number, day: number): CalEvent[] {
  const dots = getDots(year, month, day)
  return dots
    .map((color, i) => {
      const info = INFO[color]
      if (!info) return null
      const titleIdx = (day + i * 4) % info.titles.length
      const desc = info.descriptions ? info.descriptions[titleIdx % info.descriptions.length] : undefined
      return {
        time: info.times[(day * 2 + i * 3) % info.times.length],
        title: info.titles[titleIdx],
        dot: color,
        badge: info.badge,
        icon: info.icon,
        color: info.color,
        ...(desc !== undefined ? { description: desc } : {}),
      }
    })
    .filter((x): x is CalEvent => x !== null)
    .sort((a, b) => a.time.localeCompare(b.time))
}

export function countMonthEvents(year: number, month: number): number {
  const n = new Date(year, month + 1, 0).getDate()
  let total = 0
  for (let d = 1; d <= n; d++) total += getDots(year, month, d).length
  return total
}

export interface NewEvent {
  title: string
  date: string
  time: string
  color: string
}

// Extra events added by the user via the task-creation popover
export type ExtraEvents = Record<string, CalEvent[]>

export function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
