import * as React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard, type GlassCardProps } from './GlassCard'

const MetricSparkline = React.lazy(() => import('./MetricSparkline'))

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

export function MetricCard({ label, value, trend, sparkline, className, ref, ...rest }: MetricCardProps & { ref?: React.Ref<HTMLDivElement> }) {
    const sparkData = sparkline?.map((v) => ({ v })) ?? []

    return (
      <GlassCard
        ref={ref}
        padding="md"
        radius="lg"
        className={cn('flex flex-col gap-2', className)}
        {...rest}
      >
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          {label}
        </span>

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

        {sparkData.length > 0 && (
          <div className="mt-1 -mx-1">
            <React.Suspense fallback={<div style={{ height: 40 }} />}>
              <MetricSparkline data={sparkData} />
            </React.Suspense>
          </div>
        )}
      </GlassCard>
    )
}
