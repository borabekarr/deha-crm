import {
  Tooltip,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'

export function TooltipSection() {
  return (
    <section id="tooltip" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Tooltip</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Hover or focus reveals a short label anchored near the trigger element.
        </p>
      </div>

      {/* Contract-level API: <Tooltip content="..."><trigger /></Tooltip> */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Button tooltips (contract API)</p>
        <div className="flex flex-wrap items-center gap-4">
          <Tooltip content="Default tooltip">
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
            >
              Hover me
            </button>
          </Tooltip>

          <Tooltip content="Add new lead">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
              aria-label="Add lead"
            >
              +
            </button>
          </Tooltip>

          <Tooltip content="This action cannot be undone">
            <button
              type="button"
              className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Manual composition API: TooltipProvider + TooltipRoot + TooltipTrigger + TooltipContent */}
      <TooltipProvider>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Icon tooltips (compound API)</p>
          <div className="flex items-center gap-6">
            {[
              { icon: 'dashboard', tip: 'Dashboard' },
              { icon: 'people', tip: 'Leads' },
              { icon: 'task_alt', tip: 'Tasks' },
              { icon: 'bar_chart', tip: 'Reports' },
              { icon: 'settings', tip: 'Settings' },
            ].map(({ icon, tip }) => (
              <TooltipRoot key={icon}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={tip}
                    className="flex size-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tip}</TooltipContent>
              </TooltipRoot>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </section>
  )
}
