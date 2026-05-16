import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const location = useLocation()
  const isMobileShell = location.pathname === '/dashboard'

  if (isMobileShell) {
    return (
      <>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </>
    )
  }

  return (
    <>
      <header className="border-b px-6 py-4">
        <span className="text-lg font-semibold">Deha CRM</span>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t px-6 py-3 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Deha Automation
      </footer>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}
