// Render-only split of WorkflowAddElements' "Add Elements" popover
// (react-doctor no-giant-component). Class names, DOM order and markup are
// unchanged from the parent; all state, refs and the proximity/pill-spring
// wiring stay owned by WorkflowAddElements and arrive here as the same ref
// objects/callbacks (mutated in place) plus already-composed handlers.
import type { MutableRefObject, RefObject } from 'react'
import { Button } from '@/components/design-system/buttons/Buttons'
import { GENERAL_CATS, INTEGRATION_CATS, type Category, type Tab } from './workflow-add-elements-shared'
import { WorkflowAddElementsCategoryItems } from './WorkflowAddElementsCategoryItems'

interface WorkflowAddElementsPanelProps {
  aeOuterRef: RefObject<HTMLDivElement | null>
  aeVisible: boolean
  aeLeft: number
  aeTop: number
  search: string
  activeTab: Tab
  segSpringCallbackRef: (el: HTMLDivElement | null) => void
  segPillRef: (el: HTMLSpanElement | null) => void
  onSwitchTab: (tab: Tab) => void
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearchClear: () => void
  listWrapRef: RefObject<HTMLDivElement | null>
  listLeavingTab: Tab | null
  listPanelState: (idx: number) => string
  tabOrder: Tab[]
  visibleCats: Category[]
  filter: string
  hoveredId: string | null
  itemEls: MutableRefObject<Map<string, HTMLDivElement>>
  onCatMouseEnter: (cat: Category) => void
}

export function WorkflowAddElementsPanel({
  aeOuterRef,
  aeVisible,
  aeLeft,
  aeTop,
  search,
  activeTab,
  segSpringCallbackRef,
  segPillRef,
  onSwitchTab,
  onSearchChange,
  onSearchClear,
  listWrapRef,
  listLeavingTab,
  listPanelState,
  tabOrder,
  visibleCats,
  filter,
  hoveredId,
  itemEls,
  onCatMouseEnter,
}: WorkflowAddElementsPanelProps) {
  return (
    <div
      ref={aeOuterRef}
      className={`wae-pop-outer${aeVisible ? ' visible' : ''}`}
      style={{ left: aeLeft, top: aeTop }}
    >
      {/* Step 4: data-compact drives the footer collapse (spring/bounce) below —
          the card compacts whenever the search field holds any text, and
          re-expands the same way the moment it's cleared. */}
      <div className="wae-pop-inner wae-ae-inner" data-compact={search ? 'true' : undefined}>
        <div className="wae-ae-header">
          <div className="wae-ae-title">
            <span className="material-icons">widgets</span>
            Add Elements
          </div>

          {/* Segmented control — .seg/.seg.fill sizing from _controls.css, but the
              pill itself is driven by usePillSpring (Fix 4), not the shared segRef,
              so data-seg-managed still opts this instance out of _controls.js auto-init. */}
          <div
            ref={segSpringCallbackRef}
            className="seg fill wae-seg-wrap"
            data-seg-managed
            data-active-tab={activeTab}
          >
            {/* GOTCHA: the spring writes inline `transform`, so any hover polish on
                this pill must live on the CSS `scale` property, never `transform`. */}
            <span className="seg-pill" ref={segPillRef} style={{ transition: 'none' }} />
            <button
              type="button"
              className={activeTab === 'general' ? 'active' : ''}
              onClick={() => onSwitchTab('general')}
            >
              <span className="material-icons">apps</span>
              General
            </button>
            <button
              type="button"
              className={activeTab === 'integrations' ? 'active' : ''}
              onClick={() => onSwitchTab('integrations')}
            >
              <span className="material-icons">hub</span>
              Integrations
            </button>
          </div>

          {/* Search */}
          <div className="wae-ae-search" data-has-text={search ? 'true' : 'false'}>
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Search..."
              autoComplete="off"
              aria-label="Search workflow elements"
              value={search}
              onChange={onSearchChange}
            />
            {/* Item 6: clear button — visible only when text entered */}
            <button
              type="button"
              className="wae-ae-search-clear"
              aria-label="Clear search"
              onClick={onSearchClear}
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        {/* Category list — direction-aware exit/enter on tab switch (Fix 3), driven by
            usePanelDirection + the global [data-panel-state] keyframes, mirroring
            motion-tabs: the outgoing tab plays a ghost exit layer while the incoming
            tab (key={activeTab} remount) enters from the opposite side. Options inside
            register as a proximity group via data-proximity (Fix 2, default engine
            mapping — the group itself is registered once, on the shell). */}
        <div className="wae-ae-list-wrap" ref={listWrapRef}>
          {listLeavingTab && (
            <div
              className="wae-ae-list wae-ae-list-exit"
              data-panel-state={listPanelState(tabOrder.indexOf(listLeavingTab))}
              aria-hidden="true"
            >
              <WorkflowAddElementsCategoryItems
                cats={(listLeavingTab === 'general' ? GENERAL_CATS : INTEGRATION_CATS).filter(
                  (c) => !filter || c.name.toLowerCase().includes(filter)
                )}
                interactive={false}
                hoveredId={hoveredId}
                itemEls={itemEls}
                onCatMouseEnter={onCatMouseEnter}
              />
            </div>
          )}
          <div
            className="wae-ae-list wae-ae-list-enter"
            data-panel-state={listPanelState(tabOrder.indexOf(activeTab))}
            key={activeTab}
          >
            <WorkflowAddElementsCategoryItems
              cats={visibleCats}
              interactive
              hoveredId={hoveredId}
              itemEls={itemEls}
              onCatMouseEnter={onCatMouseEnter}
            />
          </div>
        </div>

        {/* Footer — wrapped so its max-height can spring-collapse in search mode. */}
        <div className="wae-ae-footer-wrap">
          <div className="wae-ae-sep" />
          <div className="wae-ae-footer">
            {/* Item 2: live import of the shared Button specimen. */}
            <Button variant="green" variant2="apply">
              <span className="material-symbols-outlined btn-apply-icon">neurology</span>
              AI Recommendations
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
