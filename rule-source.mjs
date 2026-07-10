import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/components/buttons-proximity', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-proximity]');
    
    // Find ALL filter rules for this element across all sheets
    const filterRules = [];
    for (const sheet of document.styleSheets) {
      try {
        const processRules = (rules, media) => {
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule && rule.style.filter) {
              try {
                if (el.matches(rule.selectorText)) {
                  filterRules.push({
                    selector: rule.selectorText,
                    filter: rule.style.filter,
                    media,
                    href: sheet.href || 'inline',
                    // Try to identify the source
                  });
                }
              } catch(e) {}
            }
            if (rule instanceof CSSMediaRule) {
              processRules([...rule.cssRules], rule.conditionText);
            }
          }
        };
        processRules([...sheet.cssRules], 'none');
      } catch(e) { filterRules.push({ error: e.message, href: sheet.href }); }
    }
    
    return { filterRules, sheetCount: document.styleSheets.length };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
