import { Archive, Trash2, MailOpen, Flag } from 'lucide-react'
import { SwipeActions } from '@/components/ui/swipe-actions'

const CONTACTS = [
  {
    id: 'alice',
    name: 'Alice Hartmann',
    preview: 'Hey, are you coming to the team standup later today?',
    time: '9:41 AM',
    avatar: 'AH',
    color: 'bg-violet-500',
  },
  {
    id: 'bob',
    name: 'Bob Chen',
    preview: 'Just sent you the revised proposal. Let me know your thoughts.',
    time: 'Yesterday',
    avatar: 'BC',
    color: 'bg-sky-500',
  },
  {
    id: 'carol',
    name: 'Carol Navarro',
    preview: 'The meeting notes are attached. Can you review before Thursday?',
    time: 'Tuesday',
    avatar: 'CN',
    color: 'bg-emerald-500',
  },
]

export function SwipeActionsSection() {
  return (
    <section id="swipe-actions" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Swipe Actions</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          iOS-style swipe-to-reveal row actions. Drag left to delete, right to archive.
          Velocity {'>'}0.8 px/ms or 50% reveal threshold commits the action.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Ported from rit3zh/expo-ios-like-swipe-actions.
        </p>
      </div>

      <div role="list" aria-label="Messages" className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
        {CONTACTS.map((contact) => (
          <SwipeActions.Root
            key={contact.id}
            onLeftAction={() => console.log(`Archive: ${contact.name}`)}
            onRightAction={() => console.log(`Delete: ${contact.name}`)}
          >
            {/* Left: Archive */}
            <SwipeActions.LeftActions>
              <button
                type="button"
                aria-label={`Archive message from ${contact.name}`}
                className="flex flex-col items-center justify-center gap-1 w-20 bg-emerald-500 text-white text-xs font-medium transition-opacity hover:bg-emerald-600 active:bg-emerald-700"
              >
                <Archive size={18} aria-hidden />
                <span>Archive</span>
              </button>
              <button
                type="button"
                aria-label={`Mark message from ${contact.name} as read`}
                className="flex flex-col items-center justify-center gap-1 w-20 bg-sky-500 text-white text-xs font-medium transition-opacity hover:bg-sky-600 active:bg-sky-700"
              >
                <MailOpen size={18} aria-hidden />
                <span>Read</span>
              </button>
            </SwipeActions.LeftActions>

            {/* Right: Flag + Delete */}
            <SwipeActions.RightActions>
              <button
                type="button"
                aria-label={`Flag message from ${contact.name}`}
                className="flex flex-col items-center justify-center gap-1 w-20 bg-amber-500 text-white text-xs font-medium transition-opacity hover:bg-amber-600 active:bg-amber-700"
              >
                <Flag size={18} aria-hidden />
                <span>Flag</span>
              </button>
              <button
                type="button"
                aria-label={`Delete message from ${contact.name}`}
                className="flex flex-col items-center justify-center gap-1 w-20 bg-red-500 text-white text-xs font-medium transition-opacity hover:bg-red-600 active:bg-red-700"
              >
                <Trash2 size={18} aria-hidden />
                <span>Delete</span>
              </button>
            </SwipeActions.RightActions>

            {/* Row content */}
            <SwipeActions.Content className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 shrink-0 rounded-full ${contact.color} flex items-center justify-center text-white text-sm font-semibold`}
                  aria-hidden="true"
                >
                  {contact.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {contact.name}
                    </span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0">
                      {contact.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400 truncate">
                    {contact.preview}
                  </p>
                </div>
              </div>
            </SwipeActions.Content>
          </SwipeActions.Root>
        ))}
      </div>

      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        Tip: drag a row left or right. Honors prefers-reduced-motion (instant snaps).
      </p>
    </section>
  )
}
