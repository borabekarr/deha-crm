import * as React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  name: string
  /** Primary metric shown on the right in Montserrat Black (e.g. "$320K") */
  primary: string
  /** Secondary metric shown below the name (e.g. "Top 1%") */
  secondary: string
  /** Optional avatar image URL; falls back to rank number */
  avatar?: string
}

export interface LeaderboardProps {
  title: string
  entries: LeaderboardEntry[]
}

// ── Rank badge colours ────────────────────────────────────────────────────────

const rankBg: Record<number, string> = {
  1: 'bg-yellow-400 shadow-[0_4px_8px_rgba(234,179,8,0.30)] text-white',
  2: 'bg-slate-200 text-slate-600',
  3: 'bg-amber-400 text-white',
}

const defaultRankBg = 'bg-slate-100 text-slate-500'

function rankClass(rank: number): string {
  return rankBg[rank] ?? defaultRankBg
}

// ── Avatar placeholder / image ────────────────────────────────────────────────

interface AvatarBadgeProps {
  rank: number
  name: string
  avatar?: string
}

const AvatarBadge: React.FC<AvatarBadgeProps> = ({ rank, name, avatar }) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="size-8 shrink-0 rounded-full object-cover"
      />
    )
  }
  return (
    <div
      aria-label={`Rank ${rank}`}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black',
        rankClass(rank),
      )}
    >
      {rank}
    </div>
  )
}

// ── Column header ─────────────────────────────────────────────────────────────

const ColHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <span
    className={cn(
      'text-[10px] font-black uppercase tracking-[0.1em] text-slate-400',
      className,
    )}
  >
    {children}
  </span>
)

// ── Single leaderboard row ────────────────────────────────────────────────────

interface RowProps {
  entry: LeaderboardEntry
}

const LeaderboardRow: React.FC<RowProps> = ({ entry }) => {
  const isTop = entry.rank === 1

  return (
    <div
      className={cn(
        'relative flex items-center justify-between rounded-2xl px-[14px] py-3 transition-colors duration-150',
        // #1 row: faint emerald background + left accent bar
        isTop
          ? 'bg-emerald-50/60 border border-emerald-100/80'
          : 'bg-transparent border border-transparent',
        // Hover state — all rows
        'hover:bg-white/50',
      )}
    >
      {/* Left accent bar for rank 1 */}
      {isTop && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl bg-emerald-500"
        />
      )}

      {/* Avatar + name block */}
      <div
        className={cn(
          'flex items-center gap-3',
          isTop && 'ml-[6px]',
        )}
      >
        <AvatarBadge rank={entry.rank} name={entry.name} avatar={entry.avatar} />
        <div>
          <p
            className={cn(
              'text-sm font-black leading-tight',
              isTop ? 'text-slate-900' : 'text-slate-700',
            )}
          >
            {entry.name}
          </p>
          {entry.secondary && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-emerald-500">
              {/* trending_up icon via CSS mask (avoids Material icon dep) */}
              <span aria-hidden="true" className="text-[10px]">↑</span>
              {entry.secondary}
            </p>
          )}
        </div>
      </div>

      {/* Primary metric — Montserrat Black */}
      <span
        className={cn(
          'font-black tracking-tight',
          isTop ? 'text-base text-slate-900' : 'text-[15px] text-slate-700',
        )}
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        {entry.primary}
      </span>
    </div>
  )
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

/**
 * Leaderboard — GlassCard with header + vertical rank-row list.
 *
 * Rank badges: 1 = yellow, 2 = slate, 3 = amber-orange.
 * #1 row has faint emerald row background + left accent bar.
 * Hover: bg-white/50, 150 ms transition.
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({ title, entries }) => {
  return (
    <GlassCard padding="md">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span aria-hidden="true" className="text-xl text-emerald-500">🏆</span>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>

      {/* Column labels */}
      <div className="mb-1.5 flex items-center px-[14px]">
        <ColHeader className="flex-1">Full Name</ColHeader>
        <ColHeader>Revenue</ColHeader>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1">
        {entries.map((entry) => (
          <LeaderboardRow key={entry.rank} entry={entry} />
        ))}
      </div>
    </GlassCard>
  )
}

Leaderboard.displayName = 'Leaderboard'
