import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import './styles/global.css'

import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

// Deha Design System behaviour scripts -- imported after the React root is
// mounted so document.body exists when they execute.
// _controls.js: auto-initialises .seg and .sw-base; guards on readyState.
// _darkmode.js: injects the floating Dark/Light pill; guards on document.body.
import '../design-system/preview/_controls.js'
import '../design-system/preview/_darkmode.js'
