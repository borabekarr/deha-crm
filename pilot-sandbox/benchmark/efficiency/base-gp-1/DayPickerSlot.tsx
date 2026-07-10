/* ==========================================================================
   DayPickerSlot.tsx — Day Picker with Time Slots (Deha CRM booking)
   Self-contained, render-safe React 18.3 component. No imports/exports.
   React is a global (UMD). Assigned to window.DayPickerSlot at the bottom.
   ========================================================================== */

const { useState, useMemo, useCallback } = React;

/* ----- Deterministic seeded data (no clock, no Math.random) ------------- */

const CTX_MONTH = "March 2026";
const CTX_PLACE = "Riverside Apartments · Unit 14B";

// Fixed week: Mon Mar 9 → Sun Mar 15, 2026. "Today" seeded to Wed Mar 11.
const WEEK_DAYS = [
  { wd: "Mon", n: 9,  full: "Mon, Mar 9",  past: true  },
  { wd: "Tue", n: 10, full: "Tue, Mar 10", past: true  },
  { wd: "Wed", n: 11, full: "Wed, Mar 11", today: true },
  { wd: "Thu", n: 12, full: "Thu, Mar 12" },
  { wd: "Fri", n: 13, full: "Fri, Mar 13" },
  { wd: "Sat", n: 14, full: "Sat, Mar 14" },
  { wd: "Sun", n: 15, full: "Sun, Mar 15", closed: true }, // agency closed Sundays
];

// 09:00 → 17:30 in 30-min steps.
const SLOTS = (() => {
  const out = [];
  for (let h = 9; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out; // 09:00 ... 17:30 (18 slots)
})();

// Deterministic "booked" slots per day index — a fixed pseudo-pattern.
const BOOKED = {
  2: ["09:00", "09:30", "10:00", "11:00", "13:30", "16:00"],
  3: ["10:30", "12:00", "14:00", "14:30", "17:00"],
  4: ["09:00", "11:30", "13:00", "15:30", "16:30"],
  5: ["09:30", "10:00", "12:30", "15:00"],
  6: ["09:00", "09:30", "10:00", "10:30", "13:00", "13:30", "16:00", "16:30"],
};

function isDayPickable(d) {
  return !d.past && !d.closed;
}

// Adds 30 minutes to an "HH:MM" string (deterministic, no clock).
function addHalf(t) {
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m + 30;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/* ----- Slot Button ------------------------------------------------------ */

function SlotButton({ time, state, onPick }) {
  const cls =
    "dps-slot" +
    (state === "selected" ? " dps-slot--sel" : "") +
    (state === "booked" ? " dps-slot--booked" : "");
  return (
    <button
      type="button"
      className={cls}
      disabled={state === "booked"}
      aria-pressed={state === "selected"}
      onClick={state === "booked" ? undefined : () => onPick(time)}
    >
      <span className="dps-slot-time">{time}</span>
      {state === "booked" ? (
        <span className="material-symbols-outlined dps-slot-lock">lock</span>
      ) : null}
    </button>
  );
}

/* ----- Root ------------------------------------------------------------- */

function DayPickerSlotRoot() {
  // Default to Thursday Mar 12 (index 3) — first fully open day.
  const [dayIdx, setDayIdx] = useState(3);
  const [slot, setSlot] = useState(null);

  // Derive-during-render pattern: when the selected day changes, clear the
  // slot if it is no longer available on the new day (no useEffect).
  const [prevDay, setPrevDay] = useState(3);
  if (prevDay !== dayIdx) {
    setPrevDay(dayIdx);
    if (slot && (BOOKED[dayIdx] || []).indexOf(slot) !== -1) setSlot(null);
  }

  const selectDay = useCallback((i) => {
    const d = WEEK_DAYS[i];
    if (!isDayPickable(d)) return;
    setDayIdx(i);
  }, []);

  const pickSlot = useCallback((t) => setSlot(t), []);
  const clearSel = useCallback(() => setSlot(null), []);

  const booked = useMemo(() => BOOKED[dayIdx] || [], [dayIdx]);
  const day = WEEK_DAYS[dayIdx];

  const availableCount = SLOTS.length - booked.length;
  const canConfirm = slot != null;

  return (
    <div className="dps-scope">
      <style>{CSS}</style>

      <div className="dps-card" role="group" aria-label="Book a viewing">
        {/* Header */}
        <header className="dps-head">
          <div className="dps-head-txt">
            <h2 className="dps-title">Book a viewing</h2>
            <p className="dps-ctx">
              <span className="material-symbols-outlined dps-ctx-ic">apartment</span>
              <span className="dps-ctx-place">{CTX_PLACE}</span>
            </p>
          </div>
          <div className="dps-month">
            <span className="material-symbols-outlined dps-month-ic">calendar_month</span>
            <span>{CTX_MONTH}</span>
          </div>
        </header>

        {/* Day strip */}
        <div className="dps-strip" role="listbox" aria-label="Choose a day">
          {WEEK_DAYS.map((d, i) => {
            const pickable = isDayPickable(d);
            const selected = i === dayIdx;
            const cls =
              "dps-day" +
              (selected ? " dps-day--sel" : "") +
              (!pickable ? " dps-day--off" : "") +
              (d.today ? " dps-day--today" : "");
            return (
              <button
                type="button"
                key={d.n}
                className={cls}
                role="option"
                aria-selected={selected}
                aria-disabled={!pickable}
                disabled={!pickable}
                onClick={() => selectDay(i)}
              >
                <span className="dps-day-wd">{d.wd}</span>
                <span className="dps-day-n">{d.n}</span>
                {d.today ? <span className="dps-day-dot" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>

        {/* Slot section header */}
        <div className="dps-slots-head">
          <span className="dps-slots-label">
            <span className="material-symbols-outlined dps-slots-ic">schedule</span>
            Available times
          </span>
          <span className="dps-slots-count">
            <b>{availableCount}</b> open · {day.wd}
          </span>
        </div>

        {/* Slot grid */}
        <div className="dps-grid" role="listbox" aria-label={`Time slots for ${day.full}`}>
          {SLOTS.map((t) => {
            const state =
              booked.indexOf(t) !== -1
                ? "booked"
                : slot === t
                ? "selected"
                : "open";
            return <SlotButton key={t} time={t} state={state} onPick={pickSlot} />;
          })}
        </div>

        {/* Footer */}
        <footer className="dps-foot">
          <div className="dps-summary" aria-live="polite">
            {canConfirm ? (
              <>
                <span className="dps-sum-ic-wrap">
                  <span className="material-symbols-outlined dps-sum-ic">event_available</span>
                </span>
                <span className="dps-sum-txt">
                  <span className="dps-sum-day">{day.full}</span>
                  <span className="dps-sum-slot">{slot}–{addHalf(slot)}</span>
                </span>
              </>
            ) : (
              <>
                <span className="dps-sum-ic-wrap dps-sum-ic-wrap--muted">
                  <span className="material-symbols-outlined dps-sum-ic">touch_app</span>
                </span>
                <span className="dps-sum-txt">
                  <span className="dps-sum-day">{day.full}</span>
                  <span className="dps-sum-slot dps-sum-slot--muted">Pick a time slot</span>
                </span>
              </>
            )}
          </div>

          <div className="dps-actions">
            <button
              type="button"
              className="dps-btn-ghost"
              onClick={clearSel}
              disabled={!canConfirm}
            >
              Clear
            </button>
            <button
              type="button"
              className="dps-btn-primary"
              disabled={!canConfirm}
            >
              <span className="material-symbols-outlined dps-btn-ic">check_circle</span>
              Confirm booking
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ----- Styles (rendered once via <style>) ------------------------------- */

const CSS = `
.dps-scope{
  --dps-font:'Montserrat',system-ui,-apple-system,sans-serif;

  --dps-accent: oklch(0.70 0.15 155);
  --dps-accent-strong: oklch(0.62 0.16 155);
  --dps-accent-soft: oklch(0.95 0.045 155);
  --dps-accent-ring: oklch(0.70 0.15 155 / 0.35);

  --dps-ink: oklch(0.27 0.028 260);
  --dps-ink-2: oklch(0.50 0.022 260);
  --dps-ink-3: oklch(0.63 0.020 260);

  --dps-surface: oklch(0.995 0.004 250);
  --dps-panel: oklch(0.975 0.006 255);
  --dps-hair: oklch(0.90 0.010 260);
  --dps-hair-soft: oklch(0.93 0.008 260);
  --dps-shadow-1: oklch(0.45 0.05 260 / 0.10);
  --dps-shadow-2: oklch(0.45 0.05 260 / 0.06);

  font-family: var(--dps-font);
  display:flex; justify-content:center; align-items:flex-start;
  padding: 28px 20px;
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
  color: var(--dps-ink);
}
.dps-scope *{ box-sizing:border-box; }
.dps-scope .material-symbols-outlined{
  font-family:'Material Symbols Outlined';
  font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
  line-height:1; display:block; user-select:none;
}

.dps-card{
  width: 100%; max-width: 440px;
  background: var(--dps-surface);
  border-radius: 24px;
  padding: 22px;
  box-shadow:
    0 1px 0 oklch(1 0 0 / 0.9) inset,
    0 0 0 1px var(--dps-hair),
    0 18px 44px -20px var(--dps-shadow-1),
    0 6px 16px -10px var(--dps-shadow-2);
}

/* ── Header ─────────────────────────────────────────────── */
.dps-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.dps-title{
  margin:0; font-size: 20px; font-weight: 800; letter-spacing:-0.4px;
  color: var(--dps-ink);
}
.dps-ctx{
  margin: 5px 0 0; display:flex; align-items:center; gap:6px;
  font-size: 12.5px; font-weight: 600; color: var(--dps-ink-2);
}
.dps-ctx-ic{ font-size:16px; color: var(--dps-accent-strong); }
.dps-ctx-place{ letter-spacing:-0.1px; }
.dps-month{
  display:inline-flex; align-items:center; gap:6px; flex-shrink:0;
  padding: 6px 11px; border-radius: 999px;
  background: var(--dps-panel);
  box-shadow: inset 0 0 0 1px var(--dps-hair-soft);
  font-size: 12px; font-weight: 700; letter-spacing:-0.2px; color: var(--dps-ink-2);
}
.dps-month-ic{ font-size:16px; color: var(--dps-ink-3); }

/* ── Day strip ──────────────────────────────────────────── */
.dps-strip{
  display:grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
  margin-top: 18px;
}
.dps-day{
  position:relative; appearance:none; cursor:pointer;
  display:flex; flex-direction:column; align-items:center; gap:3px;
  padding: 9px 0 10px; min-height: 58px;
  border:none; border-radius: 14px;
  background: var(--dps-panel);
  box-shadow: inset 0 0 0 1px var(--dps-hair-soft);
  font-family: var(--dps-font);
  transition: transform 160ms cubic-bezier(.22,1,.36,1),
              box-shadow 180ms ease-out, background 180ms ease-out;
}
.dps-day-wd{
  font-size: 10.5px; font-weight:700; letter-spacing: 0.4px; text-transform:uppercase;
  color: var(--dps-ink-3);
}
.dps-day-n{
  font-size: 17px; font-weight: 800; letter-spacing:-0.4px;
  font-variant-numeric: tabular-nums; color: var(--dps-ink);
}
.dps-day-dot{
  position:absolute; bottom: 6px; width: 4px; height:4px; border-radius:50%;
  background: var(--dps-accent-strong);
}
.dps-day:hover:not(:disabled){
  transform: translateY(-2px);
  box-shadow: inset 0 0 0 1px var(--dps-hair), 0 8px 16px -10px var(--dps-shadow-1);
}
.dps-day:active:not(:disabled){ transform: scale(0.96); }
.dps-day:focus-visible{ outline:none; box-shadow: 0 0 0 3px var(--dps-accent-ring); }

.dps-day--today .dps-day-wd{ color: var(--dps-accent-strong); }

.dps-day--sel{
  background: linear-gradient(180deg, var(--dps-accent), var(--dps-accent-strong));
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.28),
    0 8px 18px -8px var(--dps-accent-ring),
    0 2px 5px -2px var(--dps-accent-ring);
}
.dps-day--sel .dps-day-wd,
.dps-day--sel .dps-day-n{ color:#fff; }
.dps-day--sel .dps-day-dot{ background:#fff; }
.dps-day--sel:hover{ transform: translateY(-2px); }

.dps-day--off{
  cursor:not-allowed; background: transparent;
  box-shadow: inset 0 0 0 1px var(--dps-hair-soft);
}
.dps-day--off .dps-day-wd{ color: var(--dps-ink-3); opacity:0.6; }
.dps-day--off .dps-day-n{
  color: var(--dps-ink-3); opacity:0.5; text-decoration: line-through;
  text-decoration-thickness: 1.5px;
}

/* ── Slots header ───────────────────────────────────────── */
.dps-slots-head{
  display:flex; align-items:center; justify-content:space-between;
  margin: 20px 2px 11px;
}
.dps-slots-label{
  display:inline-flex; align-items:center; gap:7px;
  font-size: 13px; font-weight: 700; letter-spacing:-0.2px; color: var(--dps-ink);
}
.dps-slots-ic{ font-size:17px; color: var(--dps-accent-strong); }
.dps-slots-count{
  font-size: 11.5px; font-weight: 600; color: var(--dps-ink-3);
  font-variant-numeric: tabular-nums;
}
.dps-slots-count b{ color: var(--dps-accent-strong); font-weight:800; }

/* ── Slot grid ──────────────────────────────────────────── */
.dps-grid{
  display:grid; grid-template-columns: repeat(4, 1fr); gap: 7px;
}
.dps-slot{
  position:relative; appearance:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  min-height: 44px; padding: 0 4px;
  border:none; border-radius: 12px;
  background: var(--dps-panel);
  box-shadow: inset 0 0 0 1px var(--dps-hair-soft);
  font-family: var(--dps-font);
  transition: transform 150ms cubic-bezier(.22,1,.36,1),
              box-shadow 170ms ease-out, background 170ms ease-out;
}
.dps-slot-time{
  font-size: 13px; font-weight: 700; letter-spacing:-0.3px;
  font-variant-numeric: tabular-nums; color: var(--dps-ink);
}
.dps-slot:hover:not(:disabled){
  transform: translateY(-1px);
  background: var(--dps-surface);
  box-shadow: inset 0 0 0 1px var(--dps-accent), 0 6px 14px -9px var(--dps-accent-ring);
}
.dps-slot:hover:not(:disabled) .dps-slot-time{ color: var(--dps-accent-strong); }
.dps-slot:active:not(:disabled){ transform: scale(0.95); }
.dps-slot:focus-visible{ outline:none; box-shadow: 0 0 0 3px var(--dps-accent-ring); }

.dps-slot--sel{
  background: linear-gradient(180deg, var(--dps-accent), var(--dps-accent-strong));
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.28),
    0 8px 18px -8px var(--dps-accent-ring);
}
.dps-slot--sel .dps-slot-time{ color:#fff; }
.dps-slot--sel:hover{ background: linear-gradient(180deg, var(--dps-accent), var(--dps-accent-strong)); }
.dps-slot--sel:hover .dps-slot-time{ color:#fff; }

.dps-slot--booked{
  cursor:not-allowed; background: transparent;
  box-shadow: inset 0 0 0 1px var(--dps-hair-soft);
}
.dps-slot--booked .dps-slot-time{
  color: var(--dps-ink-3); opacity:0.55; text-decoration: line-through;
  text-decoration-thickness: 1.5px;
}
.dps-slot-lock{
  position:absolute; top:5px; right:6px; font-size:11px; color: var(--dps-ink-3); opacity:0.5;
}

/* ── Footer ─────────────────────────────────────────────── */
.dps-foot{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  margin-top: 20px; padding-top: 18px;
  border-top: 1px solid var(--dps-hair-soft);
}
.dps-summary{ display:flex; align-items:center; gap:10px; min-width:0; }
.dps-sum-ic-wrap{
  flex-shrink:0; width: 38px; height:38px; border-radius: 12px;
  display:grid; place-items:center;
  background: var(--dps-accent-soft);
  box-shadow: inset 0 0 0 1px oklch(0.70 0.15 155 / 0.20);
}
.dps-sum-ic-wrap--muted{
  background: var(--dps-panel);
  box-shadow: inset 0 0 0 1px var(--dps-hair-soft);
}
.dps-sum-ic{ font-size:20px; color: var(--dps-accent-strong); }
.dps-sum-ic-wrap--muted .dps-sum-ic{ color: var(--dps-ink-3); }
.dps-sum-txt{ display:flex; flex-direction:column; min-width:0; }
.dps-sum-day{
  font-size: 11px; font-weight:700; letter-spacing: 0.1px; text-transform:uppercase;
  color: var(--dps-ink-3);
}
.dps-sum-slot{
  font-size: 15px; font-weight: 800; letter-spacing:-0.4px;
  font-variant-numeric: tabular-nums; color: var(--dps-ink);
}
.dps-sum-slot--muted{ color: var(--dps-ink-3); font-weight:700; letter-spacing:-0.2px; }

.dps-actions{ display:flex; align-items:center; gap:8px; flex-shrink:0; }
.dps-btn-ghost{
  appearance:none; cursor:pointer; border:none;
  padding: 10px 12px; border-radius: 11px;
  background: transparent; color: var(--dps-ink-2);
  font-family: var(--dps-font); font-size: 12.5px; font-weight:700; letter-spacing:-0.1px;
  transition: background 160ms ease-out, color 160ms ease-out, opacity 160ms ease-out;
}
.dps-btn-ghost:hover:not(:disabled){ background: var(--dps-panel); color: var(--dps-ink); }
.dps-btn-ghost:focus-visible{ outline:none; box-shadow: 0 0 0 3px var(--dps-accent-ring); }
.dps-btn-ghost:disabled{ opacity:0.35; cursor:not-allowed; }

.dps-btn-primary{
  appearance:none; cursor:pointer; border:none;
  display:inline-flex; align-items:center; gap:7px;
  padding: 0 16px; min-height: 44px; border-radius: 13px;
  background: linear-gradient(180deg, var(--dps-accent), var(--dps-accent-strong));
  color:#fff; font-family: var(--dps-font);
  font-size: 13.5px; font-weight: 800; letter-spacing:-0.2px;
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.30),
    0 10px 22px -10px var(--dps-accent-ring),
    0 3px 8px -4px var(--dps-accent-ring);
  transition: transform 150ms cubic-bezier(.22,1,.36,1),
              box-shadow 180ms ease-out, filter 180ms ease-out;
}
.dps-btn-ic{ font-size:18px; }
.dps-btn-primary:hover:not(:disabled){ transform: translateY(-1px); filter: brightness(1.04); }
.dps-btn-primary:active:not(:disabled){ transform: scale(0.96); }
.dps-btn-primary:focus-visible{ outline:none; box-shadow: 0 0 0 3px var(--dps-accent-ring), inset 0 1px 0 oklch(1 0 0 / 0.30); }
.dps-btn-primary:disabled{
  cursor:not-allowed; filter: none;
  background: var(--dps-panel); color: var(--dps-ink-3);
  box-shadow: inset 0 0 0 1px var(--dps-hair-soft);
}

/* ── Dark mode (class + media) ──────────────────────────── */
html.dark .dps-scope,
:root.dark .dps-scope{
  --dps-accent: oklch(0.74 0.15 158);
  --dps-accent-strong: oklch(0.68 0.16 158);
  --dps-accent-soft: oklch(0.32 0.06 158);
  --dps-accent-ring: oklch(0.74 0.15 158 / 0.40);

  --dps-ink: oklch(0.95 0.010 260);
  --dps-ink-2: oklch(0.76 0.016 260);
  --dps-ink-3: oklch(0.62 0.018 260);

  --dps-surface: oklch(0.255 0.014 265);
  --dps-panel: oklch(0.305 0.016 265);
  --dps-hair: oklch(0.40 0.018 265);
  --dps-hair-soft: oklch(0.36 0.016 265);
  --dps-shadow-1: oklch(0 0 0 / 0.55);
  --dps-shadow-2: oklch(0 0 0 / 0.40);
}
html.dark .dps-card,
:root.dark .dps-card{
  box-shadow:
    0 1px 0 oklch(1 0 0 / 0.05) inset,
    0 0 0 1px var(--dps-hair),
    0 22px 48px -22px var(--dps-shadow-1),
    0 8px 18px -12px var(--dps-shadow-2);
}
html.dark .dps-day--sel .dps-day-n,
html.dark .dps-day--sel .dps-day-wd,
html.dark .dps-slot--sel .dps-slot-time,
html.dark .dps-btn-primary,
:root.dark .dps-day--sel .dps-day-n,
:root.dark .dps-day--sel .dps-day-wd,
:root.dark .dps-slot--sel .dps-slot-time,
:root.dark .dps-btn-primary{ color: oklch(0.16 0.02 265); }

@media (prefers-color-scheme: dark){
  .dps-scope{
    --dps-accent: oklch(0.74 0.15 158);
    --dps-accent-strong: oklch(0.68 0.16 158);
    --dps-accent-soft: oklch(0.32 0.06 158);
    --dps-accent-ring: oklch(0.74 0.15 158 / 0.40);

    --dps-ink: oklch(0.95 0.010 260);
    --dps-ink-2: oklch(0.76 0.016 260);
    --dps-ink-3: oklch(0.62 0.018 260);

    --dps-surface: oklch(0.255 0.014 265);
    --dps-panel: oklch(0.305 0.016 265);
    --dps-hair: oklch(0.40 0.018 265);
    --dps-hair-soft: oklch(0.36 0.016 265);
    --dps-shadow-1: oklch(0 0 0 / 0.55);
    --dps-shadow-2: oklch(0 0 0 / 0.40);
  }
  .dps-card{
    box-shadow:
      0 1px 0 oklch(1 0 0 / 0.05) inset,
      0 0 0 1px var(--dps-hair),
      0 22px 48px -22px var(--dps-shadow-1),
      0 8px 18px -12px var(--dps-shadow-2);
  }
  .dps-day--sel .dps-day-n,
  .dps-day--sel .dps-day-wd,
  .dps-slot--sel .dps-slot-time,
  .dps-btn-primary{ color: oklch(0.16 0.02 265); }
}

@media (prefers-reduced-motion: reduce){
  .dps-scope *{ transition: none !important; animation: none !important; }
}
`;

/* ----- Expose to harness (root NOT named DayPickerSlot) ------------------ */
window.DayPickerSlot = DayPickerSlotRoot;
