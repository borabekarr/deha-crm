if (import.meta.env.DEV) {
  await import("react-scan");
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { LazyMotion, domAnimation } from 'framer-motion'
import './index.css'

import { routeTree } from './routeTree.gen'
import { AnalyticsProvider } from './components/shared/AnalyticsProvider'
import * as brandAssets from '@/assets/brand'
// Force-include brand assets in build output. Consumed by /dashboard route (step 9).
void brandAssets

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <AnalyticsProvider>
        <RouterProvider router={router} />
      </AnalyticsProvider>
    </LazyMotion>
  </StrictMode>,
)
