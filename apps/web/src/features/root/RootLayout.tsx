import { Outlet, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Agentation } from 'agentation'
import { motionTransition } from '@/lib/motion'
import Toaster from '@/components/ui/toaster'
import { Toastiva } from '@/components/ui/toastiva'

const CURRENT_YEAR = new Date().getFullYear()

export function RootLayout() {
  const location = useLocation()
  const isFullScreenShell =
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/primitives')

  if (isFullScreenShell) {
    return (
      <>
        <Outlet />
        <Toaster />
        <Toastiva />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
        {import.meta.env.DEV && <Agentation />}
      </>
    )
  }

  return (
    <>
      <header className="border-b px-6 py-4" data-motion-base={motionTransition().duration}>
        <span className="text-lg font-semibold">Deha CRM</span>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t px-6 py-3 text-sm text-muted-foreground">
        &copy; {CURRENT_YEAR} Deha Automation
      </footer>
      <Toaster />
      <Toastiva />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
      {import.meta.env.DEV && <Agentation />}
    </>
  )
}
