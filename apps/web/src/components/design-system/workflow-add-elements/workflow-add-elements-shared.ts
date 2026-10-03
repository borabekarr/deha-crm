/**
 * workflow-add-elements-shared.ts
 *
 * Non-component data/types shared between WorkflowAddElements and its
 * render-only siblings (react-doctor no-giant-component split + the
 * only-export-components rule: these live in a .ts module, not a .tsx
 * component file, so Fast Refresh boundaries stay clean).
 */

// ---------------------------------------------------------------------------
// Data (verbatim from source)
// ---------------------------------------------------------------------------

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface NodeItem {
  name: string
  icon: string
  color: string
}

export const GENERAL_CATS: Category[] = [
  { id: 'input',     name: 'Input',           icon: 'login',         color: '#4F46E5' },
  { id: 'output',    name: 'Output',          icon: 'logout',        color: 'var(--brand-primary-500)' },
  { id: 'llm',       name: 'LLM',             icon: 'psychology',    color: '#8B5CF6' },
  { id: 'action',    name: 'Action',          icon: 'bolt',          color: '#F59E0B' },
  { id: 'kb',        name: 'Knowledge Base',  icon: 'folder_open',   color: '#232323' },
  { id: 'database',  name: 'Database',        icon: 'storage',       color: '#EF4444' },
  { id: 'docreader', name: 'Document Reader', icon: 'description',   color: '#D97706' },
  { id: 'logic',     name: 'Logic',           icon: 'call_split',    color: '#F97316' },
  { id: 'utils',     name: 'Utilities',       icon: 'grid_view',     color: '#0D9488' },
]

export const INTEGRATION_CATS: Category[] = [
  { id: 'notion',   name: 'Notion',        icon: 'article',       color: '#000000' },
  { id: 'slack',    name: 'Slack',         icon: 'chat',          color: '#4A154B' },
  { id: 'stripe',   name: 'Stripe',        icon: 'credit_card',   color: '#635BFF' },
  { id: 'airtable', name: 'Airtable',      icon: 'table_chart',   color: '#EF4444' },
  { id: 'gmail',    name: 'Gmail',         icon: 'email',         color: '#EA4335' },
  { id: 'sheets',   name: 'Google Sheets', icon: 'grid_on',       color: '#0F9D58' },
  { id: 'github',   name: 'GitHub',        icon: 'code',          color: '#24292E' },
  { id: 'hubspot',  name: 'HubSpot',       icon: 'hub',           color: '#FF7A59' },
]

export const NODES: Record<string, NodeItem[]> = {
  input:     [{ name: 'Text Prompt',     icon: 'notes',           color: '#4F46E5' }, { name: 'URL Fetcher',     icon: 'link',            color: '#4F46E5' }, { name: 'File Upload',     icon: 'upload_file',     color: '#4F46E5' }, { name: 'Audio Upload',    icon: 'mic',             color: '#4F46E5' }, { name: 'Image Upload',    icon: 'image',           color: '#4F46E5' }, { name: 'Form Input',      icon: 'edit_note',       color: '#4F46E5' }, { name: 'Webhook',         icon: 'webhook',         color: '#4F46E5' }, { name: 'Database Query',  icon: 'storage',         color: '#4F46E5' }],
  output:    [{ name: 'Text Output',     icon: 'text_fields',     color: 'var(--brand-primary-500)' }, { name: 'Audio Output',    icon: 'graphic_eq',      color: 'var(--brand-primary-500)' }, { name: 'Image Output',    icon: 'image',           color: 'var(--brand-primary-500)' }, { name: 'Email Send',      icon: 'send',            color: 'var(--brand-primary-500)' }, { name: 'Slack Message',   icon: 'chat',            color: 'var(--brand-primary-500)' }, { name: 'Webhook Push',    icon: 'webhook',         color: 'var(--brand-primary-500)' }],
  llm:       [{ name: 'Claude',          icon: 'smart_toy',       color: '#8B5CF6' }, { name: 'GPT-4o',          icon: 'smart_toy',       color: '#8B5CF6' }, { name: 'Gemini 2.0',      icon: 'neurology',    color: '#8B5CF6' }, { name: 'Mistral',         icon: 'psychology',      color: '#8B5CF6' }, { name: 'Llama 3',         icon: 'memory',          color: '#8B5CF6' }],
  action:    [{ name: 'Write to Notion', icon: 'edit',            color: '#F59E0B' }, { name: 'Send Email',      icon: 'email',           color: '#F59E0B' }, { name: 'HTTP Request',    icon: 'http',            color: '#F59E0B' }, { name: 'Create Record',   icon: 'add_circle',      color: '#F59E0B' }, { name: 'Slack Post',      icon: 'chat_bubble',     color: '#F59E0B' }],
  kb:        [{ name: 'Vector Search',   icon: 'manage_search',   color: '#232323' }, { name: 'Embed Document',  icon: 'upload_file',     color: '#232323' }, { name: 'Semantic Search', icon: 'travel_explore',  color: '#232323' }, { name: 'Hybrid Search',   icon: 'search',          color: '#232323' }],
  database:  [{ name: 'Query',           icon: 'search',          color: '#EF4444' }, { name: 'Insert Row',      icon: 'add',             color: '#EF4444' }, { name: 'Update Row',      icon: 'edit',            color: '#EF4444' }, { name: 'Delete Row',      icon: 'delete',          color: '#EF4444' }],
  docreader: [{ name: 'PDF Reader',      icon: 'picture_as_pdf',  color: '#D97706' }, { name: 'Word Document',   icon: 'article',         color: '#D97706' }, { name: 'CSV Parser',      icon: 'table_chart',     color: '#D97706' }, { name: 'HTML Scraper',    icon: 'code',            color: '#D97706' }],
  logic:     [{ name: 'If / Else',       icon: 'call_split',      color: '#F97316' }, { name: 'Loop',            icon: 'loop',            color: '#F97316' }, { name: 'Switch',          icon: 'alt_route',       color: '#F97316' }, { name: 'Filter',          icon: 'filter_list',     color: '#F97316' }],
  utils:     [{ name: 'Delay',           icon: 'timer',           color: '#0D9488' }, { name: 'Transform',       icon: 'transform',       color: '#0D9488' }, { name: 'Format Date',     icon: 'calendar_today',  color: '#0D9488' }, { name: 'JSON Parse',      icon: 'data_object',     color: '#0D9488' }],
  notion:    [{ name: 'Write Page',      icon: 'article',         color: '#000000' }, { name: 'Read Database',   icon: 'table_chart',     color: '#000000' }, { name: 'Create Entry',    icon: 'add',             color: '#000000' }],
  slack:     [{ name: 'Send Message',    icon: 'chat',            color: '#4A154B' }, { name: 'DM User',         icon: 'person',          color: '#4A154B' }, { name: 'Post to Channel', icon: 'campaign',        color: '#4A154B' }],
  stripe:    [{ name: 'Create Customer', icon: 'person_add',      color: '#635BFF' }, { name: 'Charge Card',     icon: 'credit_card',     color: '#635BFF' }, { name: 'Create Invoice',  icon: 'receipt',         color: '#635BFF' }],
  airtable:  [{ name: 'Query Records',   icon: 'search',          color: '#EF4444' }, { name: 'Create Record',   icon: 'add',             color: '#EF4444' }, { name: 'Update Record',   icon: 'edit',            color: '#EF4444' }],
  gmail:     [{ name: 'Send Email',      icon: 'send',            color: '#EA4335' }, { name: 'Read Inbox',      icon: 'inbox',           color: '#EA4335' }, { name: 'Create Draft',    icon: 'drafts',          color: '#EA4335' }],
  sheets:    [{ name: 'Append Row',      icon: 'add',             color: '#0F9D58' }, { name: 'Read Range',      icon: 'table_rows',      color: '#0F9D58' }, { name: 'Update Cell',     icon: 'edit',            color: '#0F9D58' }],
  github:    [{ name: 'Create Issue',    icon: 'bug_report',      color: '#24292E' }, { name: 'Open PR',         icon: 'merge',           color: '#24292E' }, { name: 'Push Commit',     icon: 'commit',          color: '#24292E' }],
  hubspot:   [{ name: 'Create Contact',  icon: 'person_add',      color: '#FF7A59' }, { name: 'Update Deal',     icon: 'handshake',       color: '#FF7A59' }, { name: 'Send Email',      icon: 'email',           color: '#FF7A59' }],
}

// ---------------------------------------------------------------------------
// State types
// ---------------------------------------------------------------------------

export type Tab = 'general' | 'integrations'

export interface MenuState {
  aeVisible: boolean
  aeLeft: number
  aeTop: number
  nodesVisible: boolean
  nodesLeft: number
  nodesTop: number
  hoveredId: string | null
  activeTab: Tab
  search: string
  /** Item 1+6: search results panel is mounted through exit animation. */
  searchPanelMounted: boolean
  /** Item 1: search results panel is playing exit animation (wae-search-leaving). */
  searchPanelLeaving: boolean
  /** Fix 5: a query changed while the results panel was already open — briefly
   *  blur+shimmer the stale result set instead of snapping to the new layout. */
  searchPending: boolean
  /** Fix 3: outgoing tab, kept mounted (as a ghost layer) through its exit animation. */
  listLeavingTab: Tab | null
}

// Category ids whose brand color is near-black and becomes unreadable in dark mode.
// These get wae-badge--ink so the dark-mode CSS can lighten the square.
export const DARK_BADGE_IDS = new Set(['notion', 'github', 'kb', 'slack'])

// Known near-black color values used in node data (same dark categories).
const INK_COLORS = new Set(['#000000', '#000', '#24292e', '#232323', '#4a154b'])

/** Returns true when the hex color is near-black (unreadable on a dark background). */
export function isInkColor(color: string): boolean {
  return INK_COLORS.has(color.toLowerCase())
}

export const INITIAL: MenuState = {
  aeVisible: false,
  aeLeft: 0,
  aeTop: 0,
  nodesVisible: false,
  nodesLeft: 0,
  nodesTop: 0,
  hoveredId: null,
  activeTab: 'general',
  search: '',
  searchPanelMounted: false,
  searchPanelLeaving: false,
  searchPending: false,
  listLeavingTab: null,
}

// Coords-only reset — preserves last aeLeft/aeTop so the panel
// fades out in place rather than jumping to 0,0 (close-spawn-left bug).
export function closedState(s: MenuState): MenuState {
  return {
    ...s,
    aeVisible: false,
    nodesVisible: false,
    hoveredId: null,
    search: '',
    searchPanelMounted: false,
    searchPanelLeaving: false,
    searchPending: false,
    listLeavingTab: null,
  }
}

// Direction-aware tab order for the seg switch (Fix 3): index difference sign
// gives the travel direction, mirroring motion-tabs' index-based `dir`.
export const TAB_ORDER: Tab[] = ['general', 'integrations']

interface SearchGroup { cat: Category; nodes: NodeItem[] }
export interface SearchGroups { general: SearchGroup[]; integrations: SearchGroup[] }

/** Groups matching nodes by their parent category, split into General vs
 *  Integrations columns for the two-column search view. */
export function buildSearchGroups(filter: string): SearchGroups {
  if (!filter) return { general: [], integrations: [] }
  const group = (cats: Category[]): SearchGroup[] =>
    cats.reduce<SearchGroup[]>((acc, cat) => {
      const matched = (NODES[cat.id] ?? []).filter((n) => n.name.toLowerCase().includes(filter))
      if (matched.length > 0) acc.push({ cat, nodes: matched })
      return acc
    }, [])
  return { general: group(GENERAL_CATS), integrations: group(INTEGRATION_CATS) }
}
