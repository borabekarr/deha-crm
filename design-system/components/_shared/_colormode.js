/* =========================================================================
   Deha preview — primary ("main color") mode switcher
   Cycles the `data-primary` attribute on <html> through the six brand
   palettes defined in colors_and_type.css (Emerald default + the five alt
   palettes shown on the Primary colors page). Persists in localStorage.
   Self-contained; sits under the dark-mode pill at the top-right.
   ========================================================================= */
(function () {
  if (window.__dehaColorMode) return;
  window.__dehaColorMode = true;

  var KEY = 'deha-preview-primary';
  /* value = data-primary attribute, swatch = the palette's own brand hue */
  var MODES = [
    { value: '',            label: 'Emerald',   swatch: '#10B981' },
    { value: 'sunflower',   label: 'Sunflower', swatch: 'oklch(82.6% 0.258 87.8)' },
    { value: 'bloodymary',  label: 'Bloody Mary', swatch: 'oklch(53.2% 0.207 24.9)' },
    { value: 'petalglow',   label: 'Petal Glow',  swatch: 'oklch(70.4% 0.196 8.0)' },
    { value: 'sexyblue',    label: 'Sexy Blue',   swatch: 'oklch(70.5% 0.173 243.9)' },
    { value: 'richgold',    label: 'Rich Gold',   swatch: 'oklch(83.9% 0.168 95.3)' }
  ];

  var root = document.documentElement;
  var idx = 0;
  try {
    var saved = localStorage.getItem(KEY);
    for (var i = 0; i < MODES.length; i++) if (MODES[i].value === saved) idx = i;
  } catch (e) {}

  function apply() {
    var v = MODES[idx].value;
    if (v) root.setAttribute('data-primary', v);
    else root.removeAttribute('data-primary');
  }
  apply();

  function injectStyle() {
    if (document.getElementById('cm-toggle-style')) return;
    var s = document.createElement('style');
    s.id = 'cm-toggle-style';
    s.textContent =
      '#cm-toggle{position:fixed;top:56px;right:14px;z-index:99999;' +
      'display:inline-flex;align-items:center;gap:7px;' +
      'font-family:"Montserrat",system-ui,sans-serif;font-size:12px;font-weight:800;' +
      'letter-spacing:0.01em;padding:8px 13px;border-radius:9999px;cursor:pointer;' +
      'color:#334155;background:rgba(255,255,255,0.92);border:1px solid #E2E8F0;' +
      '-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);' +
      'box-shadow:0 4px 14px rgba(15,23,42,0.12),inset 0 1px 0 rgba(255,255,255,0.9);' +
      'transition:background 160ms,color 160ms,border-color 160ms,transform 120ms cubic-bezier(.22,1,.36,1);}' +
      '#cm-toggle:hover{transform:translateY(-1px);}' +
      '#cm-toggle:active{transform:scale(0.96);}' +
      '#cm-dot{width:13px;height:13px;border-radius:9999px;flex:0 0 auto;' +
      'box-shadow:inset 0 1px 0 rgba(255,255,255,0.45),inset 0 -2px 0 rgba(15,23,42,0.14),0 0 0 1px rgba(15,23,42,0.10);}' +
      'html.dark #cm-toggle,[data-theme="dark"] #cm-toggle{color:#E2E8F0;background:rgba(30,41,59,0.92);' +
      'border-color:#334155;box-shadow:0 4px 14px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.08);}' +
      'html.dark #cm-dot,[data-theme="dark"] #cm-dot{box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),inset 0 -2px 0 rgba(0,0,0,0.30),0 0 0 1px rgba(255,255,255,0.14);}';
    document.head.appendChild(s);
  }

  function build() {
    injectStyle();
    if (document.getElementById('cm-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'cm-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Cycle primary brand color');
    btn.innerHTML = '<span id="cm-dot"></span><span class="cm-label"></span>';
    var dot = btn.querySelector('#cm-dot');
    var label = btn.querySelector('.cm-label');

    function refresh() {
      dot.style.background = MODES[idx].swatch;
      label.textContent = MODES[idx].label;
      btn.title = 'Primary color: ' + MODES[idx].label + ' — click to cycle';
    }
    refresh();

    btn.addEventListener('click', function () {
      idx = (idx + 1) % MODES.length;
      try { localStorage.setItem(KEY, MODES[idx].value); } catch (e) {}
      apply();
      refresh();
    });

    document.body.appendChild(btn);
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
