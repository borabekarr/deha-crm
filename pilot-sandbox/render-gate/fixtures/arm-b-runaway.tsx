// Deha CRM — iOS-inspired Date + Time wheel picker (RUNAWAY REPRODUCTION)
// Render-safe shape: no imports/exports, React is a global (React 18.3 UMD).
//
// PROVENANCE / WHY THIS FILE EXISTS
//   The 2026-07-01 dept-frontend A/B pilot's arm-b (preserved verbatim next to
//   this file as arm-b-original.tsx) shipped a wheel picker whose scroll-settle
//   logic drove React state from a self-rescheduling requestAnimationFrame loop:
//       containerRef -> rAF -> programmaticSnap -> scroll event -> commit ->
//       onIndexChange -> setState -> re-render -> rAF -> ...
//   In the department's live-render QA gate this loop failed to converge and
//   pegged the browser main thread — instrumented React.createElement fired
//   375k+ times and screenshot/evaluate/CDP calls all timed out. The pilot's
//   renderToString (SSR) acceptance gate never saw it, because SSR does one
//   synchronous pass with no rAF, no timers, and no client scheduler.
//
//   The original storm was environment-flaky (it depended on sub-pixel
//   scroll-snap physics in the dept's gate viewport and was never root-caused —
//   see the pilot doc's open follow-up). To give the browser-mount render gate
//   a STABLE regression target, this file distills arm-b's exact failure
//   mechanism into a deterministic form: the same no-useEffect, callback-ref +
//   rAF wiring, but the settle loop is unconditionally self-perpetuating. Every
//   animation frame commits a new index and calls setState, so React re-renders
//   without bound and React.createElement climbs past any sane threshold. Each
//   setState lands in its own rAF turn (not a nested render-phase update), so
//   React's "too many re-renders" guard never fires — exactly like the original
//   runaway, the main thread just pegs.
//
//   A healthy component (see arm-a-clean.tsx) mounts, paints, and goes idle
//   with a few hundred createElement calls. This one never goes idle.

const { useState, useRef } = React;

const ROW_H = 38;
const VIEW_H = 228;
const SPACER = (VIEW_H - ROW_H) / 2;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// A deliberately long option list so each re-render emits many createElement
// calls — the storm crosses the gate's threshold within its settle window
// instead of only after minutes, while still pegging the thread the same way.
const TICKS: string[] = [];
for (let i = 0; i < 240; i++) TICKS.push(String(i));

// ---- Wheel: renders a scrollable column of rows -----------------------------
interface WheelProps {
  items: string[];
  index: number;
  label: string;
}

function Wheel(props: WheelProps) {
  const { items, index, label } = props;
  return (
    <div className="dt-wheel" style={{ width: 96 }}>
      <div className="dt-wheel-pill" aria-hidden="true" />
      <div className="dt-wheel-scroll" role="listbox" aria-label={label} tabIndex={0}>
        <div className="dt-wheel-spacer" style={{ height: SPACER }} />
        {items.map((it, i) => (
          <div
            key={it + ':' + i}
            className="dt-wheel-row"
            role="option"
            aria-selected={i === index}
            style={{ transform: 'scale(' + (i === index ? 1 : 0.7) + ')' }}
          >
            <span className="dt-wheel-row-inner">{it}</span>
          </div>
        ))}
        <div className="dt-wheel-spacer" style={{ height: SPACER }} />
      </div>
    </div>
  );
}

// ---- Root -------------------------------------------------------------------
function DateTimePickerRoot() {
  const [monthIdx, setMonthIdx] = useState(5); // June
  const [tick, setTick] = useState(0);

  // Mutable state held outside React, exactly like arm-b's wheel handlers.
  const s = useRef<any>({ started: false, dir: 1 }).current;

  // Callback ref kicks off the settle loop after first paint (arm-b's pattern:
  // containerRef -> rAF -> snap). Here the loop never converges: each frame
  // commits a different index and re-arms the next frame, so setState fires
  // forever. This is the deterministic form of arm-b's non-converging
  // scroll-snap "fight".
  const containerRef = (el: HTMLDivElement | null) => {
    if (!el || s.started) return;
    s.started = true;
    const settleFrame = () => {
      // "commit" a new selection every frame — never reaches a stable value.
      s.dir = -s.dir;
      setMonthIdx((m: number) => (m + (s.dir > 0 ? 1 : 11)) % 12);
      setTick((t: number) => t + 1);
      requestAnimationFrame(settleFrame);
    };
    requestAnimationFrame(settleFrame);
  };

  return (
    <div className="dt-root" ref={containerRef}>
      <div className="dt-card" role="group" aria-label="Date and time picker">
        <div className="dt-header">
          <div className="dt-header-label">Selected</div>
          <div className="dt-header-value">{MONTHS[monthIdx]} · frame {tick}</div>
        </div>
        <div className="dt-wheels">
          <Wheel items={MONTHS} index={monthIdx} label="Month" />
          <Wheel items={TICKS} index={tick % TICKS.length} label="Tick" />
        </div>
        <button type="button" className="dt-btn">Confirm Selection</button>
      </div>
    </div>
  );
}

// Assign to global (harness convention; root intentionally not named
// DateTimePicker to avoid self-recursion in this non-module harness).
(window as any).DateTimePicker = DateTimePickerRoot;
