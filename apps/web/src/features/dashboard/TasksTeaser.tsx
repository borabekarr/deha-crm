import { GlassCard } from '@/components/design-system/GlassCard'
import { TaskCard } from '@/components/design-system/TaskCard'

export function TasksTeaser() {
  return (
    <GlassCard padding="md">
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Görevler
        </h3>
        <a
          href="/tasks"
          className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
        >
          Tüm Görevleri Gör →
        </a>
      </div>

      <div className="flex flex-col gap-3">
        <TaskCard
          title="Yeni müşteri görüşmesi ayarla — Ahmet Bey"
          priority="high"
          eta="12:00"
        />
        <TaskCard
          title="Haftalık satış raporunu hazırla"
          priority="medium"
          eta="Cuma"
        />
        <TaskCard
          title="CRM veri güncelleme kontrolü"
          priority="low"
        />
      </div>
    </GlassCard>
  )
}
