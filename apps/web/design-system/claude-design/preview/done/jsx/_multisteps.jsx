(function () {
  const { useState, useRef, useCallback } = React;

  // ---------------------------------------------------------------------------
  // Inlined from multisteps-hook.ts — imperative DOM logic for the morphing
  // capsule indicator, ripple, and celebrate.
  // ---------------------------------------------------------------------------

  const H    = 38;
  const PAD  = H / 2;
  const S_IN = 24;
  const GAP  = 22;
  const S_OUT= 28;
  const REST = 13;

  function geometry(c, n) {
    const active    = c + 1;
    const capW      = 2 * PAD + c * S_IN;
    const remaining = n - active;
    const total     = remaining > 0
      ? capW + GAP + (remaining - 1) * S_OUT + REST / 2
      : capW;
    return { active, capW, remaining, total };
  }

  function mountStage(el, n, onDotClick, capsuleEl) {
    if (!el || !capsuleEl) return;
    if (el.__msDots) return;

    const dots = [];

    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'ms-dot intro';
      d.dataset.i = String(i);
      d.style.animationDelay = `${i * 90}ms`;
      const idx = i;
      d.addEventListener('click', () => onDotClick(idx));
      el.appendChild(d);
      dots.push(d);
    }

    el.__msDots = dots;
    el.__msPrev  = 0;

    el.__msLayout = function layout(c, animatePop) {
      const g = geometry(c, n);
      el.style.width         = `${g.total}px`;
      capsuleEl.style.width  = `${g.capW}px`;

      for (let i = 0; i < n; i++) {
        const d = dots[i];
        let x;
        if (i <= c) {
          d.classList.add('is-active');
          x = PAD + i * S_IN;
        } else {
          d.classList.remove('is-active');
          const r = i - g.active;
          x = g.capW + GAP + r * S_OUT;
        }
        d.style.left = `${x}px`;
      }

      const prev = el.__msPrev ?? 0;
      if (animatePop && c > prev) {
        const frontier = dots[c];
        frontier.classList.remove('pop');
        void frontier.offsetWidth;
        frontier.classList.add('pop');
      }
      el.__msPrev = c;
    };

    el.__msCleanup = () => {
      dots.forEach((d) => { try { el.removeChild(d); } catch { /* noop */ } });
      delete el.__msDots;
      delete el.__msLayout;
      delete el.__msPrev;
      delete el.__msCleanup;
    };
  }

  function cleanupStage(el) {
    if (!el) return;
    el.__msCleanup?.();
  }

  function mountSurface(el) {
    if (!el) return;

    function addMounted() {
      el.classList.add('mounted');
    }

    requestAnimationFrame(() => requestAnimationFrame(addMounted));
    setTimeout(addMounted, 80);

    el.__msIntroTimer = setTimeout(() => {
      el.querySelectorAll('.ms-dot.intro').forEach((d) => d.classList.remove('intro'));
    }, 1400);
  }

  function cleanupSurface(el) {
    if (!el) return;
    if (el.__msIntroTimer != null) {
      clearTimeout(el.__msIntroTimer);
      delete el.__msIntroTimer;
    }
    el.classList.remove('mounted');
  }

  function ripple(btn, ev) {
    const r = document.createElement('span');
    r.className = 'ms-ripple';
    const rect  = btn.getBoundingClientRect();
    const size  = Math.max(rect.width, rect.height) * 1.15;
    const px    = ev.clientX ? ev.clientX - rect.left : rect.width  / 2;
    const py    = ev.clientY ? ev.clientY - rect.top  : rect.height / 2;
    r.style.width  = `${size}px`;
    r.style.height = `${size}px`;
    r.style.left   = `${px}px`;
    r.style.top    = `${py}px`;
    btn.appendChild(r);
    setTimeout(() => { if (r.parentNode) r.parentNode.removeChild(r); }, 640);
  }

  function celebrate(btn, capsuleEl) {
    btn.classList.remove('celebrate');
    void btn.offsetWidth;
    btn.classList.add('celebrate');

    capsuleEl.style.boxShadow =
      '0 0 0 6px rgba(16,185,129,0.18), ' +
      'var(--shadow-emerald-glow-sm), ' +
      'inset 0 1px 0 rgba(255,255,255,0.55), ' +
      'inset 0 -2px 0 rgba(0,0,0,0.20), ' +
      'inset 0 0 0 1px rgba(255,255,255,0.15)';
    setTimeout(() => { capsuleEl.style.boxShadow = ''; }, 560);
  }

  // ---------------------------------------------------------------------------
  // Step data
  // ---------------------------------------------------------------------------

  const STEPS = [
    {
      icon: 'lightbulb',
      title: 'Welcome aboard',
      desc: "Let's get your workspace set up in three quick steps.",
    },
    {
      icon: 'tune',
      title: 'Personalize it',
      desc: 'Pick the defaults that match how your team likes to work.',
    },
    {
      icon: 'rocket_launch',
      title: "You're all set",
      desc: 'Review everything, then finish to start using Deha.',
    },
  ];

  const N = STEPS.length;

  function StepPane({ step }) {
    return (
      <div className="ms-pane swap-in">
        <div className="ms-icon">
          <span className="material-symbols-outlined">{step.icon}</span>
        </div>
        <div className="ms-title">{step.title}</div>
        <div className="ms-desc">{step.desc}</div>
      </div>
    );
  }

  function Multisteps() {
    const [cur, setCur] = useState(0);
    const [paneKey, setPaneKey] = useState(0);
    const [, setDir] = useState(1);

    const capsuleRef   = useRef(null);
    const nextBtnRef   = useRef(null);

    // React 18 (this harness) calls callback refs with `null` on unmount instead
    // of invoking a returned cleanup function (React-19-only). Cleanup here is
    // driven by the el/null branches directly, mirroring the source hook.
    const surfaceRefCb = useCallback((el) => {
      if (el) mountSurface(el);
      else cleanupSurface(el);
    }, []);

    function go(next) {
      const clamped = Math.max(0, Math.min(N - 1, next));
      if (clamped === cur) return;

      const newDir = clamped > cur ? 1 : -1;
      const stage = capsuleRef.current?.parentElement;
      if (stage?.__msLayout) {
        stage.__msPrev = cur;
        stage.__msLayout(clamped, true);
      }

      setDir(newDir);
      setCur(clamped);
      setPaneKey((k) => k + 1);
    }

    function handleDotClick(idx) {
      go(idx);
    }

    const stageRefCb = useCallback(
      (el) => {
        if (el) {
          mountStage(el, N, handleDotClick, capsuleRef.current);
          el.__msLayout?.(0, false);
        } else {
          cleanupStage(el);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    function handleNext() {
      if (cur < N - 1) {
        go(cur + 1);
      } else {
        if (nextBtnRef.current && capsuleRef.current) {
          celebrate(nextBtnRef.current, capsuleRef.current);
        }
      }
    }

    function handleBack() {
      go(cur - 1);
    }

    function handleNextPointerDown(e) {
      ripple(e.currentTarget, e.nativeEvent);
    }

    function handleBackPointerDown(e) {
      ripple(e.currentTarget, e.nativeEvent);
    }

    const isFirst  = cur === 0;
    const isFinish = cur === N - 1;

    return (
      <div className="card">
        <span className="label" style={{ alignSelf: 'flex-start' }}>
          Multistep · Onboarding
        </span>
        <div className="shell zoom" style={{ width: '100%', boxSizing: 'border-box', marginTop: 10 }}>
          <div className="ms-surface" ref={surfaceRefCb}>
            <div className="ms-eyebrow">Steps</div>

            <div className="ms-indicator">
              <div className="ms-stage" ref={stageRefCb}>
                <div className="ms-capsule" ref={capsuleRef} />
              </div>
            </div>

            <div className="ms-content">
              <StepPane key={paneKey} step={STEPS[cur]} />
            </div>

            <div className="ms-actions">
              <button
                type="button"
                className={`ms-btn ms-btn--back${isFirst ? '' : ' show'}`}
                onClick={handleBack}
                onPointerDown={handleBackPointerDown}
                aria-label="Go back"
              >
                Back
              </button>
              <button
                type="button"
                ref={nextBtnRef}
                className={`ms-btn ms-btn--primary${isFinish ? ' is-finish' : ''}`}
                onClick={handleNext}
                onPointerDown={handleNextPointerDown}
                aria-label={isFinish ? 'Finish setup' : 'Continue to next step'}
              >
                <span className="ms-check">
                  <span className="material-symbols-outlined">check</span>
                </span>
                <span className="ms-next-label">{isFinish ? 'Finish' : 'Continue'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  window.Multisteps = Multisteps;
})();
