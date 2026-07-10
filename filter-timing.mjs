import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/components/buttons-proximity', { waitUntil: 'networkidle' });

  // Test: set --prox to 1.0000 (as JS engine does) vs 1 vs 0.9999
  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-proximity]');
    
    const test = (val) => {
      el.style.setProperty('--prox', val);
      const cs = window.getComputedStyle(el);
      return cs.filter;
    };
    
    return {
      prox_1: test('1'),
      prox_1_0000: test('1.0000'),
      prox_0_9999: test('0.9999'),
      // Now test: mouse-hover simulation via CSS :hover (not inline style)
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
  
  // Also test: move mouse onto button, remove inline --prox, check CSS :hover
  const btn = page.locator('[data-proximity]').first();
  const box = await btn.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  
  await page.mouse.move(cx, cy, { steps: 5 });
  await page.waitForTimeout(300);

  // Remove inline --prox so CSS :hover rule is the only source
  const hoverResult = await page.evaluate(() => {
    const el = document.querySelector('[data-proximity]');
    // Remove inline prox
    el.style.removeProperty('--prox');
    const cs = window.getComputedStyle(el);
    return {
      filter: cs.filter,
      scale: cs.scale,
      prox_computed: cs.getPropertyValue('--prox'),
      is_hovered: el.matches(':hover'),
    };
  });
  
  console.log('hover-only:', JSON.stringify(hoverResult, null, 2));
  
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
