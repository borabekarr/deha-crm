import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_controls.css'
import '../../../../design-system/preview/_darkmode.css'
import './FileFolder.css'

import { useCallback } from 'react'
import { FILES, useFileFolder } from './file-folder-hook'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'

/* ── Paper helper ─────────────────────────────────────────────────────────── */
function Paper({ variant }: { variant: 'back' | 'mid' | 'front' }) {
  const lines: Array<{ cls: string }> =
    variant === 'back'
      ? [{ cls: 'w2' }, { cls: 'w1' }, { cls: 'w4' }, { cls: 'w3' }]
      : [{ cls: 'w2' }, { cls: 'w4' }, { cls: 'w1' }, { cls: 'w3' }]

  return (
    <div className={`ff-paper ff-paper--${variant}`}>
      {lines.map((l) => (
        <div key={l.cls} className={`line ${l.cls}`} />
      ))}
    </div>
  )
}

/* ── Single folder icon ───────────────────────────────────────────────────── */
interface FolderIconProps {
  id: string
  hot?: boolean
  isPlaying: boolean
  isTapped: boolean
  folderRef: React.RefObject<HTMLDivElement | null>
  onClick: () => void
  menuOpen: boolean
  onDotsClick: () => void
  onMenuAction: (action: string) => void
}

const FOLDER_MENU_ACTIONS: Array<{ id: string; label: string; icon: string; danger?: boolean }> = [
  { id: 'rename', label: 'Rename', icon: 'edit' },
  { id: 'share', label: 'Share', icon: 'ios_share' },
  { id: 'delete', label: 'Delete', icon: 'delete', danger: true },
]

function FolderIcon({
  id,
  hot,
  isPlaying,
  isTapped,
  folderRef,
  onClick,
  menuOpen,
  onDotsClick,
  onMenuAction,
}: FolderIconProps) {
  const classes = [
    'folder',
    hot ? 'hot' : '',
    isPlaying ? 'play' : '',
    isTapped ? 'tap' : '',
    menuOpen ? 'menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} id={id} ref={folderRef} onClick={onClick} data-proximity>
      <div className="ff-clip">
        <div className="ff-grad" />
        <div className="ff-papers">
          <Paper variant="back" />
          <Paper variant="front" />
          <Paper variant="mid" />
        </div>
        <svg
          className="ff-pocket"
          viewBox="0 0 268 268"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,98 H150 C168,98 172,124 192,124 H268 V268 H0 Z" />
        </svg>
      </div>
      <div className="ff-text">
        <div className="ff-title">
          <span className="material-symbols-outlined ff-title-ic">folder</span>
          Work files
        </div>
        <div className="ff-sub">Notes &amp; More</div>
        <button
          type="button"
          className={`ff-dots${menuOpen ? ' open' : ''}`}
          aria-label="Folder actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation()
            onDotsClick()
          }}
        >
          <i /><i /><i />
        </button>
        <div
          className={`ff-menu${menuOpen ? ' show' : ''}`}
          role="menu"
          aria-label="Folder actions"
          onClick={(e) => e.stopPropagation()}
        >
          {FOLDER_MENU_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="menuitem"
              className={`ff-menu-item${a.danger ? ' ff-menu-item--danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onMenuAction(a.id)
              }}
            >
              <span className="material-symbols-outlined">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
        <div className="ff-count">
          <span className="material-symbols-outlined">file_copy</span>
          2,386 Files
        </div>
      </div>
    </div>
  )
}

/* ── Per-type color class for file-type pill ──────────────────────────────── */
function extColorClass(ext: string): string {
  switch (ext.toUpperCase()) {
    case 'PDF': return 'ff-ext-pdf'
    case 'DOC':
    case 'DOCX': return 'ff-ext-doc'
    case 'XLS':
    case 'XLSX':
    case 'CSV': return 'ff-ext-xls'
    case 'PNG':
    case 'JPG':
    case 'JPEG':
    case 'GIF':
    case 'SVG':
    case 'FIG': return 'ff-ext-img'
    default: return 'ff-ext-default'
  }
}

/* ── File row / grid cell ─────────────────────────────────────────────────── */
function FileRow({ file, onClick }: { file: (typeof FILES)[number]; onClick: () => void }) {
  return (
    <div className="ff-file" onClick={onClick} data-proximity>
      <span className={`ff-file-ic ${extColorClass(file.ext)}`}>{file.ext}</span>
      <span className="ff-file-meta">
        <span className="ff-file-name">{file.name}</span>
        <span className="ff-file-sub">{file.type} · {file.size}</span>
      </span>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function FileFolder() {
  const {
    blueState,
    redState,
    popState,
    menuState,
    cardCallbackRef,
    blueFolderRef,
    redFolderRef,
    popRef,
    popBodyCallbackRef,
    handlePopBodyScroll,
    playAll,
    closePop,
    handleFileClick,
    handleBlueClick,
    handleRedClick,
    toggleMenu,
    closeMenu,
    handleMenuAction,
  } = useFileFolder()

  // Proximity: folder pair (click to open) + file rows inside the popover.
  // Merged with the hook's own popBodyCallbackRef (scroll-mask attribute).
  const foldersProximityRef = useProximityGroup<HTMLDivElement>()
  const filesProximityRef = useProximityGroup<HTMLDivElement>()
  const popBodyRef = useCallback(
    (el: HTMLDivElement | null) => {
      popBodyCallbackRef(el)
      filesProximityRef(el)
    },
    [popBodyCallbackRef, filesProximityRef],
  )

  return (
    <div className="card" ref={cardCallbackRef}>
      <div className="ff-stage" ref={foldersProximityRef}>
        {/* NORMAL · BLUE */}
        <div className="ff-col">
          <FolderIcon
            id="ff-blue"
            isPlaying={blueState.isPlaying}
            isTapped={blueState.isTapped}
            folderRef={blueFolderRef}
            onClick={handleBlueClick}
            menuOpen={menuState.isOpen && menuState.folderId === 'ff-blue'}
            onDotsClick={() => toggleMenu('ff-blue')}
            onMenuAction={handleMenuAction}
          />
        </div>

        {/* HOT · RED */}
        <div className="ff-col">
          <FolderIcon
            id="ff-red"
            hot
            isPlaying={redState.isPlaying}
            isTapped={redState.isTapped}
            folderRef={redFolderRef}
            onClick={handleRedClick}
            menuOpen={menuState.isOpen && menuState.folderId === 'ff-red'}
            onDotsClick={() => toggleMenu('ff-red')}
            onMenuAction={handleMenuAction}
          />
        </div>
      </div>

      <div className="ff-hint">hover to lift &amp; glow · click a folder to open its files</div>

      <button type="button" className="ff-replay" onClick={playAll}>
        <span className="material-symbols-outlined">replay</span>
        Replay load
      </button>

      {/* Scrim */}
      <div
        className={`ff-scrim${popState.isOpen ? ' show' : ''}`}
        onClick={closePop}
      />

      {/* Invisible click-out catcher for the 3-dots dropdown */}
      {menuState.isOpen && (
        <div className="ff-menu-catch" onClick={closeMenu} aria-hidden="true" />
      )}

      {/* File list popover — role="dialog" div so opacity/scale fade works (native <dialog> is display:none when closed) */}
      <div
        className={`ff-pop-outer${popState.isOpen ? ' show' : ''}`}
        ref={popRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- native <dialog> is display:none when closed, which kills the opacity/scale fade; an animated popover must stay a role="dialog" div */}
        <div
          className="ff-pop"
          role="dialog"
          aria-label="Folder files"
        >
          <div className="ff-pop-head">
            <div>
              <div className="ff-pop-title">
                <span className="material-symbols-outlined ff-pop-title-ic">description</span>
                {popState.title}
              </div>
              <div className="ff-pop-sub">{popState.subtitle}</div>
            </div>
            <button
              type="button"
              className="ff-pop-close"
              aria-label="Close"
              onClick={closePop}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="ff-pop-sep" />

          <div
            className="ff-pop-body"
            ref={popBodyRef}
            onScroll={handlePopBodyScroll}
          >
            {FILES.map((f) => (
              <FileRow key={f.name} file={f} onClick={handleFileClick} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
