import * as React from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { GlassCard, type GlassCardProps } from './GlassCard'

export interface MetricCardProps
  extends Omit<GlassCardProps, 'children'> {
  /** Metric label displayed above the value */
  label: string
  /** Large display value (e.g. "1,248" or 94) */
  value: string | number
  /** Optional trend chip: direction + percentage */
  trend?: {
    direction: 'up' | 'down'
    pct: number
  }
  /** Optional sparkline data (array of numbers) */
  sparkline?: number[]
}

/**
 * MetricCard — glass KPI card with optional trend chip and sparkline.
 *
 * Composes GlassCard. Trend chip uses Material Symbols Outlined icons.
 * Sparkline rendered via Recharts AreaChart with emerald gradient.
 */
export function MetricCard({ label, value, trend, sparkline, className, ref, ...rest }: MetricCardProps & { ref?: React.Ref<HTMLDivElement> }) {
    const sparkData = sparkline?.map((v) => ({ v })) ?? []

    const gradientId = React.useId()

    return (
      <GlassCard
        ref={ref}
        padding="md"
        radius="lg"
        className={cn('flex flex-col gap-2', className)}
        {...rest}
      >
        {/* Label */}
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          {label}
        </span>

        {/* Value + trend row */}
        <div className="flex items-end justify-between gap-2">
          <span
            className="font-black text-foreground leading-none"
            style={{ fontSize: '38px', fontFamily: "'Montserrat', sans-serif" }}
          >
            {value}
          </span>

          {trend && (
            <div
              className={cn(
                'flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold',
                trend.direction === 'up'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-600',
              )}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '14px', lineHeight: 1 }}
              >
                {trend.direction === 'up' ? 'trending_up' : 'trending_down'}
              </span>
              <span>{trend.pct}%</span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparkData.length > 0 && (
          <div className="mt-1 -mx-1">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill={`url(#${gradientId})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>
    )
}
