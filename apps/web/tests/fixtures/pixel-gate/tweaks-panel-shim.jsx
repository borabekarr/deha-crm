/**
 * Gate-harness shim for `tweaks-panel.jsx`.
 *
 * `tweaks-panel.jsx` is ambient dev tooling that only ever existed inside
 * the claude.ai/design authoring environment (confirmed absent from
 * origin/HEAD at ab6b66f) — it is not part of the raw source and never will
 * be. The raw/<slug> prototypes stay verbatim; this shim supplies the
 * missing environment so they can mount under the pixel gate's local
 * server. `useTweaks` returns the caller's own defaults untouched and
 * `setTweak` is a no-op-with-state-update, so every component renders in
 * its canonical default state — exactly what the pixel gate needs to diff
 * against. The panel components themselves are pure dev chrome (sliders,
 * toggles, etc. for live-tweaking during authoring) and render nothing.
 *
 * Loaded as a classic (non-module) <script type="text/babel">, so globals
 * are attached to `window` explicitly rather than relying on top-level
 * const/let leaking across script tags.
 */

window.useTweaks = function useTweaks(defaults) {
  const [t, setT] = React.useState(defaults);
  const setTweak = (key, value) => setT((s) => ({ ...s, [key]: value }));
  return [t, setTweak];
};

window.TweaksPanel = function TweaksPanel() {
  return null;
};

window.TweakSection = function TweakSection() {
  return null;
};

window.TweakSlider = function TweakSlider() {
  return null;
};

window.TweakText = function TweakText() {
  return null;
};

window.TweakToggle = function TweakToggle() {
  return null;
};

window.TweakRadio = function TweakRadio() {
  return null;
};

window.TweakSelect = function TweakSelect() {
  return null;
};
