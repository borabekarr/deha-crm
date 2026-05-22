import { Badge } from '@/components/ui/badge'

export function BadgeSection() {
  return (
    <section id="badge" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Badge</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Inline status labels and category tags with multiple semantic variants.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Variants</p>
        <div className="flex flex-wrap gap-3">
          <Badge variant="success">Success</Badge>
          <Badge variant="default">Default</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">In context</p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-700 dark:text-neutral-200">Lead status</span>
          <Badge variant="success">Qualified</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-700 dark:text-neutral-200">Priority</span>
          <Badge variant="danger">High</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-700 dark:text-neutral-200">Category</span>
          <Badge variant="neutral">Enterprise</Badge>
        </div>
      </div>
    </section>
  )
}
