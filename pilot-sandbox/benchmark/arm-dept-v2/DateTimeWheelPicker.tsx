// DateTimeWheelPicker — iOS-inspired date + time wheel picker for Deha CRM.
// Render-safe, non-module harness build: no import/export, React is a global.
// Root component is DateTimeWheelPickerRoot; the global assignment lives at the
// very bottom. Zero useEffect. Scroll-settle uses committed-value reconciliation
// (bail when the landed index equals the committed index) so wheel snapping can
// never self-re-arm into a storm.

const { useState, useRef, useCallback, useMemo } = React;

// ---- Deterministic "today" (no clock reads, no randomness) --------------------
const TODAY = { y: 2026, m: 7, d: 4, hh: 14, mm: 30 };

const YEAR_MIN = 2023;
const YEAR_MAX = 2032;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ROW = 44; // px per wheel row
const PAD = ROW * 2; // top/bottom spacer so the center row snaps mid-viewport

function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function daysInMonth(m, y) {
  const table = [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return table[m - 1];
}
function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}
function weekdayLabel(y, m, d) {
  // Explicit y/m/d — deterministic, not a clock read.
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}
function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

// ---- One draggable, scroll-snapping wheel ------------------------------------
function DtwWheel({ items, initialIndex, onSettle, ariaLabel }) {
  const [selIdx, setSelIdx] = useState(initialIndex);
  const committedRef = useRef(initialIndex); // last reconciled index — the anchor
  const nodeRef = useRef(null);
  const timerRef = useRef(0);
  const rafRef = useRef(0);
  const cleanupRef = useRef(null);
  const dragRef = useRef({ active: false, lastV: 0 });

  // Committed-value reconciliation. A settle NEVER issues a scroll correction and
  // NEVER re-arms itself: it only reads the landed index. If that index equals the
  // committed anchor it bails immediately (no state write, no rAF). CSS mandatory
  // snap does the visual alignment, so there is nothing to storm on.
  const settle = useCallback(() => {
    const el = nodeRef.current;
    if (!el) return;
    const nearest = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW)));
    if (nearest === committedRef.current) return; // BAIL — converged
    committedRef.current = nearest;
    setSelIdx(nearest);
    onSettle(nearest, items[nearest].value);
  }, [items, onSettle]);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(settle, 110);
  }, [settle]);

  // Callback ref owns its listener lifecycle and returns cleanup via cleanupRef.
  const attach = useCallback(
    (node) => {
      if (node) {
        nodeRef.current = node;
        node.scrollTop = committedRef.current * ROW; // seed to committed row
        const onScroll = () => schedule();
        node.addEventListener('scroll', onScroll, { passive: true });
        cleanupRef.current = () => {
          node.removeEventListener('scroll', onScroll);
          if (timerRef.current) clearTimeout(timerRef.current);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
      } else if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
        nodeRef.current = null;
      }
    },
    [schedule]
  );

  // Mouse gets a hand-rolled drag + momentum; touch/trackpad use native snap.
  const onPointerDown = useCallback((e) => {
    if (e.pointerType !== 'mouse') return;
    const el = nodeRef.current;
    if (!el) return;
    dragRef.current.active = true;
    dragRef.current.lastV = 0;
    el.style.scrollSnapType = 'none';
    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {}
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    const el = nodeRef.current;
    if (!el) return;
    const dy = -e.movementY;
    el.scrollTop += dy;
    dragRef.current.lastV = dy;
  }, []);

  const onPointerUp = useCallback(
    (e) => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      const el = nodeRef.current;
      if (!el) return;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (reducedMotion()) {
        el.style.scrollSnapType = 'y mandatory';
        schedule();
        return;
      }
      let v = dragRef.current.lastV;
      let frames = 0;
      const decay = () => {
        frames += 1;
        el.scrollTop += v;
        v *= 0.93;
        if (Math.abs(v) > 0.5 && frames < 240) {
          rafRef.current = requestAnimationFrame(decay);
        } else {
          el.style.scrollSnapType = 'y mandatory'; // hand back to native snap
          schedule();
        }
      };
      rafRef.current = requestAnimationFrame(decay);
    },
    [schedule]
  );

  const onRowClick = useCallback(
    (i) => {
      const el = nodeRef.current;
      if (!el) return;
      el.scrollTo({ top: i * ROW, behavior: reducedMotion() ? 'auto' : 'smooth' });
      schedule();
    },
    [schedule]
  );

  return (
    <div className="dtw-wheel">
      <div className="dtw-band" aria-hidden="true" />
      <div
        className="dtw-scroll"
        ref={attach}
        role="listbox"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="dtw-pad" aria-hidden="true" />
        {items.map((it, i) => {
          const dist = Math.abs(i - selIdx);
          const scale = dist === 0 ? 1 : dist === 1 ? 0.92 : dist === 2 ? 0.84 : 0.78;
          const sel = i === selIdx;
          return (
            <button
              type="button"
              key={it.value}
              role="option"
              aria-selected={sel}
              className={sel ? 'dtw-row dtw-row--sel' : 'dtw-row'}
              style={{ transform: 'scale(' + scale + ')' }}
              onClick={() => onRowClick(i)}
            >
              {it.label}
            </button>
          );
        })}
        <div className="dtw-pad" aria-hidden="true" />
      </div>
    </div>
  );
}

// ---- Root ---------------------------------------------------------------------
function DateTimeWheelPickerRoot() {
  const [applied, setApplied] = useState(TODAY);
  const [draft, setDraft] = useState(TODAY);
  const [open, setOpen] = useState(true);
  const [nonce, setNonce] = useState(0); // bump to remount wheels to a new draft

  const monthItems = useMemo(() => MONTHS.map((label, i) => ({ value: i + 1, label })), []);
  const yearItems = useMemo(() => {
    const out = [];
    for (let y = YEAR_MIN; y <= YEAR_MAX; y += 1) out.push({ value: y, label: '' + y });
    return out;
  }, []);
  const hourItems = useMemo(() => {
    const out = [];
    for (let h = 0; h < 24; h += 1) out.push({ value: h, label: pad2(h) });
    return out;
  }, []);
  const minuteItems = useMemo(() => {
    const out = [];
    for (let m = 0; m < 60; m += 5) out.push({ value: m, label: pad2(m) });
    return out;
  }, []);
  const dayItems = useMemo(() => {
    const out = [];
    const max = daysInMonth(draft.m, draft.y);
    for (let d = 1; d <= max; d += 1) out.push({ value: d, label: '' + d });
    return out;
  }, [draft.m, draft.y]);

  // Stable settle handlers (functional updates → no changing deps → wheels that
  // shouldn't remount keep their scroll position across parent re-renders).
  const onDay = useCallback((_i, val) => setDraft((d) => ({ ...d, d: val })), []);
  const onMonth = useCallback(
    (_i, val) => setDraft((d) => ({ ...d, m: val, d: Math.min(d.d, daysInMonth(val, d.y)) })),
    []
  );
  const onYear = useCallback(
    (_i, val) => setDraft((d) => ({ ...d, y: val, d: Math.min(d.d, daysInMonth(d.m, val)) })),
    []
  );
  const onHour = useCallback((_i, val) => setDraft((d) => ({ ...d, hh: val })), []);
  const onMinute = useCallback((_i, val) => setDraft((d) => ({ ...d, mm: val })), []);

  const openSheet = useCallback(() => {
    setDraft(applied);
    setNonce((n) => n + 1);
    setOpen(true);
  }, [applied]);
  const cancel = useCallback(() => setOpen(false), []);
  const done = useCallback(() => {
    setDraft((d) => {
      setApplied(d);
      return d;
    });
    setOpen(false);
  }, []);
  const resetToday = useCallback(() => {
    setDraft(TODAY);
    setNonce((n) => n + 1);
  }, []);

  const appliedLine =
    weekdayLabel(applied.y, applied.m, applied.d) +
    ' ' +
    applied.d +
    ' ' +
    MONTHS[applied.m - 1] +
    ' ' +
    applied.y;
  const appliedTime = pad2(applied.hh) + ':' + pad2(applied.mm);
  const draftLine =
    weekdayLabel(draft.y, draft.m, draft.d) +
    ', ' +
    draft.d +
    ' ' +
    MONTHS[draft.m - 1] +
    ' ' +
    draft.y +
    ' · ' +
    pad2(draft.hh) +
    ':' +
    pad2(draft.mm);

  return (
    <div className="dtw-root">
      <style>{CSS}</style>

      <div className="dtw-stage">
        {/* App screen behind the sheet */}
        <div className="dtw-screen">
          <header className="dtw-appbar">
            <span className="material-symbols-outlined dtw-appicon" aria-hidden="true">
              event_available
            </span>
            <div className="dtw-apptitles">
              <h1 className="dtw-apptitle">New Appointment</h1>
              <p className="dtw-appsub">Property viewing</p>
            </div>
          </header>

          <div className="dtw-summary">
            <span className="dtw-summary-eyebrow">Scheduled for</span>
            <div className="dtw-summary-date">{appliedLine}</div>
            <div className="dtw-summary-timerow">
              <span className="material-symbols-outlined dtw-summary-clock" aria-hidden="true">
                schedule
              </span>
              <span className="dtw-summary-time">{appliedTime}</span>
              <span className="dtw-summary-chip">24h</span>
            </div>
          </div>

          <p className="dtw-hint">Confirm the slot with the client before saving.</p>

          <button type="button" className="dtw-open" onClick={openSheet}>
            <span className="material-symbols-outlined" aria-hidden="true">
              edit_calendar
            </span>
            Change date &amp; time
          </button>
        </div>

        {/* Scrim + bottom sheet */}
        <div
          className="dtw-scrim"
          data-open={open ? 'true' : 'false'}
          onClick={cancel}
          aria-hidden="true"
        />

        <div
          className="dtw-sheet"
          data-open={open ? 'true' : 'false'}
          role="dialog"
          aria-modal="true"
          aria-label="Pick date and time"
        >
          <div className="dtw-handle" aria-hidden="true" />

          <div className="dtw-sheet-head">
            <h2 className="dtw-sheet-title">Date &amp; time</h2>
            <p className="dtw-sheet-draft">{draftLine}</p>
          </div>

          <div className="dtw-section">
            <span className="dtw-section-label">Date</span>
            <div className="dtw-wheels dtw-wheels--date">
              <DtwWheel
                key={'day-' + draft.m + '-' + draft.y + '-' + nonce}
                items={dayItems}
                initialIndex={Math.min(draft.d, daysInMonth(draft.m, draft.y)) - 1}
                onSettle={onDay}
                ariaLabel="Day"
              />
              <DtwWheel
                key={'mon-' + nonce}
                items={monthItems}
                initialIndex={draft.m - 1}
                onSettle={onMonth}
                ariaLabel="Month"
              />
              <DtwWheel
                key={'yr-' + nonce}
                items={yearItems}
                initialIndex={draft.y - YEAR_MIN}
                onSettle={onYear}
                ariaLabel="Year"
              />
            </div>
          </div>

          <div className="dtw-section">
            <span className="dtw-section-label">Time</span>
            <div className="dtw-wheels dtw-wheels--time">
              <DtwWheel
                key={'hr-' + nonce}
                items={hourItems}
                initialIndex={draft.hh}
                onSettle={onHour}
                ariaLabel="Hour"
              />
              <span className="dtw-colon" aria-hidden="true">
                :
              </span>
              <DtwWheel
                key={'mn-' + nonce}
                items={minuteItems}
                initialIndex={Math.round(draft.mm / 5)}
                onSettle={onMinute}
                ariaLabel="Minute"
              />
            </div>
          </div>

          <div className="dtw-actions">
            <button
              type="button"
              className="dtw-btn dtw-btn--ghost dtw-btn--reset"
              onClick={resetToday}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                today
              </span>
              Today
            </button>
            <div className="dtw-actions-right">
              <button type="button" className="dtw-btn dtw-btn--ghost" onClick={cancel}>
                Cancel
              </button>
              <button type="button" className="dtw-btn dtw-btn--green" onClick={done}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  check
                </span>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Styles (single in-component <style>, oklch tokens, dark via class + media)
const CSS = `
.dtw-root{
  --dtw-accent:oklch(0.66 0.15 152);
  --dtw-accent-press:oklch(0.60 0.15 152);
  --dtw-accent-ink:oklch(0.99 0.02 152);
  --dtw-accent-soft:oklch(0.95 0.05 152);
  --dtw-bg:oklch(0.985 0.006 250);
  --dtw-sheet:oklch(0.995 0.003 250);
  --dtw-card:oklch(1 0 0);
  --dtw-text:oklch(0.27 0.02 255);
  --dtw-muted:oklch(0.55 0.02 255);
  --dtw-faint:oklch(0.72 0.015 255);
  --dtw-border:oklch(0.905 0.008 255);
  --dtw-band:oklch(0.955 0.007 255);
  --dtw-scrim:oklch(0.22 0.03 255 / 0.45);
  --dtw-shadow:
    0 1px 2px oklch(0.2 0.02 255 / 0.06),
    0 12px 28px -8px oklch(0.2 0.02 255 / 0.18),
    0 28px 60px -20px oklch(0.2 0.02 255 / 0.28);
  font-family:'Montserrat',system-ui,-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  display:flex; align-items:center; justify-content:center;
  min-height:100%; width:100%; padding:24px; box-sizing:border-box;
  background:
    radial-gradient(120% 80% at 50% -10%, oklch(0.93 0.03 152 / 0.35), transparent 60%),
    oklch(0.94 0.008 255);
}
html.dark .dtw-root,
.dtw-root.dtw-dark{
  --dtw-accent:oklch(0.73 0.15 152);
  --dtw-accent-press:oklch(0.67 0.15 152);
  --dtw-accent-ink:oklch(0.16 0.03 152);
  --dtw-accent-soft:oklch(0.33 0.06 152);
  --dtw-bg:oklch(0.185 0.01 255);
  --dtw-sheet:oklch(0.235 0.012 255);
  --dtw-card:oklch(0.27 0.012 255);
  --dtw-text:oklch(0.95 0.006 255);
  --dtw-muted:oklch(0.66 0.02 255);
  --dtw-faint:oklch(0.48 0.015 255);
  --dtw-border:oklch(0.33 0.012 255);
  --dtw-band:oklch(0.30 0.013 255);
  --dtw-scrim:oklch(0.06 0.01 255 / 0.62);
  --dtw-shadow:
    0 1px 2px oklch(0 0 0 / 0.4),
    0 16px 40px -10px oklch(0 0 0 / 0.55);
  background:
    radial-gradient(120% 80% at 50% -10%, oklch(0.3 0.05 152 / 0.4), transparent 60%),
    oklch(0.13 0.01 255);
}
@media (prefers-color-scheme: dark){
  .dtw-root:not(.dtw-light){
    --dtw-accent:oklch(0.73 0.15 152);
    --dtw-accent-press:oklch(0.67 0.15 152);
    --dtw-accent-ink:oklch(0.16 0.03 152);
    --dtw-accent-soft:oklch(0.33 0.06 152);
    --dtw-bg:oklch(0.185 0.01 255);
    --dtw-sheet:oklch(0.235 0.012 255);
    --dtw-card:oklch(0.27 0.012 255);
    --dtw-text:oklch(0.95 0.006 255);
    --dtw-muted:oklch(0.66 0.02 255);
    --dtw-faint:oklch(0.48 0.015 255);
    --dtw-border:oklch(0.33 0.012 255);
    --dtw-band:oklch(0.30 0.013 255);
    --dtw-scrim:oklch(0.06 0.01 255 / 0.62);
    --dtw-shadow:0 1px 2px oklch(0 0 0 / 0.4),0 16px 40px -10px oklch(0 0 0 / 0.55);
    background:
      radial-gradient(120% 80% at 50% -10%, oklch(0.3 0.05 152 / 0.4), transparent 60%),
      oklch(0.13 0.01 255);
  }
}

.dtw-root *{box-sizing:border-box;}
.dtw-root .material-symbols-outlined{
  font-family:'Material Symbols Outlined';
  font-weight:normal; font-style:normal; line-height:1;
  letter-spacing:normal; text-transform:none; white-space:nowrap;
  font-variation-settings:'opsz' 24;
}

.dtw-stage{
  position:relative; width:min(400px,100%); height:min(760px,86vh);
  background:var(--dtw-bg); border-radius:40px; overflow:hidden;
  box-shadow:var(--dtw-shadow);
  border:1px solid var(--dtw-border);
}

/* ---- App screen ---- */
.dtw-screen{ position:absolute; inset:0; padding:32px 24px; display:flex; flex-direction:column; gap:20px; }
.dtw-appbar{ display:flex; align-items:center; gap:12px; }
.dtw-appicon{ font-size:26px; color:var(--dtw-accent); }
.dtw-apptitles{ display:flex; flex-direction:column; gap:2px; }
.dtw-apptitle{ margin:0; font-size:20px; font-weight:700; letter-spacing:-0.4px; color:var(--dtw-text); }
.dtw-appsub{ margin:0; font-size:13px; font-weight:500; color:var(--dtw-muted); }

.dtw-summary{
  margin-top:4px; padding:20px; border-radius:24px;
  background:var(--dtw-card); border:1px solid var(--dtw-border);
  box-shadow:0 1px 2px oklch(0.2 0.02 255 / 0.05);
  display:flex; flex-direction:column; gap:8px;
}
.dtw-summary-eyebrow{ font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--dtw-faint); }
.dtw-summary-date{ font-size:24px; font-weight:800; letter-spacing:-0.6px; color:var(--dtw-text); font-variant-numeric:tabular-nums; }
.dtw-summary-timerow{ display:flex; align-items:center; gap:8px; }
.dtw-summary-clock{ font-size:20px; color:var(--dtw-accent); }
.dtw-summary-time{ font-size:22px; font-weight:700; letter-spacing:-0.3px; color:var(--dtw-text); font-variant-numeric:tabular-nums; }
.dtw-summary-chip{
  margin-left:2px; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700;
  color:var(--dtw-accent); background:var(--dtw-accent-soft); letter-spacing:0.3px;
}
.dtw-hint{ margin:0; font-size:13px; font-weight:500; line-height:1.5; color:var(--dtw-muted); text-wrap:balance; }

.dtw-open{
  margin-top:auto; width:100%; height:52px; border-radius:16px; cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-family:inherit; font-size:15px; font-weight:700; letter-spacing:-0.2px;
  color:var(--dtw-text); background:var(--dtw-card); border:1px solid var(--dtw-border);
  transition:transform .16s ease-out, background .16s ease-out;
}
.dtw-open .material-symbols-outlined{ font-size:20px; color:var(--dtw-accent); }
.dtw-open:hover{ background:var(--dtw-bg); }
.dtw-open:active{ transform:scale(0.97); }
.dtw-open:focus-visible{ outline:none; box-shadow:0 0 0 3px var(--dtw-accent-soft); }

/* ---- Scrim + sheet ---- */
.dtw-scrim{
  position:absolute; inset:0; background:var(--dtw-scrim);
  backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px);
  opacity:0; pointer-events:none; transition:opacity .24s ease-out;
}
.dtw-scrim[data-open="true"]{ opacity:1; pointer-events:auto; }

.dtw-sheet{
  position:absolute; left:0; right:0; bottom:0;
  background:var(--dtw-sheet);
  border-top-left-radius:28px; border-top-right-radius:28px;
  border-top:1px solid var(--dtw-border);
  padding:10px 20px calc(20px + env(safe-area-inset-bottom,0px));
  box-shadow:0 -10px 40px -12px oklch(0.2 0.02 255 / 0.35);
  transform:translateY(110%); transition:transform .3s cubic-bezier(.32,.72,0,1);
  display:flex; flex-direction:column; gap:14px;
}
.dtw-sheet[data-open="true"]{ transform:translateY(0); }

.dtw-handle{
  width:40px; height:5px; border-radius:999px; margin:2px auto 4px;
  background:var(--dtw-border);
}
.dtw-sheet-head{ display:flex; flex-direction:column; gap:3px; }
.dtw-sheet-title{ margin:0; font-size:18px; font-weight:800; letter-spacing:-0.4px; color:var(--dtw-text); }
.dtw-sheet-draft{ margin:0; font-size:13px; font-weight:600; color:var(--dtw-accent); font-variant-numeric:tabular-nums; letter-spacing:-0.2px; }

.dtw-section{ display:flex; flex-direction:column; gap:6px; }
.dtw-section-label{ font-size:11px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:var(--dtw-faint); }

.dtw-wheels{
  position:relative; display:flex; align-items:stretch;
  border-radius:18px; padding:0 6px;
  background:var(--dtw-bg); border:1px solid var(--dtw-border);
}
.dtw-wheels--date{ gap:2px; }
.dtw-wheels--time{ gap:0; justify-content:center; }
.dtw-wheels--date .dtw-wheel{ flex:1; }
.dtw-wheels--time .dtw-wheel{ width:96px; flex:none; }

.dtw-colon{
  align-self:center; font-size:24px; font-weight:800; color:var(--dtw-text);
  padding:0 2px; z-index:3; transform:translateY(-1px);
}

/* ---- Wheel ---- */
.dtw-wheel{ position:relative; height:${ROW * 5}px; }
.dtw-band{
  position:absolute; left:4px; right:4px; top:50%; height:${ROW}px;
  transform:translateY(-50%); border-radius:12px; z-index:1; pointer-events:none;
  background:var(--dtw-band);
  box-shadow:inset 0 0 0 1px oklch(0.66 0.15 152 / 0.16);
}
.dtw-scroll{
  position:relative; z-index:2; height:100%; overflow-y:scroll;
  scroll-snap-type:y mandatory; overscroll-behavior:contain;
  touch-action:pan-y; -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
  -webkit-mask-image:linear-gradient(180deg,transparent 0,oklch(0 0 0) 26%,oklch(0 0 0) 74%,transparent 100%);
  mask-image:linear-gradient(180deg,transparent 0,oklch(0 0 0) 26%,oklch(0 0 0) 74%,transparent 100%);
}
.dtw-scroll::-webkit-scrollbar{ display:none; }
.dtw-pad{ height:${PAD}px; flex:none; }
.dtw-row{
  display:flex; align-items:center; justify-content:center;
  height:${ROW}px; width:100%; flex:none; border:none; background:none; cursor:pointer;
  scroll-snap-align:center; scroll-snap-stop:always;
  font-family:inherit; font-size:19px; font-weight:600; letter-spacing:-0.3px;
  font-variant-numeric:tabular-nums; color:var(--dtw-muted);
  transition:color .18s ease-out, transform .18s ease-out;
}
.dtw-row--sel{ color:var(--dtw-accent); font-weight:800; }
.dtw-row:focus-visible{ outline:none; }
.dtw-wheel:focus-within .dtw-band{ box-shadow:inset 0 0 0 2px oklch(0.66 0.15 152 / 0.4); }

/* ---- Actions ---- */
.dtw-actions{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:2px; }
.dtw-actions-right{ display:flex; align-items:center; gap:8px; }
.dtw-btn{
  height:46px; padding:0 18px; border-radius:14px; cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  font-family:inherit; font-size:15px; font-weight:700; letter-spacing:-0.2px;
  transition:transform .16s ease-out, background .16s ease-out, box-shadow .16s ease-out;
}
.dtw-btn .material-symbols-outlined{ font-size:19px; }
.dtw-btn--ghost{ background:transparent; border:1px solid var(--dtw-border); color:var(--dtw-text); }
.dtw-btn--ghost:hover{ background:var(--dtw-bg); }
.dtw-btn--reset{ color:var(--dtw-muted); padding:0 14px; }
.dtw-btn--reset .material-symbols-outlined{ color:var(--dtw-accent); }
.dtw-btn--green{
  background:var(--dtw-accent); color:var(--dtw-accent-ink); border:none;
  box-shadow:0 4px 14px -4px oklch(0.66 0.15 152 / 0.5);
}
.dtw-btn--green:hover{ background:var(--dtw-accent-press); }
.dtw-btn:active{ transform:scale(0.96); }
.dtw-btn:focus-visible{ outline:none; box-shadow:0 0 0 3px var(--dtw-accent-soft); }

@media (prefers-reduced-motion: reduce){
  .dtw-sheet,.dtw-scrim,.dtw-btn,.dtw-open,.dtw-row{ transition:none !important; }
  .dtw-scroll{ scroll-behavior:auto; }
}
`;

// Assign to the global. Root component name deliberately differs from the global
// key to avoid infinite self-recursion in this non-module harness.
window.DateTimeWheelPicker = DateTimeWheelPickerRoot;
