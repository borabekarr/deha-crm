import './Toast.css'

// ── Live toastiva ───────────────────────────────────────────────────────────
// The real React-Native toastiva (Reanimated morph + gesture swipe + stacking)
// exported to a static web bundle and served from /public/toastiva/. Embedded
// here in an isolated iframe so its RN toolchain never touches the Vite stack.
// Tap a row inside the frame to fire a live toast.

export default function Toast() {
  return (
    <div className="tst-live-wrap">
      <iframe
        className="tst-live-frame"
        src="/toastiva/"
        title="toastiva — live demo"
        loading="lazy"
      />
      <p className="tst-live-note">
        Real <strong>toastiva</strong> running on react-native-web. Tap a row to fire a live toast —
        watch the pill morph, stack, and swipe-to-dismiss.
      </p>
    </div>
  )
}
