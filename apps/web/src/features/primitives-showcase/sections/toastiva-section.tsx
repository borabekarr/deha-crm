import { toastiva, type ToastivaPosition, type ToastivaVariant } from '@/components/ui/toastiva'

const VARIANTS: { value: ToastivaVariant; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
]

const POSITIONS: { value: ToastivaPosition; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
]

const VARIANT_BTN_CLASS: Record<ToastivaVariant, string> = {
  default:
    'border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  warning:
    'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
  danger:
    'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
}

const SAMPLE_TITLES: Record<ToastivaVariant, string> = {
  default: 'Lead saved',
  success: 'Lead qualified!',
  warning: 'Check required',
  danger: 'Action failed',
}

const SAMPLE_DESCRIPTIONS: Record<ToastivaVariant, string> = {
  default: 'Ahmet Yilmaz has been updated.',
  success: 'Ready for the next stage.',
  warning: 'Some fields need your attention.',
  danger: 'Could not delete the lead.',
}

export function ToastivaSection() {
  return (
    <section id="toastiva" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Toastiva</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Animated, position-aware toast notifications with blur header, variant morph, and swipe-to-dismiss.
          Drag a toast horizontally (over 80 px or fast fling) to dismiss it.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Ported from rit3zh/toastiva.
        </p>
      </div>

      {/* Per-position trigger rows */}
      {POSITIONS.map(({ value: pos, label: posLabel }) => (
        <div
          key={pos}
          className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-3"
        >
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{posLabel}</p>
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map(({ value: variant, label: variantLabel }) => (
              <button
                key={`${pos}-${variant}`}
                type="button"
                onClick={() =>
                  toastiva({
                    title: SAMPLE_TITLES[variant],
                    description: SAMPLE_DESCRIPTIONS[variant],
                    variant,
                    position: pos,
                  })
                }
                className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${VARIANT_BTN_CLASS[variant]}`}
              >
                {variantLabel}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
