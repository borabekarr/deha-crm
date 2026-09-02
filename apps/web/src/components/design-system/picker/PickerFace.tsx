// Render-only split of PickerBody's day/month and hour/minute FAB-expanding
// faces (react-doctor no-giant-component). Class names, DOM order, inline
// style values and markup are unchanged from the parent -- the two call
// sites in Picker.tsx pass in the same style-helper functions, state and
// `wheel` render closure the parent already owned, only the JSX moved.
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import {
  shellStyle,
  boxStyle,
  glyphStyle,
  contentStyle,
  closeStyle,
  headerRowStyle,
  headerColStyle,
  titleStyle,
  selectionBarStyle,
  footerRowStyle,
} from './picker-styles'

interface PickerFaceProps {
  screenLabel: string
  open: boolean
  onBoxClick: () => void
  triggerAriaLabel: string
  onTriggerKeyDown: (e: React.KeyboardEvent) => void
  triggerIcon: string
  badgeLabel: string | null
  titleIconColor: string
  titleIcon: string
  titleText: string
  closeAriaLabel: string
  onClose: (e: MouseEvent) => void
  trayStyle?: CSSProperties
  trayChildren: ReactNode
  todayBtnIcon: string
  todayBtnLabel: string
  onTodayClick: (e: MouseEvent) => void
  onConfirmClick: (e: MouseEvent) => void
}

export function PickerFace({
  screenLabel,
  open,
  onBoxClick,
  triggerAriaLabel,
  onTriggerKeyDown,
  triggerIcon,
  badgeLabel,
  titleIconColor,
  titleIcon,
  titleText,
  closeAriaLabel,
  onClose,
  trayStyle,
  trayChildren,
  todayBtnIcon,
  todayBtnLabel,
  onTodayClick,
  onConfirmClick,
}: PickerFaceProps) {
  return (
    <div style={shellStyle(open)} data-screen-label={screenLabel}>
      <div
        className="pk-box"
        data-open={open ? 'true' : 'false'}
        style={boxStyle(open, !!badgeLabel)}
        onClick={onBoxClick}
      >
        {/* F10: single glyph row, always mounted -- the icon span never
            unmounts across the confirm morph, only its size/position (and
            the badge text's opacity/max-width) transition via CSS on
            [data-confirmed]. */}
        <button
          type="button"
          style={{ ...glyphStyle(open), background: 'none', border: 'none', padding: 0, font: 'inherit' }}
          tabIndex={open ? -1 : 0}
          aria-label={triggerAriaLabel}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="pk-glyph-row" data-confirmed={badgeLabel ? 'true' : 'false'}>
            <span className="material-icons pk-trigger-icon">{triggerIcon}</span>
            <span className="pk-trigger-badge">{badgeLabel ?? ''}</span>
          </span>
        </button>

        <div style={contentStyle(open)}>
          <div style={headerRowStyle(open)}>
            <div style={headerColStyle}>
              <span style={titleStyle}>
                <span className="material-icons" style={{ fontSize: '20px', color: titleIconColor }}>
                  {titleIcon}
                </span>
                {titleText}
              </span>
            </div>
            <button type="button" aria-label={closeAriaLabel} style={closeStyle(open)} onClick={onClose}>
              <span className="material-icons" style={{ fontSize: '15px' }}>close</span>
            </button>
          </div>

          <div className="pk-tray" style={trayStyle}>
            <div className="pk-bar" style={selectionBarStyle} />
            {trayChildren}
          </div>

          <div style={footerRowStyle}>
            <button type="button" className="pk-today-btn" onClick={onTodayClick}>
              <span className="material-icons btn-mi">{todayBtnIcon}</span>
              {todayBtnLabel}
            </button>
            <button type="button" className="btn-primary" onClick={onConfirmClick}>
              <span className="material-icons btn-mi">check</span>Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
