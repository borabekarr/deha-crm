import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/components/buttons-proximity', { waitUntil: 'networkidle' });

  const btn = page.locator('[data-proximity]').first();
  const box = await btn.boundingBox();
  await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await page.waitForTimeout(300);

  // Get stylesheet URLs
  const result = await page.evaluate(() => {
    const sheets = [...document.styleSheets];
    return sheets.map((s, i) => ({
      index: i,
      href: s.href || 'inline',
      ruleCount: (() => { try { return s.cssRules.length; } catch(e) { return 'CORS'; } })()
    }));
  });
  
  console.log('StyleSheets:', JSON.stringify(result, null, 2));
  
  // Now find which stylesheet has the .btn-primary:hover filter rule
  const srcResult = await page.evaluate(() => {
    const el = document.querySelector('[data-proximity]');
    const found = [];
    const sheets = [...document.styleSheets];
    for (let si = 0; si < sheets.length; si++) {
      const sheet = sheets[si];
      try {
        const processRules = (rules, media, depth) => {
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              try {
                if (el.matches(rule.selectorText) && rule.style.filter && rule.style.filter !== '') {
                  found.push({
                    sheetIndex: si,
                    href: sheet.href || 'inline',
                    selector: rule.selectorText,
                    filter: rule.style.filter,
                    media
                  });
                }
              } catch(e) {}
            }
            if (rule instanceof CSSMediaRule && window.matchMedia(rule.conditionText).matches) {
              processRules([...rule.cssRules], rule.conditionText, depth+1);
            }
          }
        };
        processRules([...sheet.cssRules], 'none', 0);
      } catch(e) {}
    }
    return found;
  });
  
  console.log('Matching filter rules:', JSON.stringify(srcResult, null, 2));
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
