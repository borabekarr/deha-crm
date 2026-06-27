import { lazy, type ComponentType } from 'react'

// ---------------------------------------------------------------------------
// Component registry
//
// Canonical authoring path: /frontend-design (Tailwind-native .tsx).
// The HTML prototypes referenced by `sourceHtml` are historical artifacts
// from an earlier pipeline that has been retired. They are NOT the source of
// truth. The .tsx file for each entry is the authoritative implementation.
//
// Taxonomy is two-level:
//   status  — progress stage: Finished | Proceeding | Waiting
//   category — type subcategory: Foundations | Primitives | Animations
//              | Auxiliary Elements | Components
// The sidebar groups status -> category. See getGroupedByStatus().
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComponentStatus = 'Finished' | 'Proceeding' | 'Waiting'

export type Subcategory =
  | 'Foundations'
  | 'Primitives'
  | 'Animations'
  | 'Auxiliary Elements'
  | 'Components'

export interface RegistryEntry {
  slug: string
  name: string
  /** Progress stage — top-level sidebar group. */
  status: ComponentStatus
  /** Type subcategory — second-level sidebar group. */
  category: Subcategory
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
// Canonical ordering
// ---------------------------------------------------------------------------

export const STATUS_ORDER = ['Finished', 'Proceeding', 'Waiting'] as const

export const SUBCATEGORY_ORDER = [
  'Foundations',
  'Primitives',
  'Animations',
  'Auxiliary Elements',
  'Components',
] as const

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const registry: RegistryEntry[] = [
  // ══ Finished ══════════════════════════════════════════════════════════════
  {
    slug: 'colors-neutrals',
    name: 'Neutrals — Slate',
    status: 'Finished',
    category: 'Foundations',
    subtitle: 'Slate fg/bg/border scale',
    viewport: { width: 700, height: 160 },
    sourceHtml: '/design-system/preview/colors-neutrals.html',
    Component: lazy(() => import('@/components/design-system/colors-neutrals/ColorsNeutrals')),
  },
  {
    slug: 'colors-primary',
    name: 'Primary — Emerald',
    status: 'Finished',
    category: 'Foundations',
    subtitle: '10-step emerald scale anchored at #10B981',
    viewport: { width: 700, height: 160 },
    sourceHtml: '/design-system/preview/colors-primary.html',
    Component: lazy(() => import('@/components/design-system/colors-primary/ColorsPrimary')),
  },
  {
    slug: 'colors-semantic',
    name: 'Semantic colors',
    status: 'Finished',
    category: 'Foundations',
    subtitle: 'Success / Warning / Danger / Hot Lead',
    viewport: { width: 700, height: 200 },
    sourceHtml: '/design-system/preview/colors-semantic.html',
    Component: lazy(() => import('@/components/design-system/colors-semantic/ColorsSemantic')),
  },
  {
    slug: 'type-scale',
    name: 'Type scale',
    status: 'Finished',
    category: 'Foundations',
    subtitle: 'Display 1/2, H1–H4, body, meta, micro',
    viewport: { width: 700, height: 480 },
    sourceHtml: '/design-system/preview/type-scale.html',
    Component: lazy(() => import('@/components/design-system/type-scale/TypeScale')),
  },
  {
    slug: 'type-display',
    name: 'Display — Montserrat',
    status: 'Finished',
    category: 'Foundations',
    subtitle: 'Specimen + weight ladder (300/500/700/900)',
    viewport: { width: 700, height: 230 },
    sourceHtml: '/design-system/preview/type-display.html',
    Component: lazy(() => import('@/components/design-system/type-display/TypeDisplay')),
  },
  {
    slug: 'spacing-scale',
    name: 'Spacing scale',
    status: 'Finished',
    category: 'Foundations',
    subtitle: '4-point grid · 4 → 48px',
    viewport: { width: 700, height: 160 },
    sourceHtml: '/design-system/preview/spacing-scale.html',
    Component: lazy(() => import('@/components/design-system/spacing-scale/SpacingScale')),
  },
  {
    slug: 'spacing-radii',
    name: 'Radii',
    status: 'Finished',
    category: 'Foundations',
    subtitle: '6 → 24px + pill',
    viewport: { width: 700, height: 180 },
    sourceHtml: '/design-system/preview/spacing-radii.html',
    Component: lazy(() => import('@/components/design-system/spacing-radii/SpacingRadii')),
  },
  {
    slug: 'spacing-shadows',
    name: 'Shadows',
    status: 'Finished',
    category: 'Foundations',
    subtitle: 'glass, glass-sm, recessed, emerald-glow',
    viewport: { width: 700, height: 360 },
    sourceHtml: '/design-system/preview/spacing-shadows.html',
    Component: lazy(() => import('@/components/design-system/spacing-shadows/SpacingShadows')),
  },
  {
    slug: 'iconography',
    name: 'Iconography',
    status: 'Finished',
    category: 'Foundations',
    subtitle: 'Material Icons + Material Symbols Outlined',
    viewport: { width: 700, height: 240 },
    sourceHtml: '/design-system/preview/iconography.html',
    Component: lazy(() => import('@/components/design-system/iconography/Iconography')),
  },
  {
    slug: 'background-gradient',
    name: 'Page gradient',
    status: 'Finished',
    category: 'Foundations',
    subtitle: 'Flat white default · grid-on-white for highlighted sections',
    viewport: { width: 700, height: 240 },
    sourceHtml: '/design-system/preview/background-gradient.html',
    Component: lazy(() => import('@/components/design-system/background-gradient/BackgroundGradient')),
  },
  {
    slug: 'cards',
    name: 'Card primitives',
    status: 'Finished',
    category: 'Primitives',
    subtitle: 'Glass, inner & accent surfaces',
    viewport: { width: 700, height: 280 },
    sourceHtml: '/design-system/preview/components-cards.html',
    Component: lazy(() => import('@/components/design-system/cards/Cards')),
  },
  {
    slug: 'animated-list',
    name: 'Animated List',
    status: 'Finished',
    category: 'Animations',
    subtitle: 'Real-time push feed — absolute-slot model with slide/fade/scale variants',
    viewport: { width: 700, height: 560 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/tree/main/animated-list',
    Component: lazy(() => import('@/components/design-system/animated-list/AnimatedList')),
  },
  {
    slug: 'prize-sheet',
    name: 'Prize sheet',
    status: 'Finished',
    category: 'Animations',
    subtitle: 'Mobile bottom sheet + desktop dialog with confetti claim flow',
    viewport: { width: 760, height: 1240 },
    sourceHtml: '/design-system/preview/components-prize-sheet.html',
    Component: lazy(() => import('@/components/design-system/prize-sheet/PrizeSheet')),
  },
  {
    slug: 'ai-caveat',
    name: 'AI caveat',
    status: 'Finished',
    category: 'Auxiliary Elements',
    subtitle: 'Warning banner shown below AI chatbot responses',
    viewport: { width: 700, height: 120 },
    sourceHtml: '/design-system/preview/components-ai-caveat.html',
    Component: lazy(() => import('@/components/design-system/ai-caveat/AiCaveat')),
  },
  {
    slug: 'ai-message-box',
    name: 'AI message box',
    status: 'Finished',
    category: 'Auxiliary Elements',
    subtitle: 'Chat input with Extend-with-AI + generating state',
    viewport: { width: 600, height: 280 },
    sourceHtml: '/design-system/preview/components-ai-message-box.html',
    Component: lazy(() => import('@/components/design-system/ai-message-box/AiMessageBox')),
  },
  {
    slug: 'metric-circle',
    name: 'Metric circle',
    status: 'Finished',
    category: 'Components',
    subtitle: 'Circular progress metric',
    viewport: { width: 700, height: 320 },
    sourceHtml: '/design-system/preview/components-metric-circle.html',
    Component: lazy(() => import('@/components/design-system/metric-circle/MetricCircle')),
  },
  {
    slug: 'streak-card',
    name: 'Streak card',
    status: 'Finished',
    category: 'Components',
    subtitle: 'Animated streak + steps progress — light & dark',
    viewport: { width: 700, height: 560 },
    sourceHtml: '/design-system/preview/components-streak-card.html',
    Component: lazy(() => import('@/components/design-system/streak-card/StreakCard')),
  },
  {
    slug: 'pipeline-card',
    name: 'Pipeline Card',
    status: 'Finished',
    category: 'Components',
    subtitle: 'Daily Briefing cards — 4 AI signal types, inverted action popover',
    viewport: { width: 700, height: 1500 },
    sourceHtml: '/design-system/preview/components-pipeline-card.html',
    Component: lazy(() => import('@/components/design-system/pipeline-card/PipelineCard')),
  },
  {
    slug: 'dynamic-calendar',
    name: 'Dynamic Calendar',
    status: 'Finished',
    category: 'Components',
    subtitle: 'Dynamic Island calendar — compact/preview/expanded morph',
    viewport: { width: 1180, height: 720 },
    sourceHtml: '/design-system/preview/brand-dynamic-calendar.html',
    Component: lazy(() => import('@/components/design-system/dynamic-calendar/DynamicCalendar')),
  },

  // ══ Proceeding ════════════════════════════════════════════════════════════
  {
    slug: 'buttons',
    name: 'Buttons',
    status: 'Proceeding',
    category: 'Primitives',
    subtitle: 'Primary, inverse, glass, text',
    viewport: { width: 700, height: 140 },
    sourceHtml: '/design-system/preview/components-buttons.html',
    Component: lazy(() => import('@/components/design-system/buttons/Buttons')),
  },
  {
    slug: 'pills',
    name: 'Pills, chips & badges',
    status: 'Finished',
    category: 'Primitives',
    subtitle: 'Priority dots, stat badges, icon & event badges',
    viewport: { width: 700, height: 230 },
    sourceHtml: '/design-system/preview/components-pills.html',
    Component: lazy(() => import('@/components/design-system/pills/Pills')),
  },
  {
    slug: 'controls',
    name: 'Controls',
    status: 'Finished',
    category: 'Primitives',
    subtitle: 'Segmented control, toggle switch, slider',
    viewport: { width: 700, height: 240 },
    sourceHtml: '/design-system/preview/components-controls.html',
    Component: lazy(() => import('@/components/design-system/controls/Controls')),
  },
  {
    slug: 'smooth-drawer',
    name: 'Smooth Drawer',
    status: 'Proceeding',
    category: 'Animations',
    subtitle: 'Bottom-sheet with spring slide, staggered reveal, drag-to-dismiss + ESC',
    viewport: { width: 700, height: 560 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/tree/main/smooth-drawer',
    Component: lazy(() => import('@/components/design-system/smooth-drawer/SmoothDrawer')),
  },
  {
    slug: 'inline-edit',
    name: 'Inline Edit',
    status: 'Proceeding',
    category: 'Auxiliary Elements',
    subtitle: 'Click-to-edit inline field with save / cancel controls',
    viewport: { width: 700, height: 240 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/inline-edit/inline-edit.html',
    Component: lazy(() => import('@/components/design-system/inline-edit/InlineEdit')),
  },
  {
    slug: 'adjust-timeframe',
    name: 'Adjust Timeframe',
    status: 'Proceeding',
    category: 'Auxiliary Elements',
    subtitle: 'Draggable timeline range scrubber — emerald accent',
    viewport: { width: 880, height: 620 },
    sourceHtml: '/design-system/preview/brand-adjust-timeframe.html',
    Component: lazy(() => import('@/components/design-system/adjust-timeframe/AdjustTimeframe')),
  },
  {
    slug: 'date-picker',
    name: 'iOS Date Picker',
    status: 'Proceeding',
    category: 'Auxiliary Elements',
    subtitle: 'iOS wheel day/month/year picker with snap + depth fade',
    viewport: { width: 700, height: 560 },
    sourceHtml: '/design-system/preview/components-date-picker.html',
    Component: lazy(() => import('@/components/design-system/date-picker/DatePicker')),
  },
  {
    slug: 'github-calendar',
    name: 'GitHub Calendar',
    status: 'Proceeding',
    category: 'Auxiliary Elements',
    subtitle: 'GitHub-style contribution heatmap calendar',
    viewport: { width: 900, height: 220 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/github-calendar/github-calendar.html',
    Component: lazy(() => import('@/components/design-system/github-calendar/GithubCalendar')),
  },
  {
    slug: 'pinned-list',
    name: 'Pinned List',
    status: 'Proceeding',
    category: 'Auxiliary Elements',
    subtitle: 'Items spring between Pinned and All sections via FLIP layout animation',
    viewport: { width: 700, height: 560 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/tree/main/pinned-list',
    Component: lazy(() => import('@/components/design-system/pinned-list/PinnedList')),
  },
  {
    slug: 'currency-converter',
    name: 'Currency Converter',
    status: 'Proceeding',
    category: 'Auxiliary Elements',
    subtitle: 'Two-way live converter with flag flip + digit roll',
    viewport: { width: 720, height: 720 },
    sourceHtml: '/design-system/preview/brand-currency-converter.html',
    Component: lazy(() => import('@/components/design-system/currency-converter/CurrencyConverter')),
  },
  {
    slug: 'model-selector',
    name: 'Model selector',
    status: 'Proceeding',
    category: 'Auxiliary Elements',
    subtitle: 'AI chatbot model picker — Auto/Instant/Reasoning/Pro',
    viewport: { width: 500, height: 480 },
    sourceHtml: '/design-system/preview/components-model-selector.html',
    Component: lazy(() => import('@/components/design-system/model-selector/ModelSelector')),
  },
  {
    slug: 'status-card',
    name: 'Status Card',
    status: 'Proceeding',
    category: 'Auxiliary Elements',
    subtitle: 'Expandable issue card · tooltips · copy-link',
    viewport: { width: 520, height: 360 },
    sourceHtml: '/design-system/preview/brand-status-card.html',
    Component: lazy(() => import('@/components/design-system/status-card/StatusCard')),
  },
  {
    slug: 'multisteps',
    name: 'Multistep onboarding',
    status: 'Finished',
    category: 'Auxiliary Elements',
    subtitle: 'Morphing emerald capsule indicator + ripple buttons',
    viewport: { width: 700, height: 460 },
    sourceHtml: '/design-system/preview/components-multisteps.html',
    Component: lazy(() => import('@/components/design-system/multisteps/Multisteps')),
  },
  {
    slug: 'delete-modal',
    name: 'Delete Modal',
    status: 'Proceeding',
    category: 'Auxiliary Elements',
    subtitle: 'Confirmation dialog for destructive delete actions',
    viewport: { width: 700, height: 500 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/delete-modal/delete-modal.html',
    Component: lazy(() => import('@/components/design-system/delete-modal/DeleteModal')),
  },
  {
    slug: 'fab',
    name: 'FAB',
    status: 'Finished',
    category: 'Components',
    subtitle: 'Expanding floating action button (light/dark)',
    viewport: { width: 700, height: 720 },
    sourceHtml: '/design-system/preview/components-fab.html',
    Component: lazy(() => import('@/components/design-system/fab/Fab')),
  },
  {
    slug: 'motion-tabs',
    name: 'Motion tab bar',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Morphing icon-to-label tabs with a gliding indicator + slide-up panels',
    viewport: { width: 700, height: 440 },
    sourceHtml: '/design-system/preview/components-motion-tabs.html',
    Component: lazy(() => import('@/components/design-system/motion-tabs/MotionTabs')),
  },
  {
    slug: 'delete-button',
    name: 'Delete Button',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Destructive action button with confirm state',
    viewport: { width: 700, height: 200 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/delete-button/delete-button.html',
    Component: lazy(() => import('@/components/design-system/delete-button/DeleteButton')),
  },
  {
    slug: 'avatar-picker',
    name: 'Avatar Picker',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Profile-setup avatar stage with rotate/scale swap + validated username',
    viewport: { width: 700, height: 560 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/tree/main/avatar-picker',
    Component: lazy(() => import('@/components/design-system/avatar-picker/AvatarPicker')),
  },
  {
    slug: 'message-dropdown',
    name: 'Message Dropdown',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Gooey message dropdown — dark, side-by-side demo',
    viewport: { width: 920, height: 800 },
    sourceHtml: '/design-system/preview/brand-message-dropdown.html',
    Component: lazy(() => import('@/components/design-system/message-dropdown/MessageDropdown')),
  },
  {
    slug: 'metric-card',
    name: 'Metric card',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Numeral + delta + sparkline; click to expand',
    viewport: { width: 700, height: 320 },
    sourceHtml: '/design-system/preview/components-metric-card.html',
    Component: lazy(() => import('@/components/design-system/metric-card/MetricCard')),
  },
  {
    slug: 'statistics-graph-card',
    name: 'Statistics graph card',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'CRM deal pipeline widget — live value, trend chart & quick actions',
    viewport: { width: 700, height: 900 },
    sourceHtml: '/design-system/preview/components-statistics-graph-card.html',
    Component: lazy(() => import('@/components/design-system/statistics-graph-card/StatisticsGraphCard')),
  },
  {
    slug: 'financial-health-card',
    name: 'Financial health card',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Animated score card — glowing segmented health bar',
    viewport: { width: 700, height: 620 },
    sourceHtml: '/design-system/preview/components-financial-health-card.html',
    Component: lazy(() => import('@/components/design-system/financial-health-card/FinancialHealthCard')),
  },
  {
    slug: 'funnel-chart',
    name: 'Funnel Chart',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Horizontal funnel with emerald halo rings, staggered entrance, hover dim',
    viewport: { width: 700, height: 480 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/tree/main/funnel-chart',
    Component: lazy(() => import('@/components/design-system/funnel-chart/FunnelChart')),
  },
  {
    slug: 'leaderboard',
    name: 'Leaderboard',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Winning row treatment + segmented filter with FLIP re-rank animation',
    viewport: { width: 700, height: 400 },
    sourceHtml: '/design-system/preview/components-leaderboard.html',
    Component: lazy(() => import('@/components/design-system/leaderboard/Leaderboard')),
  },
  {
    slug: 'news-feed',
    name: 'News Feed',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Crypto news feed — bullish/bearish cards, light + dark',
    viewport: { width: 500, height: 460 },
    sourceHtml: '/design-system/preview/components-news-feed.html',
    Component: lazy(() => import('@/components/design-system/news-feed/NewsFeed')),
  },
  {
    slug: 'index-bar',
    name: 'Index Bar',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'CRM pipeline dashboard overview — metrics + stage index bar',
    viewport: { width: 700, height: 560 },
    sourceHtml: '/design-system/preview/components-index-bar.html',
    Component: lazy(() => import('@/components/design-system/index-bar/IndexBar')),
  },
  {
    slug: 'calendar',
    name: 'Calendar',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Month navigator + day selection with event panel',
    viewport: { width: 420, height: 680 },
    sourceHtml: '/design-system/preview/components-calendar.html',
    Component: lazy(() => import('@/components/design-system/calendar/Calendar')),
  },
  {
    slug: 'file-folder',
    name: 'File / Folder',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Animated file-folder app icon — blue/normal + red/hot, light & dark',
    viewport: { width: 620, height: 520 },
    sourceHtml: '/design-system/preview/components-file-folder.html',
    Component: lazy(() => import('@/components/design-system/file-folder/FileFolder')),
  },
  {
    slug: 'stacked-list',
    name: 'Stacked List',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Stacked item list with avatars, labels and actions',
    viewport: { width: 700, height: 480 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/blob/main/stacked-list/stacked-list.html',
    Component: lazy(() => import('@/components/design-system/stacked-list/StackedList')),
  },
  {
    slug: 'task-card',
    name: 'Task card',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Kanban task cards — click to open AI-driven detail popover',
    viewport: { width: 700, height: 680 },
    sourceHtml: '/design-system/preview/components-task-card.html',
    Component: lazy(() => import('@/components/design-system/task-card/TaskCard')),
  },
  {
    slug: 'connect-modal',
    name: 'Connect Modal',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'OAuth / API Key connection modal — emerald CTA',
    viewport: { width: 1280, height: 900 },
    sourceHtml: '/design-system/preview/brand-connect-modal.html',
    Component: lazy(() => import('@/components/design-system/connect-modal/ConnectModal')),
  },
  {
    slug: 'workflow-add-elements',
    name: 'Workflow: add elements',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Right-click canvas menu — category + nodes flyout with segmented tabs',
    viewport: { width: 1200, height: 800 },
    sourceHtml: '/design-system/preview/components-workflow-add-elements.html',
    Component: lazy(() => import('@/components/design-system/workflow-add-elements/WorkflowAddElements')),
  },
  {
    slug: 'workflow-nodes',
    name: 'Workflow: nodes',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Trigger / Action / Output node cards for the workflow canvas',
    viewport: { width: 900, height: 1100 },
    sourceHtml: '/design-system/preview/components-workflow-nodes.html',
    Component: lazy(() => import('@/components/design-system/workflow-nodes/WorkflowNodes')),
  },
  {
    slug: 'workflow-publish',
    name: 'Workflow: publish',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Publish button + popover for the AI workflow editor',
    viewport: { width: 480, height: 520 },
    sourceHtml: '/design-system/preview/components-workflow-publish.html',
    Component: lazy(() => import('@/components/design-system/workflow-publish/WorkflowPublish')),
  },
  {
    slug: 'workflow-template-cards',
    name: 'Workflow: template cards',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'AI workflow template card grid with flow preview and hover CTA',
    viewport: { width: 700, height: 620 },
    sourceHtml: '/design-system/preview/components-workflow-template-cards.html',
    Component: lazy(() => import('@/components/design-system/workflow-template-cards/WorkflowTemplateCards')),
  },
  {
    slug: 'task-board',
    name: 'TaskBoard',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'AI agent syncs tasks from Slack, GitHub, Notion',
    viewport: { width: 1100, height: 800 },
    sourceHtml: '/design-system/preview/brand-taskboard.html',
    Component: lazy(() => import('@/components/design-system/task-board/TaskBoard')),
  },
  {
    slug: 'sprint-planner-core',
    name: 'Sprint Planner Core',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Deha sprint planner with Ask AI command palette',
    viewport: { width: 1280, height: 900 },
    sourceHtml: '/design-system/preview/brand-sprint-planner-core.html',
    Component: lazy(() => import('@/components/design-system/sprint-planner-core/SprintPlannerCore')),
  },
  {
    slug: 'ai-memory-card',
    name: 'AI memory card',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Memory added notification card for AI chatbot',
    viewport: { width: 480, height: 620 },
    sourceHtml: '/design-system/preview/components-ai-memory-card.html',
    Component: lazy(() => import('@/components/design-system/ai-memory-card/AiMemoryCard')),
  },
  {
    slug: 'todo-list',
    name: 'To-do list',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Animated daily to-do — drag-right to complete',
    viewport: { width: 700, height: 720 },
    sourceHtml: '/design-system/preview/components-todo-list.html',
    Component: lazy(() => import('@/components/design-system/todo-list/TodoList')),
  },
  {
    slug: 'theme-editor',
    name: 'Theme editor',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Color picker + window mode + brightness settings panel',
    viewport: { width: 480, height: 620 },
    sourceHtml: '/design-system/preview/components-theme-editor.html',
    Component: lazy(() => import('@/components/design-system/theme-editor/ThemeEditor')),
  },
  {
    slug: 'toast',
    name: 'Toast',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Live morphing toast — tap to fire, drag to dismiss (pure React)',
    viewport: { width: 540, height: 980 },
    sourceHtml: '/design-system/preview/components-toast.html',
    Component: lazy(() => import('@/components/design-system/toast/Toast')),
  },
  {
    slug: 'morph-surface-feedback',
    name: 'Morph Surface Feedback',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Pill trigger morphs into a feedback surface with gliding brand dot',
    viewport: { width: 700, height: 360 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/tree/main/morph-surface-feedback',
    Component: lazy(() => import('@/components/design-system/morph-surface-feedback/MorphSurface')),
  },
  {
    slug: 'onboarding-completion',
    name: 'Onboarding Completion',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Prompt · Card · Checklist → success morph',
    viewport: { width: 480, height: 620 },
    sourceHtml: '/design-system/preview/brand-onboarding-completion.html',
    Component: lazy(() => import('@/components/design-system/onboarding-completion/OnboardingCompletion')),
  },
  {
    slug: 'dynamic-island-reader',
    name: 'Dynamic Island Reader',
    status: 'Proceeding',
    category: 'Components',
    subtitle: 'Light-mode article + animated Dynamic Island progress',
    viewport: { width: 520, height: 940 },
    sourceHtml: '/design-system/preview/brand-dynamic-island-reader.html',
    Component: lazy(() => import('@/components/design-system/dynamic-island-reader/DynamicIslandReader')),
  },

  // ══ Waiting ═══════════════════════════════════════════════════════════════
  {
    slug: 'leads-table',
    name: 'Leads Table',
    status: 'Waiting',
    category: 'Components',
    subtitle: 'Sortable leads pipeline table with row popover',
    viewport: { width: 1380, height: 920 },
    sourceHtml: '/design-system/preview/components-leads-table.html',
    Component: lazy(() => import('@/components/design-system/leads-table/LeadsTable')),
  },
  {
    slug: 'week-calendar',
    name: 'Week Calendar',
    status: 'Waiting',
    category: 'Components',
    subtitle: '7-day timed calendar with hour rail, density variants and live now-line',
    viewport: { width: 920, height: 680 },
    sourceHtml: 'https://github.com/borabekarr/deha-claude-design-htmls/tree/main/calendar',
    Component: lazy(() => import('@/components/design-system/week-calendar/WeekCalendar')),
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getBySlug(slug: string): RegistryEntry | undefined {
  return registry.find((e) => e.slug === slug)
}

/**
 * Returns registry entries bucketed status -> subcategory, both levels in
 * canonical order (STATUS_ORDER, SUBCATEGORY_ORDER). Empty buckets are pruned
 * at both levels so callers don't render empty sections.
 */
export function getGroupedByStatus(): Map<string, Map<string, RegistryEntry[]>> {
  const out = new Map<string, Map<string, RegistryEntry[]>>()

  // Seed in canonical order
  for (const status of STATUS_ORDER) {
    const sub = new Map<string, RegistryEntry[]>()
    for (const cat of SUBCATEGORY_ORDER) sub.set(cat, [])
    out.set(status, sub)
  }

  for (const entry of registry) {
    out.get(entry.status)?.get(entry.category)?.push(entry)
  }

  // Prune empty subcategories, then empty statuses
  for (const [status, sub] of out) {
    for (const [cat, entries] of sub) {
      if (entries.length === 0) sub.delete(cat)
    }
    if (sub.size === 0) out.delete(status)
  }

  return out
}
