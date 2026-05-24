import { ProgressiveBlur } from '@/components/ui/progressive-blur'

const LEADS = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Lead #${String(i + 1).padStart(2, '0')}`,
  company: ['Acme Corp', 'Globex Inc', 'Initech', 'Umbrella Co', 'Hooli'][i % 5],
  stage: ['Prospect', 'Qualified', 'Proposal', 'Negotiation', 'Closed'][i % 5],
  value: `$${(Math.round((i + 1) * 6.3 * 100) / 100).toFixed(0)}K`,
}))

const STAGE_COLOR: Record<string, string> = {
  Prospect: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  Qualified: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Proposal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Negotiation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

export function ProgressiveBlurSection() {
  return (
    <section id="progressive-blur" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Progressive Blur
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Scroll-linked backdrop-filter blur. The sticky header gains blur as the list
          scrolls beneath it. Respects <code className="font-mono text-xs">prefers-reduced-motion</code>.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Ported from rit3zh/expo-progressive-blur.
        </p>
      </div>

      {/* Variant 1: Compound ProgressiveBlur */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
          ProgressiveBlur compound (Root + Header + Content)
        </p>

        <ProgressiveBlur.Root className="h-72">
          <ProgressiveBlur.Header className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-700/60">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                CRM Pipeline
              </span>
              <span className="text-xs text-neutral-400">{LEADS.length} leads</span>
            </div>
          </ProgressiveBlur.Header>

          <ProgressiveBlur.Content className="p-2 space-y-1">
            {LEADS.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {lead.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{lead.company}</p>
                </div>
                <div className="ml-3 flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLOR[lead.stage]}`}
                  >
                    {lead.stage}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {lead.value}
                  </span>
                </div>
              </div>
            ))}
            {/* Bottom breathing room */}
            <div className="h-4" />
          </ProgressiveBlur.Content>
        </ProgressiveBlur.Root>
      </div>

      {/* Variant 2: With topGradient */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
          With top gradient mask
        </p>

        <ProgressiveBlur.Root className="h-64">
          <ProgressiveBlur.Header
            topGradient
            className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-700/60"
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                Live Feed
              </span>
            </div>
          </ProgressiveBlur.Header>

          <ProgressiveBlur.Content className="p-2 space-y-1">
            {LEADS.slice(0, 20).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <div className="size-7 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-500 dark:text-neutral-400 shrink-0">
                  {lead.name[lead.name.length - 1]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {lead.name}
                  </p>
                  <p className="text-xs text-neutral-400">{lead.company}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                  {lead.value}
                </span>
              </div>
            ))}
            <div className="h-4" />
          </ProgressiveBlur.Content>
        </ProgressiveBlur.Root>
      </div>
    </section>
  )
}
