import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/components/buttons-proximity', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const sheet = document.styleSheets[19];
    const rules = [];
    for (const rule of sheet.cssRules) {
      if (rule.selectorText && rule.selectorText.includes('btn-primary')) {
        rules.push({ selector: rule.selectorText, text: rule.cssText.substring(0, 200) });
      }
    }
    // Get the ownerNode to identify source
    const owner = sheet.ownerNode;
    return {
      rules,
      ownerTag: owner ? owner.tagName : 'unknown',
      ownerAttr: owner ? (owner.getAttribute('data-vite-dev-id') || owner.id || 'none') : 'none',
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
