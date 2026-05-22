import { ScrollArea } from '@/components/ui/scroll-area'

const MONTH_VALUES: Record<string, number> = {
  Jan: 42, Feb: 35, Mar: 58, Apr: 47, May: 61, Jun: 53,
  Jul: 68, Aug: 72, Sep: 55, Oct: 48, Nov: 39, Dec: 45,
}

const LONG_LIST = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Lead #${i + 1}`,
  company: ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli'][i % 5],
  value: `$${(Math.round((i + 1) * 4.7 * 100) / 100).toFixed(0)}K`,
}))

export function ScrollAreaSection() {
  return (
    <section id="scroll-area" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Scroll Area</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Custom-scrollbar container that clips content and renders a styled thumb.
        </p>
      </div>

      {/* Variant 1: vertical list */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Vertical list (200px height)</p>
        <ScrollArea className="h-48 w-full rounded-lg border border-slate-200 dark:border-slate-600">
          <div className="p-2 space-y-1">
            {LONG_LIST.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.company}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">{item.value}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Variant 2: horizontal scroll */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Horizontal scroll</p>
        <ScrollArea className="w-full rounded-lg border border-slate-200 dark:border-slate-600" orientation="horizontal">
          <div className="flex gap-3 p-3" style={{ width: 'max-content' }}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
              <div
                key={month}
                className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-700 px-4 py-3 min-w-[80px]"
              >
                <span className="text-xs text-slate-500 dark:text-slate-400">{month}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {MONTH_VALUES[month]}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </section>
  )
}
