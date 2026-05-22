import * as React from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

export interface MetricSparklineProps {
  data: { v: number }[]
}

export default function MetricSparkline({ data }: MetricSparklineProps) {
  const gradientId = React.useId()
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
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
  )
}
