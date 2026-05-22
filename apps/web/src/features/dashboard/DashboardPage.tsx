import { useState } from 'react'

import { Leaderboard } from '@/components/design-system/Leaderboard'
import { DashboardHeader } from './DashboardHeader'
import { HeroSection } from './HeroSection'
import { MetricGrid } from './MetricGrid'
import { PersonalGoalTracker } from './PersonalGoalTracker'
import { TasksTeaser } from './TasksTeaser'

const leaderboardEntries = [
  { rank: 1, name: 'Bora', primary: '$320K', secondary: 'Top 1%' },
  { rank: 2, name: 'Ahmet Y.', primary: '$281K', secondary: 'Top 5%' },
  { rank: 3, name: 'Selin K.', primary: '$254K', secondary: 'Top 10%' },
  { rank: 4, name: 'Mert D.', primary: '$197K', secondary: 'Top 20%' },
  { rank: 5, name: 'Zeynep A.', primary: '$154K', secondary: 'Top 30%' },
]

export function DashboardPage() {
  const [period, setPeriod] = useState('Daily')

  return (
    <div className="relative min-h-screen">
      <DashboardHeader />

      <div className="mx-auto max-w-[430px] px-4 py-6 space-y-6">
        <HeroSection period={period} onPeriodChange={setPeriod} />
        <MetricGrid />
        <Leaderboard title="Leaderboard" entries={leaderboardEntries} />
        <PersonalGoalTracker />
        <TasksTeaser />
        <div className="h-6" />
      </div>
    </div>
  )
}
