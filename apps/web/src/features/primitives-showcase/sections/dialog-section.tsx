import { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'

export function DialogSection() {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <section id="dialog" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dialog</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Modal overlay dialogs for confirmations, forms, and focused interactions.
        </p>
      </div>

      {/* Variant 1: Info dialog */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Info dialog</p>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              View Details
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lead Information</DialogTitle>
              <DialogDescription>Details about Ahmet Yilmaz</DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-2 text-sm">
              {[
                { label: 'Email', value: 'ahmet@example.com' },
                { label: 'Phone', value: '+90 555 123 45 67' },
                { label: 'Company', value: 'Acme Corp' },
                { label: 'Value', value: '$42,000' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Variant 2: Destructive confirm */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Destructive confirmation</p>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Delete Lead
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              }
            >
              <DialogTitle>Delete Lead</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this lead? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
