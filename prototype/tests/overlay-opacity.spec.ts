/**
 * overlay-opacity.spec.ts
 *
 * Asserts that every floating overlay panel (combobox list, dropdown menu,
 * sheet's nested select) renders with a fully-opaque white background
 * (rgb(255, 255, 255)) — no translucent bleed from ancestor stacking contexts.
 */
import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PROTOTYPE_URL ?? "/";

/** Open the prototype page and return the page object. */
async function openPrototype(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState("domcontentloaded");
}

/** Read the computed background-color of the first element matching selector. */
async function bgColor(page: Page, selector: string): Promise<string> {
  return page.$eval(selector, (el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
}

const OPAQUE_WHITE = "rgb(255, 255, 255)";

test.describe("Overlay panel background opacity", () => {
  test("combobox list background is opaque white when open", async ({ page }) => {
    await openPrototype(page);

    // Focus the combobox input — its onfocus handler adds class 'open'
    await page.focus("#combo-1");
    await page.waitForSelector("#combo-1-list.open");

    const color = await bgColor(page, "#combo-1-list");
    expect(color, "combo-list background must be fully opaque white").toBe(OPAQUE_WHITE);
  });

  test("dropdown menu background is opaque white when open", async ({ page }) => {
    await openPrototype(page);

    // Click the dropdown trigger — JS adds is-open to .menu
    await page.click("[data-dropdown-trigger]");
    await page.waitForSelector(".menu.is-open");

    const color = await bgColor(page, ".menu.is-open");
    expect(color, "dropdown menu background must be fully opaque white").toBe(OPAQUE_WHITE);
  });

  test("sheet's nested select background is opaque white", async ({ page }) => {
    await openPrototype(page);

    // Open the sheet drawer
    await page.click("button:has-text('Open sheet')");
    await page.waitForSelector("#sht-1.is-open");

    // The <select> inside the sheet — native select uses system rendering,
    // but the .select wrapper must have an opaque background.
    const color = await bgColor(page, "#sht-1 .select");
    expect(color, "sheet's select background must be fully opaque white").toBe(OPAQUE_WHITE);
  });
});
