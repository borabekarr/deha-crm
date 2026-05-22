import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

export function SheetSection() {
  return (
    <section id="sheet" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sheet</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Bottom or side drawer built on Vaul with snap points for peek and full states.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Side sheet</p>
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              Open Lead Details
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Lead Details</SheetTitle>
              <SheetDescription>Ahmet Yilmaz — Enterprise prospect</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Company', value: 'Acme Corp' },
                { label: 'Stage', value: 'Qualified' },
                { label: 'Value', value: '$42,000' },
                { label: 'Owner', value: 'Bora Bekar' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Action sheet</p>
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
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
