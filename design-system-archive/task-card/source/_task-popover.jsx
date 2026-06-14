/* =========================================================================
   _task-popover.jsx — Task Details Popover (TASK-scope, schema-driven)
   Calendar/Kanban click → AI-derived operational metrics for ONE task.
   v5 (Bora): single-column decision list (one metric per row, hairline
   separators, Montserrat-Black headings, no per-card AI badge). Header is a
   dynamic health color (green/amber/red) carrying title + description +
   customer. An Active-alerts strip surfaces what needs action with inline
   CTAs; every metric gets a highlighted next-step tip; an action footer
   (Reschedule · Reassign · View deal) + interactive sub-steps make it a
   working tool, not a read-only report. The header owns the only countdown.
   ========================================================================= */
const { useState, useEffect, useRef } = React;

/* ─────────────────── METRIC SCHEMA (single source of truth) ─────────────────
   time_to_deadzone removed — the header already owns the live countdown. */
const METRIC_SCHEMA = [
  { id:'substeps', label:'Sub-Steps', icon:'donut_large', component:'SubSteps',
    workspaces:['real_estate','healthcare','law','general'] },
  { id:'reschedule', label:'Reschedules', icon:'restart_alt', component:'Reschedule',
    workspaces:['real_estate','healthcare','law','general'] },
  { id:'context_switch', label:'Focus Cost', icon:'psychology', component:'FocusCost',
    workspaces:['real_estate','healthcare','law','general'] },
  { id:'energy', label:'Effort', icon:'battery_charging_full', component:'Battery',
    workspaces:['real_estate','healthcare','law','general'] },
  { id:'ageing', label:'Column Ageing', icon:'ac_unit', component:'Ageing',
    workspaces:['real_estate','healthcare','law','general'] },
  { id:'sync_score', label:'Timing Fit', icon:'my_location', component:'SyncScore',
    workspaces:['real_estate','healthcare','law','general'] },
  { id:'revenue_velocity', label:'Revenue Velocity', icon:'bolt', component:'RevenueVelocity',
    workspaces:['real_estate','general'] },
  { id:'blockers', label:'Dependency Chain', icon:'account_tree', component:'Blockers',
    workspaces:['real_estate','healthcare','law','general'] },
  { id:'lifecycle', label:'Life-cycle', icon:'timeline', component:'Lifecycle',
    workspaces:['real_estate','healthcare','law','general'] },
];

/* per-metric accent — drives the icon tile + tip tint */
const TP_ACC = {
  substeps:'#10B981', reschedule:'#F97316', context_switch:'#EF4444', energy:'#EAB308',
  ageing:'#3B82F6', sync_score:'#10B981', revenue_velocity:'#10B981', blockers:'#6366F1', lifecycle:'#8B5CF6',
};
const HEALTH = { g:'#0F9D6B', a:'#D97A2B', r:'#DC2626' };

/* ─────────────────── helpers ─────────────────── */
const pad = (n) => String(n).padStart(2, '0');
function fmtShort(ms){
  ms = Math.max(0, ms); const t = Math.floor(ms/1000);
  const h = Math.floor(t/3600), m = Math.floor(t%3600/60), s = t%60;
  return h >= 1 ? `${h}h ${pad(m)}m` : `${m}m ${pad(s)}s`;
}
function useTween(target, dur){
  const [v, setV] = useState(0);
  useEffect(() => {
    const T = (typeof performance!=='undefined' ? performance.now() : Date.now());
    let id;
    const tick = () => {
      const now = (typeof performance!=='undefined' ? performance.now() : Date.now());
      const p = Math.min(1, (now - T)/(dur||760));
      setV(target * (1 - Math.pow(1-p, 3)));
      if (p < 1) id = setTimeout(tick, 16); else setV(target);
    };
    id = setTimeout(tick, 16);
    return () => clearTimeout(id);
  }, [target, dur]);
  return v;
}

/* ═════════════════════ WIDGET LIBRARY ═════════════════════ */

/* interactive checklist + donut — toggling a step updates the ring */
function SubSteps({ data }){
  const [steps, setSteps] = useState(data.steps);
  useEffect(()=> setSteps(data.steps), [data]);
  const done = steps.filter(s => s.done).length, total = steps.length;
  const pct = Math.round(done/total*100);
  const v = useTween(pct, 700);
  const toggle = i => setSteps(s => s.map((x,j)=> j===i ? { ...x, done:!x.done } : x));
  return (
    <div className="tp-donut-row">
      <span className="tp-donut" style={{ background:`conic-gradient(var(--brand-primary) ${v}%, var(--bg-chip) 0)` }}>
        <span className="tp-donut-mid"><b>{done}/{total}</b></span>
      </span>
      <ul className="tp-steps">
        {steps.map((s, i) => (
          <li key={i} className={s.done ? 'done' : ''}>
            <button className="tp-step-tog" onClick={()=>toggle(i)} aria-label={s.done?'Mark incomplete':'Mark complete'}>
              <span className="material-icons">{s.done ? 'check_circle' : 'radio_button_unchecked'}</span>
            </button>
            <span className="tp-step-t">{s.t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Reschedule({ data }){
  const dots = Math.max(data.count, 4);
  const tone = data.count>=3 ? '#EF4444' : data.count>=1 ? '#F97316' : '#10B981';
  return (
    <div className="tp-resched">
      <span className="tp-resched-n" style={{ color: tone }}>{data.count}×</span>
      <span className="tp-dots">
        {Array.from({ length: dots }).map((_, i) => <i key={i} className={i < data.count ? 'on' : ''} style={i<data.count?{background:tone}:null} />)}
      </span>
      <span className="tp-resched-cap">{data.count===0?'never pushed':data.count>=3?'looping':'pushed '+data.count+'×'}</span>
    </div>
  );
}

/* Focus Cost — plain, legible "N tasks competing today" (no broken bars) */
function FocusCost({ data }){
  const n = competeCount(data);
  const lv = ['Low','Medium','High'][data.level] || 'Medium';
  const tone = data.level>=2 ? '#EF4444' : data.level===1 ? '#EAB308' : '#10B981';
  return (
    <div className="tp-focus">
      <span className="tp-focus-n" style={{ color: tone }}>{n}</span>
      <div className="tp-focus-tx">
        <span className="tp-focus-main">{n===1?'task competes':'tasks compete'} for focus today</span>
        <span className="tp-focus-sub" style={{ color: tone }}>{lv} switching cost</span>
      </div>
    </div>
  );
}
function competeCount(data){
  const m = (data.note||'').match(/(\d+)\s+other tasks/);
  if (m) return +m[1];
  return ({ 0:1, 1:2, 2:4 })[data.level] != null ? ({ 0:1, 1:2, 2:4 })[data.level] : 2;
}

function Battery({ data }){
  return (
    <div className="tp-batt-row">
      <span className={'tp-batt p' + data.points}>
        {[0,1,2,3,4].map(i => <i key={i} className={i < data.points ? 'on' : ''} />)}
        <span className="tp-batt-nub" />
      </span>
      <span className="tp-batt-val">{data.points}/5 effort</span>
    </div>
  );
}

/* Column Ageing — static chip + mini meter (no false-affordance slider) */
function Ageing({ data, status }){
  const pct = Math.min(100, Math.round(data.days/data.span*100));
  const w = useTween(pct, 760);
  const tone = data.frozen ? '#3B82F6' : pct>75 ? '#EF4444' : '#10B981';
  return (
    <div className="tp-age">
      <div className="tp-age-chips">
        <span className="tp-age-chip" style={{ '--ac': tone }}>
          <span className="material-icons">{data.frozen ? 'ac_unit' : 'schedule'}</span>
          {data.frozen ? 'Frozen · ' : ''}{data.days}d{data.frozen ? '' : ' in column'}
        </span>
        <span className="tp-age-of">{data.days} of {data.span} days</span>
      </div>
      <div className="tp-age-meter"><i style={{ width: w + '%', background: tone }} /></div>
    </div>
  );
}

function SyncScore({ data }){
  const tone = data.pct>=80 ? '#10B981' : data.pct>=60 ? '#EAB308' : '#EF4444';
  /* build a time-slot table: the task's scheduled slot + flanking hours */
  const peakH = 11;  /* default peak hour — real impl would use task.time */
  const hours = [8,9,10,11,12,13,14,15,16,17,18,19];
  const fitFor = h => Math.max(12, Math.round(data.pct - Math.abs(h - peakH) * 11));
  const v = useTween(data.pct, 840);
  return (
    <div className="tp-sync">
      <div className="tp-sync-head">
        <b style={{ color: tone }}>{Math.round(v)}%</b>
        <span>placement fit · {data.note}</span>
      </div>
      <div className="tp-sync-table">
        {hours.map(h => {
          const fit = fitFor(h);
          const isPeak = h === peakH;
          const slotTone = fit>=75 ? '#10B981' : fit>=50 ? '#EAB308' : '#94A3B8';
          return (
            <div key={h} className={'tp-sync-row' + (isPeak ? ' peak' : '')}>
              <span className="tp-sync-hh">{String(h).padStart(2,'0')}:00</span>
              <div className="tp-sync-bar"><i style={{ width: fit+'%', background: slotTone }} /></div>
              <span className="tp-sync-pct" style={{ color: slotTone }}>{fit}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RevenueVelocity({ data }){
  const v = useTween(data.days, 780);
  return (
    <div className="tp-rev">
      <span className="tp-rev-pill"><span className="material-icons">trending_up</span>+{Math.round(v)} days</span>
      <span className="tp-rev-cap">pulls the linked deal close sooner</span>
    </div>
  );
}

/* Dependency chain — short labels so all nodes fit one row */
function Blockers({ data }){
  const ic = { done:'check_circle', active:'radio_button_checked', locked:'lock' };
  const tone = { done:'#10B981', active:'#3B82F6', locked:'#94A3B8' };
  const fullLabel = t => t;
  return (
    <div className="tp-chain-steps">
      {data.chain.map((b, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div className="tp-chain-conn"><span className="material-icons">arrow_downward</span></div>}
          <div className={'tp-chain-step ' + b.state}>
            <span className="tp-chain-step-ic" style={{ color: tone[b.state] }}><span className="material-icons">{ic[b.state]}</span></span>
            <span className="tp-chain-step-lbl">{fullLabel(b.t)}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function Lifecycle({ data }){
  const kindIcon = { base:'radio_button_checked', sai:'auto_awesome' };
  const kindColor = { base:'var(--acc, var(--brand-primary))', sai:'#8B5CF6' };
  return (
    <ul className="tp-life-bul">
      {data.events.map((e, i) => (
        <li key={i} className="tp-life-item">
          <span className="tp-life-item-ic" style={{ color: kindColor[e.kind||'base'] }}>
            <span className="material-icons">{kindIcon[e.kind||'base']||'radio_button_checked'}</span>
          </span>
          <div className="tp-life-item-tx">
            <span className="tp-life-item-lbl">{e.t}</span>
            <span className="tp-life-item-when">{e.w}{e.n ? <span className="tp-life-n"> · {e.n}</span> : ''}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const WIDGETS = { SubSteps, Reschedule, FocusCost, Battery, Ageing, SyncScore, RevenueVelocity, Blockers, Lifecycle };

/* highlighted next-step tip (+ optional inline CTA) per metric */
function tipFor(id, data, act){
  switch (id){
    case 'substeps': {
      const next = (data.steps.find(s=>!s.done)||{}).t;
      return next ? { t:<>Next: <b>{next}</b> — tick it off above to unblock the chain.</> } : { t:'All sub-steps done — ready to advance the stage.' };
    }
    case 'reschedule':
      return data.count>=3
        ? { t:'Rescheduled 3×+ — this is looping. Reassign or change the action type to break it.', cta:{ label:'Reassign', ic:'person_add', tone:'#F97316' } }
        : { t: data.note };
    case 'context_switch':
      return { t:`Fragments ${competeCount(data)} other tasks — block a focus slot before you start.`, cta:{ label:'Block focus time', ic:'event_busy', tone:'#EF4444' } };
    case 'energy':
      return { t: data.note };
    case 'ageing':
      return data.frozen
        ? { t:`Stuck ${data.days} days in “${data.statusLabel||'this column'}” — advance the stage or escalate today.`, cta:{ label:'Advance stage', ic:'arrow_forward', tone:'#3B82F6' } }
        : { t: data.note };
    case 'sync_score':
      return { t: data.note };
    case 'revenue_velocity':
      return data.days>0 ? { t:`Finish now to pull the linked deal close ${data.days} days forward.` } : { t:'No measurable deal-velocity impact for this task.' };
    case 'blockers': {
      const next = (data.chain.find(b=>b.state==='locked')||{}).t;
      return next ? { t:<>You're the active blocker — clearing this unlocks <b>{next}</b>.</> } : { t:'No downstream tasks are waiting on this one.' };
    }
    case 'lifecycle':
      return { t:'AI keeps this timeline current from the event log — watch for repeated reschedules.' };
    default:
      return data.note ? { t:data.note } : null;
  }
}

/* ─────────────────── skeleton (lazy AI tiers) ─────────────────── */
function WidgetSkeleton(){
  return (
    <div className="tp-skel">
      <span className="tp-skel-bar w60" />
      <span className="tp-skel-bar w90" />
      <span className="tp-skel-tag"><span className="material-icons">auto_awesome</span>computing…</span>
    </div>
  );
}

/* ─────────────────── metric row ─────────────────── */
function MetricCard({ schema, data, live, status, act }){
  const Body = WIDGETS[schema.component];
  const acc = TP_ACC[schema.id] || 'var(--brand-primary)';
  const tip = data ? tipFor(schema.id, data, act) : null;
  return (
    <div className="tp-w-shell" style={{ '--acc': acc }}>
    <section className="tp-w" style={{ '--acc': acc }}>
      <div className="tp-w-head">
        <span className="tp-w-ic"><span className="material-icons">{schema.icon}</span></span>
        <span className="tp-w-label">{schema.label}</span>
      </div>
      <Body data={data} live={live} status={status} />
      {tip && (
        <div className="tp-tip">
          <span className="material-icons">tips_and_updates</span>
          <span className="tp-tip-t">{tip.t}</span>
          {tip.cta && (
            <button className="tp-tip-cta" style={{ '--cc': tip.cta.tone }} onClick={()=>act(tip.cta.label)}>
              <span className="material-icons">{tip.cta.ic}</span>{tip.cta.label}
            </button>
          )}
        </div>
      )}
    </section>
    </div>
  );
}

/* active-alerts strip — what needs action today, each with an inline CTA */
function AlertsStrip({ alerts, act }){
  if (!alerts.length) return null;
  return (
    <div className="tp-alerts">
      <div className="tp-alerts-k"><span className="material-icons">warning</span>Active alerts · {alerts.length}</div>
      <div className="tp-alerts-list">
        {alerts.map((a,i)=>(
          <div key={i} className={'tp-alert ' + a.tone}>
            <span className="tp-alert-ic"><span className="material-icons">{a.ic}</span></span>
            <span className="tp-alert-t">{a.t}</span>
            <button className="tp-alert-cta" onClick={()=>act(a.cta)}>
              <span className="material-icons">{a.cta==='Reschedule'?'event_repeat':a.cta==='Reassign'?'person_add':a.cta==='Advance stage'?'arrow_upward':'bolt'}</span>{a.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════ POPOVER ═════════════════════ */
function TaskDetailsPopover({ task, open, onClose }){
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState(null);
  const deadlineRef = useRef(0);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (task) {
      deadlineRef.current = Date.now() + (task.metrics.time_to_deadzone.mins * 60000);
      setNow(Date.now());
    }
  }, [task]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const act = (label) => {
    setToast(label + ' — action queued');
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=> setToast(null), 2200);
  };

  if (!task) return <div className="tp-overlay" />;

  const ws = task.workspace;
  const remainingMs = Math.max(0, deadlineRef.current - now);
  const live = { remainingMs };
  const M = task.metrics;

  // alert state → dynamic header color + alerts strip
  const overdue = remainingMs < 3600000;
  const frozen = M.ageing && M.ageing.frozen;
  const loop = M.reschedule && M.reschedule.count >= 3;
  const highLoad = M.context_switch && M.context_switch.level >= 2;
  const alerts = [];
  if (overdue) alerts.push({ tone:'r', ic:'hourglass_bottom', t:`Critical in ${fmtShort(remainingMs)} — the slot releases after this.`, cta:'Reschedule' });
  if (frozen) alerts.push({ tone:'a', ic:'ac_unit', t:`Frozen ${M.ageing.days} days in “${task.status.label}”.`, cta:'Advance stage' });
  if (loop) alerts.push({ tone:'a', ic:'restart_alt', t:`Rescheduled ${M.reschedule.count}× — likely looping.`, cta:'Reassign' });
  if (highLoad) alerts.push({ tone:'a', ic:'psychology', t:`High focus cost — fragments ${competeCount(M.context_switch)} tasks today.`, cta:'Block time' });
  const tone = overdue ? 'r' : (alerts.length ? 'a' : 'g');

  const visible = METRIC_SCHEMA.filter(m => m.workspaces.includes(ws));
  // pass status label into ageing tip
  if (M.ageing) M.ageing.statusLabel = task.status.label;

  return (
    <div className={'tp-overlay' + (open ? ' open' : '')} onClick={onClose}>
      <div className="tp-outer" onClick={e => e.stopPropagation()}>
        <aside className="tp-card" data-comment-anchor="621670cd36-div" data-screen-label="Task details popover" style={{ '--ph': task.priority.color, '--sc': task.status.color }}>

          <div className="tp-head">
            <div className="tp-head-top">
              <div className="tp-htags">
                <span className="tp-pri-tag" style={{ '--tc': task.priority.color }}><span className="tp-pc-dot" />{task.priority.label}</span>
                <span className="tp-status" style={{ '--tc': task.status.color }}><span className="tp-pc-dot" />{task.status.label}</span>
                <span className={'tp-countdown' + (overdue ? ' urgent' : '')}>
                  <span className="material-icons">{overdue?'priority_high':'hourglass_bottom'}</span>{fmtShort(remainingMs)}
                </span>
              </div>
              <button className="tp-close" onClick={onClose} aria-label="Close"><span className="material-icons">close</span></button>
            </div>

            <div className="tp-head-title">{task.title}</div>
            {task.desc && <div className="tp-head-desc">{task.desc}</div>}

            <div className="tp-customer">
              <span className="tp-cust-av" style={{ background: task.entity.color }}>
                {/\s/.test(task.entity.init) || task.entity.init.length>3 ? <span className="material-icons">{task.entity.init}</span> : task.entity.init}
              </span>
              <div className="tp-cust-meta">
                <div className="tp-cust-k">{task.link === 'company' ? 'Related company' : 'Related customer'}</div>
                <div className="tp-cust-name">{task.entity.name}</div>
              </div>
              <div className="tp-cust-sub"><span className="material-icons" style={{fontSize:'13px',verticalAlign:'middle',marginRight:'4px',opacity:0.85}}>call</span>{task.entity.sub}</div>
            </div>
          </div>

          <div className="tp-body">
            <AlertsStrip alerts={alerts} act={act} />

            <div className="tp-scope">
              <span className="tp-scope-lb">Operational signals</span>
              <span className="tp-scope-meta">updated just now</span>
            </div>

            <div className="tp-list">
              {visible.map(m => (
                <MetricCard key={task.id + ':' + m.id} schema={m} data={M[m.id]} live={live} status={task.status} act={act} />
              ))}
            </div>

            <div className="tp-footer">
              <button className="tp-foot-btn" style={{'--fbtn':'#F97316'}} onClick={()=>act('Reschedule')}><span className="material-icons">event_repeat</span>Reschedule</button>
              <button className="tp-foot-btn" style={{'--fbtn':'#3B82F6'}} onClick={()=>act('Reassign')}><span className="material-icons">person_add</span>Reassign</button>
              <button className="tp-foot-btn primary" style={{'--fbtn':'#10B981'}} onClick={()=>act('Open deal')}><span className="material-icons">open_in_new</span>View deal</button>
            </div>
          </div>

          <div className={'tp-toast' + (toast ? ' show' : '')}><span className="material-icons">check_circle</span>{toast}</div>
        </aside>
      </div>
    </div>
  );
}

/* ─────────────────── root + bridge from vanilla cards ─────────────────── */
function Root(){
  const [task, setTask] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    window.__openTaskPopover = (t) => { setTask(t); setOpen(true); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <TaskDetailsPopover task={task} open={open} onClose={() => setOpen(false)} />;
}

ReactDOM.createRoot(document.getElementById('taskPopRoot')).render(<Root />);
