import { useState } from 'react'
import { Pagination } from '@/components/ui/pagination'

export function PaginationSection() {
  const [page1, setPage1] = useState(1)
  const [page2, setPage2] = useState(5)
  const [page3, setPage3] = useState(1)

  return (
    <section id="pagination" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pagination</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Page navigation with ellipsis condensing for large page counts.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Small (5 pages)</p>
        <Pagination
          page={page1}
          totalPages={5}
          onPageChange={setPage1}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">Current page: {page1}</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Large (20 pages, starting at 5)</p>
        <Pagination
          page={page2}
          totalPages={20}
          onPageChange={setPage2}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">Current page: {page2}</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Single page (disabled)</p>
        <Pagination
          page={page3}
          totalPages={1}
          onPageChange={setPage3}
        />
      </div>
    </section>
  )
}
