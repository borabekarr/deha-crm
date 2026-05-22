import { toast } from '@/hooks/use-toast'

export function ToastSection() {
  return (
    <section id="toast" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Toast</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Transient notification banners that auto-dismiss after a configurable duration.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Trigger by variant</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => toast({ title: 'Lead saved', description: 'Ahmet Yilmaz has been updated.', variant: 'default' })}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
          >
            Default
          </button>
          <button
            type="button"
            onClick={() => toast({ title: 'Lead qualified!', description: 'Ready for the next stage.', variant: 'success' })}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Success
          </button>
          <button
            type="button"
            onClick={() => toast({ title: 'Check required', description: 'Some fields need your attention.', variant: 'warning' })}
            className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
          >
            Warning
          </button>
          <button
            type="button"
            onClick={() => toast({ title: 'Action failed', description: 'Could not delete the lead.', variant: 'danger' })}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Danger
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Title only</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => toast({ title: 'Copied to clipboard', variant: 'default' })}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
          >
            Toast (title only)
          </button>
          <button
            type="button"
            onClick={() => toast({ title: 'Email sent!', variant: 'success' })}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Success (title only)
          </button>
        </div>
      </div>
    </section>
  )
}
