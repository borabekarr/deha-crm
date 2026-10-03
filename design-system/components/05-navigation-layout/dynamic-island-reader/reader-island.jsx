/* =========================================================================
   Dynamic Island — Reading Progress  ·  Deha Design System
   A floating, pill-shaped reading-progress indicator that lives in the
   iPhone Dynamic Island. Tracks scroll through long-form content and morphs
   between three states:
     • compact  — plain capsule (at the top of the article / idle)
     • expanded — progress track + live % (or time remaining)
     • complete — full emerald fill + check badge + confetti micro-burst
   Built for Deha (emerald brand, slate neutrals, Montserrat). Light mode.
   ========================================================================= */

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- accent palettes (fill / glow) ------------------------------------
const ACCENTS = {
  emerald: { base: '#10B981', bright: '#34D399', glow: 'rgba(16,185,129,0.55)' },
  blue: { base: '#3B82F6', bright: '#60A5FA', glow: 'rgba(59,130,246,0.55)' },
  violet: { base: '#8B5CF6', bright: '#A78BFA', glow: 'rgba(139,92,246,0.55)' },
  amber: { base: '#F59E0B', bright: '#FBBF24', glow: 'rgba(245,158,11,0.55)' }
};

// =========================================================================
// Article content (genuine prose — a reading-progress demo needs something
// real to read). Authored for the demo; swap `ARTICLE` for your own.
// =========================================================================
const ARTICLE = {
  category: 'Craft',
  title: 'The Quiet Craft of Interface Motion',
  author: 'Mara Lindqvist',
  initials: 'ML',
  date: 'May 29, 2026',
  readMin: 6,
  blocks: [
  { t: 'p', x: 'Good motion is the part of an interface you are not supposed to notice. It does its work in the gaps between taps — softening a transition, hinting at where a thing came from, telling you that the system heard you. When it is done well, people describe the product as “fast” or “polished” without ever pointing at the animation itself.' },
  { t: 'h', x: 'Motion is meaning' },
  { t: 'p', x: 'Every movement on screen is a small sentence. A panel that slides up from the bottom says it is temporary and dismissible. A card that scales out of a list says “this is the same object, now larger.” Break that grammar — animate a modal in from the left for no reason — and users feel the friction even if they cannot name it.' },
  { t: 'p', x: 'So the first question is never “what should move?” but “what does this movement say?” If the answer is nothing, the honest choice is stillness.' },
  { t: 'quote', x: 'Animation is not decoration laid on top of a screen. It is the continuity of the screen itself.' },
  { t: 'h', x: 'The two-hundred-millisecond window' },
  { t: 'p', x: 'There is a narrow band of time — roughly 150 to 300 milliseconds — where transitions feel responsive rather than sluggish or jarring. Faster than that and the eye misses the connection between before and after. Slower, and the interface starts to feel like it is wading through syrup.' },
  { t: 'p', x: 'Most micro-interactions should live near the bottom of that window. A button depressing, a chip toggling, a row expanding: 180 to 220 milliseconds is plenty. Reserve the longer durations for larger spatial changes, where the eye genuinely needs the extra time to follow an object across the screen.' },
  { t: 'h', x: 'Easing is editorial' },
  { t: 'p', x: 'Linear motion almost never feels right, because nothing in the physical world starts and stops instantly. The easing curve is where you inject character. A gentle ease-out lands things softly and reads as calm and trustworthy. A slight overshoot — a spring that settles just past its target — reads as playful and alive.' },
  { t: 'p', x: 'The trick is consistency. Pick two or three curves and use them everywhere: one for entrances, one for exits, one for the occasional celebratory moment. A system with a coherent motion vocabulary feels designed; a system with a different curve on every element feels accidental.' },
  { t: 'quote', x: 'Restraint is the most advanced motion technique there is.' },
  { t: 'h', x: 'Restraint as a feature' },
  { t: 'p', x: 'The temptation, once you have a good animation engine, is to animate everything. Resist it. Motion draws the eye, and an eye pulled in ten directions at once sees nothing. The most sophisticated interfaces spend their motion budget carefully — one well-orchestrated moment of delight beats a dozen competing twitches.' },
  { t: 'p', x: 'A reading-progress indicator is a perfect example. It should appear when it is useful, report quietly while you read, and celebrate exactly once, at the finish line. Everything else is noise.' },
  { t: 'h', x: 'Designing for the finish' },
  { t: 'p', x: 'The end of an article is a genuine accomplishment for the reader, and it deserves a small, honest reward — a fill that completes, a check that lands, a brief burst of color that fades before it overstays its welcome. The reward works precisely because the rest of the experience was restrained.' },
  { t: 'p', x: 'That is the whole craft, really: knowing the difference between motion that serves the reader and motion that serves the designer’s ego. Get that right, and the interface disappears, leaving only the words — which is exactly where the reader wanted to be all along.' },
  { t: 'end', x: 'You’ve reached the end.' }]

};

const WPM = 230;

// =========================================================================
// Article body (light-mode Deha typography)
// =========================================================================
function ArticleBody({ accent, dark }) {
  const fg1 = dark ? '#F1F5F9' : '#0F172A';
  const fg2 = dark ? '#CBD5E1' : '#334155';
  const fg3 = dark ? '#94A3B8' : '#64748B';
  const hair = dark ? 'rgba(148,163,184,0.18)' : '#EEF1F5';
  const a = ACCENTS[accent] || ACCENTS.emerald;

  return (
    <div style={{ padding: '70px 26px 64px', boxSizing: 'border-box' }}>
      {/* category */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 11px', borderRadius: 999,
        background: dark ? 'rgba(16,185,129,0.16)' : a.base,
        color: dark ? a.bright : '#fff',
        fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
        boxShadow: dark ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1.5px 0 rgba(0,0,0,0.14)'
      }}>{ARTICLE.category}</span>

      {/* title */}
      <h1 style={{
        margin: '16px 0 0', fontSize: 28, fontWeight: 900, lineHeight: 1.12,
        letterSpacing: '-0.025em', color: fg1, textWrap: 'pretty'
      }}>{ARTICLE.title}</h1>

      {/* byline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 18 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${a.bright}, ${a.base})`,
          display: 'grid', placeItems: 'center',
          color: '#fff', fontSize: 13, fontWeight: 800,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)'
        }}>{ARTICLE.initials}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: fg1 }}>{ARTICLE.author}</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: fg3 }}>
            {ARTICLE.date} · {ARTICLE.readMin} min read
          </span>
        </div>
      </div>

      {/* hero placeholder */}
      <div style={{
        marginTop: 22, height: 188, borderRadius: 18, overflow: 'hidden',
        position: 'relative', border: `1px solid ${hair}`,
        background: dark ? '#0E1626' : '#F6F8FB',
        backgroundImage: `repeating-linear-gradient(135deg, ${dark ? 'rgba(148,163,184,0.10)' : 'rgba(15,23,42,0.05)'} 0 10px, transparent 10px 20px)`,
        display: 'grid', placeItems: 'center'
      }}>
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 11, fontWeight: 600, color: fg3,
          background: dark ? 'rgba(14,22,38,0.8)' : 'rgba(255,255,255,0.8)',
          padding: '5px 10px', borderRadius: 8, letterSpacing: '0.04em'
        }}>cover · 16:9</span>
      </div>

      {/* blocks */}
      <div style={{ marginTop: 26 }}>
        {ARTICLE.blocks.map((b, i) => {
          if (b.t === 'h') return (
            <h2 key={i} style={{
              margin: '30px 0 0', fontSize: 19, fontWeight: 800,
              letterSpacing: '-0.015em', color: fg1, lineHeight: 1.25
            }}>{b.x}</h2>);

          if (b.t === 'quote') return (
            <blockquote key={i} style={{
              margin: '28px 0', padding: '4px 0 4px 18px',
              borderLeft: `3px solid ${a.base}`,
              fontSize: 18, fontWeight: 600, fontStyle: 'italic',
              lineHeight: 1.45, color: fg1, letterSpacing: '-0.01em', textWrap: 'pretty'
            }}>{b.x}</blockquote>);

          if (b.t === 'end') return (
            <div key={i} style={{
              margin: '40px 0 0', padding: '20px', borderRadius: 16,
              border: `1px dashed ${dark ? 'rgba(16,185,129,0.4)' : a.base}`,
              background: dark ? 'rgba(16,185,129,0.08)' : a.base + '12',
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: a.base }}>check_circle</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: fg1 }}>{b.x}</span>
            </div>);

          return (
            <p key={i} style={{
              margin: '14px 0 0', fontSize: 15.5, fontWeight: 500,
              lineHeight: 1.72, color: fg2, textWrap: 'pretty',
              letterSpacing: '-0.003em'
            }}>{b.x}</p>);

        })}
      </div>
    </div>);

}

// =========================================================================
// Confetti burst (rendered once on completion)
// =========================================================================
function Confetti({ accent }) {
  const a = ACCENTS[accent] || ACCENTS.emerald;
  const pieces = React.useMemo(() => {
    const cols = [a.base, a.bright, '#FFFFFF', '#FBBF24', a.base];
    return Array.from({ length: 14 }, (_, i) => {
      const ang = Math.PI * 2 * i / 14 + (Math.random() - 0.5);
      const dist = 26 + Math.random() * 26;
      return {
        tx: Math.cos(ang) * dist + 'px',
        ty: Math.sin(ang) * dist - 6 + 'px',
        rot: Math.random() * 360 - 180 + 'deg',
        color: cols[i % cols.length],
        delay: Math.random() * 60,
        round: Math.random() > 0.5
      };
    });
  }, [accent]);
  if (RM) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {pieces.map((p, i) =>
      <span key={i} className="di-confetti-piece" style={{
        background: p.color,
        borderRadius: p.round ? '50%' : 2,
        animationDelay: p.delay + 'ms',
        '--tx': p.tx, '--ty': p.ty, '--rot': p.rot
      }} />
      )}
    </div>);

}

// =========================================================================
// THE DYNAMIC ISLAND
// props: progress (0..1), mode ('compact'|'expanded'|'complete'),
//        accent, showMode ('percent'|'time'|'off'), pillStyle ('island'|'glass'),
//        pulseKey (number — increments on milestone), onTap, celebrate
// =========================================================================
function DynamicIsland({ progress, mode, accent, showMode, pillStyle, pulseKey, onTap, celebrate, islandDark }) {
  const a = ACCENTS[accent] || ACCENTS.emerald;
  const glass = pillStyle === 'glass';
  const expanded = mode !== 'compact';
  const complete = mode === 'complete';
  const pct = Math.round(progress * 100);
  const minsLeft = Math.max(0, Math.ceil(ARTICLE.readMin * (1 - progress)));

  // ---- silhouette dimensions per state ----
  const W = expanded ? 330 : 126;
  const H = expanded ? 50 : 37;
  const R = expanded ? 25 : 22;

  // pill surface
  const surface = glass ?
  (islandDark ? {
    background: complete ? 'rgba(16,185,129,0.22)' : 'rgba(15,15,18,0.82)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.30), 0 12px 30px -10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.06)',
    backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)'
  } : {
    background: complete ? 'rgba(236,253,245,0.82)' : 'rgba(255,255,255,0.72)',
    boxShadow: '0 1px 2px rgba(15,23,42,0.10), 0 12px 30px -10px rgba(15,23,42,0.28), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(15,23,42,0.06)',
    backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)'
  }) :
  (islandDark ? {
    background: complete ? '#0D2E22' : '#0F0F12',
    boxShadow: expanded ?
    '0 2px 6px rgba(0,0,0,0.45), 0 16px 36px -10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.05)' :
    '0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.05)'
  } : {
    background: complete ? 'rgba(236,253,245,0.96)' : '#FFFFFF',
    boxShadow: expanded ?
    '0 2px 6px rgba(0,0,0,0.22), 0 16px 36px -10px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(15,23,42,0.06)' :
    '0 2px 6px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(15,23,42,0.06)'
  });

  const trackBg = islandDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)';
  const labelColor = islandDark ? '#F1F5F9' : '#0F172A';
  const iconColor = islandDark ? 'rgba(255,255,255,0.55)' : '#475569';

  // milestone glow toggles via key change on the fill
  const fillRef = React.useRef(null);
  React.useEffect(() => {
    if (RM || !fillRef.current || pulseKey === 0) return;
    const el = fillRef.current;
    el.classList.remove('di-fill-glow');void el.offsetWidth;el.classList.add('di-fill-glow');
  }, [pulseKey]);

  return (
    <div style={{
      position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50
    }}>
      <div
        className="di-pill di-tap"
        role="button"
        tabIndex={0}
        aria-label={complete ? 'Reading complete. Tap to scroll to top.' : `Reading progress ${pct} percent. Tap to scroll to top.`}
        onClick={onTap}
        onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();onTap();}}}
        style={{
          width: W, height: H, borderRadius: R,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'visible', position: 'relative',
          outline: 'none',
          ...surface
        }}>
        
        {/* pulse wrapper (milestone scale bump) */}
        <div
          key={pulseKey}
          className={pulseKey > 0 && !RM ? 'di-pulse' : ''}
          style={{
            width: '100%', height: '100%', position: 'relative',
            display: 'flex', alignItems: 'center'
          }}>
          
          {/* ---------- COMPACT FACE ---------- */}
          <div className="di-face" style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 13px',
            opacity: expanded ? 0 : 1,
            pointerEvents: expanded ? 'none' : 'auto'
          }}>
            {progress > 0.001 ?
            <React.Fragment>
                <span className="material-symbols-outlined" style={{
                fontSize: 15, color: a.base,
                fontVariationSettings: '"FILL" 1'
              }}>{complete ? 'check_circle' : 'menu_book'}</span>
                {/* mini progress ring */}
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" fill="none" stroke={trackBg} strokeWidth="2.5" />
                  <circle cx="10" cy="10" r="8" fill="none" stroke={a.bright} strokeWidth="2.5"
                strokeLinecap="round" strokeDasharray={2 * Math.PI * 8}
                strokeDashoffset={2 * Math.PI * 8 * (1 - progress)}
                transform="rotate(-90 10 10)"
                style={{ transition: RM ? 'none' : 'stroke-dashoffset 200ms ease' }} />
                </svg>
              </React.Fragment> :
            <span />}
          </div>

          {/* ---------- EXPANDED / COMPLETE FACE ---------- */}
          <div className="di-face" style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 16px',
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'scale(1)' : 'scale(0.96)',
            pointerEvents: expanded ? 'auto' : 'none'
          }}>
            {/* leading reading glyph — same white book icon in both reading and done states */}
            <span className="material-symbols-outlined" style={{
              fontSize: 18, color: iconColor,
              fontVariationSettings: '"FILL" 1', flexShrink: 0
            }}>menu_book</span>

            {/* progress track */}
            <div style={{
              flex: 1, height: 8, borderRadius: 999, background: trackBg,
              position: 'relative', overflow: 'hidden'
            }}>
              <div ref={fillRef} style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: progress * 100 + '%',
                borderRadius: 999,
                background: `linear-gradient(90deg, ${a.base}, ${a.bright})`,
                boxShadow: `0 0 10px ${a.glow}`
              }}>
                {/* sweeping shine — clipped to the green fill so it never runs past it */}
                {!RM && !complete && progress > 0.02 &&
                <div style={{ position: 'absolute', inset: 0, borderRadius: 999, overflow: 'hidden' }}>
                    <span style={{
                    position: 'absolute', top: 0, bottom: 0, left: '-30%', width: 36,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    animation: 'diShine 1.8s ease-in-out infinite'
                  }} />
                  </div>
                }
              </div>
            </div>

            {/* trailing label OR check badge */}
            {complete ?
            <div style={{ position: 'relative', flexShrink: 0, width: 28, height: 28 }}>
                <div className="di-check-pop" style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `linear-gradient(135deg, ${a.bright}, ${a.base})`,
                display: 'grid', placeItems: 'center',
                boxShadow: `0 0 12px ${a.glow}, inset 0 1px 0 rgba(255,255,255,0.5)`
              }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={RM ? {} : { strokeDasharray: 28, strokeDashoffset: 28, animation: 'diCheckDraw 360ms 120ms cubic-bezier(.65,0,.35,1) forwards' }} />
                  </svg>
                </div>
                {celebrate && <Confetti accent={accent} />}
              </div> :
            showMode === 'off' ? null :
            <span style={{
              flexShrink: 0, minWidth: showMode === 'time' ? 54 : 38, textAlign: 'right',
              fontSize: 14, fontWeight: 800, color: labelColor,
              letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums'
            }}>
                {showMode === 'time' ? `${minsLeft} min` : `${pct}%`}
              </span>
            }
          </div>
        </div>
      </div>
    </div>);

}

// =========================================================================
// MAIN
// =========================================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "emerald",
  "showMode": "percent",
  "pillStyle": "island",
  "collapseIdle": false,
  "celebrate": true,
  "darkArticle": false,
  "darkIsland": true
} /*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const scrollerRef = React.useRef(null);
  const [disp, setDisp] = React.useState(0); // smoothed 0..1
  const [mode, setMode] = React.useState('compact'); // compact | expanded | complete
  const [pulseKey, setPulseKey] = React.useState(0);
  const [scale, setScale] = React.useState(1);

  const targetRef = React.useRef(0);
  const dispRef = React.useRef(0);
  const rafRef = React.useRef(0);
  const msRef = React.useRef(0); // last milestone crossed
  const idleTimer = React.useRef(null);

  // ---- smoothing loop: lerp displayed toward target (spring-ish ease) ----
  const tick = React.useCallback(() => {
    const tgt = targetRef.current;
    const d = dispRef.current;
    const nd = d + (tgt - d) * 0.16;
    if (Math.abs(tgt - nd) < 0.0006) {
      dispRef.current = tgt;setDisp(tgt);rafRef.current = 0;
      checkMilestone(tgt);return;
    }
    dispRef.current = nd;setDisp(nd);
    checkMilestone(nd);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ---- milestone detection (25/50/75) ----
  const checkMilestone = (v) => {
    const pc = v * 100;
    const ms = pc >= 75 ? 75 : pc >= 50 ? 50 : pc >= 25 ? 25 : 0;
    if (ms > msRef.current) {msRef.current = ms;if (!RM) setPulseKey((k) => k + 1);} else
    if (ms < msRef.current) {msRef.current = ms;}
  };

  // ---- scroll handler (passive) ----
  const onScroll = React.useCallback(() => {
    const el = scrollerRef.current;if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
    targetRef.current = p;
    if (RM) {dispRef.current = p;setDisp(p);checkMilestone(p);} else
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);

    // completion shows ONLY while actually at the very bottom; swiping up
    // immediately returns to live progress and counts down from 100%.
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;

    // visual mode
    if (atBottom) setMode('complete');else
    if (p <= 0.002) setMode('compact');else
    setMode('expanded');

    // auto-collapse-when-idle option
    if (t.collapseIdle && !atBottom && p > 0.002) {
      clearTimeout(idleTimer.current);
      setMode('expanded');
      idleTimer.current = setTimeout(() => setMode('compact'), 1500);
    }
  }, [tick, t.collapseIdle]);

  React.useEffect(() => {
    const el = scrollerRef.current;if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  // ---- fit device to viewport ----
  React.useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 28) / 898, (window.innerWidth - 40) / 426));
    fit();window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const scrollToTop = () => {
    const el = scrollerRef.current;if (!el) return;
    el.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
  };

  const dark = t.darkArticle;
  const screenBg = dark ? '#0B1220' : '#FFFFFF';

  return (
    <React.Fragment>
      {/* ---------- iPhone ---------- */}
      <div style={{
        transform: `scale(${scale})`, transformOrigin: 'center center'
      }}>
        <div style={{
          padding: 12, background: '#0a0a0a', borderRadius: 56,
          boxShadow: '0 50px 90px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
        }}>
          <div style={{
            width: 402, height: 874, borderRadius: 46, overflow: 'hidden',
            position: 'relative', background: screenBg
          }}>
            {/* status bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
              <IOSStatusBar dark={dark} />
            </div>

            {/* scrollable article */}
            <div ref={scrollerRef} className="di-scroll" style={{
              height: '100%', overflowY: 'auto', position: 'relative',
              WebkitOverflowScrolling: 'touch'
            }}>
              <ArticleBody accent={t.accent} dark={dark} />
            </div>

            {/* the dynamic island (floats above content) */}
            <DynamicIsland
              progress={disp}
              mode={mode}
              accent={t.accent}
              showMode={t.showMode}
              pillStyle={t.pillStyle}
              pulseKey={pulseKey}
              celebrate={t.celebrate}
              islandDark={t.darkIsland}
              onTap={scrollToTop} />
            

            {/* home indicator */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
              height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              paddingBottom: 9, pointerEvents: 'none'
            }}>
              <div style={{
                width: 139, height: 5, borderRadius: 100,
                background: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.28)'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Tweaks ---------- */}
      <TweaksPanel>
        <TweakSection label="Indicator" />
        <TweakToggle label="Dark island" value={t.darkIsland}
        onChange={(v) => setTweak('darkIsland', v)} />
        <TweakColor label="Accent" value={t.accent === 'emerald' ? '#10B981' : t.accent === 'blue' ? '#3B82F6' : t.accent === 'violet' ? '#8B5CF6' : '#F59E0B'}
        options={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']}
        onChange={(hex) => setTweak('accent', hex === '#10B981' ? 'emerald' : hex === '#3B82F6' ? 'blue' : hex === '#8B5CF6' ? 'violet' : 'amber')} />
        <TweakRadio label="Readout" value={t.showMode}
        options={['percent', 'time', 'off']}
        onChange={(v) => setTweak('showMode', v)} />
        <TweakRadio label="Pill style" value={t.pillStyle}
        options={['island', 'glass']}
        onChange={(v) => setTweak('pillStyle', v)} />
        <TweakSection label="Behavior" />
        <TweakToggle label="Collapse when idle" value={t.collapseIdle}
        onChange={(v) => setTweak('collapseIdle', v)} />
        <TweakToggle label="Confetti on finish" value={t.celebrate}
        onChange={(v) => setTweak('celebrate', v)} />
        <TweakSection label="Article" />
        <TweakToggle label="Dark article" value={t.darkArticle}
        onChange={(v) => setTweak('darkArticle', v)} />
      </TweaksPanel>
    </React.Fragment>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);