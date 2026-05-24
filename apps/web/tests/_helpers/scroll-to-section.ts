import type { Page } from '@playwright/test'

export async function scrollToSection(page: Page, id: string): Promise<void> {
  await page.locator(`#${id}`).waitFor({ state: 'attached', timeout: 5000 })
  await page.waitForFunction(
    (sid) => !!document.querySelector(`#${sid}`),
    id,
  )
  await page.evaluate((sectionId: string) => {
    const target = document.querySelector(`#${sectionId}`) as HTMLElement | null
    if (!target) return
    let cur: HTMLElement | null = target.parentElement
    while (cur) {
      const cs = window.getComputedStyle(cur)
      const canScroll =
        (cs.overflowY === 'auto' || cs.overflowY === 'scroll' || cs.overflow === 'auto' || cs.overflow === 'scroll') &&
        cur.scrollHeight > cur.clientHeight + 4
      if (canScroll) {
        const tRect = target.getBoundingClientRect()
        const sRect = cur.getBoundingClientRect()
        cur.scrollTop += tRect.top - sRect.top - 80
        return
      }
      cur = cur.parentElement
    }
    target.scrollIntoView({ block: 'start' })
  }, id)
  await page.waitForTimeout(250)
  // Verify it stuck; if scroll was undone (e.g. hydration), retry once
  const inView = await page.evaluate((sid: string) => {
    const el = document.querySelector(`#${sid}`) as HTMLElement | null
    if (!el) return false
    const r = el.getBoundingClientRect()
    return r.top < window.innerHeight && r.bottom > 0
  }, id)
  if (!inView) {
    await page.waitForTimeout(400)
    await page.evaluate((sectionId: string) => {
      const target = document.querySelector(`#${sectionId}`) as HTMLElement | null
      if (!target) return
      let cur: HTMLElement | null = target.parentElement
      while (cur) {
        const cs = window.getComputedStyle(cur)
        const canScroll =
          (cs.overflowY === 'auto' || cs.overflowY === 'scroll' || cs.overflow === 'auto' || cs.overflow === 'scroll') &&
          cur.scrollHeight > cur.clientHeight + 4
        if (canScroll) {
          const tRect = target.getBoundingClientRect()
          const sRect = cur.getBoundingClientRect()
          cur.scrollTop += tRect.top - sRect.top - 80
          return
        }
        cur = cur.parentElement
      }
    }, id)
    await page.waitForTimeout(250)
  }
}
