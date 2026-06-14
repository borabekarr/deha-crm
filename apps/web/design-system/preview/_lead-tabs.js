/* =========================================================================
   Lead Tabs prototype — shared data contract + tab switcher.
   SECTIONS  : 9 brain sections, copied verbatim from BRAIN_SECTIONS
               (apps/web/src/components/design-system/leads-table/leadMetrics.ts)
   SIGNALS   : 8 behaviour metrics — id/label/icon from the metric catalog +
               the verbatim plain-language value/note strings built in
               buildLeadMetrics() for the demo lead.
   initTabs(): cross-fade panels, move the sliding ink, arrow-key nav.
   initBrain() and initBehaviour() are wired in later steps.
   ========================================================================= */

const SECTIONS = [
  {
    id: 'aspirations',
    label: 'Aspirations',
    icon: 'rocket_launch',
    blurb: 'Driven by the goal of building lasting generational wealth through premium real-estate assets. Wants a property that signals success and opens doors to a broader investor network.',
    chips: ['Generational wealth', 'Prestige address', 'Portfolio growth', 'Legacy asset', 'Social proof'],
    color: '#fd5969',
  },
  {
    id: 'challenges',
    label: 'Challenges',
    icon: 'sync_problem',
    blurb: 'Navigating competing demands on capital while under time pressure from a narrowing window in the current market cycle. Needs clear ROI evidence before committing.',
    chips: ['Capital allocation', 'Market timing', 'ROI uncertainty', 'Time pressure', 'Competing offers'],
    color: '#fdd02c',
  },
  {
    id: 'values',
    label: 'Values',
    icon: 'verified',
    blurb: 'Places a high premium on transparency and long-term relationships with advisors. Expects a consultant who respects their time and delivers concise, evidence-backed recommendations.',
    chips: ['Transparency', 'Reliability', 'Long-term view', 'Respect for time', 'Honest counsel'],
    color: '#fe8a01',
  },
  {
    id: 'fears',
    label: 'Fears',
    icon: 'crisis_alert',
    blurb: 'Deeply concerned about overpaying in a softening micro-market and locking liquidity into an asset that proves hard to exit. Off-plan delays rank as a secondary anxiety.',
    chips: ['Overpaying', 'Illiquidity', 'Off-plan delays', 'Hidden fees', 'Regret risk'],
    color: '#b0e731',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: 'tune',
    blurb: 'Prefers concise WhatsApp summaries over long email chains and values a single point of contact rather than handoffs between agents. Likes to see data before the pitch.',
    chips: ['WhatsApp', 'Single contact', 'Data-first', 'Brief updates', 'Sea-view units'],
    color: '#35e895',
  },
  {
    id: 'dislikes',
    label: 'Dislikes',
    icon: 'thumb_down',
    blurb: 'Loses confidence quickly when agents push urgency without evidence or repeat information already shared. Cold-call outreach at off-hours registers as a hard negative.',
    chips: ['False urgency', 'Repeat pitching', 'Off-hours calls', 'Vague timelines', 'Over-communication'],
    color: '#14aafe',
  },
  {
    id: 'influencers',
    label: 'Key Influencers',
    icon: 'groups',
    blurb: 'Financial partner and spouse carry decisive weight; no major purchase moves without their alignment. A trusted accountant also shapes the final capital-allocation decision.',
    chips: ['Spouse', 'Financial partner', 'Accountant', 'Peer investors', 'Online reviews'],
    color: '#a437eb',
  },
  {
    id: 'keywords',
    label: 'Key Words & Phrases',
    icon: 'label',
    blurb: 'Repeatedly anchors on yield, resale liquidity, and handover timeline in both written and verbal exchanges. Reacts positively to "locked-in price" and "title-deed ready".',
    chips: ['"Yield %"', '"Resale liquidity"', '"Handover timeline"', '"Locked-in price"', '"Title-deed ready"', '"No hidden fees"'],
    color: '#fc6d99',
  },
  {
    id: 'purchase_factors',
    label: 'Purchase Decision Factors',
    icon: 'fact_check',
    blurb: 'Location quality and projected rental yield are the primary gatekeepers; developer track record and payment-plan flexibility are secondary but required. Brand prestige tips close decisions.',
    chips: ['Location score', 'Rental yield', 'Developer track record', 'Payment plan', 'Brand prestige', 'Exit liquidity'],
    color: '#4a65f2',
  },
];

const SIGNALS = [
  {
    id: 'dwell',
    label: 'Deep-Dwell Time',
    icon: 'timer',
    value: '4m 12s',
    sub: 'net time on sent offers & PDFs',
    note: 'Time actually spent reading what you sent - not just opens.',
  },
  {
    id: 'reengage',
    label: 'Re-engagement Spike',
    icon: 'restart_alt',
    value: 'Opened an old link 3x in 2h',
    note: 'Sudden return after a quiet spell - intent is back.',
  },
  {
    id: 'scroll_depth',
    label: 'Scroll Depth',
    icon: 'unfold_more',
    value: '82%',
    note: 'Stuck on "Payment Plans" - the page they linger on.',
  },
  {
    id: 'interaction_vel',
    label: 'Interaction Velocity',
    icon: 'speed',
    note: 'Reply speed per channel vs the sector - lead where they move fastest.',
  },
  {
    id: 'micro_hotspot',
    label: 'Micro Hotspot',
    icon: 'my_location',
    value: 'Price Table - Extra Costs (+128% focus)',
    note: 'The single element they fixate on and keep returning to.',
  },
  {
    id: 'rage_click',
    label: 'Friction Detection',
    icon: 'touch_app',
    value: 'Rage-clicked "Payment terms"',
    note: 'Tagged distrust / confusion - reassure on this point.',
  },
  {
    id: 'geo_shift',
    label: 'Geographic Shift',
    icon: 'travel_explore',
    value: '65% of recent clicks shifted toward Suburb.',
    note: 'Search area drift across the last sessions.',
  },
  {
    id: 'buying_horizon',
    label: 'Buying Horizon',
    icon: 'hourglass_top',
    value: 'Urgent - <15 days',
    note: 'Estimated time-to-close from behaviour pattern.',
  },
];

/* ── tab switcher ───────────────────────────────────────────────────────── */
function initTabs() {
  const shell = document.querySelector('.ltb-shell');
  if (!shell) return;
  const tabs = Array.from(shell.querySelectorAll('.ltb-tab'));
  const panels = Array.from(shell.querySelectorAll('.ltb-panel'));
  const ink = shell.querySelector('.ltb-tab-ink');

  function moveInk(tab) {
    if (!ink || !tab) return;
    ink.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    ink.style.width = tab.offsetWidth + 'px';
  }

  function activate(tab) {
    const name = tab.getAttribute('data-tab');
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => {
      const on = p.getAttribute('data-panel') === name;
      p.classList.toggle('is-active', on);
      if (on) { p.removeAttribute('hidden'); } else { p.setAttribute('hidden', ''); }
    });
    moveInk(tab);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const i = tabs.indexOf(tab);
      const next = e.key === 'ArrowRight'
        ? tabs[(i + 1) % tabs.length]
        : tabs[(i - 1 + tabs.length) % tabs.length];
      activate(next);
      next.focus();
    });
  });

  // place the ink under the initially-active tab
  const initial = tabs.find((t) => t.classList.contains('is-active')) || tabs[0];
  if (initial) moveInk(initial);
}

/* ── qualification brain ────────────────────────────────────────────────── */
function initBrain() {
  const shell = document.querySelector('.ltb-shell');
  if (!shell) return;
  const canvas = shell.querySelector('.ltb-brain-canvas');
  if (!canvas) return;

  const lit = canvas.querySelector('.ltb-brain-lit');
  const regions = Array.from(canvas.querySelectorAll('.ltb-region'));
  const labels = Array.from(canvas.querySelectorAll('.ltb-region-label'));
  const leaders = Array.from(canvas.querySelectorAll('.ltb-leader'));
  const detail = shell.querySelector('.ltb-detail');
  const dpHeader = detail.querySelector('.ltb-dp-header');
  const dpIc = detail.querySelector('.ltb-dp-ic');
  const dpTitle = detail.querySelector('.ltb-dp-title');
  const dpBlurb = detail.querySelector('.ltb-dp-blurb');
  const chipsRow = detail.querySelector('.ltb-chips-row');

  const sectionById = {};
  SECTIONS.forEach((s) => { sectionById[s.id] = s; });

  // read each region's hit-path `d` once so the lit clip matches exactly
  const pathById = {};
  regions.forEach((g) => {
    const id = g.getAttribute('data-id');
    const hit = g.querySelector('.ltb-region-hit');
    if (hit) pathById[id] = hit.getAttribute('d');
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeId = null;
  let typeTimer = null;

  function setLit(id) {
    if (!lit) return;
    if (id && pathById[id]) {
      lit.style.clipPath = "path('" + pathById[id] + "')";
      lit.classList.add('is-lit');
    } else {
      lit.classList.remove('is-lit');
    }
  }

  function paintColor(id) {
    const s = sectionById[id];
    const rc = s ? s.color : null;
    if (rc) {
      detail.style.setProperty('--rc', rc);
      dpHeader.style.setProperty('--rc', rc);
    }
  }

  function setHovered(id) {
    // never override the active selection's lit clip
    const litId = id || activeId;
    setLit(litId);
    if (litId) paintColor(litId);

    regions.forEach((g) => {
      const gid = g.getAttribute('data-id');
      g.classList.toggle('is-hovered', gid === id);
      g.classList.toggle('is-dimmed', !!id && gid !== id && gid !== activeId);
    });
    leaders.forEach((g) => {
      const gid = g.getAttribute('data-id');
      g.classList.toggle('is-on', gid === id || gid === activeId);
    });
    labels.forEach((b) => {
      const bid = b.getAttribute('data-id');
      b.classList.toggle('is-hovered', bid === id);
      b.classList.toggle('is-dimmed', !!id && bid !== id && bid !== activeId);
    });
  }

  function clearHover() {
    // restore: keep active region lit, drop transient hover state
    setLit(activeId);
    regions.forEach((g) => {
      const gid = g.getAttribute('data-id');
      g.classList.remove('is-hovered');
      g.classList.toggle('is-dimmed', !!activeId && gid !== activeId);
      g.classList.toggle('is-active', gid === activeId);
    });
    leaders.forEach((g) => g.classList.toggle('is-on', g.getAttribute('data-id') === activeId));
    labels.forEach((b) => {
      const bid = b.getAttribute('data-id');
      b.classList.remove('is-hovered');
      b.classList.toggle('is-dimmed', !!activeId && bid !== activeId);
      b.classList.toggle('is-active', bid === activeId);
    });
  }

  function typewrite(text) {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    if (reduceMotion) { dpBlurb.textContent = text; return; }
    const mult = parseFloat(getComputedStyle(shell).getPropertyValue('--anim-mult')) || 1;
    const step = Math.max(1, Math.round(14 * mult));
    dpBlurb.textContent = '';
    const caret = document.createElement('span');
    caret.className = 'ltb-dp-caret';
    dpBlurb.appendChild(caret);
    let i = 0;
    typeTimer = setInterval(() => {
      if (i >= text.length) {
        clearInterval(typeTimer); typeTimer = null;
        caret.remove();
        return;
      }
      caret.insertAdjacentText('beforebegin', text.charAt(i));
      i += 1;
    }, step);
  }

  function revealChips(chips) {
    chipsRow.innerHTML = '';
    chips.forEach((c, idx) => {
      const el = document.createElement('span');
      el.className = 'ltb-chip-q';
      el.style.setProperty('--i', String(idx));
      el.textContent = c;
      chipsRow.appendChild(el);
    });
    // force reflow so the staggered transition runs from the hidden state
    void chipsRow.offsetWidth;
    Array.from(chipsRow.children).forEach((el) => el.classList.add('is-in'));
  }

  function selectSection(id) {
    const s = sectionById[id];
    if (!s) return;
    activeId = id;
    paintColor(id);
    setLit(id);
    detail.removeAttribute('data-empty');
    dpIc.textContent = s.icon;
    dpTitle.textContent = s.label;
    typewrite(s.blurb);
    revealChips(s.chips);
    clearHover();
  }

  function clearSelection() {
    activeId = null;
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    detail.setAttribute('data-empty', 'true');
    setLit(null);
    regions.forEach((g) => g.classList.remove('is-hovered', 'is-dimmed', 'is-active'));
    leaders.forEach((g) => g.classList.remove('is-on'));
    labels.forEach((b) => b.classList.remove('is-hovered', 'is-dimmed', 'is-active'));
  }

  // wire hit paths + labels: hover + click/Enter/Space
  const targets = [];
  regions.forEach((g) => {
    const id = g.getAttribute('data-id');
    const hit = g.querySelector('.ltb-region-hit');
    hit.addEventListener('pointerenter', () => setHovered(id));
    hit.addEventListener('pointerleave', clearHover);
    hit.addEventListener('click', () => selectSection(id));
  });
  labels.forEach((b) => {
    const id = b.getAttribute('data-id');
    b.addEventListener('pointerenter', () => setHovered(id));
    b.addEventListener('pointerleave', clearHover);
    b.addEventListener('click', () => selectSection(id));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSection(id); }
    });
    targets.push(b);
  });

  // arrow-key nav across the 9 labels in reading order; Esc clears
  shell.querySelector('.ltb-brain-stage').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { clearSelection(); return; }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const cur = document.activeElement;
    const i = targets.indexOf(cur);
    if (i === -1) { targets[0].focus(); e.preventDefault(); return; }
    const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    const next = fwd ? targets[(i + 1) % targets.length] : targets[(i - 1 + targets.length) % targets.length];
    next.focus();
    setHovered(next.getAttribute('data-id'));
    e.preventDefault();
  });
}

/* ── behaviour: intent signal stream ────────────────────────────────────── */
function initBehaviour() {
  const shell = document.querySelector('.ltb-shell');
  if (!shell) return;
  const bx = shell.querySelector('.ltb-bx');
  if (!bx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mult = parseFloat(getComputedStyle(shell).getPropertyValue('--anim-mult')) || 1;

  // count-up the Intent Index 0 → target
  const num = bx.querySelector('.ltb-bx-intent-num');
  if (num) {
    const target = parseInt(num.getAttribute('data-target'), 10) || 0;
    if (reduceMotion) {
      num.textContent = String(target);
    } else {
      const dur = 800 * mult;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - p, 3);
        num.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
        else num.textContent = String(target);
      };
      requestAnimationFrame(tick);
    }
  }

  // reveal: grow sparkline bars + scroll-depth fill + stagger rail/tiles/rows
  requestAnimationFrame(() => requestAnimationFrame(() => bx.classList.add('is-revealed')));

  // channel filter
  const seg = bx.querySelector('.ltb-bx-seg');
  const ind = bx.querySelector('.ltb-bx-seg-ind');
  const segBtns = Array.from(bx.querySelectorAll('.ltb-bx-seg-btn'));
  const rows = Array.from(bx.querySelectorAll('.ltb-bx-row'));
  const velRows = Array.from(bx.querySelectorAll('.ltb-bx-vel-row'));

  function moveInd(btn) {
    if (!ind || !btn) return;
    ind.style.transform = 'translateX(' + (btn.offsetLeft - 3) + 'px)';
    ind.style.width = btn.offsetWidth + 'px';
  }

  function applyChannel(channel) {
    rows.forEach((r) => {
      const match = channel === 'all' || r.getAttribute('data-channel') === channel;
      r.classList.toggle('is-hidden', !match);
    });
    // recolor/filter the interaction-velocity mini-bars
    velRows.forEach((v) => {
      const isSel = channel !== 'all' && v.getAttribute('data-channel') === channel;
      const isMute = channel !== 'all' && !isSel;
      v.classList.toggle('is-sel', isSel);
      v.classList.toggle('is-mute', isMute);
    });
  }

  function activate(btn) {
    segBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
    moveInd(btn);
    applyChannel(btn.getAttribute('data-channel'));
  }

  segBtns.forEach((btn) => btn.addEventListener('click', () => activate(btn)));

  // place indicator under the initially-active segment (default "All")
  const initial = segBtns.find((b) => b.classList.contains('is-active')) || segBtns[0];
  if (initial) { moveInd(initial); applyChannel(initial.getAttribute('data-channel')); }
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initBrain();
  initBehaviour();
});
