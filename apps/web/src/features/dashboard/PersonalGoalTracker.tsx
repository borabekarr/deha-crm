import { GlassCard } from '@/components/design-system/GlassCard'

export function PersonalGoalTracker() {
  const progress = 68

  return (
    <GlassCard padding="md">
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Personal Goal Tracker
        </h3>
        <span className="text-sm font-black text-emerald-500">{progress}%</span>
      </div>

      <p className="mb-4 text-xs font-medium text-muted-foreground">
        Aylık hedefinize ulaşmak için {100 - progress} puan daha!
      </p>

      <div
        className="relative h-3 w-full overflow-hidden rounded-full"
        style={{
          background: 'rgba(15,23,42,0.08)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.12)',
        }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-emerald-500"
          style={{
            width: `${progress}%`,
            boxShadow: '0 2px 8px rgba(16,185,129,0.45)',
          }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <span>0</span>
        <span>Hedef: 100 puan</span>
      </div>
    </GlassCard>
  )
}
