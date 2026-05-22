/**
 * overlay-stacking.spec.ts
 *
 * Asserts that when both select and combobox overlays are open simultaneously,
 * neither panel occludes the other — i.e. elementFromPoint on the bounding
 * rect center of each open panel returns an element inside that panel, not
 * an element from a competing overlay or its ancestor.
 */
import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PROTOTYPE_URL ?? "/";

async function openPrototype(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Returns true if the element at (cx, cy) is a descendant of (or is) the
 * element matching `ancestorSelector`.
 */
async function pointHitsAncestor(
  page: Page,
  cx: number,
  cy: number,
  ancestorSelector: string
): Promise<boolean> {
  return page.evaluate(
    ({ x, y, sel }) => {
      const hit = document.elementFromPoint(x, y);
      const ancestor = document.querySelector(sel);
      if (!hit || !ancestor) return false;
      return ancestor.contains(hit) || hit === ancestor;
    },
    { x: cx, y: cy, sel: ancestorSelector }
  );
}

/** Get the center point of an element's bounding rect. */
async function centerOf(page: Page, selector: string): Promise<{ x: number; y: number }> {
  const box = await page.$eval(selector, (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  return box;
}

test.describe("Overlay stacking — panels are not occluded by each other", () => {
  test("combobox list is not occluded when open after select focus", async ({ page }) => {
    await openPrototype(page);

    // 1. Open the combobox list
    await page.focus("#combo-1");
    await page.waitForSelector("#combo-1-list.open");

    // Scroll the combobox into view so its bounding rect is within the viewport
    await page.$eval("#combo-1-list", (el) =>
      el.scrollIntoView({ block: "nearest" })
    );

    const center = await centerOf(page, "#combo-1-list");

    const hitsComboList = await pointHitsAncestor(page, center.x, center.y, "#combo-1-list");
    expect(
      hitsComboList,
      `elementFromPoint(${center.x}, ${center.y}) should hit #combo-1-list, not be occluded`
    ).toBe(true);
  });

  test("dropdown menu is not occluded when open", async ({ page }) => {
    await openPrototype(page);

    // Open the dropdown menu
    await page.click("[data-dropdown-trigger]");
    await page.waitForSelector(".menu.is-open");

    await page.$eval(".menu.is-open", (el) =>
      el.scrollIntoView({ block: "nearest" })
    );

    const center = await centerOf(page, ".menu.is-open");

    const hitsMenu = await pointHitsAncestor(page, center.x, center.y, ".menu.is-open");
    expect(
      hitsMenu,
      `elementFromPoint(${center.x}, ${center.y}) should hit .menu.is-open, not be occluded`
    ).toBe(true);
  });

  test("combobox list is not occluded by dropdown menu when both are open", async ({ page }) => {
    await openPrototype(page);

    // Open dropdown first
    await page.click("[data-dropdown-trigger]");
    await page.waitForSelector(".menu.is-open");

    // Then open combobox (simulated — focus triggers open)
    await page.focus("#combo-1");
    await page.waitForSelector("#combo-1-list.open");

    await page.$eval("#combo-1-list", (el) =>
      el.scrollIntoView({ block: "nearest" })
    );

    const center = await centerOf(page, "#combo-1-list");

    const hitsComboList = await pointHitsAncestor(page, center.x, center.y, "#combo-1-list");
    expect(
      hitsComboList,
      "combobox list must not be occluded by the dropdown menu"
    ).toBe(true);
  });
});
