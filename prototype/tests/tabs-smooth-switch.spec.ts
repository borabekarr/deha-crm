import { test, expect } from '@playwright/test';

test.describe('tabs sliding pill indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the tabs section to be present
    await page.waitForSelector('.tabs-list');
  });

  test('no green bottom-line ::after rule on tabs-list', async ({ page }) => {
    // Verify no element with green background at bottom:0 of .tabs-list
    const hasGreenBottomLine = await page.evaluate(() => {
      const list = document.querySelector('.tabs-list');
      if (!list) return false;
      // Check computed style of ::after pseudo-element via stylesheet inspection
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule instanceof CSSStyleRule && rule.selectorText === '.tabs-list::after') {
              const style = rule.style;
              const hasBottom0 = style.bottom === '0' || style.bottom === '0px';
              const bg = style.background || style.backgroundColor;
              const hasGreen = /emerald|16 185 129|10b981/.test(bg);
              if (hasBottom0 && hasGreen) return true;
            }
          }
        } catch {
          // cross-origin sheet — skip
        }
      }
      return false;
    });
    expect(hasGreenBottomLine).toBe(false);
  });

  test('.tabs-indicator has position:absolute and correct transition', async ({ page }) => {
    const styles = await page.evaluate(() => {
      const list = document.querySelector('.tabs-list');
      const indicator = list?.querySelector('.tabs-indicator');
      if (!indicator) return null;
      const computed = getComputedStyle(indicator);
      return {
        position: computed.position,
        transition: computed.transition,
      };
    });
    expect(styles).not.toBeNull();
    expect(styles!.position).toBe('absolute');
    expect(styles!.transition).toMatch(/transform/);
    expect(styles!.transition).toMatch(/width/);
  });

  test('indicator moves with transform on tab click', async ({ page }) => {
    const tabsList = page.locator('.tabs-list').first();
    const triggers = tabsList.locator('.tabs-trigger');
    const count = await triggers.count();
    expect(count).toBeGreaterThan(1);

    // Get indicator transform after clicking the last tab
    const lastTab = triggers.nth(count - 1);
    await lastTab.click();

    // Sample at fixed offsets 0..150ms in parallel — order preserved by Promise.all.
    const transforms = await Promise.all(
      Array.from({ length: 4 }, async (_, step) => {
        await page.waitForTimeout(step * 50);
        return page.evaluate(() => {
          const indicator = document.querySelector('.tabs-list .tabs-indicator') as HTMLElement | null;
          return indicator ? indicator.style.transform : '';
        });
      }),
    );

    // At least one frame should have a translateX value set
    const hasTranslate = transforms.some(t => t.includes('translateX'));
    expect(hasTranslate).toBe(true);

    // Indicator width should be set (non-zero)
    const width = await page.evaluate(() => {
      const indicator = document.querySelector('.tabs-list .tabs-indicator') as HTMLElement | null;
      return indicator ? indicator.style.width : '';
    });
    expect(width).toBeTruthy();
    expect(width).not.toBe('0px');
  });

  test('indicator is positioned correctly on initial load (first active tab)', async ({ page }) => {
    const { transform, width } = await page.evaluate(() => {
      const list = document.querySelector('.tabs-list');
      const indicator = list?.querySelector('.tabs-indicator') as HTMLElement | null;
      return {
        transform: indicator?.style.transform ?? '',
        width: indicator?.style.width ?? '',
      };
    });
    // On load the first tab is active — transform should be set
    expect(transform).toContain('translateX');
    expect(width).toBeTruthy();
  });

  test('clicking each tab updates indicator offsetLeft/offsetWidth', async ({ page }) => {
    const tabsList = page.locator('.tabs-list').first();
    const triggers = tabsList.locator('.tabs-trigger');
    const count = await triggers.count();

    const positions: { transform: string; width: string }[] = [];

    for (let i = 0; i < count; i++) {
      await triggers.nth(i).click();
      await page.waitForTimeout(50);
      const pos = await page.evaluate(() => {
        const indicator = document.querySelector('.tabs-list .tabs-indicator') as HTMLElement | null;
        return { transform: indicator?.style.transform ?? '', width: indicator?.style.width ?? '' };
      });
      positions.push(pos);
    }

    // All tabs should produce a translateX value
    for (const pos of positions) {
      expect(pos.transform).toContain('translateX');
    }

    // At least 2 tabs should produce different transform values (indicator actually moves)
    const uniqueTransforms = new Set(positions.map(p => p.transform));
    expect(uniqueTransforms.size).toBeGreaterThanOrEqual(2);
  });
});
