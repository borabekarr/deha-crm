import { IOSPopover } from '@/components/ui/ios-popover'

const ACTIONS = [
  { id: 'copy', label: 'Copy Link', icon: '⎘' },
  { id: 'share', label: 'Share', icon: '↑' },
  { id: 'edit', label: 'Edit', icon: '✎' },
  { id: 'delete', label: 'Delete', icon: '⌫', destructive: true },
]

const QUICK_ACTIONS = [
  { id: 'call', label: 'Call', icon: '📞' },
  { id: 'message', label: 'Message', icon: '💬' },
  { id: 'email', label: 'Email', icon: '✉️' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'note', label: 'Add Note', icon: '📝' },
]

export function IOSPopoverSection() {
  return (
    <section id="ios-popover" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          iOS Popover
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Radix Popover with scale-from-anchor entrance, 14 px radius, glass blur, and
          animated arrow. Honors{' '}
          <code className="font-mono text-xs">prefers-reduced-motion</code>.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Ported from rit3zh/expo-ios-popover (rebased on Radix Popover).
        </p>
      </div>

      {/* Variant 1: Action menu */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
        <p className="mb-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Action menu
        </p>
        <div className="flex items-center justify-start">
          <IOSPopover.Root>
            <IOSPopover.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-neutral-900 shadow-sm hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors"
              >
                <span>More options</span>
                <span aria-hidden="true" className="text-xs opacity-60">▾</span>
              </button>
            </IOSPopover.Trigger>
            <IOSPopover.Content side="bottom" align="start">
              <div className="py-1.5" role="menu" aria-label="Action menu">
                {ACTIONS.map((action, i) => (
                  <div key={action.id}>
                    {i > 0 && (
                      <div className="mx-3 h-px bg-neutral-200/60 dark:bg-neutral-700/60" />
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className={[
                        'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        action.destructive
                          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                          : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/50',
                      ].join(' ')}
                    >
                      <span className="text-base leading-none" aria-hidden="true">
                        {action.icon}
                      </span>
                      {action.label}
                    </button>
                  </div>
                ))}
              </div>
            </IOSPopover.Content>
          </IOSPopover.Root>
        </div>
      </div>

      {/* Variant 2: Quick-contact popover with arrow */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
        <p className="mb-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Quick contact (with arrow)
        </p>
        <div className="flex items-center gap-3">
          <IOSPopover.Root>
            <IOSPopover.Trigger asChild>
              <button
                type="button"
                aria-label="Open contact actions for Yuki Tanaka"
                className="flex items-center gap-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-sm font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                  Y
                </span>
                <span>Yuki Tanaka</span>
              </button>
            </IOSPopover.Trigger>
            <IOSPopover.Content side="top" align="center">
              <IOSPopover.Arrow />
              <div className="px-1 py-2" role="menu" aria-label="Contact actions">
                <p className="px-3 pb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Quick actions
                </p>
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
                  >
                    <span className="text-base leading-none" aria-hidden="true">
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            </IOSPopover.Content>
          </IOSPopover.Root>
        </div>
      </div>
    </section>
  )
}
