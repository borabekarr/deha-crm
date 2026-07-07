(function () {
  const { useState, useRef, useCallback } = React;

  // ---------------------------------------------------------------------------
  // Inlined from streak-card-hook.ts — entrance animation + RAF/timer
  // orchestration for the StreakCard component.
  //
  // NO raw useEffect. The entrance animation is wired via a callback ref on
  // the .streak element. Cleanup (timers + RAF) is stored on the element
  // itself so the null branch of the callback ref can cancel everything.
  // ---------------------------------------------------------------------------

  const RING_R = 15.2;
  const RING_C = 2 * Math.PI * RING_R;

  function tween(el, from, to, dur, format, onEnd) {
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = format(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(frame);
      else if (onEnd) onEnd();
    }
    requestAnimationFrame(frame);
  }

  function setBarWidth(bar, pct, withFlash) {
    bar.style.width = pct + '%';
    if (withFlash) {
      clearTimeout(bar.__stkFlashTimer);
      bar.classList.add('flash');
      bar.__stkFlashTimer = setTimeout(() => { bar.classList.remove('flash'); }, 520);
    }
  }

  function drawRing(container) {
    const rp = container.querySelector('.ring-prog');
    if (rp) {
      requestAnimationFrame(() => {
        rp.style.strokeDashoffset = rp.getAttribute('data-off') ?? '';
      });
    }
  }

  function streakCardRef(el) {
    if (!el) return;

    const barEl = el.querySelector('.sc-bar-fill');
    if (!barEl) return;

    const card = el;
    let settleTimer = null;
    let barRevealTimer = null;

    function runLoad() {
      if (settleTimer) clearTimeout(settleTimer);
      if (barRevealTimer) clearTimeout(barRevealTimer);

      barEl.style.transition = 'none';
      setBarWidth(barEl, 0, false);
      void barEl.offsetWidth;

      card.classList.remove('anim-in');
      void card.offsetWidth;
      card.classList.add('anim-in');

      barRevealTimer = setTimeout(() => {
        barEl.style.transition = '';
        setBarWidth(barEl, 68.25, true);
        drawRing(card);
      }, 540);

      settleTimer = setTimeout(() => {
        card.classList.remove('anim-in');
        barEl.style.transition = 'none';
        setBarWidth(barEl, 68.25, false);
        const rp = card.querySelector('.ring-prog');
        if (rp) {
          rp.style.transition = 'none';
          rp.style.strokeDashoffset = rp.getAttribute('data-off') ?? '';
        }
        requestAnimationFrame(() => {
          barEl.style.transition = '';
          if (rp) rp.style.transition = '';
        });
      }, 1300);
    }

    runLoad();

    el.__stkCleanup = () => {
      if (settleTimer) clearTimeout(settleTimer);
      if (barRevealTimer) clearTimeout(barRevealTimer);
    };
  }

  function cleanupStreakCard(el) {
    if (!el) return;
    el.__stkCleanup?.();
    delete el.__stkCleanup;
  }

  // ---------------------------------------------------------------------------
  // RingSVG — ring geometry mirrors hook constants; initial dashoffset = full
  // circumference (invisible)
  // ---------------------------------------------------------------------------

  function RingSVG({ pct }) {
    const off = RING_C * (1 - pct);
    const circumStr = RING_C.toFixed(2);
    return (
      <svg viewBox="0 0 35 35">
        <circle cx="17.5" cy="17.5" r={RING_R} fill="none" stroke="var(--sc-ring-track)" strokeWidth="3.4" />
        <circle
          className="ring-prog"
          cx="17.5" cy="17.5" r={RING_R}
          fill="none" stroke="#10B981" strokeWidth="3.4"
          strokeLinecap="round"
          strokeDasharray={circumStr}
          strokeDashoffset={circumStr}
          data-off={off.toFixed(2)}
        />
      </svg>
    );
  }

  // ---------------------------------------------------------------------------
  // Windowing constants
  // ---------------------------------------------------------------------------

  const WINDOW_SIZE = 7;
  const WINDOW_THRESHOLD = WINDOW_SIZE - 3; // = 4

  function windowStart(cur) {
    return Math.max(0, cur - WINDOW_THRESHOLD);
  }

  // ---------------------------------------------------------------------------
  // Data model — verbatim from prototype state object
  // ---------------------------------------------------------------------------

  const INITIAL_STATE = {
    streakDays: 32,
    steps: 6825,
    maxSteps: 10000,
    cur: 3,
    days: [
      { label: 'Mon', done: true },
      { label: 'Tue', done: true },
      { label: 'Wed', done: true },
      { label: 'Thu', done: false }, // today, in progress (~72%)
      { label: 'Fri', done: false },
      { label: 'Sat', done: false },
      { label: 'Sun', done: false },
    ],
    activeRingPct: 0.72,
  };

  const DOW_CYCLE = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function nextWeekday(label) {
    const i = DOW_CYCLE.indexOf(label);
    return DOW_CYCLE[(i + 1) % 7];
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function pctOf(steps, maxSteps) {
    return Math.round((steps / maxSteps) * 100);
  }

  // ---------------------------------------------------------------------------
  // Day dot renderer — pure JSX equivalent of prototype renderDays()
  // ---------------------------------------------------------------------------

  function DayDots({ days, visibleCur, activeRingPct }) {
    return (
      <div className="sc-days">
        {days.map((d, i) => {
          const isActive = !d.done && i === visibleCur;
          const cls = 'sc-day' + (d.done ? ' is-done' : isActive ? ' is-active' : '');
          return (
            <div key={d.label} className={cls} style={{ '--i': i }}>
              {d.done ? (
                <div className="sc-dot done">
                  <span className="material-icons">check</span>
                </div>
              ) : isActive ? (
                <div className="sc-dot active">
                  <RingSVG pct={activeRingPct} />
                </div>
              ) : (
                <div className="sc-dot empty" />
              )}
              <div className="sc-day-label">{d.label}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // StreakCard
  // ---------------------------------------------------------------------------

  function StreakCard() {
    const [state, setState] = useState(() => ({ ...INITIAL_STATE, days: INITIAL_STATE.days.map((d) => ({ ...d })) }));

    // Refs to DOM nodes used by the hook / interaction handlers
    const cardRef = useRef(null);
    const streakNumRef = useRef(null);
    const stepsValRef = useRef(null);
    const stepsPctRef = useRef(null);
    const barRef = useRef(null);
    const flameRef = useRef(null);

    // ---------------------------------------------------------------------------
    // Callback ref for the .streak element — wires entrance animation via hook.
    // React 18 (this harness) calls callback refs with `null` on unmount instead
    // of invoking a returned cleanup function (React-19-only). Cleanup is
    // therefore stashed on the element and run in the null branch.
    // ---------------------------------------------------------------------------
    const handleCardRef = useCallback((el) => {
      if (!el) {
        cleanupStreakCard(cardRef.current);
        cardRef.current = null;
        return;
      }
      cardRef.current = el;
      streakCardRef(el);
    }, []);

    // ---------------------------------------------------------------------------
    // Interaction handlers (mirrors prototype replay / markDone / nextDay / addSteps)
    // ---------------------------------------------------------------------------

    function handleReplay() {
      setState((prev) => ({
        ...INITIAL_STATE,
        days: INITIAL_STATE.days.map((d) => ({ ...d })),
        streakDays: prev.streakDays,
        steps: prev.steps,
      }));
      const card = cardRef.current;
      if (!card) return;
      streakCardRef(card);
    }

    function handleMarkDone() {
      setState((prev) => {
        const d = prev.days[prev.cur];
        if (!d || d.done) return prev;
        const newDays = prev.days.map((day, i) => (i === prev.cur ? { ...day, done: true } : day));
        const fromStreak = prev.streakDays;
        const newStreakDays = prev.streakDays + 1;

        if (streakNumRef.current) {
          tween(streakNumRef.current, fromStreak, newStreakDays, 520, (v) => String(Math.round(v)), () => {
            if (streakNumRef.current) {
              streakNumRef.current.textContent = String(newStreakDays);
              streakNumRef.current.classList.remove('elastic');
              void streakNumRef.current.offsetWidth;
              streakNumRef.current.classList.add('elastic');
            }
          });
        }

        if (flameRef.current) {
          flameRef.current.classList.remove('flare');
          void flameRef.current.offsetWidth;
          flameRef.current.classList.add('flare');
        }

        return { ...prev, days: newDays, streakDays: newStreakDays };
      });
    }

    function handleNextDay() {
      setState((prev) => {
        const newCur = prev.cur + 1;
        const newWStart = windowStart(newCur);
        const needed = newWStart + WINDOW_SIZE;
        let newDays = prev.days;
        while (newDays.length < needed) {
          const lastLabel = newDays[newDays.length - 1].label;
          newDays = [...newDays, { label: nextWeekday(lastLabel), done: false }];
        }

        requestAnimationFrame(() => {
          if (cardRef.current) drawRing(cardRef.current);
        });

        return { ...prev, days: newDays, cur: newCur };
      });
    }

    function handleAddSteps() {
      setState((prev) => {
        const fromSteps = prev.steps;
        const newSteps = Math.min(prev.maxSteps, prev.steps + 1250);
        const fromPct = pctOf(fromSteps, prev.maxSteps);
        const newPct = pctOf(newSteps, prev.maxSteps);

        if (stepsValRef.current) {
          tween(stepsValRef.current, fromSteps, newSteps, 880, fmt, () => {
            if (stepsValRef.current) {
              stepsValRef.current.textContent = fmt(newSteps);
              stepsValRef.current.classList.remove('bump');
              void stepsValRef.current.offsetWidth;
              stepsValRef.current.classList.add('bump');
            }
          });
        }
        if (stepsPctRef.current) {
          tween(stepsPctRef.current, fromPct, newPct, 880, (v) => Math.round(v) + '%');
        }
        if (barRef.current) setBarWidth(barRef.current, newPct, true);

        return { ...prev, steps: newSteps };
      });
    }

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    const pct = pctOf(state.steps, state.maxSteps);

    const wStart = windowStart(state.cur);
    const visibleDays = state.days.slice(wStart, wStart + WINDOW_SIZE);
    const visibleCur = state.cur - wStart;

    return (
      <div className="stk-root">
        <div className="card" style={{ padding: 0, background: '#F8FAFC' }}>
          <div className="frame">

            {/* Shell bezel */}
            <div className="shell sc-shell" style={{ borderRadius: '32px' }}>

              {/* The streak card — entrance animation wired via callback ref */}
              <div
                className="streak"
                ref={handleCardRef}
                data-screen-label="Streak card"
              >
                {/* HEAD */}
                <div className="sc-head">
                  <div className="sc-flame" ref={flameRef}>
                    <span className="material-symbols-outlined">local_fire_department</span>
                  </div>
                  <div className="sc-head-text">
                    <div className="sc-eyebrow">Streak</div>
                    <div className="sc-streak">
                      <span className="sc-streak-num" ref={streakNumRef}>{state.streakDays}</span>
                      <span className="sc-streak-unit">Days</span>
                    </div>
                  </div>
                  <div className="sc-foot" title="Step tracking">
                    <span className="material-symbols-outlined">footprint</span>
                  </div>
                </div>

                <div className="sc-divider" />

                {/* Day dots — sliced to the derived 7-cell window */}
                <DayDots days={visibleDays} visibleCur={visibleCur} activeRingPct={state.activeRingPct} />

                {/* Steps */}
                <div className="sc-steps">
                  <div className="sc-eyebrow">Steps</div>
                  <div className="sc-steps-row">
                    <div className="sc-steps-num">
                      <span className="sc-steps-val" ref={stepsValRef}>{fmt(state.steps)}</span>
                      <span className="sc-steps-max">/{fmt(state.maxSteps)}</span>
                    </div>
                    <div className="sc-pct" ref={stepsPctRef}>{pct}%</div>
                  </div>
                  <div className="sc-bar">
                    <div
                      className="sc-bar-fill"
                      ref={barRef}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Demo controls */}
            <div className="sc-controls">
              <button type="button" className="sc-btn" onClick={handleReplay}>
                <span className="material-icons">replay</span>Replay
              </button>
              <button type="button" className="sc-btn" onClick={handleMarkDone}>
                <span className="material-icons">check</span>Mark done
              </button>
              <button type="button" className="sc-btn" onClick={handleNextDay}>
                <span className="material-icons">arrow_forward</span>Next day
              </button>
              <button type="button" className="sc-btn" onClick={handleAddSteps}>
                <span className="material-icons">directions_walk</span>+1,250 steps
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  window.StreakCard = StreakCard;
})();
