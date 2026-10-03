import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Deha CRM</h1>
      <p className="mt-1.5 text-sm">
        UI is being rebuilt from the Claude Design system (design-system/).
      </p>
    </div>
  ),
})
