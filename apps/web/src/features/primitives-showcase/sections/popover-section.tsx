import { useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

export function PopoverSection() {
  const [open1, setOpen1] = useState(false)
  const [open2, setOpen2] = useState(false)

  return (
    <section id="popover" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Popover</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Floating panels anchored to a trigger element with rich content.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Basic popover</p>
        <Popover open={open1} onOpenChange={setOpen1}>
          <PopoverTrigger>
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
            >
              Open Popover
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Popover title</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              This is a basic popover with some descriptive content inside.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Popover with actions</p>
        <Popover open={open2} onOpenChange={setOpen2}>
          <PopoverTrigger>
            <button
              type="button"
              className="rounded-xl border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600"
            >
              Filter Options
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 space-y-3">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Filter by status</p>
            {['Active', 'Pending', 'Closed'].map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input type="checkbox" className="accent-emerald-500" defaultChecked={s === 'Active'} />
                {s}
              </label>
            ))}
            <button
              type="button"
              onClick={() => setOpen2(false)}
              className="mt-2 w-full rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
            >
              Apply
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  )
}
