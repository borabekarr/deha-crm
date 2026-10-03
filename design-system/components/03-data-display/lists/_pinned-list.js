
/* =========================================================================
   Deha — Pinned List
   Vanilla JS. Pin an item and it springs up into the "Pinned" section via a
   FLIP layout animation (real DOM nodes are moved, never recreated). The
   pinned-section header fades/collapses when empty. Built on Deha tokens.
   ========================================================================= */
(function () {
  'use strict';

  var DATA = [
    { id: 'inbox',   name: 'Inbox',      sub: 'Mail · 12 unread',          icon: 'mail',           pinned: true  },
    { id: 'cal',     name: 'Calendar',   sub: 'Schedule · 3 events today', icon: 'calendar_month', pinned: false },
    { id: 'analytics', name: 'Analytics', sub: 'Reports · Updated 2h ago',  icon: 'insights',       pinned: true  },
    { id: 'chat',    name: 'Team Chat',  sub: 'Messaging · 5 channels',    icon: 'forum',          pinned: false },
    { id: 'files',   name: 'Files',      sub: 'Storage · 48 GB used',      icon: 'folder',         pinned: false },
    { id: 'billing', name: 'Billing',    sub: 'Payments · Due in 4 days',  icon: 'payments',       pinned: false }
  ];

  var itemsPinned = document.getElementById('itemsPinned');
  var itemsAll    = document.getElementById('itemsAll');
  var secPinned   = document.getElementById('secPinned');
  var secAll      = document.getElementById('secAll');
  var cntPinned   = document.getElementById('cntPinned');
  var cntAll      = document.getElementById('cntAll');

  /* ---- build a card node once; we MOVE it between sections (FLIP) ----- */
  function build(item) {
    var el = document.createElement('div');
    el.className = 'pl-item' + (item.pinned ? ' is-pinned' : '');
    el.dataset.id = item.id;
    el.innerHTML =
      '<span class="pl-ico"><span class="material-icons">' + item.icon + '</span></span>' +
      '<div class="pl-main">' +
        '<div class="pl-name">' + item.name + '</div>' +
        '<div class="pl-sub">' + item.sub + '</div>' +
      '</div>' +
      '<button class="pl-pin" type="button" aria-label="Toggle pin"><span class="material-icons">push_pin</span></button>';
    el.querySelector('.pl-pin').addEventListener('click', function () { toggle(item, el); });
    item._el = el;
    return el;
  }

  /* ---- place every card in the correct section, in DATA order -------- */
  function layout() {
    DATA.forEach(function (it) {
      var target = it.pinned ? itemsPinned : itemsAll;
      if (it._el.parentNode !== target) target.appendChild(it._el);
      else target.appendChild(it._el); // keep DATA order within a section
      it._el.classList.toggle('is-pinned', it.pinned);
    });
    var np = DATA.filter(function (d) { return d.pinned; }).length;
    var na = DATA.length - np;
    cntPinned.textContent = np;
    cntAll.textContent = na;
    secPinned.classList.toggle('empty', np === 0);
    secAll.classList.toggle('solo', np === 0);
    secAll.classList.toggle('no-items', na === 0);
  }

  /* ---- FLIP: snapshot rects, mutate, invert, play (WAAPI) ------------
     Everything that moves is measured — the item cards AND the section
     headers — so the whole surface travels on ONE clock. The pinned-section
     header collapses instantly in layout (its CSS transition is off) and is
     carried by the same FLIP instead, which is what makes the reorder read
     as a single fluent motion rather than two overlapping ones. */
  var FLIP_MS = 300;
  var FLIP_EASE = 'cubic-bezier(.22, 1, .36, 1)';
  var FOLLOW_MS = 40; // neighbours trail the card you clicked
  var running = [];

  function movers() {
    return DATA.map(function (d) { return d._el; })
      .concat(Array.prototype.slice.call(document.querySelectorAll('.pl-head')));
  }

  var flyTimer = null;

  function toggle(item, el) {
    // let an in-flight reorder settle to its end state before re-measuring
    running.forEach(function (x) { x.finish(); });
    running = [];

    var nodes = movers();
    var first = nodes.map(function (n) { return n.getBoundingClientRect(); });

    item.pinned = !item.pinned;
    layout();

    var mult = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--anim-mult')) || 1;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var subjectAnim = null;

    if (!reduce) {
      nodes.forEach(function (n, i) {
        var f = first[i], l = n.getBoundingClientRect();
        var dx = f.left - l.left, dy = f.top - l.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

        var isSubject = n === el;
        // Choreography: the card you clicked leads, everything it displaced
        // follows a beat later. Simultaneous departure is what made the
        // reorder read as the whole list lurching at once.
        var dur   = (isSubject ? FLIP_MS : FLIP_MS - 60) * mult;
        var delay = isSubject ? 0 : FOLLOW_MS * mult;

        // Speed-proportional motion blur: peak blur scales with how far the
        // node travels, and is gone by the time it lands. Two keyframes per
        // property would apply the easing per interval and hitch the travel,
        // so transform keeps a single interval while blur rides its own
        // linear track on the same clock.
        var peak = Math.min(1.5, Math.abs(dy) / 150);

        var anim = n.animate([
          { transform: 'translate(' + dx + 'px,' + dy + 'px)' },
          { transform: 'none' }
        ], { duration: dur, delay: delay, easing: FLIP_EASE, fill: 'backwards' });
        running.push(anim);
        if (isSubject) { subjectAnim = anim; }
        anim.finished.then(function () {
          running = running.filter(function (x) { return x !== anim; });
        }, function () {});

        if (peak > 0.3) {
          n.animate([
            { filter: 'blur(0px)' },
            { filter: 'blur(' + peak.toFixed(2) + 'px)', offset: 0.18 },
            { filter: 'blur(0px)', offset: 0.72 },
            { filter: 'blur(0px)' }
          ], { duration: dur, delay: delay, easing: 'linear', fill: 'backwards' });
        }
      });
    }

    // The toggled card lifts above its neighbours while it travels. The lift
    // is dropped off the animation's own finish event — a setTimeout started
    // before the animation's first frame drifts out of sync with it, which is
    // what left the shadow hanging after the card had landed.
    if (flyTimer) { window.clearTimeout(flyTimer); flyTimer = null; }
    document.querySelectorAll('.pl-item.is-flying').forEach(function (n) {
      n.classList.remove('is-flying');
    });
    if (subjectAnim) {
      el.classList.add('is-flying');
      var drop = function () { el.classList.remove('is-flying'); };
      subjectAnim.onfinish = drop;
      subjectAnim.oncancel = drop;
    }

    // pin glyph flips with the same clock
    var pin = el.querySelector('.pl-pin');
    pin.style.setProperty('--rot', item.pinned ? '-45deg' : '0deg');
    pin.classList.remove('flip'); void pin.offsetWidth; pin.classList.add('flip');
  }

  /* ---- initial render with a staggered entrance ---------------------- */
  DATA.forEach(build);
  layout();
  /* Only run the staggered entrance when the page is actually visible and
     motion is allowed — otherwise rows can stay stuck at opacity:0 in a
     throttled/paused render (thumbnails, background tabs). */
  var canAnimate = document.visibilityState === 'visible' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canAnimate) {
    DATA.forEach(function (it, i) {
      var c = it._el;
      c.classList.add('preanim', 'anim');
      requestAnimationFrame(function () {
        setTimeout(function () { c.classList.remove('preanim'); }, 60 + i * 70);
        setTimeout(function () { c.classList.remove('anim'); }, 60 + i * 70 + 660);
      });
    });
  }
})();
