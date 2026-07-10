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
  await page.mouse.move(cx, cy);
  // Wait long enough for all RAF + 100ms transition to settle
  await page.waitForTimeout(800);

  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-proximity]');
    const cs = window.getComputedStyle(el);
    const prox = el.style.getPropertyValue('--prox');
    
    // Get the transition property to see what's transitioning
    return {
      filter: cs.filter,
      scale: cs.scale,
      prox_inline: prox,
      transition: cs.transition,
      // Check inline style directly
      inline_style: el.getAttribute('style'),
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
