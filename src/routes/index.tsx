import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // TODO: check auth state and redirect accordingly
    // For now, redirect to dashboard as placeholder
    throw redirect({ to: '/dashboard' })
  },
  component: IndexPage,
})

function IndexPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting…</p>
    </div>
  )
}
