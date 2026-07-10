import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/components/buttons-proximity', { waitUntil: 'networkidle' });

  const btn = page.locator('[data-proximity]').first();
  const box = await btn.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  
  // Move mouse to center
  await page.mouse.move(cx, cy, { steps: 5 });
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-proximity]');
    const cs = window.getComputedStyle(el);
    // Also check --hover-shadow-color resolution
    const shadowColor = cs.getPropertyValue('--hover-shadow-color').trim();
    const prox = el.style.getPropertyValue('--prox') || cs.getPropertyValue('--prox');
    return {
      filter: cs.filter,
      scale: cs.scale,
      prox_inline: el.style.getPropertyValue('--prox'),
      prox_computed: cs.getPropertyValue('--prox'),
      shadow_color: shadowColor,
      filter_full: cs.getPropertyValue('filter'),
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
