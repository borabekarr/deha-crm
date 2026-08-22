/**
 * Faster-exits rule guard: proves the exit leg of a family's transition is
 * strictly shorter than its enter leg. Covers three live components
 * (Dropdown popover, DisclosureGroup accordion, StatusCard tooltip) plus a
 * token-resolution check across every faster-exits family. No screenshots —
 * timing, not pixels, is what the faster-exits rule changed.
 * See plans/faster-exits-rule.md Step 8.
 */
import { test, expect, type Page } from '@playwright/test'

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(300)
}

// "0.2s" -> 0.2, "260ms" -> 0.26 -- transitionDuration is always serialized
// in seconds by getComputedStyle, but normalize both units defensively.
function parseDuration(raw: string): number {
  const first = raw.split(',')[0]?.trim() ?? ''
  const ms = /ms$/.test(first)
  const value = Number.parseFloat(first)
  return ms ? value / 1000 : value
}

test.describe('faster-exits: exit duration < enter duration', () => {
  test('Dropdown: .dd-menu exit leg is shorter than the open leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/dropdown')
    await settle(page)

    const trigger = page.locator('.dd-trigger').first()
    const menu = page.locator('.dd-menu').first()

    await trigger.click()
    await menu.waitFor({ state: 'visible' })
    await expect(menu).toHaveAttribute('data-enter', 'true')
    const openDuration = parseDuration(await menu.evaluate((el) => getComputedStyle(el).transitionDuration))

    // .dd-scrim (position: fixed; inset: 0) sits above the trigger while the
    // menu is open, so a second trigger click would hit the scrim instead —
    // dismiss with Escape (the component's documented outside-tap/Escape
    // dismiss path) and read the transition before the exit-timer unmount.
    await page.keyboard.press('Escape')
    await expect(menu).toHaveAttribute('data-exit', 'true')
    const closedDuration = parseDuration(await menu.evaluate((el) => getComputedStyle(el).transitionDuration))

    // Dropdown sets an inline `--dd-dur: 260ms` override on the open leg, so
    // comparing closed-vs-open alone can't catch a regression in the shared
    // `--popover-exit-dur` family token -- also assert against the resolved
    // family enter tier directly.
    const familyEnterDur = parseDuration(
      await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--popover-dur').trim()),
    )

    expect(closedDuration).toBeLessThan(openDuration)
    expect(closedDuration).toBeLessThan(familyEnterDur)
  })

  test('DisclosureGroup: .dg-clip exit leg is shorter than the open leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/disclosure-group')
    await settle(page)

    // "account" ships defaultOpen, "notify" does not -- both are present on
    // first render, so no interaction is needed to observe both states.
    const openClip = page.locator('.dg[data-open="true"] .dg-clip').first()
    const closedClip = page.locator('.dg:not([data-open="true"]) .dg-clip').first()
    await openClip.waitFor({ state: 'attached' })
    await closedClip.waitFor({ state: 'attached' })

    const openDuration = parseDuration(await openClip.evaluate((el) => getComputedStyle(el).transitionDuration))
    const closedDuration = parseDuration(await closedClip.evaluate((el) => getComputedStyle(el).transitionDuration))

    expect(closedDuration).toBeLessThan(openDuration)
  })

  test('StatusCard: .sc-tip exit leg is shorter than the hovered leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/status-card')
    await settle(page)

    // The chip lives inside .sc-collapse, which is collapsed to zero height
    // until the card header is toggled open -- expand it first so the chip
    // is actually the topmost element at its own coordinates (otherwise the
    // still-covering .sc-header intercepts the hover).
    const header = page.locator('.sc-header').first()
    const card = page.locator('.sc-collapse').first()
    await header.click()
    await expect(card).toHaveAttribute('data-open', 'true')

    const chip = page.locator('.sc-chip').first()
    const tip = page.locator('.sc-tip').first()
    await tip.waitFor({ state: 'attached' })

    const closedDuration = parseDuration(await tip.evaluate((el) => getComputedStyle(el).transitionDuration))

    // Guard against the hover landing before the .sc-collapse expand
    // transition has settled -- scroll the chip into view and wait for it
    // to be stable in the viewport before dispatching the hover.
    await chip.scrollIntoViewIfNeeded()
    await expect(chip).toBeVisible()
    await expect(chip).toBeInViewport()
    await expect
      .poll(() => chip.evaluate((el) => el.getBoundingClientRect().top), { timeout: 3000 })
      .toBe(await chip.evaluate((el) => el.getBoundingClientRect().top))

    await chip.hover({ force: false })

    // Confirm the browser actually registered :hover before reading state
    // off the tooltip -- a hover dispatched mid-layout can silently miss.
    const hoverRegistered = await expect
      .poll(() => chip.evaluate((el) => el.matches(':hover')), { timeout: 3000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false)

    if (!hoverRegistered) {
      // Fallback: force the :hover pseudo-state via CDP so the hovered leg
      // can still be read reliably even if the pointer-based hover flaked.
      const client = await page.context().newCDPSession(page)
      await client.send('DOM.enable')
      await client.send('CSS.enable')
      const { root } = await client.send('DOM.getDocument')
      const chipHandle = await chip.elementHandle()
      const objectId = await chipHandle?.evaluateHandle((el) => el)
      const backendNodeId = await client.send('DOM.requestNode', {
        objectId: (objectId as unknown as { _remoteObject?: { objectId?: string } })?._remoteObject?.objectId ?? '',
      }).catch(() => null)
      const nodeId =
        backendNodeId?.nodeId ??
        (
          await client.send('DOM.querySelector', {
            nodeId: root.nodeId,
            selector: '.sc-chip',
          })
        ).nodeId
      await client.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] })
    }

    await expect(tip).toHaveCSS('opacity', '1') // wait for the hover-triggered mutation, not a bare timeout
    const hoverDuration = parseDuration(await tip.evaluate((el) => getComputedStyle(el).transitionDuration))

    expect(closedDuration).toBeLessThan(hoverDuration)
  })

  test('token resolution: every faster-exits family exit token < its enter token', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/dropdown')
    await settle(page)

    const pairs = [
      ['--popover-exit-dur', '--popover-dur'],
      ['--tooltip-exit-dur', '--tooltip-dur'],
      ['--accordion-exit-dur', '--accordion-dur'],
      ['--overlay-morph-exit-dur', '--overlay-morph-dur'],
      ['--toast-exit-dur', '--toast-dur'],
    ] as const

    const resolved = await page.evaluate((tokenPairs) => {
      const style = getComputedStyle(document.documentElement)
      return tokenPairs.map(([exitVar, enterVar]) => [style.getPropertyValue(exitVar).trim(), style.getPropertyValue(enterVar).trim()])
    }, pairs)

    for (const [i, [exitRaw, enterRaw]] of resolved.entries()) {
      const [exitVar, enterVar] = pairs[i]
      expect(exitRaw, `${exitVar} should resolve to a non-empty value`).not.toBe('')
      expect(enterRaw, `${enterVar} should resolve to a non-empty value`).not.toBe('')
      expect(parseDuration(exitRaw), `${exitVar} (${exitRaw}) should be < ${enterVar} (${enterRaw})`).toBeLessThan(parseDuration(enterRaw))
    }
  })

  test('Toast: .ts-wrap exit leg is shorter than the enter leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/toast')
    await settle(page)

    const trigger = page.locator('.btn-cta').first()
    await trigger.click()

    const wrap = page.locator('.ts-wrap').first()
    await wrap.waitFor({ state: 'visible' })

    await expect
      .poll(() => wrap.evaluate((el) => getComputedStyle(el).transitionDuration), { timeout: 2000 })
      .toMatch(/^0\.5/)
    const openDuration = parseDuration(await wrap.evaluate((el) => getComputedStyle(el).transitionDuration))

    // The exit unmount timer (exitDurMs() * MULT, --toast-exit-dur = 120ms)
    // is short enough that clicking THEN polling can race past the node's
    // removal -- arm an in-page MutationObserver on .ts-wrap's style
    // attribute BEFORE the close click so the transitionDuration flip is
    // caught no matter how fast it fires, mirroring the WorkflowPublish and
    // WorkflowAddElements hardening above.
    await page.evaluate(() => {
      const el = document.querySelector('.ts-wrap')
      ;(window as unknown as { __toastClosedDur: Promise<string> }).__toastClosedDur = new Promise<string>((resolve) => {
        if (!el) {
          resolve('')
          return
        }
        const read = () => {
          const dur = getComputedStyle(el).transitionDuration
          if (/^0\.12/.test(dur)) {
            resolve(dur)
            return true
          }
          return false
        }
        if (read()) return
        const observer = new MutationObserver(() => {
          if (read()) observer.disconnect()
        })
        observer.observe(el, { attributes: true, attributeFilter: ['style'] })
      })
    })
    await wrap.locator('.ts-close-btn').click()
    const closedDurationRaw = await page.evaluate(() => (window as unknown as { __toastClosedDur: Promise<string> }).__toastClosedDur)
    const closedDuration = parseDuration(closedDurationRaw)

    expect(closedDuration).toBeLessThan(openDuration)
  })

  test('DeleteModal: .dm-shell exit leg is shorter than the open leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/delete-modal')
    await settle(page)

    await page.locator('.dm-preview-btn').click()

    const overlay = page.locator('.dm-overlay')
    const shell = page.locator('.dm-shell')
    await expect(overlay).toHaveAttribute('data-state', 'open')
    const openDuration = parseDuration(await shell.evaluate((el) => getComputedStyle(el).animationDuration))

    await page.locator('.dm-close').click()
    await expect(overlay).toHaveAttribute('data-state', 'closing')
    const closedDuration = parseDuration(await shell.evaluate((el) => getComputedStyle(el).animationDuration))

    expect(closedDuration).toBeLessThan(openDuration)
  })

  test('Calendar: exiting month panel is shorter than the entering month panel', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/calendar')
    await settle(page)

    await page.locator('.cal-nav-btn[aria-label="Next month"]').click()

    const exiting = page.locator('.cal-grid[data-panel-state^="exiting"]')
    const entering = page.locator('.cal-grid[data-panel-state^="entering"]')
    await exiting.waitFor({ state: 'attached' })
    await entering.waitFor({ state: 'attached' })

    const exitDuration = parseDuration(await exiting.evaluate((el) => getComputedStyle(el).animationDuration))
    const enterDuration = parseDuration(await entering.evaluate((el) => getComputedStyle(el).animationDuration))

    expect(exitDuration).toBeLessThan(enterDuration)
  })

  test('WorkflowAddElements: exiting category list is shorter than the entering list', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/workflow-add-elements')
    await settle(page)

    // The Add Elements panel (.wae-pop-outer) starts hidden -- right-click
    // the canvas (its documented open path, per the on-page hint text) to
    // reveal it before the tab switch is reachable.
    await page.locator('.wae-canvas').click({ button: 'right' })
    await expect(page.locator('.wae-pop-outer')).toHaveClass(/visible/)

    // The ghost exit layer unmounts on a 260ms timer (switchTab's
    // listLeaveTimer) shortly after its own ~150ms animation completes -- a
    // separate click-then-waitFor-then-evaluate can race past that unmount
    // (especially under parallel-worker load), so the observer is armed
    // BEFORE the tab-switch click and both durations are read in one
    // in-page call the instant the exit node is found.
    await page.evaluate(() => {
      ;(window as unknown as { __waeDurations: Promise<{ exit: string; enter: string }> }).__waeDurations = new Promise((resolve) => {
        const read = () => {
          const exitEl = document.querySelector('.wae-ae-list-exit')
          const enterEl = document.querySelector('.wae-ae-list-enter')
          if (exitEl && enterEl) {
            resolve({
              exit: getComputedStyle(exitEl).animationDuration,
              enter: getComputedStyle(enterEl).animationDuration,
            })
            return true
          }
          return false
        }
        if (read()) return
        const observer = new MutationObserver(() => {
          if (read()) observer.disconnect()
        })
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-panel-state'] })
      })
    })

    await page.locator('.wae-seg-wrap button', { hasText: 'Integrations' }).click()
    const durations = await page.evaluate(
      () => (window as unknown as { __waeDurations: Promise<{ exit: string; enter: string }> }).__waeDurations,
    )

    const exitDuration = parseDuration(durations.exit)
    const enterDuration = parseDuration(durations.enter)

    expect(exitDuration).toBeLessThan(enterDuration)
  })

  test('DatePicker: #dp-panel exit leg is shorter than the open leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/date-picker')
    await settle(page)

    const panel = page.locator('#dp-panel')

    // The panel mounts already open (panelOpen starts true in the hook), so
    // #dp-open-btn's first click would toggle it CLOSED, not open it -- read
    // the open leg off the mounted-open state directly.
    await expect(panel).toHaveClass(/dp-panel--open/)
    const openDuration = parseDuration(await panel.evaluate((el) => getComputedStyle(el).transitionDuration))

    await page.locator('#dp-close-btn').click()
    await expect(panel).toHaveClass(/dp-panel--closing/)
    const closedDuration = parseDuration(await panel.evaluate((el) => getComputedStyle(el).transitionDuration))

    expect(closedDuration).toBeLessThan(openDuration)
  })

  test('PipelineCard: .pcx-overlay scrim exit leg is shorter than the open leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/pipeline-card')
    await settle(page)

    await page.locator('.pc-expand[aria-label="Open details"]').first().click()

    const overlay = page.locator('.pcx-overlay')
    await expect(overlay).toHaveClass(/open/)
    const openDuration = parseDuration(await overlay.evaluate((el) => getComputedStyle(el).transitionDuration))

    await page.locator('.pcx-close').click()
    await expect(overlay).not.toHaveClass(/open/)
    const closedDuration = parseDuration(await overlay.evaluate((el) => getComputedStyle(el).transitionDuration))

    expect(closedDuration).toBeLessThan(openDuration)
  })

  test('WorkflowPublish: .wp-bezel exit leg is shorter than the open leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/workflow-publish')
    await settle(page)

    const btn = page.locator('.wp-btn')
    const bezel = page.locator('.wp-bezel')

    await btn.click()
    await bezel.waitFor({ state: 'attached' })
    const openDuration = parseDuration(await bezel.evaluate((el) => getComputedStyle(el).animationDuration))

    // The closing animation is short enough (--overlay-morph-exit-dur) that
    // clicking THEN separately polling/re-reading can race past
    // onAnimationEnd unmounting the node before the read lands -- arm an
    // in-page MutationObserver (awaited via a window-scoped promise) before
    // the click so the class-change is caught no matter how fast it fires,
    // then click, then collect the already-settling promise's value.
    await page.evaluate(() => {
      ;(window as unknown as { __wpClosedDur: Promise<string> }).__wpClosedDur = new Promise<string>((resolve) => {
        const read = () => {
          const el = document.querySelector('.wp-bezel')
          if (el && el.classList.contains('closing')) {
            resolve(getComputedStyle(el).animationDuration)
            return true
          }
          return false
        }
        if (read()) return
        const observer = new MutationObserver(() => {
          if (read()) observer.disconnect()
        })
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
      })
    })
    await btn.click()
    const closedDurationRaw = await page.evaluate(() => (window as unknown as { __wpClosedDur: Promise<string> }).__wpClosedDur)
    const closedDuration = parseDuration(closedDurationRaw)

    expect(closedDuration).toBeLessThan(openDuration)
  })

  test('SmoothDrawer: .sd-sheet-outer exit leg is shorter than the open leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/smooth-drawer')
    await settle(page)

    // Showcase renders four DrawerInstance cards (bottom/top/left/right), one
    // per side, in DOM order -- .first() on each locator consistently
    // resolves to the same ("bottom") instance across trigger/overlay/sheet.
    const overlay = page.locator('.sd-overlay').first()
    const sheetOuter = page.locator('.sd-sheet-outer').first()

    await page.locator('.sd-trigger').first().click()
    await expect(overlay).toHaveClass(/is-open/)
    const openDuration = parseDuration(await sheetOuter.evaluate((el) => getComputedStyle(el).transitionDuration))

    await page.locator('.sd-later').first().click()
    await expect(overlay).toHaveClass(/is-closing/)
    const closedDuration = parseDuration(await sheetOuter.evaluate((el) => getComputedStyle(el).transitionDuration))

    expect(closedDuration).toBeLessThan(openDuration)
  })

  test('ExpandableScreen: .es-overlay FLIP exit leg is shorter than the open leg', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/expandable-screen')
    await settle(page)

    // .es-scrim's own opacity transition is a separate, unrelated fade (not
    // the faster-exits pair); it doubles as a reliable open/close phase
    // signal though, since its data-open toggles in the same render as the
    // FLIP surface's `closing` flag (both driven off `phase`, see collapse()
    // and the `open = phase === 'open'` derivation). The actual faster-exits
    // asymmetry (DURATION_S 0.45s open vs --duration-380 0.38s close) lives
    // on `.es-overlay`'s inline top/left/width/height/border-radius transition.
    const scrim = page.locator('.es-scrim')
    const overlay = page.locator('.es-overlay')

    await page.getByTestId('es-expand-trigger').click()
    await expect(scrim).toHaveAttribute('data-open', '')
    const openDuration = parseDuration(await overlay.evaluate((el) => getComputedStyle(el).transitionDuration))

    await page.keyboard.press('Escape')
    await expect(scrim).not.toHaveAttribute('data-open', '')
    const closedDuration = parseDuration(await overlay.evaluate((el) => getComputedStyle(el).transitionDuration))

    expect(closedDuration).toBeLessThan(openDuration)
  })

  test('ExpandableScreen: open leg collapses to 0s under --anim-mult: 0', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/expandable-screen')
    await settle(page)

    await page.evaluate(() => document.documentElement.style.setProperty('--anim-mult', '0'))

    const scrim = page.locator('.es-scrim')
    const overlay = page.locator('.es-overlay')
    const content = page.locator('.es-content')

    await page.getByTestId('es-expand-trigger').click()
    await expect(scrim).toHaveAttribute('data-open', '')

    const zeroedOverlayDuration = parseDuration(await overlay.evaluate((el) => getComputedStyle(el).transitionDuration))
    const zeroedContentDuration = parseDuration(await content.evaluate((el) => getComputedStyle(el).transitionDuration))
    expect(zeroedOverlayDuration).toBe(0)
    expect(zeroedContentDuration).toBe(0)

    // Regression guard: before the Step 2 fix, the open leg was a bare
    // `${DURATION_S}s` string that never read --anim-mult at all -- restore
    // the multiplier and confirm the open leg is back to the Apple 0.4s
    // standard, not still pinned at 0.
    await page.evaluate(() => document.documentElement.style.removeProperty('--anim-mult'))
    await page.keyboard.press('Escape')
    await expect(scrim).not.toHaveAttribute('data-open', '')
    await page.getByTestId('es-expand-trigger').click()
    await expect(scrim).toHaveAttribute('data-open', '')
    const restoredOverlayDuration = parseDuration(await overlay.evaluate((el) => getComputedStyle(el).transitionDuration))
    expect(restoredOverlayDuration).toBe(0.4)
  })

  test('DeleteModal: close timer tracks --overlay-morph-exit-dur', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/delete-modal')
    await settle(page)

    await page.locator('.dm-preview-btn').click()
    await expect(page.locator('.dm-overlay')).toHaveAttribute('data-state', 'open')

    // Arm the elapsed-time observer BEFORE the close click -- a capture-phase
    // click listener on .dm-close records the real DOM click's performance.now(),
    // since locator.click()'s actionability wait can add 50-70ms ahead of the
    // dispatched click event itself. Resolve on the overlay's data-state
    // attribute flipping to "closed" (closeTimer.set(tokenMs('--overlay-morph-exit-dur',
    // 240) + 20, ...) drives that flip), never on a bare waitForTimeout.
    await page.evaluate(() => {
      ;(window as unknown as { __dmElapsed: Promise<number> }).__dmElapsed = new Promise<number>((resolve) => {
        const overlay = document.querySelector('.dm-overlay')
        const closeBtn = document.querySelector('.dm-close')
        if (!overlay || !closeBtn) {
          resolve(-1)
          return
        }
        let clickedAt = 0
        closeBtn.addEventListener('click', () => { clickedAt = performance.now() }, { capture: true, once: true })
        const check = () => {
          if (overlay.getAttribute('data-state') === 'closed') {
            resolve(performance.now() - clickedAt)
            return true
          }
          return false
        }
        if (check()) return
        const observer = new MutationObserver(() => {
          if (check()) observer.disconnect()
        })
        observer.observe(overlay, { attributes: true, attributeFilter: ['data-state'] })
      })
    })

    await page.locator('.dm-close').click()
    const elapsed = await page.evaluate(() => (window as unknown as { __dmElapsed: Promise<number> }).__dmElapsed)

    expect(elapsed).toBeGreaterThanOrEqual(230)
    expect(elapsed).toBeLessThanOrEqual(330)
  })

  test('WorkflowAddElements: leave timers track their CSS tokens', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/workflow-add-elements')
    await settle(page)

    await page.locator('.wae-canvas').click({ button: 'right' })
    await expect(page.locator('.wae-pop-outer')).toHaveClass(/visible/)

    // C1: list ghost exit -- listLeaveTimer reads the scoped
    // --panel-slide-exit-dur override (150ms) via tokenMs + 20ms buffer.
    // Arm the removal observer BEFORE the tab-switch click; the click
    // listener records the real DOM click time, not the locator.click()
    // actionability-wait time.
    await page.evaluate(() => {
      ;(window as unknown as { __waeListElapsed: Promise<number> }).__waeListElapsed = new Promise<number>((resolve) => {
        const tabBtn = Array.from(document.querySelectorAll('.wae-seg-wrap button')).find((b) =>
          b.textContent?.includes('Integrations'),
        )
        if (!tabBtn) {
          resolve(-1)
          return
        }
        let clickedAt = 0
        tabBtn.addEventListener('click', () => { clickedAt = performance.now() }, { capture: true, once: true })
        const check = () => {
          if (!document.querySelector('.wae-ae-list-exit')) {
            resolve(performance.now() - clickedAt)
            return true
          }
          return false
        }
        const observer = new MutationObserver(() => {
          if (check()) observer.disconnect()
        })
        observer.observe(document.body, { childList: true, subtree: true })
      })
    })

    await page.locator('.wae-seg-wrap button', { hasText: 'Integrations' }).click()
    const listElapsed = await page.evaluate(() => (window as unknown as { __waeListElapsed: Promise<number> }).__waeListElapsed)

    expect(listElapsed).toBeGreaterThanOrEqual(140)
    expect(listElapsed).toBeLessThanOrEqual(230)

    // C2: search flyout exit -- searchLeaveTimer reads --duration-280 via
    // tokenMs + 20ms buffer. Type until the search results panel mounts,
    // then move the mouse off the flyout so its own hover state doesn't keep
    // the nodes flyout mounted, arm the removal observer, then click clear.
    const searchInput = page.getByLabel('Search workflow elements')
    await searchInput.click()
    await searchInput.fill('search')
    await expect(page.locator('.wae-search-cat-card').first()).toBeVisible()
    await page.mouse.move(0, 0)

    await page.evaluate(() => {
      ;(window as unknown as { __waeSearchElapsed: Promise<number> }).__waeSearchElapsed = new Promise<number>((resolve) => {
        const clearBtn = document.querySelector('.wae-ae-search-clear')
        if (!clearBtn) {
          resolve(-1)
          return
        }
        let clickedAt = 0
        clearBtn.addEventListener('click', () => { clickedAt = performance.now() }, { capture: true, once: true })
        const check = () => {
          if (!document.querySelector('.wae-nodes-inner.wae-search-mode')) {
            resolve(performance.now() - clickedAt)
            return true
          }
          return false
        }
        const observer = new MutationObserver(() => {
          if (check()) observer.disconnect()
        })
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
      })
    })

    await page.locator('.wae-ae-search-clear').click()
    const searchElapsed = await page.evaluate(
      () => (window as unknown as { __waeSearchElapsed: Promise<number> }).__waeSearchElapsed,
    )

    expect(searchElapsed).toBeGreaterThanOrEqual(270)
    expect(searchElapsed).toBeLessThanOrEqual(350)
  })
})
