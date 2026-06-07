import { lazy, type ComponentType } from 'react'

// ---------------------------------------------------------------------------
// Component registry
//
// Canonical authoring path: /frontend-design (Tailwind-native .tsx).
// The HTML prototypes referenced by `sourceHtml` are historical artifacts
// from an earlier pipeline that has been retired. They are NOT the source of
// truth. The .tsx file for each entry is the authoritative implementation.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegistryEntry {
  slug: string
  name: string
  category: string
  subtitle: string
  viewport?: { width?: number; height?: number }
  /**
   * Historical reference link to the original HTML prototype.
   * This is NOT the source of truth. The `.tsx` component authored via
   * `/frontend-design` is the canonical implementation. The HTML prototype
   * is kept only as a reference for legacy context.
   */
  sourceHtml: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ReturnType<typeof lazy<ComponentType<any>>>
}

// ---------------------------------------------------------------------------
// Canonical category order
// ---------------------------------------------------------------------------

export const CATEGORY_ORDER = [
  'Foundations',
  'Primitives',
  'Metrics & Charts',
  'Data',
  'Sheets & Cards',
  'Workflow',
  'AI',
  'Misc',
] as const

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const registry: RegistryEntry[] = [
  // ── Foundations ──────────────────────────────────────────────────────────
  {
    slug: 'colors-neutrals',
    name: 'Neutrals — Slate',
    category: 'Foundations',
    subtitle: 'Slate fg/bg/border scale',
    viewport: { width: 700, height: 160 },
    sourceHtml: '/design-system/preview/colors-neutrals.html',
    Component: lazy(() => import('@/components/design-system/colors-neutrals/ColorsNeutrals')),
  },
  {
    slug: 'colors-primary',
    name: 'Primary — Emerald',
    category: 'Foundations',
    subtitle: '10-step emerald scale anchored at #10B981',
    viewport: { width: 700, height: 160 },
    sourceHtml: '/design-system/preview/colors-primary.html',
    Component: lazy(() => import('@/components/design-system/colors-primary/ColorsPrimary')),
  },
  {
    slug: 'colors-semantic',
    name: 'Semantic colors',
    category: 'Foundations',
    subtitle: 'Success / Warning / Danger / Hot Lead',
    viewport: { width: 700, height: 200 },
    sourceHtml: '/design-system/preview/colors-semantic.html',
    Component: lazy(() => import('@/components/design-system/colors-semantic/ColorsSemantic')),
  },
  {
    slug: 'type-scale',
    name: 'Type scale',
    category: 'Foundations',
    subtitle: 'Display 1/2, H1–H4, body, meta, micro',
    viewport: { width: 700, height: 480 },
    sourceHtml: '/design-system/preview/type-scale.html',
    Component: lazy(() => import('@/components/design-system/type-scale/TypeScale')),
  },
  {
    slug: 'type-display',
    name: 'Display — Montserrat',
    category: 'Foundations',
    subtitle: 'Specimen + weight ladder (300/500/700/900)',
    viewport: { width: 700, height: 230 },
    sourceHtml: '/design-system/preview/type-display.html',
    Component: lazy(() => import('@/components/design-system/type-display/TypeDisplay')),
  },
  {
    slug: 'spacing-scale',
    name: 'Spacing scale',
    category: 'Foundations',
    subtitle: '4-point grid · 4 → 48px',
    viewport: { width: 700, height: 160 },
    sourceHtml: '/design-system/preview/spacing-scale.html',
    Component: lazy(() => import('@/components/design-system/spacing-scale/SpacingScale')),
  },
  {
    slug: 'spacing-radii',
    name: 'Radii',
    category: 'Foundations',
    subtitle: '6 → 24px + pill',
    viewport: { width: 700, height: 180 },
    sourceHtml: '/design-system/preview/spacing-radii.html',
    Component: lazy(() => import('@/components/design-system/spacing-radii/SpacingRadii')),
  },
  {
    slug: 'spacing-shadows',
    name: 'Shadows',
    category: 'Foundations',
    subtitle: 'glass, glass-sm, recessed, emerald-glow',
    viewport: { width: 700, height: 360 },
    sourceHtml: '/design-system/preview/spacing-shadows.html',
    Component: lazy(() => import('@/components/design-system/spacing-shadows/SpacingShadows')),
  },
  {
    slug: 'iconography',
    name: 'Iconography',
    category: 'Foundations',
    subtitle: 'Material Icons + Material Symbols Outlined',
    viewport: { width: 700, height: 240 },
    sourceHtml: '/design-system/preview/iconography.html',
    Component: lazy(() => import('@/components/design-system/iconography/Iconography')),
  },
  {
    slug: 'brand-logo',
    name: 'Logo & wordmark',
    category: 'Foundations',
    subtitle: 'Placeholder mark + lockup (real logo pending)',
    viewport: { width: 700, height: 200 },
    sourceHtml: '/design-system/preview/brand-logo.html',
    Component: lazy(() => import('@/components/design-system/brand-logo/BrandLogo')),
  },
  {
    slug: 'background-gradient',
    name: 'Page gradient',
    category: 'Foundations',
    subtitle: 'Flat white default · grid-on-white for highlighted sections',
    viewport: { width: 700, height: 240 },
    sourceHtml: '/design-system/preview/background-gradient.html',
    Component: lazy(() => import('@/components/design-system/background-gradient/BackgroundGradient')),
  },
  // ── Primitives ───────────────────────────────────────────────────────────
  {
    slug: 'buttons',
    name: 'Buttons',
    category: 'Primitives',
    subtitle: 'Primary, inverse, glass, text',
    viewport: { width: 700, height: 140 },
    sourceHtml: '/design-system/preview/components-buttons.html',
    Component: lazy(() => import('@/components/design-system/buttons/Buttons')),
  },
  {
    slug: 'pills',
    name: 'Pills, chips & badges',
    category: 'Primitives',
    subtitle: 'Priority dots, segmented, stat badges',
    viewport: { width: 700, height: 230 },
    sourceHtml: '/design-system/preview/components-pills.html',
    Component: lazy(() => import('@/components/design-system/pills/Pills')),
  },
  {
    slug: 'cards',
    name: 'Card primitives',
    category: 'Primitives',
    subtitle: 'Glass, inner & accent surfaces',
    viewport: { width: 700, height: 280 },
    sourceHtml: '/design-system/preview/components-cards.html',
    Component: lazy(() => import('@/components/design-system/cards/Cards')),
  },
  // ── Data ─────────────────────────────────────────────────────────────────
  {
    slug: 'leads-table',
    name: 'Leads Table',
    category: 'Data',
    subtitle: 'Sortable leads pipeline table with row popover',
    viewport: { width: 1380, height: 920 },
    sourceHtml: '/design-system/preview/components-leads-table.html',
    Component: lazy(() => import('@/components/design-system/leads-table/LeadsTable')),
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getBySlug(slug: string): RegistryEntry | undefined {
  return registry.find((e) => e.slug === slug)
}

/** Returns registry entries bucketed by category in CATEGORY_ORDER order. */
export function getGrouped(): Map<string, RegistryEntry[]> {
  const map = new Map<string, RegistryEntry[]>()

  // Seed map in canonical order
  for (const cat of CATEGORY_ORDER) {
    map.set(cat, [])
  }

  for (const entry of registry) {
    const bucket = map.get(entry.category)
    if (bucket) {
      bucket.push(entry)
    } else {
      // Unknown category — append at end
      const existing = map.get(entry.category)
      if (!existing) map.set(entry.category, [entry])
      else existing.push(entry)
    }
  }

  // Remove empty buckets so callers don't render empty sections
  for (const [cat, entries] of map) {
    if (entries.length === 0) map.delete(cat)
  }

  return map
}
