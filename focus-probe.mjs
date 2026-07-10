import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/components/buttons-proximity', { waitUntil: 'networkidle' });
  
  // Move mouse away
  await page.mouse.move(0, 0);
  await page.waitForTimeout(100);

  // Try to focus the first [data-proximity] element via JS
  const result = await page.evaluate(async () => {
    const el = document.querySelector('[data-proximity]');
    if (!el) return { found: false };
    
    // Focus with keyboard modality (simulate keyboard interaction)
    // Use dispatchEvent to trigger focus-visible
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    el.focus();
    
    await new Promise(r => setTimeout(r, 200));
    
    const cs = window.getComputedStyle(el);
    const isFocused = document.activeElement === el;
    const isFocusVisible = el.matches(':focus-visible');
    
    return {
      found: true,
      is_focused: isFocused,
      is_focus_visible: isFocusVisible,
      scale: cs.scale,
      outline: cs.outline,
      box_shadow: cs.boxShadow,
      prox_computed: cs.getPropertyValue('--prox'),
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
