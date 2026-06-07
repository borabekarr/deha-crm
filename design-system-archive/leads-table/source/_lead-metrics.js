/* =========================================================================
   Deha CRM — Lead Details Popover · schema + tiered metric engine.
   Pills = depth/cost tiers (NOT topic categories). Each metric is a config
   object; the React component maps over SCHEMA and renders by `viz`.
   buildLeadMetrics(lead, ws) derives believable per-lead data from the
   existing lead record (deterministic, seeded by id) so every lead differs.
   ========================================================================= */
(function(){
  const H = (window.DEHA_LEADS && window.DEHA_LEADS.helpers) || {};
  const fmtTL = H.fmtTL || (n => '₺'+n);

  /* tone tokens → CSS custom-property color refs (resolve inside .ldx-overlay) */
  const T = { g:'var(--g)', gl:'var(--g-l)', a:'var(--a)', al:'var(--a-l)', r:'var(--r)', rl:'var(--r-l)',
              b:'var(--b)', bl:'var(--b-l)', v:'var(--v)', vl:'var(--v-l)', o:'var(--o)', ol:'var(--o-l)', txt:'var(--txt)' };
  const TBG = { g:['var(--g)','var(--g-bg)','var(--g-bd)'], a:['var(--a)','var(--a-bg)','var(--a-bd)'], r:['var(--r)','var(--r-bg)','var(--r-bd)'],
                b:['var(--b)','var(--b-bg)','var(--b-bd)'], v:['var(--v)','var(--v-bg)','var(--v-bd)'], o:['var(--o)','var(--o-bg)','var(--o-bd)'] };

  /* ── pills (depth/cost tiers) ──────────────────────────────────────── */
  const PILLS = [
    { id:1, label:'Pulse',         icon:'monitor_heart',     tier:0, trigger:'auto' },
    { id:2, label:'Behavior',      icon:'ads_click',         tier:1, trigger:'on_active' },
    { id:3, label:'Qualification', icon:'workspace_premium', tier:2, trigger:'on_select' },
    { id:4, label:'Deep NLP',      icon:'graphic_eq',        tier:3, trigger:'manual' },
    { id:5, label:'Risk',          icon:'crisis_alert',      tier:2, trigger:'on_select' },
  ];
  const TIER_LABEL = { 0:'Rule-based · auto', 1:'Behavioral logs · on activity', 2:'LLM profiling · on demand', 3:'Voice/NLP · manual' };

  const WORKSPACES = [
    { id:'real_estate', label:'Real estate' },
    { id:'general',     label:'General' },
    { id:'healthcare',  label:'Healthcare' },
    { id:'law',         label:'Law' },
  ];

  /* ── metric schema (single source of truth) ──────────────────────────
     {id,label,icon,pill,tier,span,more?,ws?}  — ws limits to a workspace. */
  const ALL = ['real_estate','general','healthcare','law'];
  const SCHEMA = [
    // PILL 1 — Pulse (tier 0) · order = verdict → action → analysis → friction → risk
    { id:'pulse_summary',  label:'Pulse Summary',       icon:'bolt',            pill:1, tier:0, span:2, ws:ALL },
    { id:'contact_time',   label:'Optimal Contact Time',icon:'schedule',        pill:1, tier:0, span:2, ws:ALL },
    { id:'velocity_trend', label:'Velocity Trend',      icon:'show_chart',      pill:1, tier:0, span:1, ws:ALL },
    { id:'channel_share',  label:'Preferred Channel',   icon:'forum',           pill:1, tier:0, span:1, ws:ALL },
    { id:'anomaly',        label:'Friction Detector',   icon:'warning',         pill:1, tier:0, span:2, ws:ALL },
    { id:'loss_pulse',     label:'Loss Risk · drop-off',icon:'trending_down',   pill:1, tier:0, span:2, ws:ALL },
    // PILL 2 — Behavior (tier 1)
    { id:'dwell',          label:'Deep-Dwell Time',     icon:'timer',           pill:2, tier:1, span:1, ws:ALL },
    { id:'reengage',       label:'Re-engagement Spike', icon:'restart_alt',     pill:2, tier:1, span:1, ws:ALL },
    { id:'scroll_depth',   label:'Scroll Depth',        icon:'unfold_more',     pill:2, tier:1, span:1, ws:ALL },
    { id:'interaction_vel',label:'Interaction Velocity',icon:'speed',           pill:2, tier:1, span:1, ws:ALL },
    { id:'micro_hotspot',  label:'Micro Hotspot',       icon:'my_location',     pill:2, tier:1, span:2, ws:ALL },
    { id:'rage_click',     label:'Friction Detection',  icon:'touch_app',       pill:2, tier:1, span:1, ws:ALL },
    { id:'geo_shift',      label:'Geographic Shift',    icon:'travel_explore',  pill:2, tier:1, span:1, ws:['real_estate','general'] },
    { id:'buying_horizon', label:'Buying Horizon',      icon:'hourglass_top',   pill:2, tier:1, span:2, ws:ALL },
    // PILL 3 — Qualification (tier 2)
    { id:'decision_power', label:'Decision Power',      icon:'gavel',           pill:3, tier:2, span:1, ws:ALL },
    { id:'persona',        label:'Comm. Persona',       icon:'psychology',      pill:3, tier:2, span:1, ws:ALL },
    { id:'motivation',     label:'Core Motivation',     icon:'interests',       pill:3, tier:2, span:2, ws:ALL },
    { id:'objection',      label:'Objection Profile',   icon:'shield',          pill:3, tier:2, span:2, ws:ALL },
    { id:'funding',        label:'Funding Confidence',  icon:'account_balance', pill:3, tier:2, span:1, ws:ALL },
    { id:'ltv_segment',    label:'Lifetime Value',      icon:'diamond',         pill:3, tier:2, span:1, ws:ALL },
    { id:'price_ceiling',  label:'Price Elasticity',    icon:'sell',            pill:3, tier:2, span:1, ws:['real_estate','general'] },
    { id:'dealbreaker',    label:'Unspoken Deal-Breaker',icon:'block',          pill:3, tier:2, span:2, ws:ALL },
    // healthcare injects (Pill 3)
    { id:'treat_urgency',  label:'Treatment Urgency',   icon:'emergency',       pill:3, tier:2, span:1, ws:['healthcare'] },
    { id:'med_anxiety',    label:'Medical Anxiety',     icon:'sentiment_stressed',pill:3, tier:2, span:1, ws:['healthcare'] },
    { id:'treat_retention',label:'Treatment Retention', icon:'event_repeat',    pill:3, tier:2, span:2, ws:['healthcare'] },
    // law injects (Pill 3)
    { id:'precedent',      label:'Precedent Success',   icon:'balance',         pill:3, tier:2, span:1, ws:['law'] },
    { id:'doc_completion', label:'Document Completion', icon:'task',            pill:3, tier:2, span:1, ws:['law'] },
    // Pill 3 — show more
    { id:'risk_appetite',  label:'Risk Appetite',       icon:'casino',          pill:3, tier:2, span:1, more:true, ws:ALL },
    { id:'liquidity',      label:'Asset Liquidity Urgency',icon:'water_drop',   pill:3, tier:2, span:1, more:true, ws:ALL },
    { id:'upsell',         label:'Upsell Propensity',   icon:'trending_up',     pill:3, tier:2, span:1, more:true, ws:ALL },
    { id:'discount_sens',  label:'Discount Sensitivity',icon:'percent',         pill:3, tier:2, span:1, more:true, ws:ALL },
    { id:'market_sens',    label:'Market Price Sensitivity',icon:'insights',    pill:3, tier:2, span:1, more:true, ws:ALL },
    // PILL 4 — Deep NLP & Voice (tier 3)
    { id:'voice_summary',  label:'Last Voice Summary',  icon:'graphic_eq',      pill:4, tier:3, span:2, ws:ALL },
    { id:'pronoun',        label:'Pronoun Dominance',   icon:'groups',          pill:4, tier:3, span:1, ws:ALL },
    { id:'hesitation',     label:'Hesitation Tracker',  icon:'more_horiz',      pill:4, tier:3, span:1, ws:ALL },
    { id:'mirroring',      label:'Mirroring Index',     icon:'compare_arrows',  pill:4, tier:3, span:1, ws:ALL },
    { id:'urgency_friction',label:'Urgency Friction',   icon:'bolt',            pill:4, tier:3, span:1, ws:ALL },
    { id:'prompt_drift',   label:'Unanswered Drift',    icon:'help',            pill:4, tier:3, span:2, ws:ALL },
    { id:'overload',       label:'Information Overload', icon:'inventory_2',     pill:4, tier:3, span:1, ws:ALL },
    { id:'turning_point',  label:'The Turning Point',   icon:'flag',            pill:4, tier:3, span:1, ws:ALL },
    // PILL 5 — Risk & Forecast (tier 2)
    { id:'loss_risk',      label:'Loss Risk',           icon:'dangerous',       pill:5, tier:2, span:2, ws:ALL },
    { id:'touchpoints',    label:'Touchpoints to Close',icon:'footprint',       pill:5, tier:2, span:1, ws:ALL },
    { id:'velocity_dev',   label:'Velocity Deviation',  icon:'speed',           pill:5, tier:2, span:1, ws:ALL },
    { id:'neg_buffer',     label:'Negotiation Buffer',  icon:'handshake',       pill:5, tier:2, span:1, ws:['real_estate','general'] },
    { id:'golden_hour',    label:'Golden Hour Trigger', icon:'wb_twilight',     pill:5, tier:2, span:1, ws:ALL },
    { id:'friction_index', label:'Decision Friction',   icon:'sync_problem',    pill:5, tier:2, span:1, ws:ALL },
    { id:'followup_fatigue',label:'Follow-Up Fatigue',  icon:'notifications_off',pill:5, tier:2, span:1, ws:ALL },
    // Pill 5 — show more
    { id:'discount_eff',   label:'Discount Efficiency', icon:'savings',         pill:5, tier:2, span:1, more:true, ws:ALL },
    { id:'payment_default',label:'Payment Default Risk',icon:'credit_card_off', pill:5, tier:2, span:1, more:true, ws:ALL },
    { id:'org_fatigue',    label:'Organizational Fatigue',icon:'groups_2',      pill:5, tier:2, span:1, more:true, ws:ALL },
    { id:'info_asymmetry', label:'Info Asymmetry Leverage',icon:'balance',      pill:5, tier:2, span:1, more:true, ws:ALL },
    { id:'yes_set',        label:'Yes-Set Momentum',    icon:'thumb_up',        pill:5, tier:2, span:1, more:true, ws:ALL },
  ];

  /* ── helpers ──────────────────────────────────────────────────────── */
  const clamp = (n,a,b)=> Math.max(a, Math.min(b, n));
  function seeded(id, salt){ let t = (id*2654435761 + salt*40503) >>> 0; return ()=>{ t = (t*1103515245 + 12345) & 0x7fffffff; return t/0x7fffffff; }; }
  function pick(arr, r){ return arr[Math.floor(r*arr.length) % arr.length]; }
  function toneFor(pct, invert){ const p = invert ? 100-pct : pct; return p>=67?'g':p>=40?'a':'r'; }
  const isActive = l => l.last < 3*1440;
  const hasVoice = l => ![9,14,16].includes(l.id) && l.acts && l.acts.some(a=>a.ic==='call');
  function coldDropHours(l){
    if (l.temp==='cold') return null;            // already cold — no live deadline
    const base = l.temp==='hot' ? 30 : 16;
    const r = seeded(l.id, 7)();
    return Math.round(base + r*30 - (l.last/1440)*1.5);
  }

  /* primary contact channel from stated preference */
  function channelOf(l){
    const p = (l.profile && l.profile.pref) || '';
    if (/whatsapp/i.test(p)) return 'WhatsApp';
    if (/instagram/i.test(p)) return 'Instagram';
    if (/email/i.test(p)) return 'Email';
    if (/phone/i.test(p)) return 'Phone';
    return 'WhatsApp';
  }

  /* sector-average comparison chip {pct,dir,label} */
  function cmp(delta, label){ return { pct:Math.abs(Math.round(delta)), dir: delta>=0?'up':'down', label: label||'vs sector avg' }; }

  /* per-channel interaction model — speed tag + reply time + share% + vs sector */
  const SPEED = { extreme:{lb:'Extreme speed',tone:'g'}, high:{lb:'High speed',tone:'b'}, medium:{lb:'Medium speed',tone:'a'}, low:{lb:'Low speed',tone:'slate'} };
  function channelsFor(l){
    const r = seeded(l.id, 11);
    const pref = channelOf(l);
    const base = [
      { name:'WhatsApp',  icon:'chat',         t:Math.round(3+r()*9) },          // minutes
      { name:'Phone',     icon:'call',         t:Math.round(45+r()*120) },        // minutes
      { name:'Email',     icon:'mail',         t:Math.round(180+r()*360) },       // minutes
      { name:'Instagram', icon:'photo_camera', t:Math.round(240+r()*900) },       // minutes
    ];
    // raw "interaction pull" — preferred channel dominates
    const pull = base.map(c=> (c.name===pref?2.4:1) * (1/Math.sqrt(c.t)) * (0.8+r()*0.5));
    const sum = pull.reduce((a,b)=>a+b,0);
    const sectAvg = { WhatsApp:34, Phone:140, Email:520, Instagram:900 }; // sector mean reply (min)
    return base.map((c,i)=>{
      const share = Math.round(pull[i]/sum*100);
      const speed = c.t<=12?'extreme' : c.t<=90?'high' : c.t<=420?'medium' : 'low';
      const tm = c.t<60 ? c.t+'m' : c.t<1440 ? (c.t/60).toFixed(c.t<180?1:0).replace('.0','')+'h' : Math.round(c.t/1440)+'d';
      const avg = sectAvg[c.name];
      const faster = Math.round((avg - c.t)/avg*100); // + = faster than sector
      return { name:c.name, icon:c.icon, speed, speedLb:SPEED[speed].lb, speedTone:SPEED[speed].tone, time:tm, share, vs:cmp(faster, faster>=0?'faster than sector':'slower than sector'), preferred:c.name===pref };
    }).sort((a,b)=> b.share-a.share);
  }

  /* GitHub-style daily contribution levels (0–4) over a quarter (13 weeks × 7) */
  function heatDays(l){
    const r = seeded(l.id, 13);
    const a = l.freq && l.freq.length===4 ? l.freq : [2,3,3,2];
    const max = Math.max(...a, 1);
    const W = 13;
    const days = [];
    for (let wk=0; wk<W; wk++){
      // interpolate weekly intensity across the 4 freq anchors
      const f = wk/(W-1)*3, lo = Math.floor(f), hi = Math.min(3, lo+1), t = f-lo;
      const intensity = (a[lo]*(1-t) + a[hi]*t) / max;   // 0..1
      for (let d=0; d<7; d++){
        const hit = r() < intensity*0.8 + 0.06;
        days.push(hit ? 1 + Math.floor(r()*intensity*3.4) : 0);
      }
    }
    return days; // 91 ints
  }

  /* objections from the event log (neg/warn signals) + budget confidence */
  function objectionsOf(l){
    const out = [];
    (l.signals||[]).forEach(s=>{
      if (s[0]==='neg' || s[0]==='warn'){
        let icon='shield', fix='Address head-on before the next ask.';
        const txt = s[1];
        if (/price|budget|installment|cost|fee/i.test(txt)){ icon='sell'; fix='Reframe on value + offer a staged payment plan.'; }
        else if (/quiet|no reply|dropped|skip/i.test(txt)){ icon='notifications_off'; fix='Switch channel — a short WhatsApp beats another email.'; }
        else if (/competitor|comparing/i.test(txt)){ icon='compare_arrows'; fix='Send a side-by-side that wins on your strengths.'; }
        else if (/family|partner|decision/i.test(txt)){ icon='groups'; fix='Get the second decision-maker into the room.'; }
        out.push({ t:txt, icon, tone:s[0]==='neg'?'r':'a', fix });
      }
    });
    if ((l.profile&&/low/i.test(l.profile.budgetConf||''))) out.push({ t:'Budget stated only vaguely', icon:'help', tone:'a', fix:'Pin the real number with an either/or question.' });
    return out;
  }

  /* pulse verdict as 3 icon bullets (situation · signal · move) */
  function summaryBullets(l){
    const first = l.name.split(' ')[0];
    const h = l.score>=70?'g':l.score>=45?'a':'r';
    const gapD = Math.round(l.last/1440);
    const move = (l.nba && l.nba[0] && l.nba[0].t) ? l.nba[0].t : (l.next ? l.next.split(/[.—]/)[0] : 'Make one concrete next move');
    if (l.age3) return [
      { ic:'fiber_new', tone:'b', t:'Brand-new lead — only '+l.age+' days in, signals still forming.' },
      { ic:'bolt', tone:'g', t:first+' replies fast; early intent looks '+(h==='g'?'strong':'workable')+'.' },
      { ic:'arrow_forward', tone:'g', t:move+'.' },
    ];
    if (h==='g') return [
      { ic:'trending_up', tone:'g', t:'Strong, active deal — '+first+' is engaged and progressing.' },
      { ic:'check_circle', tone:'g', t:'Stage momentum is high; little is blocking the close.' },
      { ic:'arrow_forward', tone:'g', t:move+'.' },
    ];
    if (h==='a') return [
      { ic:'schedule', tone:'a', t:'Warm but undecided — interested, not yet committed.' },
      { ic:'priority_high', tone:'a', t:'No firm next step on the calendar — momentum is at risk.' },
      { ic:'arrow_forward', tone:'g', t:move+'.' },
    ];
    return [
      { ic:'trending_down', tone:'r', t:'Cooling off — '+first+' has gone quiet ('+gapD+'d since contact).' },
      { ic:'warning', tone:'r', t:'Signals weakening; more time here may not pay off.' },
      { ic:'arrow_forward', tone:'a', t:'Re-qualify with one low-effort touch before investing more.' },
    ];
  }

  /* ── derive every metric for one lead in one workspace ─────────────── */
  function buildLeadMetrics(l, ws){
    const m = {};
    const r2 = seeded(l.id, 2), r3 = seeded(l.id, 3), r4 = seeded(l.id, 4), r5 = seeded(l.id, 5);
    const score = l.score, sent = l.sentiment, eng = l.engagement, gapD = Math.round(l.last/1440);
    const first = l.name.split(' ')[0];
    const ch = channelOf(l);

    // helper makers
    const stat  = (v, sub, note) => ({ viz:'stat', v, sub, note });
    const bar   = (pct, tone, vlabel, note) => ({ viz:'bar', pct:clamp(Math.round(pct),2,100), tone:T[tone+'l']||T[tone], vlabel, note });
    const wbars = (items, note) => ({ viz:'wbars', items, note });
    const split = (parts, note) => ({ viz:'split', parts, note });
    const spark = (points, dir, tag, note) => ({ viz:'spark', points, dir, tag, note });
    const level = (lv, labels, tone, note) => ({ viz:'level', lv, labels, tone:T[tone+'l']||T[tone], note });
    const dots  = (on, total, n, tone, note) => ({ viz:'dots', on, total, n, tone:T[tone+'l']||T[tone], note });
    const chips = (items, note) => ({ viz:'chips', items, note });
    const phrase= (rows, note) => ({ viz:'phrase', rows, note });
    const pillv = (v, icon, tone, note) => ({ viz:'pill', v, icon, tone:T[tone], toneBg:(TBG[tone]||TBG.g)[1], toneBd:(TBG[tone]||TBG.g)[2], note });
    const ring  = (pct, tone, label, note) => ({ viz:'ring', pct:clamp(Math.round(pct),0,100), tone:T[tone+'l']||T[tone], label, note });
    // new viz makers (single-column, bullet/icon-forward)
    const playbook = (rows, opts) => Object.assign({ viz:'playbook', rows }, opts||{});
    const heatmap  = (days, tag, dir, note) => ({ viz:'heatmap', days, tag, dir, note });
    const daywindow= (cfg) => Object.assign({ viz:'daywindow' }, cfg);
    const channels = (items, note) => ({ viz:'channels', items, note });
    const colbars  = (items, note) => ({ viz:'colbars', items, note });
    const elasticity = (cfg) => Object.assign({ viz:'elasticity' }, cfg);

    /* ── PILL 1 · Pulse (tier 0) ── */
    m.pulse_summary = playbook(summaryBullets(l));
    m.pulse_summary.hero = true;

    const negSig = (l.signals||[]).find(s=>s[0]==='neg') || (l.signals||[]).find(s=>s[0]==='warn');
    m.anomaly = negSig
      ? pillv(negSig[1], 'warning', negSig[0]==='neg'?'r':'a', 'Flagged automatically from the event log — worth a look before the next touch.')
      : { viz:'status', ok:true, text:'No friction detected', sub:'all process signals normal' };
    m.anomaly.themeAcc = 'var(--r-l)';   // friction detector always red-themed

    const fUp = l.freq[3] >= l.freq[0];
    const velPct = Math.abs(Math.round((l.freq[3]-l.freq[0])/Math.max(l.freq[0],1)*100));
    m.velocity_trend = heatmap(heatDays(l), (fUp?'+':'−')+velPct+'%', fUp?'up':'down',
      '35-day interaction density — each box is one day. '+(fUp?'Rising into this week.':'Cooling vs a month ago.'));
    if (!fUp) m.velocity_trend.themeAcc = 'var(--r-l)';  // cooling trend = red theme

    m.channel_share = channels(channelsFor(l),
      'Where the conversation actually happens — and how fast each replies.');

    const win = (l.nba && l.nba[0] && /\d/.test(l.nba[0].t)) ? l.nba[0].t.replace(/^(Call|Send|Offer|Book|Confirm)\s*/,'') : pick(['Tue 11:00–13:00','Wed 18:00–20:00','Thu 10:00–12:00'], r2());
    const wm = /(\d{1,2}):\d{2}\s*[–-]\s*(\d{1,2}):\d{2}/.exec(win);
    const startH = wm ? +wm[1] : 11, endH = wm ? +wm[2] : 13;
    const dayLb = (/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.exec(win)||[])[0] || 'Tue';
    m.contact_time = daywindow({ startH, endH, dayLb, rate:60+Math.round(r2()*15),
      altRate:38+Math.round(r2()*8),
      note:'Best opened-and-replied window from past touches — line up the next call here.' });

    const lossDrop = clamp(100 - score + gapD*1.5, 6, 96);
    m.loss_pulse = bar(lossDrop, toneFor(lossDrop,true)==='g'?'g':(lossDrop>60?'r':'a'),
      lossDrop+'%', lossDrop>55 ? 'Critical gap since last touch — re-engage today.' : 'Stable for now; keep the cadence.');
    m.loss_pulse.themeAcc = 'var(--r-l)';   // loss-risk always red-themed

    /* ── PILL 2 · Behavior (tier 1) ── */
    const dwellS = Math.round(40 + eng*4 + r3()*200);
    m.dwell = stat(Math.floor(dwellS/60)+'m '+String(dwellS%60).padStart(2,'0')+'s', 'net time on sent offers & PDFs',
      'Time actually spent reading what you sent — not just opens.');
    // sector comparison badge
    const sectDwellS = 180;  // 3-minute sector baseline
    const dwellDiff = Math.round((dwellS - sectDwellS)/sectDwellS * 100);
    m.dwell.sectorBadge = { pct: Math.abs(dwellDiff), dir: dwellDiff >= 0 ? 'up' : 'down' };

    const spike = (l.signals||[]).some(s=>/open|view|re-?read|spike/i.test(s[1]));
    m.reengage = spike
      ? pillv('Opened an old link '+(2+Math.floor(r3()*4))+'× in 2h', 'restart_alt', 'g', 'Sudden return after a quiet spell — intent is back.')
      : pillv('No spike in 7 days', 'remove', 'a', 'No fresh re-engagement; a nudge may be needed.');

    const sd = Math.round(45 + r3()*52);
    m.scroll_depth = bar(sd, sd>70?'g':'a', sd+'%', 'Stuck on "'+pick(['Payment Plans','Floor Plan','Extra Costs','Location & Transit'], r3())+'" — the page they linger on.');

    m.interaction_vel = channels(channelsFor(l), 'Reply speed per channel vs the sector — lead where they move fastest.');

    m.micro_hotspot = pillv(pick(['Price Table — Extra Costs','Payment Schedule','Sea-view photos','Floor Plan — Bedrooms'], r4())+' (+'+(90+Math.floor(r4()*60))+'% focus)', 'my_location', 'b',
      'The single element they fixate on and keep returning to.');

    const rage = score < 60 || (l.obj||[]).length>1;
    m.rage_click = rage
      ? pillv('Rage-clicked "'+pick(['Cancellation & Refund','Late-delivery clause','Payment terms'], r4())+'"', 'touch_app', 'r', 'Tagged distrust / confusion — reassure on this point.')
      : pillv('No friction detected', 'check_circle', 'g', 'No rapid-click or rage patterns on key fields.');

    const locs = (l.profile && l.profile.locations || 'Center → Suburb').split(/,|→|\//).map(s=>s.trim()).filter(Boolean);
    m.geo_shift = locs.length>=2
      ? split([{label:locs[0], pct:35, tone:'var(--txt4)'}, {label:locs[1]+' (now)', pct:65, tone:T.bl}], '65% of recent clicks shifted toward '+locs[1]+'.')
      : stat('Stable', 'no area drift', 'Search area has not shifted.');

    const horizon = /investment|holiday/i.test((l.profile&&l.profile.motivation)||'') ? 'Investor · 3–6 mo' : (score>=75?'Urgent · <15 days':'Active · 1–2 mo');
    m.buying_horizon = pillv(horizon, 'hourglass_top', score>=75?'g':'b', 'Estimated time-to-close from behaviour pattern.');

    /* ── PILL 3 · Qualification (tier 2) ── */
    const dec = (l.profile&&l.profile.decision)||'Solo';
    const decP = /solo/i.test(dec)?90 : /partner/i.test(dec)?55 : /family/i.test(dec)?40 : 30;
    m.decision_power = ring(decP, decP>=70?'g':'a', decP>=70?'Decides alone':'Shared decision',
      decP>=70?'Controls the budget alone — the decision-maker.':'Shares the decision ('+dec.toLowerCase()+') — loop them in.');
    m.decision_power.compare = cmp(decP-58, decP>=58?'more autonomous than sector':'less autonomous than sector');
    m.decision_power.steps = [ decP>=70
      ? { ic:'bolt', t:'Push for the decision directly — no need to wait on others.' }
      : { ic:'groups', t:'Identify the second decision-maker and get them in the next call.' } ];

    const personaIco = p => p==='Analytical'?'analytics' : p==='Relational'?'favorite' : 'bolt';
    const personaTone = p => p==='Analytical'?'b' : p==='Relational'?'v' : 'o';
    const personaTalk = p => p==='Analytical'?'Lead with numbers, comparables and a clear spec sheet.' : p==='Relational'?'Open warm, build trust first, keep the data light.' : 'Be brief and direct — headline the bottom line, skip the preamble.';
    const personas = score>=70?['Analytical','Direct'] : sent>=60?['Relational'] : ['Direct'];
    m.persona = playbook(
      personas.map(p=>({ ic:personaIco(p), tone:personaTone(p), t:p+' communicator' })),
      { steps: personas.map(p=>({ ic:'record_voice_over', t:personaTalk(p) })) });

    const mot = (l.profile&&l.profile.motivation)||'';
    const motMap = {
      'Passive Income':{ic:'savings'}, 'Prestige':{ic:'workspace_premium'}, 'Lifestyle':{ic:'beach_access'},
      'Leisure':{ic:'beach_access'}, 'Stability':{ic:'foundation'}, 'Exploring':{ic:'explore'},
    };
    const motTags = /investment/i.test(mot)?['Passive Income','Prestige']:/holiday/i.test(mot)?['Lifestyle','Leisure']:/primary/i.test(mot)?['Lifestyle','Stability']:['Exploring'];
    m.motivation = playbook(
      motTags.map(t=>({ ic:(motMap[t]||{ic:'interests'}).ic, tone:'g', t })),
      { compare: cmp(/investment/i.test(mot)?34:18, /investment/i.test(mot)?'more investor-led than sector':'vs sector mix'),
        steps: [{ ic:'auto_stories', t:'Lead the story with '+motTags[0].toLowerCase()+' — it is what actually drives the buy.' }],
        tip: /investment/i.test(mot) ? 'Frame ROI, yield and resale liquidity — not lifestyle.' : 'Sell the feeling of the space first; justify with numbers second.' });

    const objs = objectionsOf(l);
    m.objection = objs.length
      ? playbook(
          objs.slice(0,3).map(o=>({ ic:o.icon, tone:o.tone, t:o.t })),
          { steps: objs.slice(0,2).map(o=>({ ic:'arrow_forward', t:o.fix })),
            tip: 'Tackle the top objection before your next ask — don’t let it sit.' })
      : { viz:'status', ok:true, text:'No objections detected', sub:'nothing blocking — keep momentum' };

    const fin = (l.profile&&l.profile.financing)||'';
    const finP = /cash/i.test(fin)?95 : /mortgage/i.test(fin)?55 : 40;
    m.funding = ring(finP, finP>=80?'g':finP>=50?'a':'r', (/cash/i.test(fin)?'Cash':fin||'Unclear')+' · '+finP+'%',
      /cash/i.test(fin)?'Cash buyer — financing will not drop the deal.':'Financing is '+(fin||'unclear').toLowerCase()+' — confirm before investing more.');
    m.funding.steps = [ /cash/i.test(fin)
      ? { ic:'verified', t:'No mortgage contingency — you can close fast; offer a quick-close incentive.' }
      : { ic:'fact_check', t:'Get a pre-approval letter on file before the next milestone.' } ];

    const ltv = l.ltv||0;
    const seg = ltv>=4e6?['HNWI — A+','g']:ltv>=2.5e6?['Segment A','g']:ltv>=1.6e6?['Segment B','a']:['Segment C','b'];
    m.ltv_segment = colbars([
      { label:'This lead', v:ltv, tone:seg[1], lead:true },
      { label:'Segment avg', v:1900000, tone:'slate' },
      { label:'Top 10%', v:5200000, tone:'v' },
    ], 'Long-term value incl. future buys + referral potential.');
    m.ltv_segment.seg = seg[0];
    m.ltv_segment.steps = [{ ic: ltv>=2.5e6?'star':'trending_up', t: ltv>=2.5e6?'High-LTV — protect this relationship; assign your strongest closer.':'Look for an upsell or referral path to lift lifetime value.' }];

    const stated = (l.profile&&l.profile.budget||'').match(/max\s*₺?([\d.,]+\s*[MmKk]?)/);
    const spokenVal = l.value ? Math.round(l.value*0.92) : (ltv*0.55);
    const ceil = l.value ? Math.round(l.value*1.08) : Math.round(ltv*0.7);
    const headroom = Math.round((ceil-spokenVal)/Math.max(spokenVal,1)*100);
    m.price_ceiling = elasticity({
      spoken: spokenVal, max: ceil, fmt: v=>fmtTL(Math.round(v/1e5)*1e5), headroom,
      note:'Spoken budget vs the real ceiling inferred from behaviour — the bar fills to where they’ll actually stretch.',
      steps:[{ ic:'sell', t:'You have ~'+headroom+'% headroom — don’t anchor at the stated number; present up to the ceiling.' }] });

    const req = (l.profile&&l.profile.reqs&&l.profile.reqs[0]) || 'parking';
    m.dealbreaker = (l.profile&&l.profile.reqs&&l.profile.reqs.length)
      ? phrase([{ t:'Never lingers >10s on listings without '+req.toLowerCase()+' — treat it as mandatory.' }], 'Shared trait of everything they silently rejected.')
      : stat('Not enough signal', 'needs more viewed listings', 'Will surface once more listings are reviewed.');

    // show-more (Pill 3)
    m.risk_appetite = bar(30+r5()*60, 'b', null, 'Appetite for aggressive / off-plan options.');
    m.liquidity     = bar(40+r5()*55, 'a', null, 'How fast they need to deploy capital.');
    m.upsell        = bar(35+r5()*55, 'g', null, 'Likelihood to add a second unit or upgrade.');
    m.discount_sens = bar(30+r5()*60, 'o', null, 'How much a discount actually moves them.');
    m.market_sens   = bar(40+r5()*50, 'v', null, 'Reactivity to broader market price moves.');

    // healthcare injects
    m.treat_urgency   = bar(60+r4()*35, 'r', null, 'Urgency from complaint text & first call.');
    m.med_anxiety     = level(Math.floor(r4()*3), ['Calm','Cautious','Anxious'], 'a', 'High anxiety → lead with trust, not price.');
    m.treat_retention = bar(55+r4()*40, 'g', null, 'Predicted adherence to a multi-session plan.');
    // law injects
    m.precedent     = bar(50+r4()*45, 'b', null, 'Win rate of comparable precedent cases.');
    m.doc_completion= bar(40+r4()*55, 'a', null, 'Share of required documents collected.');

    /* ── PILL 4 · Deep NLP & Voice (tier 3) ── */
    m.voice_summary = phrase([
      { ic:'graphic_eq', t:'Tone: '+pick(['calm but rushed','warm, decisive','guarded, analytical','friendly, hesitant'], r2()) },
      { ic:'format_quote', t:'Standout: "'+pick(['get the deed done','need the sea view','is the price final?','let me talk to my partner'], r2())+'"' },
      { ic:'task_alt', t:'Promised: '+pick(['offer by Friday','decision after the weekend','a second viewing','send documents'], r2()) },
    ], '3-point X-ray of the last recorded call.');

    const we = 40 + Math.floor(r3()*45);
    m.pronoun = split([{label:'"We / partner" '+we+'%', pct:we, tone:T.vl}, {label:'"I" '+(100-we), pct:100-we, tone:'var(--txt4)'}],
      we>60?'Heavy "we" → a hidden partner is in the decision.':'Speaks as "I" — likely the sole decider.');

    m.hesitation = stat((1.5+r3()*2.6).toFixed(1)+'s', 'pause on "'+pick(['price','closing terms','location'], r3())+'"', 'Longest hesitation → near the budget limit.');
    m.mirroring = ring(25+r3()*50, 'a', 'register fit', 'How well you matched their register. Lead is technical — answer with numbers.');
    m.urgency_friction = bar(30+r3()*55, 'o', null, 'Speech speed/tone above their baseline → deadline pressure.');
    m.prompt_drift = phrase([{ ic:'help', t:'Asked about '+pick(['late-delivery penalties','resale liquidity','maintenance fees'], r4())+' 2 days ago — left unanswered.' }], 'Concerns implied but never closed out.');
    m.overload = bar(45+r4()*45, 'r', null, 'Docs/messages beyond capacity → stop sending for 3 days.');
    m.turning_point = phrase([{ ic:'flag', t:pick(['May 24','Jun 1','Apr 18'], r4())+' — interest +40% after the '+pick(['B-Block image','price revision','terrace photos'], r4())+'.' }], 'Single event that shifted the trajectory.');

    /* ── PILL 5 · Risk & Forecast (tier 2) ── */
    const ghost = clamp(100-score + (l.freq[3]===0?20:0), 10, 92);
    const churn = clamp(lossDrop - 12 + gapD, 8, 90);
    m.loss_risk = { viz:'horizon', note:'One engine, two horizons — switch to see each risk.', horizons:[
      { id:'ghost', label:'Immediate ghost', pct:Math.round(ghost), tone:T[ghost>60?'rl':'al'],
        sub: ghost>60 ? "Don't email the offer — book a live call." : 'Low ghost risk; a message is fine.' },
      { id:'churn', label:'Competitor churn', pct:Math.round(churn), tone:T[churn>55?'rl':'al'],
        sub: churn>55 ? 'No contact in '+gapD+' days — a rival may be courting them.' : 'Holding; keep the cadence steady.' },
    ]};

    const tp = score>=80?2:score>=60?4:6;
    m.touchpoints = stat('~'+tp+' touches', Math.max(1,Math.round(tp/2))+' in-person likely', 'Remaining calls/meetings vs similar closed-won profiles.');

    const dev = Math.round((61 - eng) + (r2()*30-15));
    m.velocity_dev = stat((dev>0?'+':'')+dev+'%', dev>0?'faster than top closers':'slower than top closers',
      'Elapsed time vs the top closed-won average.');
    m.velocity_dev.tone = dev>=0 ? T.g : T.r;

    m.neg_buffer = stat('max '+(3+Math.floor(r3()*5))+'% below list', 'price flex from similar profiles', 'How far comparable buyers pushed before closing.');
    m.golden_hour = stat(pick(['Fri 10:30–11:30','Tue 18:00–19:00','Thu 09:30–10:30'], r3()), 'most open to a decisive ask', 'Window they are most receptive to an aggressive move.');
    m.friction_index = bar(30+r4()*55, 'a', null, 'Indecision approving steps — wants reconfirmation.');
    m.followup_fatigue = bar(20+r4()*60, 'o', null, 'When more follow-ups start to backfire. Back off past the line.');

    // show-more (Pill 5)
    m.discount_eff   = bar(35+r5()*55, 'g', null, 'How efficiently a discount converts here.');
    m.payment_default= bar(10+r5()*40, 'r', null, 'Risk of a payment/financing default.');
    m.org_fatigue    = bar(25+r5()*55, 'a', null, 'Decision fatigue across their org/family unit.');
    m.info_asymmetry = bar(40+r5()*50, 'b', null, 'Your information edge in the negotiation.');
    m.yes_set        = bar(45+r5()*50, 'g', null, 'Momentum of small agreed-yeses toward the close.');

    return m;
  }

  /* one-line pulse summary (rule-based) */
  function summaryFor(l){
    const h = l.score>=70?'g':l.score>=45?'a':'r';
    const first = l.name.split(' ')[0];
    if (l.age3) return 'Brand-new lead, only '+l.age+' days in — early signals look '+(h==='g'?'promising':'okay')+' and '+first+' replies fast. Lock a discovery call before they shop around.';
    if (h==='g') return 'Strong, active deal. '+first+' is engaged and progressing — remove the last bit of friction and keep momentum toward close.';
    if (h==='a') return 'Warm but undecided. '+first+' is interested yet hasn’t committed — a concrete next step is what moves this forward.';
    return 'Cooling off. '+first+' has gone quiet and signals are weakening — re-qualify with one low-effort touch before investing more time.';
  }

  window.DEHA_LEAD_POP = { PILLS, TIER_LABEL, WORKSPACES, SCHEMA, buildLeadMetrics, isActive, hasVoice, coldDropHours, summaryFor };
})();
