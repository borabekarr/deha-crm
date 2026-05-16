import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { GlassCard } from '@/components/design-system/GlassCard'
import { HeroCard } from '@/components/design-system/HeroCard'
import { MetricCard } from '@/components/design-system/MetricCard'
import { Leaderboard } from '@/components/design-system/Leaderboard'
import { TaskCard } from '@/components/design-system/TaskCard'
import { SegmentedPills } from '@/components/design-system/SegmentedPills'
import { Button } from '@/components/design-system/Button'
import { HeroChart } from '@/components/design-system/HeroChart'

// ── Mock data ─────────────────────────────────────────────────────────────────

const heroChartData = [
  { x: 'Pzt', y: 38 },
  { x: 'Sal', y: 52 },
  { x: 'Crs', y: 45 },
  { x: 'Per', y: 61 },
  { x: 'Cum', y: 55 },
  { x: 'Cmt', y: 72 },
  { x: 'Paz', y: 68 },
]

const leaderboardEntries = [
  { rank: 1, name: 'Bora', primary: '$320K', secondary: 'Top 1%' },
  { rank: 2, name: 'Ahmet Y.', primary: '$281K', secondary: 'Top 5%' },
  { rank: 3, name: 'Selin K.', primary: '$254K', secondary: 'Top 10%' },
  { rank: 4, name: 'Mert D.', primary: '$197K', secondary: 'Top 20%' },
  { rank: 5, name: 'Zeynep A.', primary: '$154K', secondary: 'Top 30%' },
]

const newLeadsSparkline = [28, 35, 30, 42, 38, 50, 48, 55, 52, 60]
const predictedValueSparkline = [85, 90, 88, 95, 92, 100, 105, 110, 108, 115]
const dailySpendSparkline = [120, 115, 118, 112, 116, 110, 114, 108, 113, 107]
const monthlyLeadsSparkline = [38, 40, 42, 41, 44, 43, 46, 45, 47, 48]

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

// ── Sticky glass header ───────────────────────────────────────────────────────

function DashboardHeader() {
  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.6)',
      }}
    >
      {/* Wordmark */}
      <span
        className="text-xl font-black tracking-tight text-slate-900"
        style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
      >
        deha
        <span className="text-emerald-500">.</span>
      </span>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          type="button"
          aria-label="Bildirimler"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-sm border border-white/60"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            notifications
          </span>
          {/* Red dot */}
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"
          />
        </button>

        {/* Avatar placeholder */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-black shadow-sm"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          B
        </div>
      </div>
    </div>
  )
}

// ── Hero section ──────────────────────────────────────────────────────────────

interface HeroSectionProps {
  period: string
  onPeriodChange: (v: string) => void
}

function HeroSection({ period, onPeriodChange }: HeroSectionProps) {
  return (
    <HeroCard padding="lg" withGrid>
      {/* Greeting row */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2
            className="text-2xl font-black text-white leading-tight"
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
          >
            Hoş geldin Bora!
          </h2>
          <p className="mt-1 text-sm font-medium text-white/80">
            İşletmenle ilgili son gelişmeler burada.
          </p>
        </div>

        {/* Sparkle icon */}
        <span
          className="text-2xl leading-none select-none"
          aria-hidden="true"
        >
          ✨
        </span>
      </div>

      {/* CTA button */}
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

      {/* Segmented pills */}
      <div className="mb-4">
        <SegmentedPills
          options={['Daily', 'Weekly', 'Monthly']}
          value={period}
          onChange={onPeriodChange}
          className="bg-white/20 [box-shadow:inset_0_2px_4px_rgba(0,0,0,0.08)]"
        />
      </div>

      {/* Hero chart */}
      <HeroChart data={heroChartData} height={160} className="-mx-1" />
    </HeroCard>
  )
}

// ── Metric grid ───────────────────────────────────────────────────────────────

function MetricGrid() {
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

// ── Personal Goal Tracker ─────────────────────────────────────────────────────

function PersonalGoalTracker() {
  const progress = 68

  return (
    <GlassCard padding="md">
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-base font-black text-slate-900"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Personal Goal Tracker
        </h3>
        <span className="text-sm font-black text-emerald-500">{progress}%</span>
      </div>

      <p className="mb-4 text-xs font-medium text-slate-500">
        Aylık hedefinize ulaşmak için {100 - progress} puan daha!
      </p>

      {/* Recessed track */}
      <div
        className="relative h-3 w-full overflow-hidden rounded-full"
        style={{
          background: 'rgba(15,23,42,0.08)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.12)',
        }}
      >
        {/* Emerald fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-emerald-500"
          style={{
            width: `${progress}%`,
            boxShadow: '0 2px 8px rgba(16,185,129,0.45)',
          }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span>0</span>
        <span>Hedef: 100 puan</span>
      </div>
    </GlassCard>
  )
}

// ── Tasks teaser ──────────────────────────────────────────────────────────────

function TasksTeaser() {
  return (
    <GlassCard padding="md">
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-base font-black text-slate-900"
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

// ── Dashboard page ────────────────────────────────────────────────────────────

function DashboardPage() {
  const [period, setPeriod] = useState('Daily')

  return (
    <div className="relative min-h-screen">
      {/* Sticky header sits outside scroll column */}
      <DashboardHeader />

      {/* Scrollable content column — 430px max, centered on desktop */}
      <div className="mx-auto max-w-[430px] px-4 py-6 space-y-6">
        <HeroSection period={period} onPeriodChange={setPeriod} />
        <MetricGrid />
        <Leaderboard title="Leaderboard" entries={leaderboardEntries} />
        <PersonalGoalTracker />
        <TasksTeaser />
        {/* Bottom breathing room for mobile nav */}
        <div className="h-6" />
      </div>
    </div>
  )
}
