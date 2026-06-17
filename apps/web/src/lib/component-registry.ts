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
  {
    slug: 'controls',
    name: 'Controls',
    category: 'Primitives',
    subtitle: 'Segmented control, toggle switch, slider',
    viewport: { width: 700, height: 240 },
    sourceHtml: '/design-system/preview/components-controls.html',
    Component: lazy(() => import('@/components/design-system/controls/Controls')),
  },
  {
    slug: 'fab',
    name: 'FAB',
    category: 'Primitives',
    subtitle: 'Expanding floating action button (light/dark)',
    viewport: { width: 700, height: 720 },
    sourceHtml: '/design-system/preview/components-fab.html',
    Component: lazy(() => import('@/components/design-system/fab/Fab')),
  },
  {
    slug: 'motion-tabs',
    name: 'Motion tab bar',
    category: 'Primitives',
    subtitle: 'Morphing icon-to-label tabs with a gliding indicator + slide-up panels',
    viewport: { width: 700, height: 440 },
    sourceHtml: '/design-system/preview/components-motion-tabs.html',
    Component: lazy(() => import('@/components/design-system/motion-tabs/MotionTabs')),
  },
  {
    slug: 'delete-button',
    name: 'Delete Button',
    category: 'Primitives',
    subtitle: 'Destructive action button with confirm state',
    viewport: { width: 700, height: 200 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/delete-button/delete-button.html',
    Component: lazy(() => import('@/components/design-system/delete-button/DeleteButton')),
  },
  {
    slug: 'inline-edit',
    name: 'Inline Edit',
    category: 'Primitives',
    subtitle: 'Click-to-edit inline field with save / cancel controls',
    viewport: { width: 700, height: 240 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/inline-edit/inline-edit.html',
    Component: lazy(() => import('@/components/design-system/inline-edit/InlineEdit')),
  },
  // ── Metrics & Charts ──────────────────────────────────────────────────────
  {
    slug: 'chart',
    name: 'Chart',
    category: 'Metrics & Charts',
    subtitle: 'Line/area chart · dual-series · tooltip · axis labels · footer stats',
    viewport: { width: 700, height: 420 },
    sourceHtml: '/design-system/preview/components-chart.html',
    Component: lazy(() => import('@/components/design-system/chart/Chart')),
  },
  {
    slug: 'metric-card',
    name: 'Metric card',
    category: 'Metrics & Charts',
    subtitle: 'Numeral + delta + sparkline; click to expand',
    viewport: { width: 700, height: 320 },
    sourceHtml: '/design-system/preview/components-metric-card.html',
    Component: lazy(() => import('@/components/design-system/metric-card/MetricCard')),
  },
  {
    slug: 'metric-circle',
    name: 'Metric circle',
    category: 'Metrics & Charts',
    subtitle: 'Circular progress metric',
    viewport: { width: 700, height: 320 },
    sourceHtml: '/design-system/preview/components-metric-circle.html',
    Component: lazy(() => import('@/components/design-system/metric-circle/MetricCircle')),
  },
  {
    slug: 'statistics-graph-card',
    name: 'Statistics graph card',
    category: 'Metrics & Charts',
    subtitle: 'CRM deal pipeline widget — live value, trend chart & quick actions',
    viewport: { width: 700, height: 900 },
    sourceHtml: '/design-system/preview/components-statistics-graph-card.html',
    Component: lazy(() => import('@/components/design-system/statistics-graph-card/StatisticsGraphCard')),
  },
  {
    slug: 'streak-card',
    name: 'Streak card',
    category: 'Metrics & Charts',
    subtitle: 'Animated streak + steps progress — light & dark',
    viewport: { width: 700, height: 560 },
    sourceHtml: '/design-system/preview/components-streak-card.html',
    Component: lazy(() => import('@/components/design-system/streak-card/StreakCard')),
  },
  {
    slug: 'financial-health-card',
    name: 'Financial health card',
    category: 'Metrics & Charts',
    subtitle: 'Animated score card — glowing segmented health bar',
    viewport: { width: 700, height: 620 },
    sourceHtml: '/design-system/preview/components-financial-health-card.html',
    Component: lazy(() => import('@/components/design-system/financial-health-card/FinancialHealthCard')),
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
  {
    slug: 'leaderboard',
    name: 'Leaderboard',
    category: 'Data',
    subtitle: 'Winning row treatment + segmented filter with FLIP re-rank animation',
    viewport: { width: 700, height: 400 },
    sourceHtml: '/design-system/preview/components-leaderboard.html',
    Component: lazy(() => import('@/components/design-system/leaderboard/Leaderboard')),
  },
  {
    slug: 'pipeline-card',
    name: 'Pipeline Card',
    category: 'Data',
    subtitle: 'Daily Briefing cards — 4 AI signal types, inverted action popover',
    viewport: { width: 700, height: 1500 },
    sourceHtml: '/design-system/preview/components-pipeline-card.html',
    Component: lazy(() => import('@/components/design-system/pipeline-card/PipelineCard')),
  },
  {
    slug: 'news-feed',
    name: 'News Feed',
    category: 'Data',
    subtitle: 'Crypto news feed — bullish/bearish cards, light + dark',
    viewport: { width: 500, height: 460 },
    sourceHtml: '/design-system/preview/components-news-feed.html',
    Component: lazy(() => import('@/components/design-system/news-feed/NewsFeed')),
  },
  {
    slug: 'index-bar',
    name: 'Index Bar',
    category: 'Data',
    subtitle: 'CRM pipeline dashboard overview — metrics + stage index bar',
    viewport: { width: 700, height: 560 },
    sourceHtml: '/design-system/preview/components-index-bar.html',
    Component: lazy(() => import('@/components/design-system/index-bar/IndexBar')),
  },
  {
    slug: 'calendar',
    name: 'Calendar',
    category: 'Data',
    subtitle: 'Month navigator + day selection with event panel',
    viewport: { width: 420, height: 680 },
    sourceHtml: '/design-system/preview/components-calendar.html',
    Component: lazy(() => import('@/components/design-system/calendar/Calendar')),
  },
  {
    slug: 'file-folder',
    name: 'File / Folder',
    category: 'Data',
    subtitle: 'Animated file-folder app icon — blue/normal + red/hot, light & dark',
    viewport: { width: 620, height: 520 },
    sourceHtml: '/design-system/preview/components-file-folder.html',
    Component: lazy(() => import('@/components/design-system/file-folder/FileFolder')),
  },
  {
    slug: 'date-picker',
    name: 'iOS Date Picker',
    category: 'Data',
    subtitle: 'iOS wheel day/month/year picker with snap + depth fade',
    viewport: { width: 700, height: 560 },
    sourceHtml: '/design-system/preview/components-date-picker.html',
    Component: lazy(() => import('@/components/design-system/date-picker/DatePicker')),
  },
  {
    slug: 'github-calendar',
    name: 'GitHub Calendar',
    category: 'Data',
    subtitle: 'GitHub-style contribution heatmap calendar',
    viewport: { width: 900, height: 220 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/github-calendar/github-calendar.html',
    Component: lazy(() => import('@/components/design-system/github-calendar/GithubCalendar')),
  },
  {
    slug: 'stacked-list',
    name: 'Stacked List',
    category: 'Data',
    subtitle: 'Stacked item list with avatars, labels and actions',
    viewport: { width: 700, height: 480 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/stacked-list/stacked-list.html',
    Component: lazy(() => import('@/components/design-system/stacked-list/StackedList')),
  },
  // ── Sheets & Cards ───────────────────────────────────────────────────────
  {
    slug: 'task-card',
    name: 'Task card',
    category: 'Sheets & Cards',
    subtitle: 'Kanban task cards — click to open AI-driven detail popover',
    viewport: { width: 700, height: 680 },
    sourceHtml: '/design-system/preview/components-task-card.html',
    Component: lazy(() => import('@/components/design-system/task-card/TaskCard')),
  },
  {
    slug: 'prize-sheet',
    name: 'Prize sheet',
    category: 'Sheets & Cards',
    subtitle: 'Mobile bottom sheet + desktop dialog with confetti claim flow',
    viewport: { width: 760, height: 1240 },
    sourceHtml: '/design-system/preview/components-prize-sheet.html',
    Component: lazy(() => import('@/components/design-system/prize-sheet/PrizeSheet')),
  },
  {
    slug: 'model-selector',
    name: 'Model selector',
    category: 'Sheets & Cards',
    subtitle: 'AI chatbot model picker — Auto/Instant/Reasoning/Pro',
    viewport: { width: 500, height: 480 },
    sourceHtml: '/design-system/preview/components-model-selector.html',
    Component: lazy(() => import('@/components/design-system/model-selector/ModelSelector')),
  },
  {
    slug: 'model-selection-sheet',
    name: 'Model selection sheet',
    category: 'Sheets & Cards',
    subtitle: 'Mobile-style AI model picker sheet with metric bars + confetti confirm',
    viewport: { width: 420, height: 680 },
    sourceHtml: '/design-system/preview/components-model-selection-sheet.html',
    Component: lazy(() => import('@/components/design-system/model-selection-sheet/ModelSelectionSheet')),
  },
  // ── Workflow ──────────────────────────────────────────────────────────────
  {
    slug: 'workflow-add-elements',
    name: 'Workflow: add elements',
    category: 'Workflow',
    subtitle: 'Right-click canvas menu — category + nodes flyout with segmented tabs',
    viewport: { width: 1200, height: 800 },
    sourceHtml: '/design-system/preview/components-workflow-add-elements.html',
    Component: lazy(() => import('@/components/design-system/workflow-add-elements/WorkflowAddElements')),
  },
  {
    slug: 'workflow-nodes',
    name: 'Workflow: nodes',
    category: 'Workflow',
    subtitle: 'Trigger / Action / Output node cards for the workflow canvas',
    viewport: { width: 900, height: 1100 },
    sourceHtml: '/design-system/preview/components-workflow-nodes.html',
    Component: lazy(() => import('@/components/design-system/workflow-nodes/WorkflowNodes')),
  },
  {
    slug: 'workflow-publish',
    name: 'Workflow: publish',
    category: 'Workflow',
    subtitle: 'Publish button + popover for the AI workflow editor',
    viewport: { width: 480, height: 520 },
    sourceHtml: '/design-system/preview/components-workflow-publish.html',
    Component: lazy(() => import('@/components/design-system/workflow-publish/WorkflowPublish')),
  },
  {
    slug: 'workflow-template-cards',
    name: 'Workflow: template cards',
    category: 'Workflow',
    subtitle: 'AI workflow template card grid with flow preview and hover CTA',
    viewport: { width: 700, height: 620 },
    sourceHtml: '/design-system/preview/components-workflow-template-cards.html',
    Component: lazy(() => import('@/components/design-system/workflow-template-cards/WorkflowTemplateCards')),
  },
  {
    slug: 'multisteps',
    name: 'Multistep onboarding',
    category: 'Workflow',
    subtitle: 'Morphing emerald capsule indicator + ripple buttons',
    viewport: { width: 700, height: 460 },
    sourceHtml: '/design-system/preview/components-multisteps.html',
    Component: lazy(() => import('@/components/design-system/multisteps/Multisteps')),
  },
  // ── AI ────────────────────────────────────────────────────────────────────
  {
    slug: 'ai-memory-card',
    name: 'AI memory card',
    category: 'AI',
    subtitle: 'Memory added notification card for AI chatbot',
    viewport: { width: 480, height: 620 },
    sourceHtml: '/design-system/preview/components-ai-memory-card.html',
    Component: lazy(() => import('@/components/design-system/ai-memory-card/AiMemoryCard')),
  },
  {
    slug: 'ai-caveat',
    name: 'AI caveat',
    category: 'AI',
    subtitle: 'Warning banner shown below AI chatbot responses',
    viewport: { width: 700, height: 120 },
    sourceHtml: '/design-system/preview/components-ai-caveat.html',
    Component: lazy(() => import('@/components/design-system/ai-caveat/AiCaveat')),
  },
  {
    slug: 'ai-message-box',
    name: 'AI message box',
    category: 'AI',
    subtitle: 'Chat input with Extend-with-AI + generating state',
    viewport: { width: 600, height: 280 },
    sourceHtml: '/design-system/preview/components-ai-message-box.html',
    Component: lazy(() => import('@/components/design-system/ai-message-box/AiMessageBox')),
  },
  // ── Misc ──────────────────────────────────────────────────────────────────
  {
    slug: 'delete-modal',
    name: 'Delete Modal',
    category: 'Misc',
    subtitle: 'Confirmation dialog for destructive delete actions',
    viewport: { width: 700, height: 500 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/delete-modal/delete-modal.html',
    Component: lazy(() => import('@/components/design-system/delete-modal/DeleteModal')),
  },
  {
    slug: 'todo-list',
    name: 'To-do list',
    category: 'Misc',
    subtitle: 'Animated daily to-do — drag-right to complete',
    viewport: { width: 700, height: 720 },
    sourceHtml: '/design-system/preview/components-todo-list.html',
    Component: lazy(() => import('@/components/design-system/todo-list/TodoList')),
  },
  {
    slug: 'theme-editor',
    name: 'Theme editor',
    category: 'Misc',
    subtitle: 'Color picker + window mode + brightness settings panel',
    viewport: { width: 480, height: 620 },
    sourceHtml: '/design-system/preview/components-theme-editor.html',
    Component: lazy(() => import('@/components/design-system/theme-editor/ThemeEditor')),
  },
  {
    slug: 'toast',
    name: 'Toast',
    category: 'Misc',
    subtitle: 'Live morphing toast — tap to fire (real Reanimated build)',
    viewport: { width: 540, height: 860 },
    sourceHtml: '/design-system/preview/components-toast.html',
    Component: lazy(() => import('@/components/design-system/toast/Toast')),
  },
  // ── Brand (Claude Design import) ──────────────────────────────────────────
  {
    slug: 'connect-modal',
    name: 'Connect Modal',
    category: 'Sheets & Cards',
    subtitle: 'OAuth / API Key connection modal — emerald CTA',
    viewport: { width: 1280, height: 900 },
    sourceHtml: '/design-system/preview/brand-connect-modal.html',
    Component: lazy(() => import('@/components/design-system/connect-modal/ConnectModal')),
  },
  {
    slug: 'status-card',
    name: 'Status Card',
    category: 'Sheets & Cards',
    subtitle: 'Expandable issue card · tooltips · copy-link',
    viewport: { width: 520, height: 360 },
    sourceHtml: '/design-system/preview/brand-status-card.html',
    Component: lazy(() => import('@/components/design-system/status-card/StatusCard')),
  },
  {
    slug: 'message-dropdown',
    name: 'Message Dropdown',
    category: 'Primitives',
    subtitle: 'Gooey message dropdown — dark, side-by-side demo',
    viewport: { width: 920, height: 800 },
    sourceHtml: '/design-system/preview/brand-message-dropdown.html',
    Component: lazy(() => import('@/components/design-system/message-dropdown/MessageDropdown')),
  },
  {
    slug: 'adjust-timeframe',
    name: 'Adjust Timeframe',
    category: 'Data',
    subtitle: 'Draggable timeline range scrubber — emerald accent',
    viewport: { width: 880, height: 620 },
    sourceHtml: '/design-system/preview/brand-adjust-timeframe.html',
    Component: lazy(() => import('@/components/design-system/adjust-timeframe/AdjustTimeframe')),
  },
  {
    slug: 'currency-converter',
    name: 'Currency Converter',
    category: 'Data',
    subtitle: 'Two-way live converter with flag flip + digit roll',
    viewport: { width: 720, height: 720 },
    sourceHtml: '/design-system/preview/brand-currency-converter.html',
    Component: lazy(() => import('@/components/design-system/currency-converter/CurrencyConverter')),
  },
  {
    slug: 'dynamic-calendar',
    name: 'Dynamic Calendar',
    category: 'Data',
    subtitle: 'Dynamic Island calendar — compact/preview/expanded morph',
    viewport: { width: 1180, height: 720 },
    sourceHtml: '/design-system/preview/brand-dynamic-calendar.html',
    Component: lazy(() => import('@/components/design-system/dynamic-calendar/DynamicCalendar')),
  },
  {
    slug: 'task-board',
    name: 'TaskBoard',
    category: 'Workflow',
    subtitle: 'AI agent syncs tasks from Slack, GitHub, Notion',
    viewport: { width: 1100, height: 800 },
    sourceHtml: '/design-system/preview/brand-taskboard.html',
    Component: lazy(() => import('@/components/design-system/task-board/TaskBoard')),
  },
  {
    slug: 'sprint-planner-core',
    name: 'Sprint Planner Core',
    category: 'Workflow',
    subtitle: 'Deha sprint planner with Ask AI command palette',
    viewport: { width: 1280, height: 900 },
    sourceHtml: '/design-system/preview/brand-sprint-planner-core.html',
    Component: lazy(() => import('@/components/design-system/sprint-planner-core/SprintPlannerCore')),
  },
  {
    slug: 'ai-composer',
    name: 'AI Composer',
    category: 'AI',
    subtitle: 'AI composer + tools toolbar — mobile dock',
    viewport: { width: 480, height: 860 },
    sourceHtml: '/design-system/preview/brand-ai-composer.html',
    Component: lazy(() => import('@/components/design-system/ai-composer/AiComposer')),
  },
  {
    slug: 'onboarding-completion',
    name: 'Onboarding Completion',
    category: 'Misc',
    subtitle: 'Prompt · Card · Checklist → success morph',
    viewport: { width: 480, height: 620 },
    sourceHtml: '/design-system/preview/brand-onboarding-completion.html',
    Component: lazy(() => import('@/components/design-system/onboarding-completion/OnboardingCompletion')),
  },
  {
    slug: 'dynamic-island-reader',
    name: 'Dynamic Island Reader',
    category: 'Misc',
    subtitle: 'Light-mode article + animated Dynamic Island progress',
    viewport: { width: 520, height: 940 },
    sourceHtml: '/design-system/preview/brand-dynamic-island-reader.html',
    Component: lazy(() => import('@/components/design-system/dynamic-island-reader/DynamicIslandReader')),
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
