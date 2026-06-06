import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Agentation } from 'agentation'

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4">
        <span className="text-lg font-semibold">Deha Design System — Showcase</span>
      </header>
      <main className="flex-1 px-6 py-8">
        <Outlet />
      </main>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
      {import.meta.env.DEV && <Agentation />}
    </div>
  )
}
