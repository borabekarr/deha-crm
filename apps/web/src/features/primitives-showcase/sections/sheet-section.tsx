import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

export function SheetSection() {
  return (
    <section id="sheet" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Sheet</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Bottom or side drawer built on Vaul with snap points for peek and full states.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Side sheet</p>
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
            >
              Open Lead Details
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Lead Details</SheetTitle>
              <SheetDescription>Ahmet Yilmaz, Enterprise prospect</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Company', value: 'Acme Corp' },
                { label: 'Stage', value: 'Qualified' },
                { label: 'Value', value: '$42,000' },
                { label: 'Owner', value: 'Bora Bekar' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-neutral-500">{label}</span>
                  <span className="font-medium text-neutral-900">{value}</span>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Action sheet</p>
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="rounded-xl border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600"
            >
              Quick Actions
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Quick Actions</SheetTitle>
              <SheetDescription>Choose an action to perform</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {['Call Lead', 'Send Email', 'Schedule Meeting', 'Add Note'].map((action) => (
                <button
                  key={action}
                  type="button"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {action}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </section>
  )
}
