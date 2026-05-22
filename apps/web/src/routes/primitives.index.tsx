import { createFileRoute } from '@tanstack/react-router'
import { PrimitivesIndexPage } from '@/features/primitives-showcase/PrimitivesIndexPage'

export const Route = createFileRoute('/primitives/')({
  component: PrimitivesIndexPage,
})
