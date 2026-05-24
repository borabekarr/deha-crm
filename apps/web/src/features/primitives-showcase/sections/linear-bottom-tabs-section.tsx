import { Home, Search, Inbox, User } from 'lucide-react'
import { LinearBottomTabs } from '@/components/ui/linear-bottom-tabs'

export function LinearBottomTabsSection() {
  return (
    <section id="linear-bottom-tabs" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Linear Bottom Tabs</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Floating bottom tab bar inspired by Linear. A shared-layout pill slides between hovered/focused
          tabs; the active tab has its own independent indicator.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Ported from rit3zh/expo-linear-like-bottom-tabs.
        </p>
      </div>

      {/* Variant 1: Icon + label */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Icon + label</p>
        <div className="flex justify-center">
          <LinearBottomTabs.Root defaultValue="home" scopeId="linear-tabs-demo-1">
            <LinearBottomTabs.Tab value="home" icon={<Home size={20} />}>
              Home
            </LinearBottomTabs.Tab>
            <LinearBottomTabs.Tab value="search" icon={<Search size={20} />}>
              Search
            </LinearBottomTabs.Tab>
            <LinearBottomTabs.Tab value="inbox" icon={<Inbox size={20} />}>
              Inbox
            </LinearBottomTabs.Tab>
            <LinearBottomTabs.Tab value="profile" icon={<User size={20} />}>
              Profile
            </LinearBottomTabs.Tab>
          </LinearBottomTabs.Root>
        </div>
      </div>

      {/* Variant 2: Icon-only */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Icon only</p>
        <div className="flex justify-center">
          <LinearBottomTabs.Root defaultValue="home" scopeId="linear-tabs-demo-2">
            <LinearBottomTabs.Tab value="home" icon={<Home size={20} />} aria-label="Home" />
            <LinearBottomTabs.Tab value="search" icon={<Search size={20} />} aria-label="Search" />
            <LinearBottomTabs.Tab value="inbox" icon={<Inbox size={20} />} aria-label="Inbox" />
            <LinearBottomTabs.Tab value="profile" icon={<User size={20} />} aria-label="Profile" />
          </LinearBottomTabs.Root>
        </div>
      </div>

      {/* Variant 3: Contextual in a phone-like frame */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">In context (phone frame)</p>
        <div className="flex justify-center">
          <div className="relative w-64 h-48 rounded-2xl bg-neutral-100 dark:bg-neutral-900 overflow-hidden border border-neutral-200 dark:border-neutral-700 flex items-end justify-center pb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-neutral-400">App content</p>
            </div>
            <LinearBottomTabs.Root defaultValue="home" scopeId="linear-tabs-demo-3">
              <LinearBottomTabs.Tab value="home" icon={<Home size={18} />} aria-label="Home" />
              <LinearBottomTabs.Tab value="search" icon={<Search size={18} />} aria-label="Search" />
              <LinearBottomTabs.Tab value="inbox" icon={<Inbox size={18} />} aria-label="Inbox" />
              <LinearBottomTabs.Tab value="profile" icon={<User size={18} />} aria-label="Profile" />
            </LinearBottomTabs.Root>
          </div>
        </div>
      </div>
    </section>
  )
}
