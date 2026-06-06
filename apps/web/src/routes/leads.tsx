import { createFileRoute } from '@tanstack/react-router'
import LeadsTable from '@/components/design-system/leads-table/LeadsTable'

export const Route = createFileRoute('/leads')({
  component: LeadsPage,
})

function LeadsPage() {
  return (
    // Prototype viewport: 1380x920 -- give the table breathing room
    <div style={{ minWidth: 1200, maxWidth: 1440, margin: '0 auto', padding: '0 0 48px' }}>
      {/* LeadPopover is managed internally by LeadsTable -- row click opens it */}
      <LeadsTable />
    </div>
  )
}
