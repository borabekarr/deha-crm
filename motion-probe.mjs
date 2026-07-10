import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = {};

  // ---- RENDER PROBE: at least 4 [data-proximity] visible, no page errors ----
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${BASE}/components/buttons-proximity`, { waitUntil: 'networkidle' });
    const els = await page.locator('[data-proximity]').all();
    const visibleCount = (await Promise.all(els.map(e => e.isVisible()))).filter(Boolean).length;
    results.render_count = visibleCount;
    results.page_errors = errors;
    results.render_pass = visibleCount >= 4 && errors.length === 0;
    await ctx.close();
  }

  // ---- HOVER: scale ramps toward 1.04, filter brightens, token provenance ----
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/components/buttons-proximity`, { waitUntil: 'networkidle' });

    // Pick first [data-proximity] button
    const btn = page.locator('[data-proximity]').first();
    const box = await btn.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Move mouse to button center
    await page.mouse.move(cx, cy, { steps: 5 });
    await page.waitForTimeout(300);

    // Check scale and filter
    const [scale, filter] = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const cs = window.getComputedStyle(el);
      return [cs.scale, cs.filter];
    }, '[data-proximity]');

    results.hover_scale = scale;
    results.hover_filter = filter;
    results.hover_scale_pass = (() => {
      if (!scale || scale === 'none' || scale === '1') return false;
      const v = parseFloat(scale);
      return v >= 1.035 && v <= 1.045;
    })();
    results.hover_filter_pass = filter && filter.includes('brightness') && filter.includes('drop-shadow');

    // Token provenance: set --anim-mult: 0, transition duration should drop to 0s
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--anim-mult', '0');
    });
    await page.waitForTimeout(50);
    const transitionDuration = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return window.getComputedStyle(el).transitionDuration;
    }, '[data-proximity]');
    results.token_duration_with_mult0 = transitionDuration;
    // transitionDuration should be '0s, 0s' or similar all-zeros when --anim-mult is 0
    results.token_provenance_pass = transitionDuration.split(',').map(s => s.trim()).every(d => parseFloat(d) === 0);
    
    await ctx.close();
  }

  // ---- PRESS: active state produces scale below 1 or transform change ----
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/components/buttons-proximity`, { waitUntil: 'networkidle' });

    const btn = page.locator('[data-proximity]').first();
    const box = await btn.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    
    // Move to center first (to have hover state)
    await page.mouse.move(cx, cy, { steps: 5 });
    await page.waitForTimeout(200);
    
    // Mouse down
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    const [pressScale, pressTransform] = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const cs = window.getComputedStyle(el);
      return [cs.scale, cs.transform];
    }, '[data-proximity]');
    
    results.press_scale = pressScale;
    results.press_transform = pressTransform;
    // Press should produce scale < 1 OR a transform change from none
    results.press_pass = (() => {
      if (pressScale && pressScale !== 'none') {
        const v = parseFloat(pressScale);
        if (!isNaN(v) && v < 1) return true;
      }
      // Check transform matrix - if it has scale < 1 
      if (pressTransform && pressTransform !== 'none' && pressTransform !== 'matrix(1, 0, 0, 1, 0, 0)') {
        // matrix(a, b, c, d, tx, ty) - scale X is 'a', scale Y is 'd'
        const m = pressTransform.match(/matrix\(([^,]+),/);
        if (m) {
          const sx = parseFloat(m[1]);
          if (sx < 1) return true;
        }
        return true; // any non-identity transform change counts
      }
      return false;
    })();
    
    await page.mouse.up();
    await ctx.close();
  }

  // ---- FOCUS: tab to [data-proximity] button, check scale = 1.04 or visible focus ----
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/components/buttons-proximity`, { waitUntil: 'networkidle' });
    
    // Move mouse away from any button first
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    const [focusedTag, focusedHasProx, focusScale, focusOutline, focusBoxShadow] = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return ['none', false, 'none', 'none', 'none'];
      const cs = window.getComputedStyle(el);
      const hasProx = el.hasAttribute('data-proximity');
      return [el.tagName, hasProx, cs.scale, cs.outline, cs.boxShadow];
    });
    
    results.focus_element = focusedTag;
    results.focus_has_proximity = focusedHasProx;
    results.focus_scale = focusScale;
    results.focus_outline = focusOutline;
    results.focus_box_shadow = focusBoxShadow;
    
    // Check if the focused element is a [data-proximity] button with scale 1.04 or outline
    results.focus_pass = (() => {
      if (!focusedHasProx) {
        // Maybe need more tabs - try to find if any [data-prox] button gets correct focus styling
        return false; // will check below
      }
      const scaleNum = parseFloat(focusScale);
      const hasScale = !isNaN(scaleNum) && scaleNum >= 1.035;
      const hasOutline = focusOutline && focusOutline !== 'none' && !focusOutline.startsWith('0px');
      const hasShadow = focusBoxShadow && focusBoxShadow !== 'none';
      return hasScale || hasOutline || hasShadow;
    })();
    
    // If first tab didn't land on a data-proximity element, try more tabs
    if (!focusedHasProx) {
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        const [tag, hasProx, sc, out, sh] = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return ['none', false, 'none', 'none', 'none'];
          const cs = window.getComputedStyle(el);
          return [el.tagName, el.hasAttribute('data-proximity'), cs.scale, cs.outline, cs.boxShadow];
        });
        if (hasProx) {
          results.focus_element = tag;
          results.focus_has_proximity = hasProx;
          results.focus_scale = sc;
          results.focus_outline = out;
          results.focus_box_shadow = sh;
          const scaleNum = parseFloat(sc);
          const hasScale = !isNaN(scaleNum) && scaleNum >= 1.035;
          const hasOutline = out && out !== 'none' && !out.startsWith('0px');
          const hasShadow = sh && sh !== 'none';
          results.focus_pass = hasScale || hasOutline || hasShadow;
          break;
        }
      }
    }
    
    await ctx.close();
  }

  // ---- HIT-AREA: ::after pseudo-element >= 40px on smallest interactive [data-proximity] ----
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/components/buttons-proximity`, { waitUntil: 'networkidle' });
    
    const hitAreaResult = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-proximity]');
      let smallest = null;
      let smallestArea = Infinity;
      for (const el of els) {
        const box = el.getBoundingClientRect();
        const area = box.width * box.height;
        if (area < smallestArea) {
          smallestArea = area;
          smallest = el;
        }
      }
      if (!smallest) return { found: false };
      
      const box = smallest.getBoundingClientRect();
      const cs = window.getComputedStyle(smallest, '::after');
      const afterContent = cs.content;
      const afterWidth = cs.width;
      const afterHeight = cs.height;
      
      // Check actual element size too
      return {
        found: true,
        element_width: box.width,
        element_height: box.height,
        after_content: afterContent,
        after_width: afterWidth,
        after_height: afterHeight,
        after_width_px: parseFloat(afterWidth),
        after_height_px: parseFloat(afterHeight),
      };
    });
    
    results.hit_area = hitAreaResult;
    // Pass if element itself is >= 40px in each dim OR ::after is >= 40px
    results.hit_area_pass = (() => {
      if (!hitAreaResult.found) return false;
      const elOk = hitAreaResult.element_width >= 40 && hitAreaResult.element_height >= 40;
      const afterOk = hitAreaResult.after_width_px >= 40 && hitAreaResult.after_height_px >= 40;
      return elOk || afterOk;
    })();
    
    await ctx.close();
  }

  await browser.close();

  console.log('=== MOTION-GATE RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error('PROBE_ERROR:', e.message); process.exit(1); });
