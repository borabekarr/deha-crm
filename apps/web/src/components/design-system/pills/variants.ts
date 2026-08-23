// variants.ts — data tables for the Pills specimens.
// Split out of Pills.tsx (react-fast-refresh-export-isolation: a module
// exporting a React component may only export components; these tables
// live here instead). Mirrors the Toast/proto/variants.ts split.

export interface PriorityPillSpec {
  color: string
  label: string
}

export const PRIORITY_PILLS: PriorityPillSpec[] = [
  { color: '#EF4444', label: 'Yüksek' },
  { color: '#EAB308', label: 'Orta' },
  { color: 'var(--brand-primary-500)', label: 'Düşük' },
]

export interface StatBadgeSpec {
  tone: 'success' | 'danger' | 'gci' | 'time' | 'tag'
  icon?: string
  prefix?: string
  label: string
}

export const STAT_BADGES: StatBadgeSpec[] = [
  { tone: 'success', icon: 'trending_up', label: '+12%' },
  { tone: 'danger', icon: 'trending_down', label: '-34%' },
  { tone: 'gci', prefix: '$', label: '45K GCI' },
  { tone: 'time', icon: 'schedule', label: '12:00' },
  { tone: 'tag', icon: 'home_work', label: 'Değerleme' },
  { tone: 'tag', icon: 'sell', label: 'Satış' },
  { tone: 'tag', icon: 'volunteer_activism', label: 'Nurture' },
]

export interface ColumnTagSpec {
  tone: 'todo' | 'progress' | 'review' | 'done'
  icon: string
  label: string
  count: number
}

export const COLUMN_TAGS: ColumnTagSpec[] = [
  { tone: 'todo', icon: 'inbox', label: 'Todo', count: 4 },
  { tone: 'progress', icon: 'bolt', label: 'In Progress', count: 3 },
  { tone: 'review', icon: 'visibility', label: 'Review', count: 2 },
  { tone: 'done', icon: 'task_alt', label: 'Done', count: 3 },
]

export interface EventBadgeSpec {
  color: string
  icon: string
  label: string
  tone?: 'black'
}

export const EVENT_BADGES: EventBadgeSpec[] = [
  { color: '#EC4899', icon: 'self_improvement', label: 'Personal' },
  { color: '#3B82F6', icon: 'event', label: 'Meeting' },
  { color: '#F97316', icon: 'call', label: 'Call' },
  { color: 'var(--brand-primary-500)', icon: 'task_alt', label: 'Done' },
  { color: '#EF4444', icon: 'warning', label: 'Urgent' },
  { color: '#111111', icon: 'lock', label: 'Private', tone: 'black' },
  { color: '#EAB308', icon: 'star', label: 'Featured' },
]

export interface IconBadgeSpec {
  color: string
  icon: string
  tone?: 'black'
}

export const ICON_BADGES: IconBadgeSpec[] = [
  { color: 'var(--brand-primary-500)', icon: 'bolt' },
  { color: '#EF4444', icon: 'favorite' },
  { color: '#F97316', icon: 'schedule' },
  { color: '#3B82F6', icon: 'insights' },
  { color: '#EAB308', icon: 'lock' },
  { color: '#111111', icon: 'dark_mode', tone: 'black' },
]
