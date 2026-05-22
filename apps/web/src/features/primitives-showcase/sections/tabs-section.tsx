import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function TabsSection() {
  return (
    <section id="tabs" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Tabs</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Segmented pill tabs for switching between related content panels.
        </p>
      </div>

      {/* Variant 1: Three tabs */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Three tabs</p>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Overview panel content.</p>
          </TabsContent>
          <TabsContent value="analytics">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Analytics panel content.</p>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Settings panel content.</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Variant 2: Two tabs */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Two tabs</p>
        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Daily view.</p>
          </TabsContent>
          <TabsContent value="weekly">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Weekly view.</p>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
