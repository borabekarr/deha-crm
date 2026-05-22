import { createFileRoute } from '@tanstack/react-router'
import { PrimitivesLayout } from '@/features/primitives-showcase/PrimitivesLayout'

export const Route = createFileRoute('/primitives')({
  component: PrimitivesLayout,
})
