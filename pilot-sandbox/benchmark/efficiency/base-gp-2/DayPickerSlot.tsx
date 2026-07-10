/* DayPickerSlot.tsx — Day Picker with Time Slots (Deha CRM appointment booking)
   Render-safe, non-module harness build. React is a GLOBAL (18.3 UMD).
   No imports/exports. No useEffect. Deterministic (no clock at render time).
   Root component is DayPickerSlotRoot; global export at bottom. */

const { useState, useRef, useCallback } = React;

/* ── Deterministic seed data ─────────────────────────────────────────────
   A fixed booking week: Mon 06 Jul – Sun 12 Jul 2026. No Date.now() reads. */
const MONTH_LABEL = "July 2026";
const CONTEXT_SUB = "Select a day and time for the property viewing";

const WEEK: { wd: string; day: number; iso: string; disabled?: boolean }[] = [
  { wd: "MON", day: 6,  iso: "2026-07-06" },
  { wd: "TUE", day: 7,  iso: "2026-07-07" },
  { wd: "WED", day: 8,  iso: "2026-07-08" },
  { wd: "THU", day: 9,  iso: "2026-07-09" },
  { wd: "FRI", day: 10, iso: "2026-07-10" },
  { wd: "SAT", day: 11, iso: "2026-07-11" },
  { wd: "SUN", day: 12, iso: "2026-07-12", disabled: true }, // closed Sundays
];

const TODAY_ISO = "2026-07-07"; // fixed "today" marker — never read the clock

/* Fixed 09:00 → 17:30, 30-min steps → 18 slots */
const SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let m = 9 * 60; m <= 17 * 60 + 30; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0"));
  }
  return out;
})();

/* Deterministic "booked" set per day — seeded from day number, no randomness. */
function bookedForDay(dayNum: number): Set<number> {
  const s = new Set<number>();
  for (let i = 0; i < SLOTS.length; i++) {
    // stable pseudo-pattern: mixes day + slot index, fully deterministic
    if (((dayNum * 7 + i * 3 + (i % 2) * 5) % 5) === 0) s.add(i);
    if (((dayNum + i) % 6) === 0) s.add(i);
  }
  return s;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WD_LONG: Record<string, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday",
  FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
};

const CSS = `
.dps-scope{
  --dps-accent: oklch(0.72 0.17 152);
  --dps-accent-strong: oklch(0.66 0.18 152);
  --dps-accent-ink: oklch(0.28 0.09 152);
  --dps-amber: oklch(0.80 0.14 82);
  --dps-danger: oklch(0.64 0.20 25);

  --dps-bg: oklch(0.97 0.006 250);
  --dps-card: oklch(0.995 0.003 250);
  --dps-card-2: oklch(0.975 0.005 250);
  --dps-ink: oklch(0.26 0.02 260);
  --dps-ink-2: oklch(0.46 0.02 260);
  --dps-ink-3: oklch(0.62 0.015 260);
  --dps-line: oklch(0.90 0.008 260);
  --dps-line-soft: oklch(0.93 0.006 260);
  --dps-slot-bg: oklch(0.985 0.004 250);

  font-family:'Montserrat',system-ui,-apple-system,sans-serif;
  color: var(--dps-ink);
  background: var(--dps-bg);
  min-height:100%;
  display:flex; align-items:center; justify-content:center;
  padding:32px 16px;
  box-sizing:border-box;
}
.dps-scope *{ box-sizing:border-box; }

.dps-card{
  width:100%; max-width:420px;
  background:
    linear-gradient(180deg, var(--dps-card) 0%, var(--dps-card-2) 100%);
  border-radius:24px;
  padding:24px;
  box-shadow:
    0 1px 0 oklch(1 0 0 / .8) inset,
    0 0 0 1px oklch(0.90 0.008 260 / .7),
    0 2px 4px oklch(0.4 0.03 260 / .05),
    0 14px 30px -12px oklch(0.4 0.03 260 / .22),
    0 40px 64px -32px oklch(0.4 0.03 260 / .18);
}

/* Header */
.dps-head{ display:flex; align-items:flex-start; gap:12px; margin-bottom:20px; }
.dps-badge{
  flex:0 0 auto; width:44px; height:44px; border-radius:14px;
  display:grid; place-items:center;
  background: linear-gradient(155deg, var(--dps-accent) 0%, var(--dps-accent-strong) 100%);
  color: oklch(0.99 0.02 152);
  box-shadow:
    0 1px 0 oklch(1 0 0 / .35) inset,
    0 6px 14px -6px var(--dps-accent-strong);
}
.dps-badge .material-symbols-outlined{ font-size:24px; }
.dps-head-txt{ min-width:0; padding-top:1px; }
.dps-title{ margin:0; font-size:19px; font-weight:800; letter-spacing:-0.3px; line-height:1.15; }
.dps-sub{ margin:3px 0 0; font-size:12.5px; font-weight:500; color:var(--dps-ink-3); line-height:1.35; }

/* Section labels */
.dps-lbl{
  display:flex; align-items:center; justify-content:space-between;
  margin:0 2px 10px;
}
.dps-lbl-t{ font-size:11px; font-weight:700; letter-spacing:0.6px; text-transform:uppercase; color:var(--dps-ink-3); }
.dps-lbl-month{ font-size:11.5px; font-weight:700; letter-spacing:-0.1px; color:var(--dps-ink-2); font-variant-numeric:tabular-nums; }

/* Day strip */
.dps-week{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin-bottom:22px; }
.dps-day{
  position:relative;
  appearance:none; border:0; cursor:pointer;
  padding:9px 2px 8px;
  border-radius:14px;
  background: var(--dps-slot-bg);
  box-shadow: 0 0 0 1px var(--dps-line-soft) inset;
  display:flex; flex-direction:column; align-items:center; gap:3px;
  min-height:56px; justify-content:center;
  transition: transform 180ms ease-out, box-shadow 180ms ease-out, background 180ms ease-out;
}
.dps-day-wd{ font-size:9.5px; font-weight:700; letter-spacing:0.5px; color:var(--dps-ink-3); }
.dps-day-n{ font-size:16px; font-weight:800; letter-spacing:-0.3px; color:var(--dps-ink); font-variant-numeric:tabular-nums; line-height:1; }
.dps-day:hover:not(:disabled):not(.is-sel){ transform:translateY(-2px); box-shadow:0 0 0 1px var(--dps-line) inset, 0 8px 16px -10px oklch(0.4 0.03 260 / .5); }
.dps-day:active:not(:disabled){ transform:scale(0.96); }
.dps-day.is-sel{
  background: linear-gradient(160deg, var(--dps-accent) 0%, var(--dps-accent-strong) 100%);
  box-shadow:
    0 1px 0 oklch(1 0 0 / .3) inset,
    0 8px 18px -8px var(--dps-accent-strong);
}
.dps-day.is-sel .dps-day-wd{ color: oklch(0.99 0.03 152 / .85); }
.dps-day.is-sel .dps-day-n{ color: oklch(0.995 0.01 152); }
.dps-day:disabled{ cursor:not-allowed; opacity:.42; }
.dps-day:disabled .dps-day-n{ text-decoration:line-through; text-decoration-color:var(--dps-ink-3); }
.dps-dot{ position:absolute; bottom:6px; width:4px; height:4px; border-radius:50%; background:var(--dps-accent-strong); }
.dps-day.is-sel .dps-dot{ background: oklch(0.99 0.03 152); }

/* Slot grid */
.dps-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.dps-slot{
  appearance:none; border:0; cursor:pointer;
  min-height:44px;
  border-radius:12px;
  background:var(--dps-slot-bg);
  box-shadow:0 0 0 1px var(--dps-line-soft) inset;
  font-family:inherit;
  font-size:13.5px; font-weight:700; letter-spacing:-0.2px;
  font-variant-numeric:tabular-nums;
  color:var(--dps-ink);
  display:grid; place-items:center;
  transition: transform 150ms ease-out, box-shadow 150ms ease-out, background 150ms ease-out, color 150ms ease-out;
}
.dps-slot:hover:not(:disabled):not(.is-sel){ transform:translateY(-1px); box-shadow:0 0 0 1px var(--dps-accent) inset; color:var(--dps-accent-ink); }
.dps-slot:active:not(:disabled){ transform:scale(0.96); }
.dps-slot.is-sel{
  color: oklch(0.995 0.01 152);
  background: linear-gradient(160deg, var(--dps-accent) 0%, var(--dps-accent-strong) 100%);
  box-shadow:0 1px 0 oklch(1 0 0 / .3) inset, 0 6px 14px -7px var(--dps-accent-strong);
}
.dps-slot:disabled{ cursor:not-allowed; color:var(--dps-ink-3); opacity:.5; text-decoration:line-through; text-decoration-color:var(--dps-ink-3); background:transparent; box-shadow:0 0 0 1px var(--dps-line-soft) inset; }

.dps-empty{
  grid-column:1 / -1; text-align:center; padding:26px 8px;
  font-size:12.5px; font-weight:600; color:var(--dps-ink-3);
}

/* Footer */
.dps-foot{ margin-top:22px; padding-top:18px; border-top:1px solid var(--dps-line-soft); }
.dps-summary{
  display:flex; align-items:center; gap:10px; margin-bottom:14px;
  padding:11px 13px; border-radius:14px;
  background:var(--dps-card-2);
  box-shadow:0 0 0 1px var(--dps-line-soft) inset;
}
.dps-summary .material-symbols-outlined{ font-size:20px; color:var(--dps-accent-strong); flex:0 0 auto; }
.dps-summary-txt{ min-width:0; }
.dps-summary-main{ font-size:13px; font-weight:700; letter-spacing:-0.2px; color:var(--dps-ink); font-variant-numeric:tabular-nums; }
.dps-summary-sub{ font-size:11px; font-weight:500; color:var(--dps-ink-3); margin-top:1px; }

.dps-actions{ display:flex; gap:10px; }
.dps-confirm{
  flex:1 1 auto;
  appearance:none; border:0; cursor:pointer;
  min-height:48px; border-radius:14px;
  font-family:inherit; font-size:14.5px; font-weight:800; letter-spacing:-0.2px;
  color: oklch(0.99 0.02 152);
  background: linear-gradient(160deg, var(--dps-accent) 0%, var(--dps-accent-strong) 100%);
  box-shadow:0 1px 0 oklch(1 0 0 / .3) inset, 0 8px 18px -8px var(--dps-accent-strong);
  display:flex; align-items:center; justify-content:center; gap:7px;
  transition: transform 150ms ease-out, box-shadow 150ms ease-out, filter 150ms ease-out;
}
.dps-confirm .material-symbols-outlined{ font-size:19px; }
.dps-confirm:hover:not(:disabled){ filter:brightness(1.04); box-shadow:0 1px 0 oklch(1 0 0 / .3) inset, 0 12px 24px -8px var(--dps-accent-strong); }
.dps-confirm:active:not(:disabled){ transform:scale(0.96); }
.dps-confirm:disabled{ cursor:not-allowed; filter:grayscale(.55); opacity:.6; box-shadow:0 0 0 1px var(--dps-line) inset; }
.dps-confirm.is-done{ background: linear-gradient(160deg, oklch(0.70 0.15 150), oklch(0.62 0.16 150)); }

.dps-cancel{
  flex:0 0 auto; appearance:none; cursor:pointer;
  min-height:48px; padding:0 16px; border-radius:14px; border:0;
  background:transparent; color:var(--dps-ink-3);
  box-shadow:0 0 0 1px var(--dps-line-soft) inset;
  font-family:inherit; font-size:13px; font-weight:700;
  transition: color 150ms ease-out, box-shadow 150ms ease-out, transform 150ms ease-out;
}
.dps-cancel:hover{ color:var(--dps-ink-2); box-shadow:0 0 0 1px var(--dps-line) inset; }
.dps-cancel:active{ transform:scale(0.96); }

/* Focus ring */
.dps-scope :focus-visible{ outline:2px solid var(--dps-accent-strong); outline-offset:2px; border-radius:12px; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce){
  .dps-scope *{ transition:none !important; }
}

/* Dark mode — class convention + system pref, accent holds */
html.dark .dps-scope,
.dps-scope.dps-dark{
  --dps-bg: oklch(0.20 0.014 265);
  --dps-card: oklch(0.265 0.017 265);
  --dps-card-2: oklch(0.235 0.015 265);
  --dps-ink: oklch(0.96 0.006 260);
  --dps-ink-2: oklch(0.80 0.01 260);
  --dps-ink-3: oklch(0.65 0.012 260);
  --dps-line: oklch(0.40 0.015 265);
  --dps-line-soft: oklch(0.34 0.014 265);
  --dps-slot-bg: oklch(0.30 0.016 265);
  --dps-accent-ink: oklch(0.90 0.06 152);
}
html.dark .dps-scope .dps-card,
.dps-scope.dps-dark .dps-card{
  box-shadow:
    0 1px 0 oklch(1 0 0 / .06) inset,
    0 0 0 1px oklch(0.42 0.015 265 / .8),
    0 18px 40px -16px oklch(0 0 0 / .55),
    0 40px 72px -36px oklch(0 0 0 / .5);
}
@media (prefers-color-scheme: dark){
  .dps-scope:not(.dps-light){
    --dps-bg: oklch(0.20 0.014 265);
    --dps-card: oklch(0.265 0.017 265);
    --dps-card-2: oklch(0.235 0.015 265);
    --dps-ink: oklch(0.96 0.006 260);
    --dps-ink-2: oklch(0.80 0.01 260);
    --dps-ink-3: oklch(0.65 0.012 260);
    --dps-line: oklch(0.40 0.015 265);
    --dps-line-soft: oklch(0.34 0.014 265);
    --dps-slot-bg: oklch(0.30 0.016 265);
    --dps-accent-ink: oklch(0.90 0.06 152);
  }
  .dps-scope:not(.dps-light) .dps-card{
    box-shadow:
      0 1px 0 oklch(1 0 0 / .06) inset,
      0 0 0 1px oklch(0.42 0.015 265 / .8),
      0 18px 40px -16px oklch(0 0 0 / .55),
      0 40px 72px -36px oklch(0 0 0 / .5);
  }
}
`;

function DayPickerSlotRoot() {
  // Default selection: Tuesday 07 (today, available)
  const [selDayIso, setSelDayIso] = useState<string>("2026-07-07");
  const [selSlot, setSelSlot] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  // Derive-in-render: when the day changes, clear any slot that is now booked.
  const prevDay = useRef<string>(selDayIso);
  const dayObj = WEEK.find((d) => d.iso === selDayIso)!;
  const booked = bookedForDay(dayObj.day);
  if (prevDay.current !== selDayIso) {
    prevDay.current = selDayIso;
    if (selSlot !== null && booked.has(selSlot)) setSelSlot(null);
    if (confirmed) setConfirmed(false);
  }

  const onPickDay = useCallback((iso: string) => {
    setSelDayIso(iso);
  }, []);

  const onPickSlot = useCallback((i: number) => {
    setSelSlot(i);
    setConfirmed(false);
  }, []);

  const onReset = useCallback(() => {
    setSelSlot(null);
    setConfirmed(false);
  }, []);

  const onConfirm = useCallback(() => {
    setConfirmed(true);
  }, []);

  const dateStr = WD_LONG[dayObj.wd] + ", " + MONTH_NAMES[6] + " " + dayObj.day;
  const canConfirm = selSlot !== null && !confirmed;

  return (
    <div className="dps-scope">
      <style>{CSS}</style>

      <div className="dps-card" role="group" aria-label="Book a viewing">
        {/* Header */}
        <div className="dps-head">
          <div className="dps-badge" aria-hidden="true">
            <span className="material-symbols-outlined">event_available</span>
          </div>
          <div className="dps-head-txt">
            <h2 className="dps-title">Book a viewing</h2>
            <p className="dps-sub">{CONTEXT_SUB}</p>
          </div>
        </div>

        {/* Day strip */}
        <div className="dps-lbl">
          <span className="dps-lbl-t">Choose a day</span>
          <span className="dps-lbl-month">{MONTH_LABEL}</span>
        </div>
        <div className="dps-week" role="listbox" aria-label="Days">
          {WEEK.map((d) => {
            const sel = d.iso === selDayIso;
            const isToday = d.iso === TODAY_ISO;
            return (
              <button
                key={d.iso}
                type="button"
                role="option"
                aria-selected={sel}
                disabled={d.disabled}
                className={"dps-day" + (sel ? " is-sel" : "")}
                onClick={() => onPickDay(d.iso)}
                aria-label={WD_LONG[d.wd] + " July " + d.day + (d.disabled ? ", unavailable" : "")}
              >
                <span className="dps-day-wd">{d.wd}</span>
                <span className="dps-day-n">{d.day}</span>
                {isToday && !d.disabled ? <span className="dps-dot" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>

        {/* Slot grid */}
        <div className="dps-lbl">
          <span className="dps-lbl-t">Available times</span>
          <span className="dps-lbl-month">{dayObj.wd} · {dayObj.day} Jul</span>
        </div>
        {dayObj.disabled ? (
          <div className="dps-grid">
            <div className="dps-empty">No viewings on this day.</div>
          </div>
        ) : (
          <div className="dps-grid" role="listbox" aria-label="Time slots">
            {SLOTS.map((t, i) => {
              const isBooked = booked.has(i);
              const sel = selSlot === i;
              return (
                <button
                  key={t}
                  type="button"
                  role="option"
                  aria-selected={sel}
                  disabled={isBooked}
                  className={"dps-slot" + (sel ? " is-sel" : "")}
                  onClick={() => onPickSlot(i)}
                  aria-label={t + (isBooked ? ", booked" : "")}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="dps-foot">
          <div className="dps-summary">
            <span className="material-symbols-outlined" aria-hidden="true">
              {selSlot !== null ? "check_circle" : "schedule"}
            </span>
            <div className="dps-summary-txt">
              <div className="dps-summary-main">
                {selSlot !== null ? dateStr + " · " + SLOTS[selSlot] : dateStr}
              </div>
              <div className="dps-summary-sub">
                {selSlot !== null ? "30-minute viewing slot" : "Pick a time to continue"}
              </div>
            </div>
          </div>

          <div className="dps-actions">
            <button
              type="button"
              className={"dps-confirm" + (confirmed ? " is-done" : "")}
              disabled={!canConfirm}
              onClick={onConfirm}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {confirmed ? "task_alt" : "calendar_add_on"}
              </span>
              {confirmed ? "Viewing confirmed" : "Confirm viewing"}
            </button>
            <button type="button" className="dps-cancel" onClick={onReset}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Global export for the non-module harness. Root is NOT named DayPickerSlot.
window.DayPickerSlot = DayPickerSlotRoot;
