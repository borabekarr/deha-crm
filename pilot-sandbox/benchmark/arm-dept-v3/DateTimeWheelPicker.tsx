// DateTimeWheelPicker — iOS-inspired date + time wheel picker for Deha CRM.
// Render-safe, no-bundler target: React is a global (18.3 UMD), no import/export,
// no useEffect. DOM listeners are wired through a stable callback ref that detaches
// on the null-call (React 18 convention). Scroll settling converges by committed-
// index reconciliation: the settle timer only READS the landed row and bails when
// it equals the committed lastIndex — it never issues a corrective scroll, so it
// can never re-arm itself. Every programmatic scroll (row click, Reset, day clamp)
// pre-sets lastIndex before moving, so the follow-up settle bails immediately.

const { useState, useRef, useCallback, useMemo } = React;

// ----- deterministic "today" (no clock reads, no Math.random) ----------------
const TODAY = { y: 2026, m: 7, d: 4, hh: 14, mm: 30 };

const YEAR_MIN = 2020;
const YEAR_MAX = 2035;
const YEARS: number[] = [];
for (let y = YEAR_MIN; y <= YEAR_MAX; y++) YEARS.push(y);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOURS: number[] = [];
for (let h = 0; h < 24; h++) HOURS.push(h);
const MINUTES: number[] = [];
for (let mi = 0; mi < 60; mi += 5) MINUTES.push(mi);

const ROW_H = 40;   // px per row
const VISIBLE = 5;  // rows shown (center is index 2)
const PAD = ((VISIBLE - 1) / 2) * ROW_H;

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function daysInMonth(y: number, m: number): number {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}
function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}
function formatSelection(v: { y: number; m: number; d: number; hh: number; mm: number }): string {
  const wd = WEEKDAYS[new Date(v.y, v.m - 1, v.d).getDay()];
  return wd + ', ' + v.d + ' ' + MONTHS[v.m - 1] + ' ' + v.y + '  ·  ' + pad2(v.hh) + ':' + pad2(v.mm);
}

// ----- inline icon set (one consistent stroke family, currentColor, not emoji;
//       material-symbols font cannot load offline, so stroke SVGs honor the
//       no-emoji / single-family intent while staying self-contained) ----------
type IconProps = { name: 'calendar' | 'clock' | 'check' | 'close' | 'today'; className?: string };
function Icon(props: IconProps) {
  const common = {
    width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const, className: props.className, 'aria-hidden': true,
  };
  if (props.name === 'calendar') {
    return (
      <svg {...common}>
        <rect x="3" y="4.5" width="18" height="16" rx="3" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    );
  }
  if (props.name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    );
  }
  if (props.name === 'check') {
    return (
      <svg {...common}>
        <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />
      </svg>
    );
  }
  if (props.name === 'today') {
    return (
      <svg {...common}>
        <path d="M20 11a8 8 0 1 0-2.3 5.6" />
        <path d="M20 5v5h-5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// ----- a single iOS wheel column ---------------------------------------------
// The container callback ref is STABLE (empty deps): it reads live props from a
// `latest` ref updated each render, attaches scroll + pointer listeners on the
// node-call, and removes them on the null-call. `selectedIndex` only drives
// styling of the centered row — it never triggers a scroll. Scrolls happen only
// via the imperative api (scrollToIndex) handed up to the parent.
type WheelItem = { key: string; label: string };
type WheelApi = { scrollToIndex: (i: number, notify: boolean) => void };
type WheelProps = {
  items: WheelItem[];
  initialIndex: number;
  selectedIndex: number;
  ariaLabel: string;
  wheelId: string;
  onSettle: (index: number) => void;
  registerApi: (api: WheelApi | null) => void;
  reducedMotion: boolean;
};

function Wheel(props: WheelProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const lastIndexRef = useRef<number>(props.initialIndex);
  const settleTimerRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const scrollHandlerRef = useRef<((e: Event) => void) | null>(null);
  const dragRef = useRef<{ active: boolean; startY: number; startTop: number; lastY: number; v: number }>(
    { active: false, startY: 0, startTop: 0, lastY: 0, v: 0 }
  );

  // live props snapshot (render-phase assignment; not an effect)
  const latest = useRef<WheelProps & { itemsLen: number }>(null as unknown as WheelProps & { itemsLen: number });
  latest.current = { ...props, itemsLen: props.items.length };

  const settle = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;
    const L = latest.current;
    let idx = Math.round(node.scrollTop / ROW_H);
    idx = Math.max(0, Math.min(L.itemsLen - 1, idx));
    if (idx === lastIndexRef.current) return; // committed-index reconciliation: BAIL, never re-arm
    lastIndexRef.current = idx;
    L.onSettle(idx);
  }, []);

  const armSettle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(settle, 110);
  }, [settle]);

  const scrollToIndex = useCallback((i: number, notify: boolean) => {
    const node = nodeRef.current;
    if (!node) return;
    const L = latest.current;
    const clamped = Math.max(0, Math.min(L.itemsLen - 1, i));
    lastIndexRef.current = clamped; // pre-set so the follow-up settle bails
    node.scrollTo({ top: clamped * ROW_H, behavior: L.reducedMotion ? 'auto' : 'smooth' });
    if (notify) L.onSettle(clamped);
  }, []);

  // stable attach/detach — everything read from refs
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      nodeRef.current = node;
      node.scrollTop = lastIndexRef.current * ROW_H; // direct set: fires one scroll -> settle -> bail

      const onScroll = () => { if (!dragRef.current.active) armSettle(); };
      scrollHandlerRef.current = onScroll;
      node.addEventListener('scroll', onScroll, { passive: true });

      const onPointerDown = (e: PointerEvent) => {
        const L = latest.current;
        const d = dragRef.current;
        d.active = true; d.startY = e.clientY; d.startTop = node.scrollTop; d.lastY = e.clientY; d.v = 0;
        node.style.scrollSnapType = 'none';
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        try { node.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
        void L;
      };
      const onPointerMove = (e: PointerEvent) => {
        const d = dragRef.current;
        if (!d.active) return;
        d.v = e.clientY - d.lastY;
        d.lastY = e.clientY;
        node.scrollTop = d.startTop - (e.clientY - d.startY);
      };
      const endDrag = (e: PointerEvent) => {
        const d = dragRef.current;
        if (!d.active) return;
        d.active = false;
        try { node.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
        const L = latest.current;
        if (L.reducedMotion) { node.style.scrollSnapType = ''; armSettle(); return; }
        let v = -d.v; // continue fling direction
        const decay = () => {
          v *= 0.94;
          node.scrollTop += v;
          if (Math.abs(v) > 0.5) { rafRef.current = requestAnimationFrame(decay); }
          else { node.style.scrollSnapType = ''; armSettle(); } // let snap engage, then reconcile
        };
        if (Math.abs(v) > 0.5) rafRef.current = requestAnimationFrame(decay);
        else { node.style.scrollSnapType = ''; armSettle(); }
      };
      node.addEventListener('pointerdown', onPointerDown);
      node.addEventListener('pointermove', onPointerMove);
      node.addEventListener('pointerup', endDrag);
      node.addEventListener('pointercancel', endDrag);
      (node as unknown as { __cleanup?: () => void }).__cleanup = () => {
        node.removeEventListener('pointerdown', onPointerDown);
        node.removeEventListener('pointermove', onPointerMove);
        node.removeEventListener('pointerup', endDrag);
        node.removeEventListener('pointercancel', endDrag);
      };

      latest.current.registerApi({ scrollToIndex });
    } else {
      const node = nodeRef.current;
      if (node) {
        if (scrollHandlerRef.current) node.removeEventListener('scroll', scrollHandlerRef.current);
        const c = (node as unknown as { __cleanup?: () => void }).__cleanup;
        if (c) c();
      }
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      latest.current.registerApi(null);
      nodeRef.current = null;
    }
  }, [armSettle, scrollToIndex]);

  const onRowClick = useCallback((i: number) => { scrollToIndex(i, true); }, [scrollToIndex]);

  return (
    <div className="dtw-wheel" role="listbox" aria-label={props.ariaLabel} tabIndex={0}>
      <div className="dtw-wheel-scroll" ref={containerRef}>
        <div style={{ height: PAD }} aria-hidden={true} />
        {props.items.map((it, i) => {
          const dist = Math.abs(i - props.selectedIndex);
          const isSel = i === props.selectedIndex;
          return (
            <button
              type="button"
              key={it.key}
              role="option"
              aria-selected={isSel}
              className={'dtw-row' + (isSel ? ' dtw-row-sel' : '')}
              data-dist={dist > 2 ? 3 : dist}
              onClick={() => onRowClick(i)}
            >
              {it.label}
            </button>
          );
        })}
        <div style={{ height: PAD }} aria-hidden={true} />
      </div>
    </div>
  );
}

// ----- root ------------------------------------------------------------------
function DateTimeWheelPickerRoot() {
  const [reducedMotion] = useState<boolean>(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [open, setOpen] = useState<boolean>(true);
  const [applied, setApplied] = useState<{ y: number; m: number; d: number; hh: number; mm: number } | null>(null);
  const [draft, setDraft] = useState<{ y: number; m: number; d: number; hh: number; mm: number }>({ ...TODAY });

  const draftRef = useRef(draft);
  draftRef.current = draft; // render-phase mirror for event-handler reads

  const apisRef = useRef<{ [k: string]: WheelApi }>({});
  const register = useCallback((key: string, api: WheelApi | null) => {
    if (api) apisRef.current[key] = api;
    else delete apisRef.current[key];
  }, []);

  const dayItems = useMemo<WheelItem[]>(() => {
    const dc = daysInMonth(draft.y, draft.m);
    const out: WheelItem[] = [];
    for (let d = 1; d <= dc; d++) out.push({ key: 'd' + d, label: '' + d });
    return out;
  }, [draft.y, draft.m]);

  const monthItems = useMemo<WheelItem[]>(() => MONTHS.map((mo, i) => ({ key: 'm' + i, label: mo })), []);
  const yearItems = useMemo<WheelItem[]>(() => YEARS.map((yr) => ({ key: 'y' + yr, label: '' + yr })), []);
  const hourItems = useMemo<WheelItem[]>(() => HOURS.map((h) => ({ key: 'h' + h, label: pad2(h) })), []);
  const minuteItems = useMemo<WheelItem[]>(() => MINUTES.map((mi) => ({ key: 'mi' + mi, label: pad2(mi) })), []);

  const handleSettle = useCallback((kind: string, idx: number) => {
    const prev = draftRef.current;
    const next = { ...prev };
    if (kind === 'year') next.y = YEARS[idx];
    else if (kind === 'month') next.m = idx + 1;
    else if (kind === 'day') next.d = idx + 1;
    else if (kind === 'hour') next.hh = HOURS[idx];
    else if (kind === 'minute') next.mm = MINUTES[idx];
    if (kind === 'year' || kind === 'month') {
      const dc = daysInMonth(next.y, next.m);
      if (next.d > dc) {
        next.d = dc;
        const api = apisRef.current.day;
        if (api) api.scrollToIndex(dc - 1, false);
      }
    }
    draftRef.current = next;
    setDraft(next);
  }, []);

  const onYear = useCallback((i: number) => handleSettle('year', i), [handleSettle]);
  const onMonth = useCallback((i: number) => handleSettle('month', i), [handleSettle]);
  const onDay = useCallback((i: number) => handleSettle('day', i), [handleSettle]);
  const onHour = useCallback((i: number) => handleSettle('hour', i), [handleSettle]);
  const onMinute = useCallback((i: number) => handleSettle('minute', i), [handleSettle]);

  const handleReset = useCallback(() => {
    const t = { ...TODAY };
    draftRef.current = t;
    setDraft(t);
    const a = apisRef.current;
    if (a.day) a.day.scrollToIndex(t.d - 1, false);
    if (a.month) a.month.scrollToIndex(t.m - 1, false);
    if (a.year) a.year.scrollToIndex(YEARS.indexOf(t.y), false);
    if (a.hour) a.hour.scrollToIndex(HOURS.indexOf(t.hh), false);
    if (a.minute) a.minute.scrollToIndex(MINUTES.indexOf(t.mm), false);
  }, []);

  const handleDone = useCallback(() => {
    setApplied({ ...draftRef.current });
    setOpen(false);
  }, []);

  const handleCancel = useCallback(() => { setOpen(false); }, []);

  const handleOpen = useCallback(() => {
    const base = draftRef.current;
    const src = applied ? applied : base;
    const seed = { ...src };
    draftRef.current = seed;
    setDraft(seed);
    setOpen(true);
  }, [applied]);

  const summaryText = applied ? formatSelection(applied) : 'No appointment set';

  return (
    <div className="dtw-root">
      <style>{CSS}</style>

      {/* mock app screen behind the sheet */}
      <div className="dtw-screen">
        <div className="dtw-screen-card">
          <div className="dtw-screen-eyebrow">Appointment</div>
          <div className="dtw-screen-head">Schedule a viewing</div>
          <p className="dtw-screen-sub">Pick a date and time for the property tour.</p>
          <div className={'dtw-summary' + (applied ? ' dtw-summary-set' : '')}>
            <span className="dtw-summary-ico"><Icon name="calendar" /></span>
            <span className="dtw-summary-text">{summaryText}</span>
          </div>
          <button type="button" className="dtw-btn-open" onClick={handleOpen}>
            <Icon name="clock" />
            <span>{applied ? 'Change date & time' : 'Set date & time'}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="dtw-overlay" role="presentation">
          <div className="dtw-backdrop" onClick={handleCancel} aria-hidden={true} />
          <section className="dtw-sheet" role="dialog" aria-modal="true" aria-label="Choose date and time">
            <div className="dtw-handle" aria-hidden={true} />

            <header className="dtw-sheet-head">
              <div className="dtw-sheet-titles">
                <h2 className="dtw-sheet-title">Date &amp; time</h2>
                <p className="dtw-sheet-live">{formatSelection(draft)}</p>
              </div>
              <button type="button" className="dtw-icon-btn" onClick={handleCancel} aria-label="Close">
                <Icon name="close" />
              </button>
            </header>

            {/* DATE group */}
            <div className="dtw-group">
              <div className="dtw-group-labels dtw-labels-date">
                <span>Day</span><span>Month</span><span>Year</span>
              </div>
              <div className="dtw-wheels dtw-wheels-date">
                <div className="dtw-band" aria-hidden={true} />
                <Wheel
                  items={dayItems} initialIndex={draft.d - 1} selectedIndex={draft.d - 1}
                  ariaLabel="Day" wheelId="day" onSettle={onDay}
                  registerApi={(a) => register('day', a)} reducedMotion={reducedMotion}
                />
                <Wheel
                  items={monthItems} initialIndex={draft.m - 1} selectedIndex={draft.m - 1}
                  ariaLabel="Month" wheelId="month" onSettle={onMonth}
                  registerApi={(a) => register('month', a)} reducedMotion={reducedMotion}
                />
                <Wheel
                  items={yearItems} initialIndex={YEARS.indexOf(draft.y)} selectedIndex={YEARS.indexOf(draft.y)}
                  ariaLabel="Year" wheelId="year" onSettle={onYear}
                  registerApi={(a) => register('year', a)} reducedMotion={reducedMotion}
                />
              </div>
            </div>

            {/* TIME group */}
            <div className="dtw-group">
              <div className="dtw-group-labels dtw-labels-time">
                <span>Hour</span><span>Minute</span>
              </div>
              <div className="dtw-wheels dtw-wheels-time">
                <div className="dtw-band" aria-hidden={true} />
                <Wheel
                  items={hourItems} initialIndex={HOURS.indexOf(draft.hh)} selectedIndex={HOURS.indexOf(draft.hh)}
                  ariaLabel="Hour" wheelId="hour" onSettle={onHour}
                  registerApi={(a) => register('hour', a)} reducedMotion={reducedMotion}
                />
                <div className="dtw-colon" aria-hidden={true}>:</div>
                <Wheel
                  items={minuteItems} initialIndex={MINUTES.indexOf(draft.mm)} selectedIndex={MINUTES.indexOf(draft.mm)}
                  ariaLabel="Minute" wheelId="minute" onSettle={onMinute}
                  registerApi={(a) => register('minute', a)} reducedMotion={reducedMotion}
                />
              </div>
            </div>

            <footer className="dtw-foot">
              <button type="button" className="dtw-btn-ghost" onClick={handleReset}>
                <Icon name="today" />
                <span>Today</span>
              </button>
              <div className="dtw-foot-right">
                <button type="button" className="dtw-btn-secondary" onClick={handleCancel}>Cancel</button>
                <button type="button" className="dtw-btn-primary" onClick={handleDone}>
                  <Icon name="check" />
                  <span>Done</span>
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

// ----- styles (single injected <style>, all tokens inlined as oklch / sanctioned
//       overlays; scoped under .dtw-root; dark via html.dark AND prefers-color) --
const CSS = `
.dtw-root{
  --brand:oklch(0.696 0.149 162.5);
  --brand-600:oklch(0.596 0.127 163.2);
  --brand-700:oklch(0.508 0.105 165.6);
  --brand-50:oklch(0.979 0.021 166.1);
  --fg1:oklch(0.208 0.04 265.8);
  --fg2:oklch(0.372 0.039 257.3);
  --fg3:oklch(0.554 0.041 257.4);
  --fg-inv:oklch(1 0 0);
  --app-bg:oklch(0.984 0.003 247.9);
  --card:rgba(255,255,255,0.70);
  --card-solid:oklch(0.984 0.003 247.9);
  --border-glass:rgba(255,255,255,0.60);
  --hairline:oklch(0.929 0.013 255.5);
  --recessed:oklch(0.968 0.007 247.9);
  --shadow-glass:0 4px 6px -1px rgba(0,0,0,0.10),0 2px 4px -1px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.4);
  --shadow-glass-sm:0 1px 2px 0 rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,0.40);
  --shadow-emerald:0 10px 30px -10px rgba(16,185,129,0.50);
  --shadow-recessed:inset 0 2px 4px 0 rgba(0,0,0,0.06);
  --font:'Montserrat',system-ui,-apple-system,'Segoe UI',sans-serif;
  position:fixed;inset:0;font-family:var(--font);color:var(--fg1);
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.dtw-root *{box-sizing:border-box;}

/* backdrop app screen */
.dtw-screen{position:absolute;inset:0;background:var(--app-bg);display:flex;align-items:center;justify-content:center;padding:24px;}
.dtw-screen-card{
  width:100%;max-width:380px;padding:24px;border-radius:20px;
  background:var(--card);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
  border:1px solid var(--border-glass);box-shadow:var(--shadow-glass);
}
.dtw-screen-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--brand-600);}
.dtw-screen-head{font-size:24px;font-weight:800;letter-spacing:-0.02em;margin-top:6px;color:var(--fg1);}
.dtw-screen-sub{font-size:14px;font-weight:500;color:var(--fg3);margin:6px 0 16px;line-height:1.45;}
.dtw-summary{
  display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;
  background:var(--recessed);border:1px solid var(--hairline);color:var(--fg3);
  font-size:13px;font-weight:600;box-shadow:var(--shadow-recessed);
}
.dtw-summary-set{color:var(--fg1);border-color:oklch(0.696 0.149 162.5 / 0.35);background:var(--brand-50);}
.dtw-summary-ico{display:inline-flex;color:var(--brand-600);}
.dtw-summary-text{font-variant-numeric:tabular-nums;letter-spacing:-0.01em;}
.dtw-btn-open{
  margin-top:16px;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:12px 20px;border-radius:16px;border:0;cursor:pointer;
  font-family:var(--font);font-size:14px;font-weight:800;color:var(--fg-inv);
  background:oklch(0.696 0.149 162.5);text-shadow:0 1px 2px rgba(0,0,0,0.18);
  box-shadow:var(--shadow-emerald),inset 0 1px 0 rgba(255,255,255,0.5),inset 0 -2px 0 rgba(0,0,0,0.22),inset 0 0 0 1px rgba(255,255,255,0.15);
  background-image:linear-gradient(to right,rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.07) 1px,transparent 1px);
  background-size:14px 14px;transition:filter 200ms cubic-bezier(.22,1,.36,1),transform 200ms;
}
.dtw-btn-open:hover{filter:brightness(1.05);}
.dtw-btn-open:active{transform:scale(0.96);}

/* overlay + sheet */
.dtw-overlay{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;z-index:10;}
.dtw-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);animation:dtw-fade 200ms ease-out;}
.dtw-sheet{
  position:relative;width:100%;max-width:440px;padding:8px 20px 20px;
  border-radius:24px 24px 0 0;
  background:var(--card);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
  border:1px solid var(--border-glass);border-bottom:0;
  box-shadow:var(--shadow-glass),0 -8px 40px -12px rgba(0,0,0,0.30);
  animation:dtw-rise 280ms cubic-bezier(.22,1,.36,1);
}
.dtw-handle{width:40px;height:5px;border-radius:9999px;background:oklch(0.869 0.02 252.9);margin:6px auto 10px;}
.dtw-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}
.dtw-sheet-titles{min-width:0;}
.dtw-sheet-title{font-size:20px;font-weight:800;letter-spacing:-0.02em;margin:0;color:var(--fg1);}
.dtw-sheet-live{font-size:13px;font-weight:600;color:var(--brand-600);margin:3px 0 0;font-variant-numeric:tabular-nums;letter-spacing:-0.01em;}
.dtw-icon-btn{
  flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;
  width:36px;height:36px;border-radius:12px;border:1px solid var(--hairline);
  background:var(--recessed);color:var(--fg2);cursor:pointer;transition:transform 150ms ease-out,filter 150ms ease-out;
}
.dtw-icon-btn:hover{filter:brightness(0.98);}
.dtw-icon-btn:active{transform:scale(0.94);}

/* wheel groups */
.dtw-group{margin-bottom:14px;}
.dtw-group-labels{display:grid;gap:0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--fg3);margin-bottom:6px;padding:0 4px;}
.dtw-labels-date{grid-template-columns:1fr 1.3fr 1.3fr;}
.dtw-labels-time{grid-template-columns:1fr 1fr;}
.dtw-group-labels span{text-align:center;}

.dtw-wheels{
  position:relative;display:flex;align-items:stretch;
  height:${VISIBLE * ROW_H}px;border-radius:16px;overflow:hidden;
  background:var(--recessed);border:1px solid var(--hairline);box-shadow:var(--shadow-recessed);
}
.dtw-wheels-date .dtw-wheel:nth-child(2){flex:1;}
.dtw-wheels-date .dtw-wheel:nth-child(3){flex:1.3;}
.dtw-wheels-date .dtw-wheel:nth-child(4){flex:1.3;}
.dtw-wheels-time .dtw-wheel{flex:1;}

/* centered selection band spanning the group */
.dtw-band{
  position:absolute;left:8px;right:8px;top:calc(50% - ${ROW_H / 2}px);height:${ROW_H}px;
  border-radius:12px;background:oklch(0.696 0.149 162.5 / 0.10);
  border:1px solid oklch(0.696 0.149 162.5 / 0.35);pointer-events:none;z-index:2;
}
.dtw-colon{display:flex;align-items:center;justify-content:center;width:14px;font-size:20px;font-weight:800;color:var(--fg2);z-index:3;}

.dtw-wheel{position:relative;flex:1;min-width:0;outline:none;}
.dtw-wheel:focus-visible{box-shadow:inset 0 0 0 2px oklch(0.696 0.149 162.5 / 0.35);border-radius:12px;}
.dtw-wheel-scroll{
  height:100%;overflow-y:scroll;scroll-snap-type:y mandatory;
  scrollbar-width:none;-ms-overflow-style:none;touch-action:pan-y;
  -webkit-mask-image:linear-gradient(to bottom,transparent,black 22%,black 78%,transparent);
  mask-image:linear-gradient(to bottom,transparent,black 22%,black 78%,transparent);
}
.dtw-wheel-scroll::-webkit-scrollbar{display:none;width:0;height:0;}
.dtw-row{
  display:flex;align-items:center;justify-content:center;height:${ROW_H}px;width:100%;
  scroll-snap-align:center;border:0;background:transparent;cursor:pointer;
  font-family:var(--font);font-size:19px;font-weight:600;color:var(--fg2);
  font-variant-numeric:tabular-nums;letter-spacing:-0.02em;
  transition:color 160ms ease-out,transform 160ms ease-out,opacity 160ms ease-out;
}
.dtw-row[data-dist="1"]{opacity:0.72;transform:scale(0.94);}
.dtw-row[data-dist="2"]{opacity:0.46;transform:scale(0.88);}
.dtw-row[data-dist="3"]{opacity:0.3;transform:scale(0.84);}
.dtw-row-sel{color:var(--brand-700);font-weight:800;transform:scale(1.04);opacity:1;}

/* footer */
.dtw-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px;}
.dtw-foot-right{display:flex;align-items:center;gap:10px;}
.dtw-btn-ghost{
  display:inline-flex;align-items:center;gap:6px;padding:10px 14px;border-radius:12px;
  border:1px solid var(--hairline);background:transparent;color:var(--fg2);cursor:pointer;
  font-family:var(--font);font-size:13px;font-weight:700;transition:transform 150ms ease-out,filter 150ms ease-out;
}
.dtw-btn-ghost:hover{filter:brightness(0.98);}
.dtw-btn-ghost:active{transform:scale(0.96);}
.dtw-btn-secondary{
  padding:12px 18px;border-radius:14px;border:1px solid var(--hairline);
  background:var(--recessed);color:var(--fg1);cursor:pointer;
  font-family:var(--font);font-size:14px;font-weight:700;transition:transform 150ms ease-out,filter 150ms ease-out;
}
.dtw-btn-secondary:hover{filter:brightness(0.98);}
.dtw-btn-secondary:active{transform:scale(0.96);}
.dtw-btn-primary{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;
  border-radius:16px;border:0;cursor:pointer;font-family:var(--font);font-size:14px;font-weight:800;
  color:var(--fg-inv);background:oklch(0.696 0.149 162.5);text-shadow:0 1px 2px rgba(0,0,0,0.18);
  box-shadow:var(--shadow-emerald),inset 0 1px 0 rgba(255,255,255,0.5),inset 0 -2px 0 rgba(0,0,0,0.22),inset 0 0 0 1px rgba(255,255,255,0.15);
  background-image:linear-gradient(to right,rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.07) 1px,transparent 1px);
  background-size:14px 14px;transition:filter 200ms cubic-bezier(.22,1,.36,1),transform 200ms;
}
.dtw-btn-primary:hover{filter:brightness(1.05);}
.dtw-btn-primary:active{transform:scale(0.96);}
.dtw-btn-open:focus-visible,.dtw-btn-primary:focus-visible,.dtw-btn-secondary:focus-visible,.dtw-btn-ghost:focus-visible,.dtw-icon-btn:focus-visible{
  outline:none;box-shadow:0 0 0 3px oklch(0.696 0.149 162.5 / 0.35);
}

@keyframes dtw-rise{from{transform:translateY(100%);}to{transform:translateY(0);}}
@keyframes dtw-fade{from{opacity:0;}to{opacity:1;}}

/* dark mode — both conventions */
html.dark .dtw-root{
  --fg1:oklch(0.968 0.007 247.9);
  --fg2:oklch(0.869 0.02 252.9);
  --fg3:oklch(0.711 0.035 256.8);
  --app-bg:oklch(0.208 0.04 265.8);
  --card:rgba(30,41,59,0.70);
  --card-solid:oklch(0.279 0.037 260);
  --border-glass:rgba(255,255,255,0.10);
  --hairline:oklch(0.372 0.039 257.3);
  --recessed:oklch(0.279 0.037 260);
  --brand-600:oklch(0.696 0.149 162.5);
  --brand-700:oklch(0.696 0.149 162.5);
  --brand-50:oklch(0.279 0.037 260);
  --shadow-glass:0 4px 6px -1px rgba(0,0,0,0.50),0 2px 4px -1px rgba(0,0,0,0.30),inset 0 1px 0 rgba(255,255,255,0.10);
  --shadow-glass-sm:0 1px 2px 0 rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,0.10);
}
html.dark .dtw-summary-set{background:var(--recessed);}
html.dark .dtw-handle{background:oklch(0.372 0.039 257.3);}
@media (prefers-color-scheme:dark){
  html:not(.light) .dtw-root{
    --fg1:oklch(0.968 0.007 247.9);
    --fg2:oklch(0.869 0.02 252.9);
    --fg3:oklch(0.711 0.035 256.8);
    --app-bg:oklch(0.208 0.04 265.8);
    --card:rgba(30,41,59,0.70);
    --card-solid:oklch(0.279 0.037 260);
    --border-glass:rgba(255,255,255,0.10);
    --hairline:oklch(0.372 0.039 257.3);
    --recessed:oklch(0.279 0.037 260);
    --brand-600:oklch(0.696 0.149 162.5);
    --brand-700:oklch(0.696 0.149 162.5);
    --brand-50:oklch(0.279 0.037 260);
    --shadow-glass:0 4px 6px -1px rgba(0,0,0,0.50),0 2px 4px -1px rgba(0,0,0,0.30),inset 0 1px 0 rgba(255,255,255,0.10);
  }
  html:not(.light) .dtw-summary-set{background:var(--recessed);}
  html:not(.light) .dtw-handle{background:oklch(0.372 0.039 257.3);}
}
@media (prefers-reduced-motion:reduce){
  .dtw-sheet,.dtw-backdrop{animation:none;}
  .dtw-row{transition:none;}
}
`;

// hand the root to the harness global (NOT named DateTimeWheelPicker — that would
// self-recurse in the non-module harness).
window.DateTimeWheelPicker = DateTimeWheelPickerRoot;
