import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/components/buttons-proximity', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const els = document.querySelectorAll('[data-proximity]');
    const first = els[0];
    const cs = window.getComputedStyle(first);
    
    // Get all matching CSS rules for this element
    const sheets = [...document.styleSheets];
    const matchingRules = [];
    for (const sheet of sheets) {
      try {
        for (const rule of sheet.cssRules || []) {
          // Check if it's a regular style rule (not media query) targeting filter
          if (rule.selectorText && first.matches(rule.selectorText) && rule.style.filter) {
            matchingRules.push({ selector: rule.selectorText, filter: rule.style.filter });
          }
        }
      } catch(e) {}
    }
    
    return {
      first_class: first.className,
      first_tag: first.tagName,
      matching_filter_rules: matchingRules,
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
