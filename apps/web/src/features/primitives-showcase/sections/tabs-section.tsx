import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function TabsSection() {
  return (
    <section id="tabs" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tabs</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Segmented pill tabs for switching between related content panels.
        </p>
      </div>

      {/* Variant 1: Three tabs */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Three tabs</p>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-slate-600 dark:text-slate-300">Overview panel content.</p>
          </TabsContent>
          <TabsContent value="analytics">
            <p className="text-sm text-slate-600 dark:text-slate-300">Analytics panel content.</p>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-sm text-slate-600 dark:text-slate-300">Settings panel content.</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Variant 2: Two tabs */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Two tabs</p>
        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <p className="text-sm text-slate-600 dark:text-slate-300">Daily view.</p>
          </TabsContent>
          <TabsContent value="weekly">
            <p className="text-sm text-slate-600 dark:text-slate-300">Weekly view.</p>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
