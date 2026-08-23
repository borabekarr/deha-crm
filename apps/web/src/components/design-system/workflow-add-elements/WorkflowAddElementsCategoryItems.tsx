// Render-only split of WorkflowAddElements' category row list (react-doctor
// no-giant-component). Class names, DOM order and markup are unchanged from
// the parent. `interactive=false` renders a non-interactive ghost copy for
// the outgoing tab's exit layer (Fix 3) — no proximity/hover/refs.
import type { MutableRefObject } from 'react'
import { DARK_BADGE_IDS, type Category } from './workflow-add-elements-shared'

interface WorkflowAddElementsCategoryItemsProps {
  cats: Category[]
  interactive: boolean
  hoveredId: string | null
  itemEls: MutableRefObject<Map<string, HTMLDivElement>>
  onCatMouseEnter: (cat: Category) => void
}

export function WorkflowAddElementsCategoryItems({
  cats,
  interactive,
  hoveredId,
  itemEls,
  onCatMouseEnter,
}: WorkflowAddElementsCategoryItemsProps) {
  return (
    <>
      {cats.map((cat) => (
        <div
          key={cat.id}
          {...(interactive
            ? {
                ref: (el: HTMLDivElement | null) => {
                  if (el) itemEls.current.set(cat.id, el)
                  else itemEls.current.delete(cat.id)
                },
                onMouseEnter: () => onCatMouseEnter(cat),
                'data-proximity': true,
              }
            : {})}
          className={`wae-ae-item${interactive && hoveredId === cat.id ? ' hovered' : ''}`}
        >
          <div
            className={`wae-badge-icon wae-badge-lg${DARK_BADGE_IDS.has(cat.id) ? ' wae-badge--ink' : ''}`}
            style={{ backgroundColor: cat.color }}
          >
            <span className="material-icons">{cat.icon}</span>
          </div>
          <span className="wae-ae-name">{cat.name}</span>
          <span className="material-icons wae-ae-chevron">chevron_right</span>
        </div>
      ))}
    </>
  )
}
