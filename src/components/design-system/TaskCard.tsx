import * as React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'
import { Chip } from './Chip'

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface TaskCardProps {
  title: string
  priority: 'high' | 'medium' | 'low'
  /** Optional countdown / ETA label shown as a dark chip (e.g. "12:00" or "2 saat") */
  eta?: string
}

// ── Priority → Chip mapping ───────────────────────────────────────────────────

const priorityVariant = {
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
} as const satisfies Record<TaskCardProps['priority'], 'priority-high' | 'priority-medium' | 'priority-low'>

const priorityLabel: Record<TaskCardProps['priority'], string> = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
}

// ── Priority left-bar colour ──────────────────────────────────────────────────

const priorityBar: Record<TaskCardProps['priority'], string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-emerald-500',
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

/**
 * TaskCard — GlassCard showing task title, Turkish priority Chip
 * (Yüksek / Orta / Düşük) and an optional countdown chip.
 *
 * Used in the vertical task list on the Tasks screen and as a
 * teaser on the Dashboard screen.
 */
export const TaskCard: React.FC<TaskCardProps> = ({ title, priority, eta }) => {
  return (
    <GlassCard padding="md" className="relative overflow-visible pl-[22px]">
      {/* Priority accent bar — left edge */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-0 left-0 top-0 w-[4px] rounded-l-[24px]',
          priorityBar[priority],
        )}
      />

      {/* Top row: title + ETA chip */}
      <div className="flex items-start justify-between gap-3">
        {/* Title */}
        <h4 className="flex-1 text-[15px] font-black leading-snug text-slate-900">
          {title}
        </h4>

        {/* Optional countdown chip */}
        {eta && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full',
              'bg-black/20 px-[10px] py-1 text-[11px] font-bold text-white',
            )}
          >
            {/* schedule icon via Unicode clock */}
            <svg
              aria-hidden="true"
              className="h-3 w-3 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2ZM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8Zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7Z" />
            </svg>
            {eta}
          </span>
        )}
      </div>

      {/* Bottom row: priority Chip */}
      <div className="mt-3">
        <Chip variant={priorityVariant[priority]} className="pointer-events-none">
          {priorityLabel[priority]}
        </Chip>
      </div>
    </GlassCard>
  )
}

TaskCard.displayName = 'TaskCard'
