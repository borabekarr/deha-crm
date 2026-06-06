/* =========================================================================
   _lead-popover.jsx — Lead Details Popover (LEAD-scope, schema + tier driven)
   Centered grey-bezel modal in the pipeline-card popover language. Pills =
   depth/cost tiers (0 auto · 1 on-active · 2 on-select · 3 manual+gated).
   Every widget renders from DEHA_LEAD_POP.SCHEMA via a generic <Viz>.
   ========================================================================= */
const { useState, useEffect, useRef, useLayoutEffect } = React;
const LP = window.DEHA_LEAD_POP;
const LH = (window.DEHA_LEADS && window.DEHA_LEADS.helpers) || {};
const initials = LH.initials || (n => n.slice(0,2).toUpperCase());

const TONEBG = {
  g:['var(--g)','var(--g-bg)','var(--g-bd)'], a:['var(--a)','var(--a-bg)','var(--a-bd)'], r:['var(--r)','var(--r-bg)','var(--r-bd)'],
  b:['var(--b)','var(--b-bg)','var(--b-bd)'], v:['var(--v)','var(--v-bg)','var(--v-bd)'], o:['var(--o)','var(--o-bg)','var(--o-bd)'],
};
const HEALTH = { g:'#0F9D6B', a:'#D97A2B', r:'#475569' };   // strong emerald · amber attention · slate at-risk
const healthOf = s => s>=70?'g':s>=45?'a':'r';
const HEALTH_WORD = { g:'On track', a:'Needs attention', r:'At risk' };
const STAGE_ICON = { lead:'person_add', qualified:'verified', proposal:'description', negotiation:'handshake', closing:'task_alt' };
const TEMP = { hot:{c:'#F97316',ic:'local_fire_department'}, warm:{c:'#EAB308',ic:'thermostat'}, cold:{c:'#64748B',ic:'ac_unit'} };
/* sentiment number → icon + category word */
function sentimentCat(s){
  if (s>=72) return { ic:'sentiment_very_satisfied', word:'Positive' };
  if (s>=55) return { ic:'sentiment_satisfied', word:'Warm' };
  if (s>=42) return { ic:'sentiment_neutral', word:'Neutral' };
  return { ic:'sentiment_dissatisfied', word:'Negative' };
}
/* deterministic, lead-seeded week-over-week delta that leans with the score */
function weekDelta(id, base){
  const f = (Math.sin(id*73.13 + base*1.7) * 1000) % 1;
  return Math.round((base-58)/11 + f*4 - 1);
}

/* ─────────────── timer-based tween (throttle-safe; rAF stalls in preview) ── */
function useTween(target, dur){
  const [v, setV] = useState(0);
  useEffect(()=>{
    const T = (typeof performance!=='undefined' ? performance.now() : Date.now());
    let id;
    const tick = ()=>{
      const now = (typeof performance!=='undefined' ? performance.now() : Date.now());
      const p = Math.min(1, (now - T)/(dur||760));
      setV(target * (1 - Math.pow(1-p, 3)));
      if (p < 1) id = setTimeout(tick, 16); else setV(target);
    };
    id = setTimeout(tick, 16);
    return ()=> clearTimeout(id);
  }, [target, dur]);
  return v;
}
let _gidN = 0; const gid = () => 'lg' + (++_gidN);

/* ─────────────── animated viz primitives ─────────────── */
function Bar({ pct, tone, vlabel }){
  const w = useTween(pct, 780);
  return (
    <div className="ldx-barbox" style={{ '--tone': tone }}>
      <span className="ldx-bar-v">{vlabel != null ? vlabel : Math.round(w) + '%'}</span>
      <div className="ldx-bar"><i style={{ width: w + '%' }}><span className="ldx-bar-glow" /></i></div>
    </div>
  );
}
function WBar({ it }){
  const w = useTween(it.w, 760);
  return (
    <div style={{ '--wtone': it.tone }}>
      <div className="ldx-wbar-top"><span>{it.n}</span><b>{it.label != null ? it.label : Math.round(w) + '%'}</b></div>
      <div className="ldx-wbar-tr"><i style={{ width: w + '%' }} /></div>
    </div>
  );
}
function SplitSeg({ p }){ const w = useTween(p.pct, 720); return <i style={{ width: w + '%', background: p.tone }} />; }
function Ring({ pct, tone }){
  const val = useTween(pct, 860);
  const R=21, C=2*Math.PI*R, off=C*(1-val/100);
  const id = useRef(gid()).current;
  return (
    <div className="ldx-ring">
      <svg width="54" height="54" viewBox="0 0 54 54">
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone} stopOpacity="0.55" /><stop offset="1" stopColor={tone} />
        </linearGradient></defs>
        <circle cx="27" cy="27" r={R} fill="none" stroke="var(--track)" strokeWidth="6.5" />
        <circle cx="27" cy="27" r={R} fill="none" stroke={`url(#${id})`} strokeWidth="6.5" strokeLinecap="round"
          strokeDasharray={C.toFixed(1)} strokeDashoffset={off.toFixed(1)} transform="rotate(-90 27 27)" />
      </svg>
      <span className="rv" style={{ color: tone }}>{Math.round(val)}</span>
    </div>
  );
}
function Spark({ points, dir, tag }){
  const prog = useTween(100, 920);
  const max = Math.max(...points, 1), min = Math.min(...points, 0);
  const n = points.length, W = 100, Hh = 34, rng = (max-min)||1;
  const xs = i => (i/(n-1))*W;
  const ys = v => Hh - ((v-min)/rng)*(Hh-6) - 3;
  const line = points.map((v,i)=>`${i?'L':'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
  const area = `${line} L${W},${Hh} L0,${Hh} Z`;
  const col = dir==='up' ? 'var(--g-l)' : 'var(--r-l)';
  const id = useRef(gid()).current;
  const lx = xs(n-1), ly = ys(points[n-1]);
  return (
    <div className="ldx-spark-row">
      <svg className="ldx-spark" viewBox={`0 0 ${W} ${Hh}`} preserveAspectRatio="none">
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity="0.28" /><stop offset="1" stopColor={col} stopOpacity="0" />
        </linearGradient></defs>
        <path d={area} fill={`url(#${id})`} opacity={prog/100} />
        <path d={line} fill="none" stroke={col} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          pathLength="100" strokeDasharray="100" strokeDashoffset={100 - prog} />
        <circle cx={lx} cy={ly} r="2.6" fill={col} opacity={prog>92?1:0} />
      </svg>
      <span className="ldx-spark-tag" style={{ color: col }}>
        <span className="material-symbols-outlined">{dir==='up'?'trending_up':'trending_down'}</span>{tag}
      </span>
    </div>
  );
}

/* ── new single-column viz: playbook · heatmap · daywindow · channels · colbars · elasticity ── */
const TONE_HEX = { g:'var(--g-l)', a:'var(--a-l)', r:'var(--r-l)', b:'var(--b-l)', v:'var(--v-l)', o:'var(--o-l)', slate:'var(--txt4)' };
const SPEED_TONE = { g:'#059669', b:'#0EA5A0', a:'#D97706', slate:'#64748B' };

function Bullets({ rows }){
  return (
    <ul className="ldx-bul">
      {rows.map((row,i)=>(
        <li key={i} className="ldx-bul-li">
          <span className="ldx-bul-ic" style={{ color: TONE_HEX[row.tone]||'var(--txt3)' }}><span className="material-symbols-outlined">{row.ic||'chevron_right'}</span></span>
          <span className="ldx-bul-t">{row.t}</span>
        </li>
      ))}
    </ul>
  );
}

/* per-day interaction times for the heatmap hover tooltip (deterministic) */
const HEAT_HOURS = [9,10,11,12,13,14,15,16,17,18,19,20];
function heatTip(i, lv, total){
  const ago = total-1-i;
  const day = ago===0 ? 'Today' : ago===1 ? 'Yesterday' : ago+' days ago';
  if (!lv) return { day, n:0, times:[] };
  let seed = (i*131 + lv*977 + 17) % 9973;
  const rnd = ()=>{ seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed/0x7fffffff; };
  const used = new Set(), times = [];
  for (let k=0;k<lv;k++){
    let h = HEAT_HOURS[Math.floor(rnd()*HEAT_HOURS.length)], guard=0;
    while(used.has(h) && guard++<12) h = HEAT_HOURS[Math.floor(rnd()*HEAT_HOURS.length)];
    used.add(h);
    const m = [0,15,30,45][Math.floor(rnd()*4)];
    times.push(String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'));
  }
  times.sort();
  return { day, n:lv, times };
}
function Heatmap({ days, tag, dir }){
  const prog = useTween(days.length, 1100);
  const shown = Math.round(prog);
  return (
    <div className="ldx-heat-wrap">
      <div className="ldx-heat">
        {days.map((lv,i)=>{
          const tip = heatTip(i, lv, days.length);
          return (
            <span key={i} className={'ldx-heat-box l'+ (i<shown?lv:0)}>
              <span className="ldx-heat-tip">
                <b>{tip.day}</b>
                <span className="ldx-heat-tip-n">{tip.n ? tip.n+' interaction'+(tip.n>1?'s':'') : 'No interactions'}</span>
              </span>
            </span>
          );
        })}
      </div>
      <div className="ldx-heat-foot">
        <span className="ldx-heat-scale">Less <i className="l0" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /> More</span>
      </div>
    </div>
  );
}

function DayWindow({ startH, endH, dayLb, rate, altRate }){
  const lo = 8, hi = 21, span = hi-lo;
  const left = ((startH-lo)/span)*100, width = ((endH-startH)/span)*100;
  const grow = useTween(width, 760);
  const hours = []; for (let h=lo; h<=hi; h++) hours.push(h);
  const halves = []; for (let h=lo; h<hi; h++) halves.push(h+0.5);
  return (
    <div className="ldx-dw">
      <div className="ldx-dw-head">
        <div className="ldx-dw-when-row">
          <span className="ldx-dw-day">{dayLb}</span>
          <span className="ldx-dw-rate-badge">{rate}%</span>
          <span className="ldx-dw-time">{String(startH).padStart(2,'0')}:00 - {String(endH).padStart(2,'00')}:00</span>
        </div>
      </div>
      <div className="ldx-dw-track">
        <div className="ldx-dw-window" style={{ left: left+'%', width: grow+'%' }}>
          <span className="ldx-dw-flag">{rate}%</span>
        </div>
        {halves.map(t=> <span key={'h'+t} className="ldx-dw-tick minor" style={{ left: ((t-lo)/span)*100+'%' }}><i /></span>)}
        {hours.map(t=> <span key={t} className="ldx-dw-tick" style={{ left: ((t-lo)/span)*100+'%' }}><i /><span className="ldx-dw-tick-lb">{String(t).padStart(2,'0')}:00</span></span>)}
      </div>
      <div className="ldx-dw-legend"><span className="ldx-dw-dot on" />Peak window&nbsp;·&nbsp;<span className="ldx-dw-dot" />{altRate}% outside it</div>
    </div>
  );
}

/* channels: slim shared bar + compact bullet list */
const CH_COLOR = { WhatsApp:'var(--g-l)', Phone:'var(--b-l)', Email:'var(--v-l)', Instagram:'var(--o-l)' };
const chColor = name => CH_COLOR[name] || 'var(--txt4)';
function ChSeg({ s }){ const w = useTween(s.pn, 720); return <i style={{ width: w+'%', background: s.color }} />; }
function Channels({ items }){
  const tot = items.reduce((a,c)=> a + (c.share||0), 0) || 1;
  const segs = items.map(c => ({ c, color: chColor(c.name), pn: (c.share/tot)*100 }));
  return (
    <div className="ldx-chwrap">
      <div className="ldx-chbar">{segs.map((s,i)=> <ChSeg key={i} s={s} />)}</div>
      <ul className="ldx-ch-bullets">
        {segs.map((s,i)=>{ const c = s.c; return (
          <li key={i} className="ldx-ch-bul">
            <span className="ldx-ch-bul-dot" style={{ background: s.color }} />
            <span className="ldx-ch-bul-name">{c.name}{c.preferred && <span className="ldx-ch-pref"><span className="material-symbols-outlined">star</span></span>}</span>
            <div className="ldx-ch-bul-stats">
              <span className="ldx-ch-bul-time"><span className="material-symbols-outlined">schedule</span>{c.time}</span>
              <span className={'ldx-vsbadge ' + c.vs.dir}><span className="material-icons">{c.vs.dir==='up'?'trending_up':'trending_down'}</span>{c.vs.pct}% {c.vs.dir==='up'?'faster':'slower'}</span>
              <span className="ldx-speedtag" style={{ '--st': SPEED_TONE[c.speedTone] }}>{c.speedLb}</span>
            </div>
          </li>
        ); })}
      </ul>
    </div>
  );
}

/* stacked single-column bar — 3 values share 1 bar, stacked vertically */
function ColBarSeg({ it, total }){
  const pct = useTween((it.v/total)*100, 780);
  return <div className={'ldx-colbars-seg'+(it.lead?' lead':'')} style={{ height: pct+'%', background: TONE_HEX[it.tone]||'var(--txt4)' }} />;
}
function ColBars({ items }){
  const total = items.reduce((a,x)=>a+x.v, 0) || 1;
  const fmtTL = LH.fmtTL || (n=>'₺'+n);
  return (
    <div className="ldx-colbars-stacked">
      <div className="ldx-colbars-bar">
        {[...items].reverse().map((it,i)=> <ColBarSeg key={i} it={it} total={total} />)}
      </div>
      <div className="ldx-colbars-legend">
        {items.map((it,i)=>(
          <div key={i} className={'ldx-colbars-leg'+(it.lead?' lead':'')}>
            <i style={{ background: TONE_HEX[it.tone]||'var(--txt4)' }} />
            <span>{it.label}</span>
            <b>{fmtTL(Math.round(it.v/1e5)*1e5)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function Elasticity({ spoken, max, fmt, headroom }){
  const spokenPct = (spoken / max) * 100;
  const spokenFill = useTween(spokenPct, 820);
  const ceilFill   = useTween(100 - spokenPct, 820);
  return (
    <div className="ldx-elx">
      <div className="ldx-elx-nums">
        <div className="ldx-elx-num"><span className="ldx-elx-k">Spoken</span><span className="ldx-elx-v">{fmt(spoken)}</span></div>
        <div className="ldx-elx-num right"><span className="ldx-elx-k">Ceiling</span><span className="ldx-elx-v hi">{fmt(max)}</span></div>
      </div>
      <div className="ldx-elx-track">
        <div className="ldx-elx-fill" style={{ width: spokenFill+'%' }} />
        <div className="ldx-elx-fill ceil" style={{ left: spokenFill+'%', width: ceilFill+'%' }} />
      </div>
      <div className="ldx-elx-foot">
        <span className="ldx-elx-headpct"><span className="material-symbols-outlined">arrow_upward</span>{headroom}%</span>
        <span className="ldx-elx-headlbl">headroom above stated budget</span>
      </div>
    </div>
  );
}
function Viz({ d }){
  switch (d.viz){
    case 'playbook':
      return <Bullets rows={d.rows} />;
    case 'heatmap':
      return <Heatmap days={d.days} tag={d.tag} dir={d.dir} />;
    case 'daywindow':
      return <DayWindow startH={d.startH} endH={d.endH} dayLb={d.dayLb} rate={d.rate} altRate={d.altRate} />;
    case 'channels':
      return <Channels items={d.items} />;
    case 'colbars':
      return <ColBars items={d.items} />;
    case 'elasticity':
      return <Elasticity spoken={d.spoken} max={d.max} fmt={d.fmt} headroom={d.headroom} />;
    case 'lead':
      return <p className="ldx-leadline">{d.rows[0].t}</p>;
    case 'stat':
      return (
        <div className="ldx-stat">
          <div className="ldx-stat-main">
            <span className={'ldx-stat-v' + (String(d.v).length>14?' sm':'')} style={d.tone?{color:d.tone}:null}>{d.v}</span>
            {d.sectorBadge && <span className={'ldx-vsbadge ' + d.sectorBadge.dir}><span className="material-icons">{d.sectorBadge.dir==='up'?'trending_up':'trending_down'}</span>{d.sectorBadge.pct}% vs sector</span>}
          </div>
          {d.sub && <span className="ldx-stat-sub">{d.sub}</span>}
        </div>
      );
    case 'bar':
      return <Bar pct={d.pct} tone={d.tone} vlabel={d.vlabel} />;
    case 'wbars':
      return <div className="ldx-wbars">{d.items.map((it,i)=> <WBar key={i} it={it} />)}</div>;
    case 'split':
      return (
        <div>
          <div className="ldx-split">{d.parts.map((p,i)=> <SplitSeg key={i} p={p} />)}</div>
          <div className="ldx-split-leg">{d.parts.map((p,i)=> <span key={i}><i style={{ background: p.tone }} />{p.label}<b className="ldx-split-pct"> {Math.round(p.pct)}%</b></span>)}</div>
        </div>
      );
    case 'spark':
      return <Spark points={d.points} dir={d.dir} tag={d.tag} />;
    case 'ring':
      return (
        <div className="ldx-ring-row">
          <Ring pct={d.pct} tone={d.tone} />
          {d.label && <span className="ldx-stat-sub">{d.label}</span>}
        </div>
      );
    case 'level':
      return (
        <div style={{ '--tone': d.tone }}>
          <div className="ldx-level">{[0,1,2].map(i=> <i key={i} className={i<=d.lv?'on':''} />)}</div>
          <div className="ldx-level-lb">{d.labels[d.lv]}</div>
        </div>
      );
    case 'dots':
      return (
        <div className="ldx-dots" style={{ '--tone': d.tone }}>
          <span className="ldx-dots-n">{d.n}</span>
          <span className="ldx-dots-row">{Array.from({length:d.total}).map((_,i)=> <i key={i} className={i<d.on?'on':''} style={{ transitionDelay:(i*45)+'ms' }} />)}</span>
        </div>
      );
    case 'chips':
      return (
        <div className="ldx-chips">
          {d.items.map((c,i)=>{ const tb = TONEBG[c.tone]||TONEBG.g; return (
            <span key={i} className="ldx-chip lead" style={{ '--ctone':tb[0], '--ctone-bg':tb[1], '--ctone-bd':tb[2] }}>{c.t}</span>
          ); })}
        </div>
      );
    case 'phrase':
      return (
        <div className="ldx-phrase">
          {d.rows.map((row,i)=>(
            <div key={i} className="ldx-phr">
              {row.ic && <span className="material-symbols-outlined">{row.ic}</span>}
              <span>{row.t}</span>
            </div>
          ))}
        </div>
      );
    case 'pill':
      return (
        <span className="ldx-pillval" style={{ '--tone':d.tone, '--tone-bg':d.toneBg, '--tone-bd':d.toneBd }}>
          {d.icon && <span className="material-symbols-outlined">{d.icon}</span>}{d.v}
        </span>
      );
    default:
      return null;
  }
}

const TIERMETA = { 0:{lb:'Auto',cls:'t0'}, 1:{lb:'Log',cls:'t1'}, 2:{lb:'AI',cls:'t2'}, 3:{lb:'Voice',cls:'t3'} };
const TIER_ACC = { 0:'var(--g-l)', 1:'var(--b-l)', 2:'var(--v-l)', 3:'var(--o-l)' };

/* status strip — clean-state collapse (friction / objections) */
function StatusStrip({ schema, d }){
  return (
    <div className="ldx-w-shell" style={{ '--acc': d.themeAcc || 'var(--g-l)' }}>
    <section className="ldx-w">
      <div className="ldx-w-head">
        <span className="ldx-w-ic"><span className="material-symbols-outlined">{schema.icon}</span></span>
        <span className="ldx-w-label">{schema.label}</span>
      </div>
      <div className="ldx-status">
        <span className="ldx-status-ic"><span className="material-symbols-outlined">check</span></span>
        <span className="ldx-status-t">{d.text}</span>
        <span className="ldx-status-sub">{d.sub}</span>
      </div>
    </section>
    </div>
  );
}
/* pick the card's accent color from its data, falling back to the tier hue */
function accentOf(d, tier){
  if (d && d.themeAcc) return d.themeAcc;   // explicit danger/semantic override wins first
  if (d){
    if (d.tone) return d.tone;
    if (d.viz==='split' && d.parts[0]) return d.parts[0].tone;
    if (d.viz==='wbars' && d.items[0]) return d.items[0].tone;
    if (d.viz==='spark') return d.dir==='up' ? 'var(--g-l)' : 'var(--r-l)';
    if (d.viz==='chips' && d.items[0]){ const tb = TONEBG[d.items[0].tone]; if (tb) return tb[0]; }
  }
  return TIER_ACC[tier] || 'var(--v-l)';
}

/* loss-risk merged engine — one widget, horizon toggle */
function HorizonWidget({ schema, d }){
  const [hz, setHz] = useState(d.horizons[0].id);
  const cur = d.horizons.find(h=>h.id===hz) || d.horizons[0];
  return (
    <div className="ldx-w-shell" style={{ '--acc': d.themeAcc || cur.tone }}>
    <section className="ldx-w" style={{ '--acc': d.themeAcc || cur.tone }}>
      <div className="ldx-w-head">
        <span className="ldx-w-ic"><span className="material-symbols-outlined">{schema.icon}</span></span>
        <span className="ldx-w-label">{schema.label}</span>
      </div>
      <div className="ldx-hz">
        {d.horizons.map(h=>(
          <button key={h.id} className={'ldx-hz-btn' + (h.id===hz?' on':'')} onClick={()=>setHz(h.id)}>{h.label}</button>
        ))}
      </div>
      <div className="ldx-hz-body"><Bar pct={cur.pct} tone={cur.tone} /></div>
      <div className="ldx-w-note"><span className="material-symbols-outlined">tips_and_updates</span>{cur.sub}</div>
    </section>
    </div>
  );
}

/* shared footer: vs-sector compare · highlighted next steps · powerful tip */
function WidgetFooter({ d }){
  return (
    <React.Fragment>
      {d.compare && (
        <div className={'ldx-cmp ' + d.compare.dir}>
          <span className="ldx-cmp-badge"><span className="material-icons">{d.compare.dir==='up'?'trending_up':'trending_down'}</span>{d.compare.pct}%</span>
          <span className="ldx-cmp-lb">{d.compare.label}</span>
        </div>
      )}
      {d.steps && d.steps.length>0 && (
        <div className="ldx-steps">
          <div className="ldx-steps-k"><span className="material-symbols-outlined">playlist_add_check</span>Recommended next steps</div>
          <ul className="ldx-steps-list">
            {d.steps.map((s,i)=>(
              <li key={i}><span className="ldx-steps-ic"><span className="material-symbols-outlined">{s.ic||'arrow_forward'}</span></span>{s.t}</li>
            ))}
          </ul>
        </div>
      )}
      {d.tip && <div className="ldx-tip"><span className="material-symbols-outlined">tips_and_updates</span><span>{d.tip}</span></div>}
      {d.note && !d.tip && <div className="ldx-w-note"><span className="material-symbols-outlined">info</span>{d.note}</div>}
    </React.Fragment>
  );
}

/* one widget = one full-width row; each has its own grey outer shell */
function Widget({ schema, data }){
  if (!data) return null;
  // interaction_vel duplicates the Pulse channel_share widget — suppress in other pills
  if (schema.id === 'interaction_vel') return null;
  if (data.viz === 'horizon') return <HorizonWidget schema={schema} d={data} />;
  if (data.viz === 'status') return <StatusStrip schema={schema} d={data} />;
  const hero = data.hero;
  const acc = hero ? 'var(--o-l)' : accentOf(data, schema.tier);
  return (
    <div className={'ldx-w-shell' + (hero?' hero':'')} style={{ '--acc': acc }}>
      <section className="ldx-w">
        <div className="ldx-w-head">
          <span className="ldx-w-ic"><span className="material-symbols-outlined">{hero?'auto_awesome':schema.icon}</span></span>
          <span className="ldx-w-label">{hero?'AI verdict':schema.label}</span>
          {data.viz==='heatmap' && <span className={'ldx-tagbadge ldx-hm-hd-badge ' + (data.dir==='up'?'up':'down')} style={{marginLeft:'auto'}}>
            <span className="material-icons">{data.dir==='up'?'trending_up':'trending_down'}</span>{data.tag}
          </span>}
        </div>
        <Viz d={data} />
        {schema.id !== 'velocity_trend' && schema.id !== 'pulse_summary' && <WidgetFooter d={data} />}
      </section>
    </div>
  );
}

/* skeleton grid for an in-flight tier-2/3 compute */
function Skeletons(){
  return (
    <div className="ldx-skel-grid">
      {[0,1,2,3].map(i=>(
        <div className="ldx-skel" key={i} style={i%3===0?{gridColumn:'1 / -1'}:null}>
          <div className="ldx-skel-bar w35" />
          <div className="ldx-skel-bar w80" />
          <div className="ldx-skel-bar w50" />
          <span className="ldx-skel-tag"><span className="ldx-skel-spin" />computing…</span>
        </div>
      ))}
    </div>
  );
}

/* ═════════════════════ POPOVER ═════════════════════ */

/* animated header stat slot (Win % / Sentiment) */
function Slot({ icon, label, value, suffix }){
  const v = useTween(value, 840);
  return (
    <div className="ldx-slot">
      <div className="ldx-slot-l"><span className="material-symbols-outlined">{icon}</span>{label}</div>
      <div className="ldx-slot-v">{Math.round(v)}{suffix||''}</div>
      <div className="ldx-slot-bar"><i style={{ width: v + '%' }} /></div>
    </div>
  );
}

/* depth-tier segmented control — design-system .seg (sliding emerald pill) */
function SegPills({ pills, active, onSelect }){
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: 3, width: 0 });
  const measure = () => {
    const root = ref.current; if (!root) return;
    const btn = root.querySelector('.ldx-segbtn.on'); if (!btn) return;
    setPos(prev => (prev.left === btn.offsetLeft && prev.width === btn.offsetWidth) ? prev : { left: btn.offsetLeft, width: btn.offsetWidth });
  };
  useLayoutEffect(measure, [active]);          // on mount + active change (pre-paint)
  useEffect(()=>{ const t = setTimeout(measure, 140); return ()=> clearTimeout(t); }, [active]); // font/open reflow
  return (
    <div className="ldx-seg fill" ref={ref}>
      <span className="ldx-seg-pill" style={{ left: pos.left + 'px', width: pos.width + 'px' }} />
      {pills.map(p=>(
        <button key={p.id} className={'ldx-segbtn' + (p.id===active?' on':'')} onClick={()=>onSelect(p)}>
          <span className={'ldx-pill-dot t'+p.tier} />
          <span className="ldx-segbtn-lb">{p.label}</span>
        </button>
      ))}
    </div>
  );
}
function LeadDetailsPopover({ lead, open, onClose }){
  const [pill, setPill] = useState(1);
  const [ws, setWs] = useState('real_estate');
  const [computed, setComputed] = useState(()=>new Set([1]));
  const [loading, setLoading] = useState(null);
  const [showMore, setShowMore] = useState({});
  const [now, setNow] = useState(Date.now());
  const deadline = useRef(null);
  const timers = useRef([]);
  const bodyRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [edges, setEdges] = useState({ top:false, bottom:false });
  function onBodyScroll(){
    const el = bodyRef.current; if (!el) return;
    const st = el.scrollTop, max = el.scrollHeight - el.clientHeight;
    setScrolled(st > 50);  // higher threshold prevents gate-content false compact
    setEdges({ top: st > 6, bottom: st < max - 6 });
  }

  // reset everything when a new lead opens
  useEffect(()=>{
    if (!lead) return;
    setPill(1); setWs('real_estate'); setShowMore({}); setLoading(null);
    const init = new Set([1]);
    if (LP.isActive(lead)) init.add(2);   // tier-1 auto when lead is active
    setComputed(init);
    const ch = LP.coldDropHours(lead);
    deadline.current = ch!=null ? Date.now() + ch*3600000 : null;
    setNow(Date.now());
    timers.current.forEach(clearTimeout); timers.current = [];
  }, [lead]);

  // 1s tick for the countdown
  useEffect(()=>{
    if (!open || deadline.current==null) return;
    const t = setInterval(()=> setNow(Date.now()), 1000);
    return ()=> clearInterval(t);
  }, [open, lead]);

  // reset scroll only when switching pill/lead/workspace/open (NOT on recompute)
  useEffect(()=>{
    const el = bodyRef.current; if (!el) return;
    el.scrollTop = 0; setScrolled(false);
    const id = setTimeout(()=>{
      const max = el.scrollHeight - el.clientHeight;
      setEdges({ top:false, bottom: max > 6 });
    }, 60);
    return ()=> clearTimeout(id);
  }, [pill, ws, lead, open]);

  // re-check edges (preserve scroll position) when computed/loading/showMore changes
  useEffect(()=>{
    const el = bodyRef.current; if (!el) return;
    const id = setTimeout(()=>{
      const st = el.scrollTop, max = el.scrollHeight - el.clientHeight;
      setEdges({ top: st > 6, bottom: st < max - 6 });
    }, 80);
    return ()=> clearTimeout(id);
  }, [computed, loading, showMore]);

  if (!lead) return <div className="ldx-overlay" />;

  const metrics = LP.buildLeadMetrics(lead, ws);
  const h = healthOf(lead.score);
  const voice = LP.hasVoice(lead);
  const stage = window.DEHA_LEADS.STAGES[lead.stage] || {};
  const curPill = LP.PILLS.find(p=>p.id===pill);

  function startCompute(id, ms){
    setLoading(id);
    const t = setTimeout(()=>{ setComputed(s=>{ const n=new Set(s); n.add(id); return n; }); setLoading(null); }, ms);
    timers.current.push(t);
  }
  function selectPill(p){
    setPill(p.id);
    if (p.tier===2 && !computed.has(p.id) && loading==null) startCompute(p.id, 850);
  }
  function recompute(id, ms){
    setComputed(s=>{ const n=new Set(s); n.delete(id); return n; });
    startCompute(id, ms);
  }

  // countdown text + escalation level
  let cd = null, cdLevel = 'cool';
  if (deadline.current!=null){
    const ms = Math.max(0, deadline.current - now);
    const hh = Math.floor(ms/3600000), mm = Math.floor(ms%3600000/60000), ss = Math.floor(ms%60000/1000);
    cd = hh>=1 ? `${hh}h ${String(mm).padStart(2,'0')}m` : `${mm}m ${String(ss).padStart(2,'0')}s`;
    cdLevel = ms < 24*3600000 ? 'hot' : ms < 48*3600000 ? 'warm' : 'cool';
  }
  const winDelta = weekDelta(lead.id, lead.score);
  const sent = sentimentCat(lead.sentiment);

  // body content for the active pill
  const pillSchema = LP.SCHEMA.filter(s=> s.pill===pill && s.ws.includes(ws));
  const baseItems = pillSchema.filter(s=> !s.more);
  const moreItems = pillSchema.filter(s=> s.more);
  const visible = showMore[pill] ? baseItems.concat(moreItems) : baseItems;

  let body;
  if (loading === pill){
    body = <Skeletons />;
  } else if (curPill.tier===3 && !computed.has(pill)){
    body = voice ? (
      <div className="ldx-gate">
        <div className="ldx-gate-ic t3"><span className="material-symbols-outlined">graphic_eq</span></div>
        <div className="ldx-gate-t">Deep voice & NLP analysis</div>
        <div className="ldx-gate-s">Runs prosody, hesitation and language-pattern models over {lead.name.split(' ')[0]}’s call recordings. This is the most expensive tier — it only runs when you ask.</div>
        <button className="ldx-gate-btn t3" onClick={()=>startCompute(4, 1200)}><span className="material-symbols-outlined">bolt</span>Run deep analysis</button>
        <div className="ldx-gate-cost"><span className="material-symbols-outlined">bolt</span>Tier 3 · ~8s · uses voice credits</div>
      </div>
    ) : (
      <div className="ldx-gate">
        <div className="ldx-gate-ic gated"><span className="material-symbols-outlined">mic_off</span></div>
        <div className="ldx-gate-t">Insufficient data for voice analysis</div>
        <div className="ldx-gate-s">No call recordings or sufficient message history exist for {lead.name.split(' ')[0]} yet. Voice & deep-NLP metrics stay disabled until there’s something to analyze — no inference is run.</div>
        <button className="ldx-gate-btn t3" disabled><span className="material-symbols-outlined">block</span>Nothing to analyze</button>
        <div className="ldx-gate-cost"><span className="material-symbols-outlined">info</span>Capture a call to unlock this tier</div>
      </div>
    );
  } else if (curPill.tier===1 && !computed.has(pill)){
    body = (
      <div className="ldx-gate">
        <div className="ldx-gate-ic t2" style={{ background:'linear-gradient(150deg,var(--b-l),var(--b))', boxShadow:'0 8px 20px -8px var(--b-l)' }}><span className="material-symbols-outlined">ads_click</span></div>
        <div className="ldx-gate-t">No recent activity</div>
        <div className="ldx-gate-s">Behavioral signals normally compute automatically for active leads. {lead.name.split(' ')[0]} has been quiet for {Math.round(lead.last/1440)} days, so they’re paused — compute them anyway?</div>
        <button className="ldx-gate-btn t2" style={{ background:'var(--b)' }} onClick={()=>startCompute(2, 700)}><span className="material-symbols-outlined">play_arrow</span>Compute behavior signals</button>
        <div className="ldx-gate-cost"><span className="material-symbols-outlined">bolt</span>Tier 1 · cheap · log aggregation</div>
      </div>
    );
  } else {
    body = (
      <React.Fragment>
        <div className="ldx-grid">
          {visible.map(s=> <Widget key={s.id} schema={s} data={metrics[s.id]} />)}
        </div>
        {moreItems.length>0 && !showMore[pill] && (
          <button className="ldx-more" onClick={()=>setShowMore(s=>({ ...s, [pill]:true }))}>
            <span className="material-symbols-outlined">expand_more</span>Show {moreItems.length} more
          </button>
        )}
        <LeadTools ws={ws} lead={lead} />
      </React.Fragment>
    );
  }

  const freshComputed = (curPill.tier>=2) && computed.has(pill) && loading!==pill;

  return (
    <div className={'ldx-overlay' + (open?' open':'')} onClick={onClose}>
      <div className="ldx-outer" onClick={e=>e.stopPropagation()}>
        <div className={'ldx-card' + (scrolled?' compact':'')} data-screen-label="Lead details popover">

          <div className="ldx-head" style={{ '--hbg': HEALTH[h] }}>
            <div className="ldx-head-top">
              <span className="ldx-health-word"><span className="material-symbols-outlined">{h==='g'?'trending_up':h==='a'?'remove':'trending_down'}</span>{HEALTH_WORD[h]}</span>
              <button className="ldx-close" onClick={onClose} aria-label="Close"><span className="material-icons">close</span></button>
            </div>

            <div className="ldx-id">
              <span className="ldx-av" style={{ '--av': HEALTH[h] }}>{initials(lead.name)}</span>
              <div className="ldx-id-meta">
                <div className="ldx-name-row">
                  <span className="ldx-name">{lead.name}</span>
                  <span className="ldx-badge" style={{ '--bg': stage.dot }}><span className="material-symbols-outlined">{STAGE_ICON[lead.stage]}</span>{stage.label}</span>
                  <span className="ldx-badge" style={{ '--bg': TEMP[lead.temp].c }}><span className="material-symbols-outlined">{TEMP[lead.temp].ic}</span>{lead.temp}</span>
                </div>
                <div className="ldx-phone"><span className="material-symbols-outlined">call</span>{lead.phone}</div>
              </div>
            </div>

            {/* verdict band — the numbers ARE the headline */}
            <div className="ldx-verdict">
              <div className="ldx-vmain">
                <div className="ldx-vk"><span className="material-symbols-outlined">target</span>Win probability</div>
                <div className="ldx-vrow">
                  <span className="ldx-vnum">{lead.score}<span className="ldx-vpct">%</span></span>
                  {winDelta===0 ? (
                    <span className="ldx-vdelta flat"><span className="material-icons">remove</span>flat</span>
                  ) : (
                    <span className={'ldx-vdelta ' + (winDelta>0?'up':'down')}>
                      <span className="material-icons">{winDelta>0?'trending_up':'trending_down'}</span>{winDelta>0?'+':'−'}{Math.abs(winDelta)} pts
                    </span>
                  )}
                </div>
                <div className="ldx-vbar"><i style={{ width: lead.score+'%' }} /></div>
                <div className="ldx-vbar-cap">vs last week</div>
              </div>
              <div className="ldx-vside">
                <div className="ldx-vstat">
                  <div className="ldx-vk"><span className="material-symbols-outlined">account_balance_wallet</span>Pipeline value</div>
                  <div className="ldx-vval">{lead.value ? LH.fmtTL(lead.value) : '—'}</div>
                </div>
                <div className="ldx-vstat">
                  <div className="ldx-vk"><span className="material-symbols-outlined">diamond</span>Pipeline LTV</div>
                  <div className="ldx-vval">{lead.ltv ? LH.fmtTL(lead.ltv) : '—'}</div>
                </div>
                <div className="ldx-vstat">
                  <div className="ldx-vk"><span className="material-symbols-outlined">{sent.ic}</span>Sentiment</div>
                  <div className="ldx-vval sm">{sent.word}</div>
                </div>
              </div>
            </div>

            <div className="ldx-head-foot">
              <span className="ldx-pin"><span className="material-symbols-outlined">schedule</span>{Math.round(lead.last/1440) < 1 ? 'touched today' : Math.round(lead.last/1440)+'d since contact'}</span>
              {cd && <span className={'ldx-countdown lv-'+cdLevel}><span className="material-symbols-outlined">{cdLevel==='hot'?'priority_high':'hourglass_bottom'}</span>Cold-drop in {cd}</span>}
            </div>
          </div>

          <div className="ldx-pills">
            <SegPills pills={LP.PILLS} active={pill} onSelect={selectPill} />
          </div>

          <div className={'ldx-bodywrap' + (edges.top?' fade-top':'') + (edges.bottom?' fade-bottom':'')}>
            <div className="ldx-body" ref={bodyRef} onScroll={onBodyScroll}>
              <div className="ldx-scope">
                <span className="ldx-scope-lb">{curPill.tier===0?'Auto-computed signals':curPill.tier===1?'Behavioral logs':curPill.tier===2?'AI profiling':'Voice & NLP'}</span>
                <span className="ldx-scope-meta">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  {curPill.tier===0 ? 'AI · auto · updated 2h ago' : (freshComputed ? 'AI · just now' : 'AI')}
                </span>
                {freshComputed && (
                  <button className="ldx-recompute" onClick={()=>recompute(pill, 850)}><span className="material-symbols-outlined">refresh</span>Recompute</button>
                )}
              </div>
              {body}
            </div>
            <div className="ldx-edge top" aria-hidden="true" />
            <div className="ldx-edge bot" aria-hidden="true" />
          </div>

        </div>
      </div>
    </div>
  );
}

/* embedded lead-context AI tools — mini chatbot interface */

/* AI responses per tool (deterministic, lead-seeded) */
const TOOL_RESPONSES = {
  'Ghostwrite follow-up': l => `Hi ${l.name.split(' ')[0]}, I wanted to follow up on our last conversation. Based on your interest in the sea-view units you revisited last week, I've shortlisted three listings that match your exact criteria. Would you be free for a quick call this Tuesday between 11:00–13:00? I can walk you through them in 15 minutes.`,
  'Match listings': l => `Based on ${l.name.split(' ')[0]}'s behavior — 87% scroll depth on floor-plan pages, 3 return visits to sea-view listings — I recommend:\n• Sky Villa 4B (₺2.1M) — 94% match\n• Marina Residence 3A (₺1.85M) — 89% match\n• Horizon Penthouse (₺2.4M) — 81% match`,
  'Ghost-buyer check': l => `Buyer authenticity: ${l.score}%. Signals: fast reply via WhatsApp, consistent interest in 2-bedroom units, no generic inquiry patterns detected. No ghost-buyer flags — this lead shows genuine purchase intent.`,
  'Propensity score': l => `${l.name.split(' ')[0]} has a ${l.score}% propensity to convert within 30 days. Primary drivers: high engagement velocity, budget confidence, recent price-comparison behavior. Recommended next: schedule a call Tue 11:00–13:00.`,
  'Patient tone adaptor': l => `Tone profile: warm & collaborative. Avoid clinical language — lead with empathy, use "we" instead of "you should". Follow up within 48 hours with a personal message.`
};

function LeadTools({ ws, lead }){
  const tools = [
    { ic:'auto_awesome', t:'Ghostwrite follow-up', color:'#8B5CF6' },
    { ic:'travel_explore', t:'Match listings',      color:'#3B82F6' },
    { ic:'plagiarism',    t:'Ghost-buyer check',    color:'#F97316' },
    { ic:'insights',      t:'Propensity score',     color:'#10B981' },
  ];
  if (ws==='healthcare') tools.splice(1, 0, { ic:'sentiment_satisfied', t:'Patient tone adaptor', color:'#EAB308' });

  const [chatOpen, setChatOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [typed, setTyped] = useState('');
  const [activeTool, setActiveTool] = useState(null);
  const typeTimer = useRef(null);

  function openTool(tool){
    setActiveTool(tool); setChatOpen(true); setThinking(true); setTyped('');
    clearTimeout(typeTimer.current);
    setTimeout(()=>{
      setThinking(false);
      const fn = TOOL_RESPONSES[tool.t];
      const full = fn ? fn(lead||{name:'Lead',score:72}) : 'Analysis complete.';
      let i = 0;
      function step(){ setTyped(full.slice(0,++i)); if(i<full.length) typeTimer.current=setTimeout(step,11); }
      step();
    }, 1500);
  }
  useEffect(()=>()=>clearTimeout(typeTimer.current), []);

  return (
    <div className="ldx-tools">
      <div className="ldx-tools-t"><span className="material-symbols-outlined">smart_toy</span>Lead-context AI tools</div>
      {!chatOpen ? (
        <div className="ldx-tools-btns">
          {tools.map((t,i)=>(
            <button key={i} className="ldx-tool-card" style={{ '--tc': t.color }} onClick={()=>openTool(t)}>
              <span className="ldx-tool-card-ic"><span className="material-symbols-outlined">{t.ic}</span></span>
              <span className="ldx-tool-card-t">{t.t}</span>
              <span className="material-symbols-outlined ldx-tool-arrow">arrow_forward</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="ldx-chat">
          <div className="ldx-chat-head">
            <span className="ldx-chat-av" style={{ '--tc': activeTool?.color }}><span className="material-symbols-outlined">{activeTool?.ic}</span></span>
            <div className="ldx-chat-meta">
              <span className="ldx-chat-name">{activeTool?.t}</span>
              <span className="ldx-chat-status">{thinking?'Thinking…':'Done'}</span>
            </div>
            <button className="ldx-chat-x" onClick={()=>{setChatOpen(false);clearTimeout(typeTimer.current);}}><span className="material-icons">close</span></button>
          </div>
          <div className="ldx-chat-body">
            {thinking
              ? <div className="ldx-chat-dots"><span/><span/><span/></div>
              : <p className="ldx-chat-msg">{typed}<span className="ldx-chat-cursor"/></p>
            }
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── root + bridge from the vanilla table ─────────── */
function LeadRoot(){
  const [lead, setLead] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(()=>{
    window.__openLeadPopover = (l)=>{ setLead(l); setOpen(true); };
    window.__closeLeadPopover = ()=> setOpen(false);
    const onKey = e=>{ if (e.key==='Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, []);
  const close = ()=>{ setOpen(false); if (window.__ltOnLeadPopoverClosed) window.__ltOnLeadPopoverClosed(); };
  return <LeadDetailsPopover lead={lead} open={open} onClose={close} />;
}

ReactDOM.createRoot(document.getElementById('leadPopRoot')).render(<LeadRoot />);
