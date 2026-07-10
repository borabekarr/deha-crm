// Render-safe, single-file component for a no-bundler <script> harness.
// React 18.3.1 UMD is a global. No module syntax. No lifecycle effects.
const { useState, useRef, useCallback, useMemo } = React;

// ---- Deterministic seed data (never read the clock at render time) --------
const WEEK_DAYS = [
  { key: "mon-10", weekday: "Mon", date: 10, available: true, today: false },
  { key: "tue-11", weekday: "Tue", date: 11, available: true, today: false },
  { key: "wed-12", weekday: "Wed", date: 12, available: true, today: true },
  { key: "thu-13", weekday: "Thu", date: 13, available: true, today: false },
  { key: "fri-14", weekday: "Fri", date: 14, available: true, today: false },
  { key: "sat-15", weekday: "Sat", date: 15, available: true, today: false },
  { key: "sun-16", weekday: "Sun", date: 16, available: false, today: false },
];

// Slots 09:00 -> 17:30, 30-min steps (18 slots).
const SLOTS = (() => {
  const out = [];
  for (let m = 9 * 60; m <= 17 * 60 + 30; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const label = String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
    out.push({ key: label, label, minutes: m });
  }
  return out;
})();

// Deterministic booked-slot map per day (no Math.random). A stable pseudo-hash
// spreads a handful of "booked" slots differently for each day.
function bookedSetForDay(dayKey) {
  const set = new Set();
  let acc = 0;
  for (let i = 0; i < dayKey.length; i++) acc = (acc * 31 + dayKey.charCodeAt(i)) >>> 0;
  const count = 3 + (acc % 3); // 3..5 booked slots
  let cursor = acc;
  for (let i = 0; i < count; i++) {
    cursor = (cursor * 1103515245 + 12345) >>> 0;
    set.add(cursor % SLOTS.length);
  }
  return set;
}

function firstOpenSlot(dayKey) {
  const booked = bookedSetForDay(dayKey);
  for (let i = 0; i < SLOTS.length; i++) if (!booked.has(i)) return SLOTS[i].key;
  return null;
}

const DEFAULT_DAY = "thu-13";

function Icon({ name, className }) {
  return (
    <span className={"material-symbols-outlined dps-ico" + (className ? " " + className : "")} aria-hidden="true">
      {name}
    </span>
  );
}

function DayPickerSlotRoot() {
  const [selectedDay, setSelectedDay] = useState(DEFAULT_DAY);
  const [selectedSlot, setSelectedSlot] = useState(() => firstOpenSlot(DEFAULT_DAY));
  const [confirmed, setConfirmed] = useState(false);

  // Derive-during-render reset: when the day changes, drop a now-invalid slot.
  // No lifecycle effect — compare a stored prev value in the render phase.
  const prevDay = useRef(DEFAULT_DAY);
  if (prevDay.current !== selectedDay) {
    prevDay.current = selectedDay;
    const idx = SLOTS.findIndex((s) => s.key === selectedSlot);
    const stillOk = selectedSlot && idx >= 0 && !bookedSetForDay(selectedDay).has(idx);
    if (!stillOk) setSelectedSlot(firstOpenSlot(selectedDay));
    if (confirmed) setConfirmed(false);
  }

  const bookedSet = useMemo(() => bookedSetForDay(selectedDay), [selectedDay]);
  const dayMeta = useMemo(() => WEEK_DAYS.find((d) => d.key === selectedDay), [selectedDay]);

  const openCount = SLOTS.length - bookedSet.size;

  const handleDay = useCallback((d) => {
    if (!d.available) return;
    setSelectedDay(d.key);
  }, []);

  const handleSlot = useCallback((idx, key) => {
    if (bookedSetForDay(prevDay.current).has(idx)) return;
    setSelectedSlot(key);
    setConfirmed(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedSlot) return;
    setConfirmed(true);
  }, [selectedSlot]);

  const handleClear = useCallback(() => {
    setSelectedSlot(null);
    setConfirmed(false);
  }, []);

  const summaryText = selectedSlot
    ? dayMeta.weekday + " " + dayMeta.date + " Mar, " + selectedSlot
    : "Pick a time slot to continue";

  return (
    <div className="dps-scope">
      <style>{CSS}</style>
      <section className="dps-card" aria-label="Book a viewing">
        {/* Header */}
        <header className="dps-head">
          <div className="dps-head-icon" aria-hidden="true">
            <Icon name="event_available" />
          </div>
          <div className="dps-head-copy">
            <h2 className="dps-title">Book a viewing</h2>
            <p className="dps-sub">March 2025 &middot; Riverside Apartment</p>
          </div>
          <span className="dps-badge">
            <span className="dps-dot" aria-hidden="true" />
            {openCount} open
          </span>
        </header>

        {/* Day strip */}
        <div className="dps-section-label">
          <Icon name="calendar_month" className="dps-label-ico" />
          Choose a day
        </div>
        <div className="dps-strip" role="group" aria-label="Select a day">
          {WEEK_DAYS.map((d) => {
            const isSel = d.key === selectedDay;
            const cls =
              "dps-day" +
              (isSel ? " is-selected" : "") +
              (d.today ? " is-today" : "") +
              (!d.available ? " is-disabled" : "");
            return (
              <button
                key={d.key}
                type="button"
                className={cls}
                aria-pressed={isSel}
                aria-disabled={!d.available}
                disabled={!d.available}
                onClick={() => handleDay(d)}
              >
                <span className="dps-day-wd">{d.weekday}</span>
                <span className="dps-day-num">{d.date}</span>
                {d.today ? <span className="dps-today-dot" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>

        {/* Slot grid */}
        <div className="dps-section-label dps-slot-head">
          <span>
            <Icon name="schedule" className="dps-label-ico" />
            Available times
          </span>
          <span className="dps-slot-day">
            {dayMeta.weekday} {dayMeta.date}
          </span>
        </div>
        <div className="dps-grid" role="group" aria-label="Select a time slot">
          {SLOTS.map((s, idx) => {
            const isBooked = bookedSet.has(idx);
            const isSel = !isBooked && s.key === selectedSlot;
            const cls =
              "dps-slot" + (isSel ? " is-selected" : "") + (isBooked ? " is-booked" : "");
            return (
              <button
                key={s.key}
                type="button"
                className={cls}
                aria-pressed={isSel}
                aria-disabled={isBooked}
                disabled={isBooked}
                onClick={() => handleSlot(idx, s.key)}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="dps-foot">
          <div className={"dps-summary" + (confirmed ? " is-done" : "")}>
            <Icon
              name={confirmed ? "task_alt" : selectedSlot ? "event" : "touch_app"}
              className="dps-sum-ico"
            />
            <div className="dps-sum-copy">
              <span className="dps-sum-label">
                {confirmed ? "Viewing confirmed" : selectedSlot ? "Your selection" : "No time yet"}
              </span>
              <span className="dps-sum-value">{summaryText}</span>
            </div>
          </div>
          <div className="dps-actions">
            <button
              type="button"
              className="dps-btn-ghost"
              onClick={handleClear}
              disabled={!selectedSlot}
            >
              Clear
            </button>
            <button
              type="button"
              className="dps-btn-green"
              onClick={handleConfirm}
              disabled={!selectedSlot || confirmed}
            >
              <Icon name={confirmed ? "check" : "arrow_forward"} className="dps-btn-ico" />
              {confirmed ? "Confirmed" : "Confirm booking"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

const CSS = `
.dps-scope{
  --dps-bg: oklch(0.985 0.006 250);
  --dps-card: oklch(1 0 0);
  --dps-card-2: oklch(0.975 0.008 255);
  --dps-ink: oklch(0.26 0.03 262);
  --dps-ink-soft: oklch(0.52 0.025 262);
  --dps-ink-faint: oklch(0.66 0.02 262);
  --dps-line: oklch(0.92 0.012 262);
  --dps-line-soft: oklch(0.95 0.008 262);
  --dps-accent: oklch(0.68 0.17 150);
  --dps-accent-deep: oklch(0.58 0.16 152);
  --dps-accent-ink: oklch(0.30 0.09 155);
  --dps-accent-wash: oklch(0.955 0.045 155);
  --dps-shadow-1: 0 1px 2px oklch(0.55 0.05 262 / 0.06);
  --dps-shadow-2: 0 6px 16px oklch(0.5 0.05 262 / 0.08);
  --dps-shadow-3: 0 24px 48px -12px oklch(0.45 0.06 262 / 0.14);
  --dps-ring: oklch(0.68 0.17 150 / 0.5);
  --dps-r-card: 24px;
  --dps-r-mid: 16px;
  --dps-r-pill: 12px;
  font-family:'Montserrat',system-ui,-apple-system,sans-serif;
  color:var(--dps-ink);
  display:flex;
  justify-content:center;
  padding:32px 16px;
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.dps-scope *{box-sizing:border-box;}
.dps-ico{
  font-family:'Material Symbols Outlined';
  font-weight:normal;font-style:normal;line-height:1;
  font-variation-settings:'FILL' 0,'wght' 420,'GRAD' 0,'opsz' 24;
  -webkit-font-feature-settings:'liga';font-feature-settings:'liga';
  vertical-align:middle;user-select:none;
  /* Contain glyph to a 1em box so an unloaded icon font clips instead of
     sprawling the raw ligature word across the layout. */
  display:inline-grid;place-items:center;
  width:1em;height:1em;overflow:hidden;white-space:nowrap;
}

.dps-card{
  width:100%;max-width:440px;
  background:var(--dps-card);
  border:1px solid var(--dps-line);
  border-radius:var(--dps-r-card);
  padding:24px;
  box-shadow:var(--dps-shadow-1),var(--dps-shadow-2),var(--dps-shadow-3);
}

/* Header */
.dps-head{display:flex;align-items:center;gap:12px;margin-bottom:24px;}
.dps-head-icon{
  flex:none;display:grid;place-items:center;
  width:44px;height:44px;border-radius:14px;
  background:var(--dps-accent-wash);
  color:var(--dps-accent-deep);
  box-shadow:inset 0 0 0 1px oklch(0.68 0.17 150 / 0.16);
}
.dps-head-icon .dps-ico{font-size:24px;}
.dps-head-copy{flex:1;min-width:0;}
.dps-title{margin:0;font-size:19px;font-weight:800;letter-spacing:-0.4px;line-height:1.15;}
.dps-sub{margin:2px 0 0;font-size:12.5px;font-weight:500;color:var(--dps-ink-soft);letter-spacing:-0.1px;}
.dps-badge{
  flex:none;display:inline-flex;align-items:center;gap:6px;
  padding:6px 10px;border-radius:999px;
  background:var(--dps-accent-wash);
  color:var(--dps-accent-ink);
  font-size:11.5px;font-weight:700;letter-spacing:-0.1px;font-variant-numeric:tabular-nums;
  box-shadow:inset 0 0 0 1px oklch(0.68 0.17 150 / 0.14);
}
.dps-dot{width:7px;height:7px;border-radius:50%;background:var(--dps-accent);box-shadow:0 0 0 3px oklch(0.68 0.17 150 / 0.18);}

/* Section labels */
.dps-section-label{
  display:flex;align-items:center;gap:6px;
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;
  color:var(--dps-ink-faint);margin-bottom:10px;
}
.dps-label-ico{font-size:15px;}
.dps-slot-head{justify-content:space-between;margin-top:22px;}
.dps-slot-head>span{display:inline-flex;align-items:center;gap:6px;}
.dps-slot-day{
  text-transform:none;letter-spacing:-0.1px;font-size:12px;
  color:var(--dps-ink);font-weight:700;font-variant-numeric:tabular-nums;
}

/* Day strip */
.dps-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.dps-day{
  position:relative;
  display:flex;flex-direction:column;align-items:center;gap:3px;
  padding:10px 0 12px;min-height:64px;
  border:1px solid var(--dps-line);
  border-radius:var(--dps-r-pill);
  background:var(--dps-card);
  cursor:pointer;
  font-family:inherit;
  transition:transform .16s ease-out,border-color .16s ease-out,background .16s ease-out,box-shadow .16s ease-out;
}
.dps-day-wd{font-size:10.5px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase;color:var(--dps-ink-faint);}
.dps-day-num{font-size:17px;font-weight:800;letter-spacing:-0.5px;color:var(--dps-ink);font-variant-numeric:tabular-nums;}
.dps-day:hover:not(.is-disabled):not(.is-selected){border-color:oklch(0.82 0.05 155);background:var(--dps-card-2);}
.dps-day:active:not(.is-disabled){transform:scale(0.96);}
.dps-day.is-selected{
  border-color:transparent;
  background:linear-gradient(180deg,var(--dps-accent) 0%,var(--dps-accent-deep) 100%);
  box-shadow:0 6px 14px -4px oklch(0.58 0.16 152 / 0.5),inset 0 1px 0 oklch(1 0 0 / 0.25);
}
.dps-day.is-selected .dps-day-num{color:oklch(1 0 0);}
.dps-day.is-selected .dps-day-wd{color:oklch(0.96 0.03 155);}
.dps-today-dot{width:5px;height:5px;border-radius:50%;background:var(--dps-accent);position:absolute;bottom:6px;}
.dps-day.is-selected .dps-today-dot{background:oklch(1 0 0 / 0.9);}
.dps-day.is-today:not(.is-selected){border-color:oklch(0.82 0.06 155);}
.dps-day.is-disabled{
  cursor:not-allowed;background:var(--dps-line-soft);border-color:var(--dps-line-soft);
}
.dps-day.is-disabled .dps-day-num,.dps-day.is-disabled .dps-day-wd{color:var(--dps-ink-faint);opacity:0.55;text-decoration:line-through;text-decoration-thickness:1px;}

/* Slot grid */
.dps-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.dps-slot{
  min-height:44px;padding:0 4px;
  border:1px solid var(--dps-line);
  border-radius:var(--dps-r-pill);
  background:var(--dps-card);
  color:var(--dps-ink);
  font-family:inherit;font-size:13.5px;font-weight:700;letter-spacing:-0.2px;
  font-variant-numeric:tabular-nums;
  cursor:pointer;
  transition:transform .15s ease-out,border-color .15s ease-out,background .15s ease-out,box-shadow .15s ease-out,color .15s ease-out;
}
.dps-slot:hover:not(.is-booked):not(.is-selected){border-color:oklch(0.80 0.06 155);background:var(--dps-accent-wash);color:var(--dps-accent-ink);}
.dps-slot:active:not(.is-booked){transform:scale(0.96);}
.dps-slot.is-selected{
  border-color:transparent;color:oklch(1 0 0);
  background:linear-gradient(180deg,var(--dps-accent) 0%,var(--dps-accent-deep) 100%);
  box-shadow:0 5px 12px -4px oklch(0.58 0.16 152 / 0.5),inset 0 1px 0 oklch(1 0 0 / 0.25);
}
.dps-slot.is-booked{
  cursor:not-allowed;color:var(--dps-ink-faint);
  background:var(--dps-line-soft);border-color:var(--dps-line-soft);
  text-decoration:line-through;text-decoration-thickness:1px;opacity:0.72;
}

/* Footer */
.dps-foot{
  margin-top:24px;padding-top:20px;
  border-top:1px solid var(--dps-line-soft);
  display:flex;flex-direction:column;gap:16px;
}
.dps-summary{display:flex;align-items:center;gap:12px;}
.dps-sum-ico{
  font-size:20px;flex:none;
  width:38px;height:38px;border-radius:11px;display:grid;place-items:center;
  background:var(--dps-card-2);color:var(--dps-ink-soft);
  box-shadow:inset 0 0 0 1px var(--dps-line);
}
.dps-summary.is-done .dps-sum-ico{background:var(--dps-accent-wash);color:var(--dps-accent-deep);box-shadow:inset 0 0 0 1px oklch(0.68 0.17 150 / 0.18);}
.dps-sum-copy{display:flex;flex-direction:column;min-width:0;}
.dps-sum-label{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--dps-ink-faint);}
.dps-sum-value{font-size:14px;font-weight:800;letter-spacing:-0.3px;color:var(--dps-ink);font-variant-numeric:tabular-nums;text-wrap:balance;}
.dps-actions{display:flex;gap:10px;}
.dps-btn-ghost{
  flex:none;padding:0 16px;min-height:44px;
  border:1px solid var(--dps-line);border-radius:var(--dps-r-mid);
  background:var(--dps-card);color:var(--dps-ink-soft);
  font-family:inherit;font-size:13.5px;font-weight:700;letter-spacing:-0.1px;cursor:pointer;
  transition:transform .15s ease-out,border-color .15s ease-out,background .15s ease-out,color .15s ease-out;
}
.dps-btn-ghost:hover:not(:disabled){border-color:oklch(0.86 0.02 262);background:var(--dps-card-2);color:var(--dps-ink);}
.dps-btn-ghost:active:not(:disabled){transform:scale(0.96);}
.dps-btn-green{
  flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;
  min-height:44px;padding:0 18px;
  border:none;border-radius:var(--dps-r-mid);
  background:linear-gradient(180deg,var(--dps-accent) 0%,var(--dps-accent-deep) 100%);
  color:oklch(1 0 0);
  font-family:inherit;font-size:14px;font-weight:800;letter-spacing:-0.2px;cursor:pointer;
  box-shadow:0 8px 18px -6px oklch(0.58 0.16 152 / 0.55),inset 0 1px 0 oklch(1 0 0 / 0.28);
  transition:transform .15s ease-out,box-shadow .15s ease-out,filter .15s ease-out;
}
.dps-btn-green .dps-btn-ico{font-size:18px;}
.dps-btn-green:hover:not(:disabled){filter:brightness(1.04);box-shadow:0 10px 22px -6px oklch(0.58 0.16 152 / 0.6),inset 0 1px 0 oklch(1 0 0 / 0.3);}
.dps-btn-green:active:not(:disabled){transform:scale(0.96);}

.dps-btn-green:disabled{
  background:var(--dps-line);color:var(--dps-ink-faint);
  box-shadow:none;cursor:not-allowed;
}
.dps-btn-ghost:disabled{opacity:0.5;cursor:not-allowed;}

/* Focus ring */
.dps-scope button:focus-visible{outline:none;box-shadow:0 0 0 3px var(--dps-ring);}
.dps-day.is-selected:focus-visible,.dps-slot.is-selected:focus-visible{box-shadow:0 0 0 3px var(--dps-ring),0 5px 12px -4px oklch(0.58 0.16 152 / 0.5);}

/* Reduced motion */
@media (prefers-reduced-motion: reduce){
  .dps-scope *{transition:none !important;}
  .dps-day:active,.dps-slot:active,.dps-btn-green:active,.dps-btn-ghost:active{transform:none;}
}

/* Dark mode: class convention */
html.dark .dps-scope{
  --dps-card: oklch(0.255 0.018 262);
  --dps-card-2: oklch(0.30 0.02 262);
  --dps-ink: oklch(0.95 0.008 255);
  --dps-ink-soft: oklch(0.74 0.015 258);
  --dps-ink-faint: oklch(0.60 0.018 258);
  --dps-line: oklch(0.36 0.02 262);
  --dps-line-soft: oklch(0.32 0.018 262);
  --dps-accent-wash: oklch(0.34 0.055 155);
  --dps-accent-ink: oklch(0.86 0.09 155);
  --dps-shadow-1: 0 1px 2px oklch(0 0 0 / 0.3);
  --dps-shadow-2: 0 8px 20px oklch(0 0 0 / 0.35);
  --dps-shadow-3: 0 28px 52px -14px oklch(0 0 0 / 0.5);
}
/* Dark mode: system preference (unless page forces light) */
@media (prefers-color-scheme: dark){
  .dps-scope{
    --dps-card: oklch(0.255 0.018 262);
    --dps-card-2: oklch(0.30 0.02 262);
    --dps-ink: oklch(0.95 0.008 255);
    --dps-ink-soft: oklch(0.74 0.015 258);
    --dps-ink-faint: oklch(0.60 0.018 258);
    --dps-line: oklch(0.36 0.02 262);
    --dps-line-soft: oklch(0.32 0.018 262);
    --dps-accent-wash: oklch(0.34 0.055 155);
    --dps-accent-ink: oklch(0.86 0.09 155);
    --dps-shadow-1: 0 1px 2px oklch(0 0 0 / 0.3);
    --dps-shadow-2: 0 8px 20px oklch(0 0 0 / 0.35);
    --dps-shadow-3: 0 28px 52px -14px oklch(0 0 0 / 0.5);
  }
  html.light .dps-scope{
    --dps-card: oklch(1 0 0);
    --dps-card-2: oklch(0.975 0.008 255);
    --dps-ink: oklch(0.26 0.03 262);
    --dps-ink-soft: oklch(0.52 0.025 262);
    --dps-ink-faint: oklch(0.66 0.02 262);
    --dps-line: oklch(0.92 0.012 262);
    --dps-line-soft: oklch(0.95 0.008 262);
    --dps-accent-wash: oklch(0.955 0.045 155);
    --dps-accent-ink: oklch(0.30 0.09 155);
  }
}
`;

window.DayPickerSlotRoot = DayPickerSlotRoot;
window.DayPickerSlot = DayPickerSlotRoot;
