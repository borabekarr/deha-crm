import { Home, Search } from 'lucide-react'
import { MotionTabs } from '@/components/ui/motion-tabs'

export function MotionTabsSection() {
  return (
    <section id="motion-tabs" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Motion Tabs</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Pill tabs with a shared-layout morph indicator powered by Framer Motion layoutId.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Ported from rit3zh/expo-motion-tabs.
        </p>
      </div>

      {/* Variant 1: Icon + label triggers */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Morph indicator</p>
        <MotionTabs.Root defaultValue="home" scopeId="motion-tabs-demo-1">
          <MotionTabs.List>
            <MotionTabs.Trigger value="home">
              <Home size={14} aria-hidden />
              Home
            </MotionTabs.Trigger>
            <MotionTabs.Trigger value="search">
              <Search size={14} aria-hidden />
              Search
            </MotionTabs.Trigger>
          </MotionTabs.List>
          <MotionTabs.Content value="home">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Home panel — the indicator morphs here.</p>
          </MotionTabs.Content>
          <MotionTabs.Content value="search">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Search panel — indicator morphed from Home.</p>
          </MotionTabs.Content>
        </MotionTabs.Root>
      </div>

      {/* Variant 2: Three tabs to show multi-stop morph */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Three stops</p>
        <MotionTabs.Root defaultValue="overview" scopeId="motion-tabs-demo-2">
          <MotionTabs.List>
            <MotionTabs.Trigger value="overview">Overview</MotionTabs.Trigger>
            <MotionTabs.Trigger value="analytics">Analytics</MotionTabs.Trigger>
            <MotionTabs.Trigger value="settings">Settings</MotionTabs.Trigger>
          </MotionTabs.List>
          <MotionTabs.Content value="overview">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Overview panel content.</p>
          </MotionTabs.Content>
          <MotionTabs.Content value="analytics">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Analytics panel content.</p>
          </MotionTabs.Content>
          <MotionTabs.Content value="settings">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Settings panel content.</p>
          </MotionTabs.Content>
        </MotionTabs.Root>
      </div>
    </section>
  )
}
