import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './AvatarPicker.css'

import { useState } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { validateUsername } from './avatar-picker-hook'

// ---------------------------------------------------------------------------
// AvatarPicker — profile-setup avatar picker
//
// Animation: the large avatar stage uses a React `key` prop on `.ap-big-art`
// that changes on every selection. Each remount re-triggers the CSS keyframe
// `apSwap` (rotate(-75deg) + scale(1) → scale(1.05) → scale(1)), so no JS
// animation driver is needed. The `key` on `.ap-avatar-name` does the same
// for the `apFade` keyframe.
//
// Scroll: strip scroll position and edge-arrow visibility are driven purely
// by scroll event handlers and derived state — no useEffect anywhere.
//
// Validation: delegated to `validateUsername()` in avatar-picker-hook.ts.
// `onComplete` fires only when username.trim().length >= 3.
//
// No useEffect / useLayoutEffect anywhere in this file.
// ---------------------------------------------------------------------------

export interface AvatarPickerProps {
  /** Fires when the user submits a valid avatar + username pair. */
  onComplete?: (data: { avatarId: number; username: string }) => void
}

interface Avatar {
  id: number
  ring: string   // rgb components, e.g. "239, 68, 68"
  src: string
  alt: string
}

const AVATARS: Avatar[] = [
  { id: 1, ring: '30, 41, 59',    src: '/avatars/black.jpg',  alt: 'Black'  },
  { id: 2, ring: '59, 130, 246',  src: '/avatars/blue.jpg',   alt: 'Blue'   },
  { id: 3, ring: '34, 197, 94',   src: '/avatars/green.jpg',  alt: 'Green'  },
  { id: 4, ring: '249, 115, 22',  src: '/avatars/orange.jpg', alt: 'Orange' },
  { id: 5, ring: '236, 72, 153',  src: '/avatars/pink.jpg',   alt: 'Pink'   },
  { id: 6, ring: '168, 85, 247',  src: '/avatars/purple.jpg', alt: 'Purple' },
  { id: 7, ring: '239, 68, 68',   src: '/avatars/red.jpg',    alt: 'Red'    },
  { id: 8, ring: '148, 163, 184', src: '/avatars/white.jpg',  alt: 'White'  },
]

export default function AvatarPicker({ onComplete }: AvatarPickerProps) {
  const [selected, setSelected] = useState<Avatar>(AVATARS[0])
  const [username, setUsername] = useState('')
  const [focused, setFocused] = useState(false)
  // Track scroll edges: canScrollLeft / canScrollRight
  // Discrete two-page slide: 0 = first 4 avatars, 1 = last 4 avatars
  const [page, setPage] = useState(0)
  const canScrollLeft  = page === 1
  const canScrollRight = page === 0

  const { isValid, showError, nearLimit, trimmed } = validateUsername(username)

  function submit() {
    if (!isValid) return
    onComplete?.({ avatarId: selected.id, username: trimmed })
  }

  // Discrete single-slide: page 0 = first 4 avatars, page 1 = last 4 avatars
  function scrollStrip(dir: 'left' | 'right') {
    setPage(dir === 'right' ? 1 : 0)
  }

  return (
    <div className="ap-card">
      <div className="ap-inner">

        {/* Header — icon + h2 vertically centered in same row, sub below */}
        <div className="ap-header">
          <div className="ap-header-row">
            <span className={iconClass('photo_camera') + ' ap-header-icon'}>photo_camera</span>
            <h2 className="ap-h2">Pick Your Avatar</h2>
          </div>
          <p className="ap-sub">Choose one to get started</p>
        </div>

        {/* Stage */}
        <div className="ap-stage">
          <div className="ap-ring-wrap">
            <span
              className="ap-ring"
              style={{
                boxShadow: `0 0 0 2px rgba(${selected.ring},0.55), 0 8px 28px rgba(${selected.ring},0.22)`,
              }}
            />
            <div className="ap-big-clip">
              {/* key remount re-triggers apSwap keyframe on every selection */}
              <div className="ap-big-art" key={selected.id}>
                <img
                  className="ap-big-img"
                  src={selected.src}
                  alt={selected.alt}
                  draggable={false}
                />
              </div>
            </div>
          </div>

          {/* key remount re-triggers apFade keyframe on every selection */}
          <span className="ap-avatar-name" key={'n' + selected.id}>{selected.alt}</span>

          {/* Thumbnail strip — arrows float at component edges, strip clips center */}
          <div
            className="ap-strip-outer"
            data-page={page}
            style={{ '--ap-page': page } as React.CSSProperties}
          >
            {/* Left edge arrow: at component left edge, only when on page 1 */}
            {canScrollLeft && (
              <div className="ap-edge ap-edge--left ap-edge--visible" aria-hidden="true">
                <button
                  type="button"
                  className="ap-edge-btn"
                  onClick={() => scrollStrip('left')}
                  aria-label="Scroll left"
                >
                  <span className={iconClass('arrow_back_ios')}>arrow_back_ios</span>
                </button>
              </div>
            )}

            {/* Clipping wrapper — 4 full thumbs + 5th peek, centered */}
            <div className="ap-strip-wrap">
              {/* Transform-driven track — all 8 avatars in a flex row */}
              <div className="ap-track">
                {AVATARS.map((a) => {
                  const on = a.id === selected.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={'ap-thumb' + (on ? ' ap-thumb--on' : '')}
                      style={on ? {
                        '--ap-ring-rgb': a.ring,
                      } as React.CSSProperties : undefined}
                      aria-label={'Select ' + a.alt}
                      aria-pressed={on}
                      onClick={() => setSelected(a)}
                    >
                      <img
                        className="ap-thumb-img"
                        src={a.src}
                        alt={a.alt}
                        draggable={false}
                      />
                    </button>
                  )
                })}
              </div>{/* end .ap-track */}
            </div>{/* end .ap-strip-wrap */}

            {/* Right edge arrow: at component right edge, only when on page 0 */}
            {canScrollRight && (
              <div className="ap-edge ap-edge--right ap-edge--visible" aria-hidden="true">
                <button
                  type="button"
                  className="ap-edge-btn"
                  onClick={() => scrollStrip('right')}
                  aria-label="Scroll right"
                >
                  <span className={iconClass('arrow_forward_ios')}>arrow_forward_ios</span>
                </button>
              </div>
            )}
          </div>{/* end .ap-strip-outer */}
        </div>

        {/* Username field */}
        <div className="ap-field">
          <div className="ap-field-top">
            <label className="ap-label" htmlFor="ap-username">
              <span className={iconClass('person') + ' ap-label-icon'}>person</span>
              Username
            </label>
            <span className={'ap-count' + (nearLimit ? ' ap-count--warn' : '')}>
              {username.length}/20
            </span>
          </div>

          <div className="ap-input-wrap">
            <span className={iconClass('edit') + ' ap-input-icon' + (focused ? ' ap-input-icon--on' : '')}>
              edit
            </span>
            <input
              id="ap-username"
              className={'ap-input' + (showError ? ' ap-input--err' : '')}
              type="text"
              aria-label="Username"
              placeholder="your_username..."
              maxLength={20}
              spellCheck={false}
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </div>

          {showError && (
            <p className="ap-err" role="alert">Username must be at least 3 characters</p>
          )}

          <button
            type="button"
            className="btn-green ap-submit"
            disabled={!isValid}
            onClick={submit}
          >
            Get Started
            <span
              className={iconClass('chevron_right') + ' ap-submit-icon'}
              style={{ fontVariationSettings: "'wght' 700" }}
            >
              chevron_right
            </span>
          </button>
        </div>

      </div>
    </div>
  )
}
