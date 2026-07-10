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
  
  await page.mouse.move(cx, cy);
  await page.waitForTimeout(500);

  // Use page.evaluate to check what CSS rules provide the 'filter' property
  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-proximity]');
    
    // Check all stylesheets for filter rules matching this element
    const filterRules = [];
    for (const sheet of document.styleSheets) {
      try {
        const rules = [...sheet.cssRules];
        function checkRules(rules, mediaText) {
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule && rule.style.filter) {
              try {
                if (el.matches(rule.selectorText)) {
                  filterRules.push({
                    selector: rule.selectorText,
                    filter: rule.style.filter,
                    media: mediaText,
                    href: sheet.href ? sheet.href.split('/').pop() : 'inline'
                  });
                }
              } catch(e) {}
            }
            if (rule instanceof CSSMediaRule) {
              checkRules([...rule.cssRules], rule.conditionText);
            }
          }
        }
        checkRules(rules, '');
      } catch(e) {}
    }
    
    return { filterRules };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
