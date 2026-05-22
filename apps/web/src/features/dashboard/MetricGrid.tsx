import { MetricCard } from '@/components/design-system/MetricCard'

const newLeadsSparkline = [28, 35, 30, 42, 38, 50, 48, 55, 52, 60]
const predictedValueSparkline = [85, 90, 88, 95, 92, 100, 105, 110, 108, 115]
const dailySpendSparkline = [120, 115, 118, 112, 116, 110, 114, 108, 113, 107]
const monthlyLeadsSparkline = [38, 40, 42, 41, 44, 43, 46, 45, 47, 48]

export function MetricGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        label="New Leads"
        value="142"
        trend={{ direction: 'up', pct: 12 }}
        sparkline={newLeadsSparkline}
      />
      <MetricCard
        label="Predicted Value"
        value="$1.2M"
        trend={{ direction: 'up', pct: 8 }}
        sparkline={predictedValueSparkline}
      />
      <MetricCard
        label="Daily Spend"
        value="&#x20BA;112.5"
        trend={{ direction: 'down', pct: 3 }}
        sparkline={dailySpendSparkline}
      />
      <MetricCard
        label="Monthly Leads"
        value="48"
        trend={{ direction: 'up', pct: 5 }}
        sparkline={monthlyLeadsSparkline}
      />
    </div>
  )
}
