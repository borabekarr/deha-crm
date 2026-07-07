(function () {
  const { useCallback, useRef } = React;

  // ---------------------------------------------------------------------------
  // Inlined from controls-hook.ts — DOM-side behavior for .seg, .sw-base, .slider
  // ---------------------------------------------------------------------------

  function segRef(el) {
    if (!el) return;

    const pill = el.querySelector('.seg-pill');
    if (!pill) return;

    function reposition(animate) {
      const active = el.querySelector('button.active');
      if (!active) return;
      if (!animate) pill.style.transition = 'none';
      pill.style.left = active.offsetLeft + 'px';
      pill.style.width = active.offsetWidth + 'px';
      if (!animate) {
        void pill.offsetWidth;
        pill.style.transition = '';
      }
    }

    reposition(false);
    const resumeTimer = setTimeout(() => reposition(false), 60);

    function onResize() { reposition(false); }
    window.addEventListener('resize', onResize);

    function onClick(e) {
      const btn = e.target.closest('button');
      if (!btn || !el.contains(btn)) return;
      el.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      reposition(true);
    }
    el.addEventListener('click', onClick);

    el.__segCleanup = () => {
      clearTimeout(resumeTimer);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('click', onClick);
    };
  }

  function cleanupSeg(el) {
    if (!el) return;
    el.__segCleanup?.();
    delete el.__segCleanup;
  }

  function swRef(el) {
    if (!el) return;

    function onClick() {
      el.classList.add('sw-armed');
      const isOn = el.classList.toggle('sw-on');
      el.classList.toggle('sw-off', !isOn);
    }
    el.addEventListener('click', onClick);

    el.__swCleanup = () => {
      el.removeEventListener('click', onClick);
    };
  }

  function cleanupSw(el) {
    if (!el) return;
    el.__swCleanup?.();
    delete el.__swCleanup;
  }

  function sliderRef(el) {
    if (!el) return;

    const fill = el.querySelector('.fill');
    const thumb = el.querySelector('.thumb');
    if (!fill || !thumb) return;

    let pressed = false;

    function setFromClientX(clientX) {
      const rect = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const pctStr = (pct * 100).toFixed(1) + '%';
      fill.style.width = pctStr;
      thumb.style.left = pctStr;
    }

    function onDown(e) {
      pressed = true;
      el.classList.add('dragging');
      el.setPointerCapture(e.pointerId);
      setFromClientX(e.clientX);
    }
    function onMove(e) {
      if (!pressed) return;
      setFromClientX(e.clientX);
    }
    function onUp(e) {
      if (!pressed) return;
      pressed = false;
      el.classList.remove('dragging');
      try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    }

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    el.__sliderCleanup = () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }

  function cleanupSlider(el) {
    if (!el) return;
    el.__sliderCleanup?.();
    delete el.__sliderCleanup;
  }

  // ---------------------------------------------------------------------------
  // Controls component
  // ---------------------------------------------------------------------------

  function Controls() {
    // React 18 (this harness) calls callback refs with `null` on unmount instead
    // of invoking a returned cleanup function (React-19-only). Cleanup is
    // therefore stashed on the element itself and run in the null branch, with
    // a plain ref tracking the previously mounted element.
    const segElRef = useRef(null);
    const segCb = useCallback((el) => {
      if (el) {
        segElRef.current = el;
        segRef(el);
      } else {
        cleanupSeg(segElRef.current);
        segElRef.current = null;
      }
    }, []);

    const swElRef = useRef(null);
    const swCb = useCallback((el) => {
      if (el) {
        swElRef.current = el;
        swRef(el);
      } else {
        cleanupSw(swElRef.current);
        swElRef.current = null;
      }
    }, []);

    const sliderElRef = useRef(null);
    const sliderCb = useCallback((el) => {
      if (el) {
        sliderElRef.current = el;
        sliderRef(el);
      } else {
        cleanupSlider(sliderElRef.current);
        sliderElRef.current = null;
      }
    }, []);

    return (
      <div className="card">
        {/* Toggle row */}
        <div className="row">
          <div className="title">
            Toggle
            <div className="meta">switch</div>
          </div>
          <div className="sw-base sw-off" ref={swCb} />
        </div>

        {/* Segmented row */}
        <div className="row">
          <div className="title">
            Segmented
            <div className="meta">radio (1 of n)</div>
          </div>
          <div className="seg" ref={segCb}>
            <span className="seg-pill" />
            <button type="button" className="active">Leads</button>
            <button type="button">Qualified</button>
          </div>
        </div>

        {/* Slider row */}
        <div className="row">
          <div className="title">
            Slider
            <div className="meta">range input</div>
          </div>
          <div className="slider" ref={sliderCb}>
            <div className="fill" />
            <div className="thumb" />
          </div>
        </div>
      </div>
    );
  }

  window.Controls = Controls;
})();
