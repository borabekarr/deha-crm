import { HeroCard } from '@/components/design-system/HeroCard'
import { Button } from '@/components/design-system/Button'
import { SegmentedPills } from '@/components/design-system/SegmentedPills'
import { HeroChart } from '@/components/design-system/HeroChart'

const heroChartData = [
  { x: 'Pzt', y: 38 },
  { x: 'Sal', y: 52 },
  { x: 'Crs', y: 45 },
  { x: 'Per', y: 61 },
  { x: 'Cum', y: 55 },
  { x: 'Cmt', y: 72 },
  { x: 'Paz', y: 68 },
]

interface HeroSectionProps {
  period: string
  onPeriodChange: (v: string) => void
}

export function HeroSection({ period, onPeriodChange }: HeroSectionProps) {
  return (
    <HeroCard padding="lg" withGrid>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-white leading-tight"
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
          >
            Hoş geldin Bora!
          </h2>
          <p className="mt-1 text-sm font-medium text-white/80">
            İşletmenle ilgili son gelişmeler burada.
          </p>
        </div>

        <span
          className="text-2xl leading-none select-none"
          aria-hidden="true"
        >
          ✨
        </span>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="mb-5 text-emerald-600 font-extrabold border-white/40"
      >
        View Your Leads
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
          arrow_forward
        </span>
      </Button>

      <div className="mb-4">
        <SegmentedPills
          options={['Daily', 'Weekly', 'Monthly']}
          value={period}
          onChange={onPeriodChange}
          className="bg-white/20 [box-shadow:inset_0_2px_4px_rgba(0,0,0,0.08)]"
        />
      </div>

      <HeroChart data={heroChartData} height={160} className="-mx-1" />
    </HeroCard>
  )
}
