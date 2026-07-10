// Deha CRM — Day Picker with Time Slots (appointment / viewing booking)
// Render-safe, single-file, no imports/exports. React 18.3 UMD is a global.

const { useState, useRef, useCallback } = React;

// ----- Deterministic seed data (no clock reads, no Math.random) --------------

type DayCell = {
  key: string;
  weekday: string;
  dayNum: number;
  today: boolean;
  disabled: boolean;
};

const MONTH_LABEL = "March 2025";

// A fixed week strip. One day is unavailable, one is "today".
const WEEK: DayCell[] = [
  { key: "mon", weekday: "Mon", dayNum: 10, today: false, disabled: false },
  { key: "tue", weekday: "Tue", dayNum: 11, today: true, disabled: false },
  { key: "wed", weekday: "Wed", dayNum: 12, today: false, disabled: false },
  { key: "thu", weekday: "Thu", dayNum: 13, today: false, disabled: true },
  { key: "fri", weekday: "Fri", dayNum: 14, today: false, disabled: false },
  { key: "sat", weekday: "Sat", dayNum: 15, today: false, disabled: false },
  { key: "sun", weekday: "Sun", dayNum: 16, today: false, disabled: false },
];

// 09:00 -> 17:30, 30-minute steps => 18 slots.
const SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let m = 9 * 60; m <= 17 * 60 + 30; m += 30) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return out;
})();

// Deterministic "booked" slots per day, derived from the day key.
// A tiny stable hash keeps this pure and repeatable.
function bookedSetFor(dayKey: string): Set<number> {
  let h = 2166136261;
  for (let i = 0; i < dayKey.length; i++) {
    h ^= dayKey.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  const booked = new Set<number>();
  // Pick a few pseudo-slots off the stable hash, spread across the grid.
  for (let i = 0; i < 5; i++) {
    h = (h * 16777619 + 0x9e37) >>> 0;
    booked.add(h % SLOTS.length);
  }
  return booked;
}

// ----- Component -------------------------------------------------------------

function DayPickerSlotRoot() {
  // Default selection: the "today" day (Tue 11), a sensible open slot.
  const [dayKey, setDayKey] = useState<string>("tue");
  const [slotIdx, setSlotIdx] = useState<number | null>(3); // 10:30
  const [confirmed, setConfirmed] = useState<boolean>(false);

  // Derived-during-render reset: when the day changes, drop the chosen slot
  // (and any confirmation) without useEffect.
  const prevDay = useRef<string>(dayKey);
  if (prevDay.current !== dayKey) {
    prevDay.current = dayKey;
    setSlotIdx(null);
    setConfirmed(false);
  }

  const booked = bookedSetFor(dayKey);
  const selectedDay = WEEK.find((d) => d.key === dayKey) ?? WEEK[0];

  const chosenTime = slotIdx != null ? SLOTS[slotIdx] : null;
  const canConfirm = chosenTime != null && !confirmed;

  const pickDay = useCallback((k: string, disabled: boolean) => {
    if (disabled) return;
    setDayKey(k);
  }, []);

  const pickSlot = useCallback((i: number, disabled: boolean) => {
    if (disabled) return;
    setConfirmed(false);
    setSlotIdx(i);
  }, []);

  const summary =
    chosenTime != null
      ? `${selectedDay.weekday} ${selectedDay.dayNum} ${MONTH_LABEL.split(" ")[0]} · ${chosenTime}`
      : "Select a time to continue";

  return (
    <div className="dps-root">
      <style>{CSS}</style>

      <section className="dps-card" role="group" aria-label="Book a viewing">
        {/* Header */}
        <header className="dps-head">
          <div className="dps-head-txt">
            <h2 className="dps-title">Book a viewing</h2>
            <p className="dps-sub">
              <span className="material-symbols-outlined dps-sub-ic" aria-hidden="true">
                calendar_month
              </span>
              {MONTH_LABEL}
            </p>
          </div>
          <span className="dps-badge">
            <span className="dps-badge-dot" aria-hidden="true" />
            30 min
          </span>
        </header>

        {/* Day strip */}
        <div className="dps-section-lbl" id="dps-day-lbl">
          Choose a day
        </div>
        <div className="dps-week" role="radiogroup" aria-labelledby="dps-day-lbl">
          {WEEK.map((d) => {
            const active = d.key === dayKey;
            return (
              <button
                key={d.key}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={d.disabled}
                disabled={d.disabled}
                className={
                  "dps-day" +
                  (active ? " is-active" : "") +
                  (d.today ? " is-today" : "") +
                  (d.disabled ? " is-off" : "")
                }
                onClick={() => pickDay(d.key, d.disabled)}
              >
                <span className="dps-day-wd">{d.weekday}</span>
                <span className="dps-day-num">{d.dayNum}</span>
                {d.today ? <span className="dps-day-mark" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>

        {/* Slot grid */}
        <div className="dps-section-lbl" id="dps-slot-lbl">
          Available times
          <span className="dps-slot-count">{SLOTS.length - booked.size} open</span>
        </div>
        <div className="dps-grid" role="radiogroup" aria-labelledby="dps-slot-lbl">
          {SLOTS.map((t, i) => {
            const isBooked = booked.has(i);
            const active = i === slotIdx;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={isBooked}
                disabled={isBooked}
                className={
                  "dps-slot" +
                  (active ? " is-active" : "") +
                  (isBooked ? " is-booked" : "")
                }
                onClick={() => pickSlot(i, isBooked)}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="dps-foot">
          <div className={"dps-summary" + (chosenTime ? " is-set" : "")}>
            <span className="material-symbols-outlined dps-summary-ic" aria-hidden="true">
              {confirmed ? "check_circle" : chosenTime ? "event_available" : "schedule"}
            </span>
            <span className="dps-summary-txt">
              {confirmed ? "Viewing confirmed" : summary}
            </span>
          </div>
          <div className="dps-actions">
            <button
              type="button"
              className="dps-btn-ghost"
              onClick={() => {
                setSlotIdx(null);
                setConfirmed(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="dps-btn-green"
              disabled={!canConfirm}
              aria-disabled={!canConfirm}
              onClick={() => setConfirmed(true)}
            >
              <span className="material-symbols-outlined dps-btn-ic" aria-hidden="true">
                {confirmed ? "task_alt" : "arrow_forward"}
              </span>
              {confirmed ? "Booked" : "Confirm booking"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

// ----- Styles (single injected block, prefixed .dps-*) -----------------------

const CSS = `
.dps-root{
  --dps-bg: oklch(0.985 0.004 250);
  --dps-card: oklch(1 0 0);
  --dps-card-2: oklch(0.975 0.006 250);
  --dps-ink: oklch(0.26 0.02 260);
  --dps-ink-2: oklch(0.52 0.02 260);
  --dps-ink-3: oklch(0.66 0.018 260);
  --dps-line: oklch(0.92 0.008 260);
  --dps-line-2: oklch(0.88 0.01 260);
  --dps-accent: oklch(0.72 0.17 150);
  --dps-accent-ink: oklch(0.30 0.09 150);
  --dps-accent-soft: oklch(0.955 0.045 150);
  --dps-shadow: 0 1px 2px oklch(0.5 0.03 260 / 0.06),
                0 8px 20px -8px oklch(0.5 0.03 260 / 0.14),
                0 24px 48px -20px oklch(0.5 0.03 260 / 0.18);
  --dps-r: 22px;

  font-family:'Montserrat',system-ui,-apple-system,sans-serif;
  display:flex; justify-content:center; align-items:flex-start;
  padding:32px 20px;
  background:var(--dps-bg);
  min-height:100%;
  color:var(--dps-ink);
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  box-sizing:border-box;
}
.dps-root *,.dps-root *::before,.dps-root *::after{ box-sizing:border-box; }
.dps-root .material-symbols-outlined{
  font-variation-settings:'wght' 500,'GRAD' 0,'opsz' 24; line-height:1;
}

.dps-card{
  width:100%; max-width:420px;
  background:var(--dps-card);
  border:1px solid var(--dps-line);
  border-radius:var(--dps-r);
  box-shadow:var(--dps-shadow);
  padding:24px;
  display:flex; flex-direction:column; gap:20px;
}

/* Header */
.dps-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.dps-head-txt{ display:flex; flex-direction:column; gap:4px; }
.dps-title{
  margin:0; font-size:20px; font-weight:800; letter-spacing:-0.4px;
  line-height:1.1; text-wrap:balance;
}
.dps-sub{
  margin:0; display:flex; align-items:center; gap:6px;
  font-size:13px; font-weight:600; color:var(--dps-ink-2); letter-spacing:-0.1px;
}
.dps-sub-ic{ font-size:16px; color:var(--dps-accent); }
.dps-badge{
  display:inline-flex; align-items:center; gap:6px;
  padding:6px 11px; border-radius:999px;
  background:var(--dps-accent-soft);
  color:var(--dps-accent-ink);
  font-size:12px; font-weight:700; letter-spacing:-0.1px;
  font-variant-numeric:tabular-nums;
  white-space:nowrap;
}
.dps-badge-dot{ width:6px; height:6px; border-radius:999px; background:var(--dps-accent); }

/* Section label */
.dps-section-lbl{
  display:flex; align-items:center; justify-content:space-between;
  font-size:11px; font-weight:700; letter-spacing:0.6px; text-transform:uppercase;
  color:var(--dps-ink-3); margin:-4px 0 -8px;
}
.dps-slot-count{
  font-size:11px; font-weight:700; letter-spacing:0.2px; text-transform:none;
  color:var(--dps-accent-ink); font-variant-numeric:tabular-nums;
}

/* Day strip */
.dps-week{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
.dps-day{
  position:relative;
  display:flex; flex-direction:column; align-items:center; gap:3px;
  padding:9px 2px 10px;
  min-height:58px;
  border:1px solid var(--dps-line);
  border-radius:14px;
  background:var(--dps-card);
  color:var(--dps-ink);
  cursor:pointer;
  font-family:inherit;
  transition:transform .16s ease-out, border-color .16s ease-out,
             background .16s ease-out, box-shadow .16s ease-out;
}
.dps-day-wd{ font-size:10px; font-weight:700; letter-spacing:0.3px; color:var(--dps-ink-3); text-transform:uppercase; }
.dps-day-num{ font-size:16px; font-weight:800; letter-spacing:-0.4px; font-variant-numeric:tabular-nums; }
.dps-day-mark{ position:absolute; bottom:6px; width:4px; height:4px; border-radius:999px; background:var(--dps-accent); }
.dps-day:hover:not(.is-off):not(.is-active){
  border-color:var(--dps-line-2); background:var(--dps-card-2); transform:translateY(-1px);
}
.dps-day:active:not(.is-off){ transform:scale(0.96); }
.dps-day.is-active{
  background:linear-gradient(180deg, oklch(0.75 0.17 150), oklch(0.70 0.17 150));
  border-color:transparent; color:oklch(1 0 0);
  box-shadow:0 6px 14px -6px oklch(0.70 0.17 150 / 0.6);
}
.dps-day.is-active .dps-day-wd{ color:oklch(1 0 0 / 0.85); }
.dps-day.is-active .dps-day-mark{ background:oklch(1 0 0); }
.dps-day.is-off{ cursor:not-allowed; opacity:0.42; background:var(--dps-card-2); }
.dps-day.is-off .dps-day-num{ text-decoration:line-through; text-decoration-thickness:1.5px; color:var(--dps-ink-3); }

/* Slot grid */
.dps-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.dps-slot{
  min-height:44px;
  border:1px solid var(--dps-line);
  border-radius:12px;
  background:var(--dps-card);
  color:var(--dps-ink);
  font-family:inherit;
  font-size:14px; font-weight:700; letter-spacing:-0.2px;
  font-variant-numeric:tabular-nums;
  cursor:pointer;
  transition:transform .15s ease-out, border-color .15s ease-out,
             background .15s ease-out, color .15s ease-out, box-shadow .15s ease-out;
}
.dps-slot:hover:not(.is-booked):not(.is-active){
  border-color:var(--dps-accent); color:var(--dps-accent-ink); transform:translateY(-1px);
}
.dps-slot:active:not(.is-booked){ transform:scale(0.96); }
.dps-slot.is-active{
  background:var(--dps-accent-soft);
  border-color:var(--dps-accent);
  color:var(--dps-accent-ink);
  box-shadow:inset 0 0 0 1px var(--dps-accent), 0 4px 10px -6px oklch(0.70 0.17 150 / 0.5);
}
.dps-slot.is-booked{
  cursor:not-allowed;
  color:var(--dps-ink-3);
  background:var(--dps-card-2);
  border-color:transparent;
  text-decoration:line-through;
  text-decoration-thickness:1.5px;
  text-decoration-color:var(--dps-ink-3);
  opacity:0.65;
}

/* Footer */
.dps-foot{
  display:flex; flex-direction:column; gap:14px;
  padding-top:18px; border-top:1px solid var(--dps-line);
}
.dps-summary{
  display:flex; align-items:center; gap:9px;
  font-size:13.5px; font-weight:600; color:var(--dps-ink-2); letter-spacing:-0.1px;
  font-variant-numeric:tabular-nums;
}
.dps-summary.is-set{ color:var(--dps-ink); font-weight:700; }
.dps-summary-ic{ font-size:20px; color:var(--dps-ink-3); }
.dps-summary.is-set .dps-summary-ic{ color:var(--dps-accent); }

.dps-actions{ display:flex; align-items:center; gap:10px; }
.dps-btn-ghost{
  flex:0 0 auto;
  padding:12px 16px; min-height:46px;
  border:1px solid var(--dps-line-2);
  border-radius:13px; background:var(--dps-card);
  color:var(--dps-ink-2);
  font-family:inherit; font-size:13.5px; font-weight:700; letter-spacing:-0.1px;
  cursor:pointer;
  transition:transform .15s ease-out, background .15s ease-out, color .15s ease-out;
}
.dps-btn-ghost:hover{ background:var(--dps-card-2); color:var(--dps-ink); }
.dps-btn-ghost:active{ transform:scale(0.97); }
.dps-btn-green{
  flex:1 1 auto;
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  padding:12px 18px; min-height:46px;
  border:0; border-radius:13px;
  background:linear-gradient(180deg, oklch(0.75 0.17 150), oklch(0.69 0.17 150));
  color:oklch(1 0 0);
  font-family:inherit; font-size:14.5px; font-weight:800; letter-spacing:-0.2px;
  cursor:pointer;
  box-shadow:0 6px 16px -8px oklch(0.69 0.17 150 / 0.7), inset 0 1px 0 oklch(1 0 0 / 0.2);
  transition:transform .15s ease-out, box-shadow .15s ease-out, filter .15s ease-out;
}
.dps-btn-green:hover:not(:disabled){ filter:brightness(1.04); box-shadow:0 10px 22px -8px oklch(0.69 0.17 150 / 0.8), inset 0 1px 0 oklch(1 0 0 / 0.2); }
.dps-btn-green:active:not(:disabled){ transform:scale(0.96); }
.dps-btn-green:disabled{ cursor:not-allowed; filter:grayscale(0.5); opacity:0.5; box-shadow:none; }
.dps-btn-ic{ font-size:19px; }

/* Focus ring */
.dps-day:focus-visible,.dps-slot:focus-visible,
.dps-btn-green:focus-visible,.dps-btn-ghost:focus-visible{
  outline:none;
  box-shadow:0 0 0 2px var(--dps-card), 0 0 0 4px var(--dps-accent);
}

/* Dark mode — class convention */
html.dark .dps-root{
  --dps-bg: oklch(0.20 0.012 260);
  --dps-card: oklch(0.255 0.014 260);
  --dps-card-2: oklch(0.295 0.016 260);
  --dps-ink: oklch(0.96 0.006 260);
  --dps-ink-2: oklch(0.76 0.012 260);
  --dps-ink-3: oklch(0.60 0.014 260);
  --dps-line: oklch(0.34 0.016 260);
  --dps-line-2: oklch(0.40 0.018 260);
  --dps-accent-soft: oklch(0.34 0.06 150);
  --dps-accent-ink: oklch(0.90 0.10 150);
  --dps-shadow: 0 1px 2px oklch(0 0 0 / 0.4),
                0 10px 26px -10px oklch(0 0 0 / 0.55),
                0 30px 60px -24px oklch(0 0 0 / 0.6);
}
html.dark .dps-slot.is-active{ color:oklch(0.94 0.09 150); }

/* Dark mode — system preference */
@media (prefers-color-scheme: dark){
  .dps-root{
    --dps-bg: oklch(0.20 0.012 260);
    --dps-card: oklch(0.255 0.014 260);
    --dps-card-2: oklch(0.295 0.016 260);
    --dps-ink: oklch(0.96 0.006 260);
    --dps-ink-2: oklch(0.76 0.012 260);
    --dps-ink-3: oklch(0.60 0.014 260);
    --dps-line: oklch(0.34 0.016 260);
    --dps-line-2: oklch(0.40 0.018 260);
    --dps-accent-soft: oklch(0.34 0.06 150);
    --dps-accent-ink: oklch(0.90 0.10 150);
    --dps-shadow: 0 1px 2px oklch(0 0 0 / 0.4),
                  0 10px 26px -10px oklch(0 0 0 / 0.55),
                  0 30px 60px -24px oklch(0 0 0 / 0.6);
  }
  .dps-slot.is-active{ color:oklch(0.94 0.09 150); }
}

@media (prefers-reduced-motion: reduce){
  .dps-root *{ transition:none !important; animation:none !important; }
}
`;

// Assign to the global the harness expects. Root is intentionally NOT named
// "DayPickerSlot" to avoid self-recursion in this non-module harness.
window.DayPickerSlot = DayPickerSlotRoot;
