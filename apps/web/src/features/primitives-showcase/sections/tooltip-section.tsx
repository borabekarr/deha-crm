import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'

export function TooltipSection() {
  return (
    <section id="tooltip" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tooltip</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Hover or focus reveals a short label anchored near the trigger element.
        </p>
      </div>

      <TooltipProvider>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Button tooltips</p>
          <div className="flex flex-wrap items-center gap-4">
            <Tooltip content="Default tooltip">
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                  Hover me
                </button>
              </TooltipTrigger>
              <TooltipContent>Default tooltip</TooltipContent>
            </Tooltip>

            <Tooltip content="Add new lead">
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                  aria-label="Add lead"
                >
                  +
                </button>
              </TooltipTrigger>
              <TooltipContent>Add new lead</TooltipContent>
            </Tooltip>

            <Tooltip content="This action cannot be undone">
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </TooltipTrigger>
              <TooltipContent>This action cannot be undone</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Icon tooltips</p>
          <div className="flex items-center gap-6">
            {[
              { icon: 'dashboard', tip: 'Dashboard' },
              { icon: 'people', tip: 'Leads' },
              { icon: 'task_alt', tip: 'Tasks' },
              { icon: 'bar_chart', tip: 'Reports' },
              { icon: 'settings', tip: 'Settings' },
            ].map(({ icon, tip }) => (
              <Tooltip key={icon} content={tip}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={tip}
                    className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tip}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </section>
  )
}
