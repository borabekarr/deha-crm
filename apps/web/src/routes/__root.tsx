import { createRootRoute } from '@tanstack/react-router'
import { Agentation } from 'agentation'
import { RootLayout } from '@/features/root/RootLayout'

export const Route = createRootRoute({
  component: () => (
    <>
      <RootLayout />
      {import.meta.env.DEV && <Agentation />}
    </>
  ),
})
