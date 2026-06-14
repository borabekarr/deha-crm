import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_controls.css'
import '../../../../design-system/preview/_darkmode.css'
import './FileFolder.css'

import { FILES, type ViewMode, useFileFolder } from './file-folder-hook'

/* ── Paper helper ─────────────────────────────────────────────────────────── */
function Paper({ variant }: { variant: 'back' | 'mid' | 'front' }) {
  const lines: Array<{ cls: string }> =
    variant === 'back'
      ? [{ cls: 'w2' }, { cls: 'w1' }, { cls: 'w4' }, { cls: 'w3' }]
      : [{ cls: 'w2' }, { cls: 'w4' }, { cls: 'w1' }, { cls: 'w3' }]

  return (
    <div className={`ff-paper ff-paper--${variant}`}>
      {lines.map((l, i) => (
        <div key={i} className={`line ${l.cls}`} />
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
  folderRef: React.RefObject<HTMLDivElement>
  onClick: () => void
}

function FolderIcon({ id, hot, isPlaying, isTapped, folderRef, onClick }: FolderIconProps) {
  const classes = [
    'folder',
    hot ? 'hot' : '',
    isPlaying ? 'play' : '',
    isTapped ? 'tap' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} id={id} ref={folderRef} onClick={onClick}>
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
        <div className="ff-title">Work files</div>
        <div className="ff-sub">Notes &amp; More</div>
        <div className="ff-dots">
          <i /><i /><i />
        </div>
        <div className="ff-count">
          <span className="material-symbols-outlined">file_copy</span>
          2,386 Files
        </div>
      </div>
    </div>
  )
}

/* ── File row / grid cell ─────────────────────────────────────────────────── */
function FileRow({ file }: { file: (typeof FILES)[number] }) {
  return (
    <div className="ff-file" style={{ '--c': file.color } as React.CSSProperties}>
      <span className="ff-file-ic">{file.ext}</span>
      <span className="ff-file-meta">
        <span className="ff-file-name">{file.name}</span>
        <span className="ff-file-sub">{file.type} · {file.size}</span>
      </span>
    </div>
  )
}

/* ── Segmented control (list / grid) ──────────────────────────────────────── */
interface SegmentedProps {
  view: ViewMode
  onChange: (v: ViewMode) => void
}

function SegmentedViewToggle({ view, onChange }: SegmentedProps) {
  return (
    <div className="seg compact fill">
      <span className="seg-pill" />
      <button
        className={view === 'list' ? 'active' : ''}
        onClick={() => onChange('list')}
      >
        List
      </button>
      <button
        className={view === 'grid' ? 'active' : ''}
        onClick={() => onChange('grid')}
      >
        Grid
      </button>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function FileFolder() {
  const {
    blueState,
    redState,
    popState,
    cardCallbackRef,
    blueFolderRef,
    redFolderRef,
    popRef,
    playAll,
    closePop,
    handleBlueClick,
    handleRedClick,
    setView,
  } = useFileFolder()

  return (
    <div className="card" ref={cardCallbackRef}>
      <div className="ff-stage">
        {/* NORMAL · BLUE */}
        <div className="ff-col">
          <FolderIcon
            id="ff-blue"
            isPlaying={blueState.isPlaying}
            isTapped={blueState.isTapped}
            folderRef={blueFolderRef}
            onClick={handleBlueClick}
          />
          <div className="ff-cap">
            <span className="dot blue" />
            Default
          </div>
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
          />
          <div className="ff-cap">
            <span className="dot red" />
            Hot · active
          </div>
        </div>
      </div>

      <div className="ff-hint">hover to lift &amp; glow · click a folder to open its files</div>

      <button className="ff-replay" onClick={playAll}>
        <span className="material-symbols-outlined">replay</span>
        Replay load
      </button>

      {/* Scrim */}
      <div
        className={`ff-scrim${popState.isOpen ? ' show' : ''}`}
        onClick={closePop}
      />

      {/* File list popover */}
      <div
        className={`ff-pop${popState.isOpen ? ' show' : ''}`}
        ref={popRef}
        role="dialog"
        aria-modal="true"
        aria-label="Folder files"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ff-pop-head">
          <div>
            <div className="ff-pop-title">{popState.title}</div>
            <div className="ff-pop-sub">{popState.subtitle}</div>
          </div>
          <button
            className="ff-pop-close"
            aria-label="Close"
            onClick={closePop}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="ff-pop-tools">
          <SegmentedViewToggle view={popState.view} onChange={setView} />
        </div>

        <div className={`ff-pop-body${popState.view === 'grid' ? ' grid' : ''}`}>
          {FILES.map((f) => (
            <FileRow key={f.name} file={f} />
          ))}
        </div>
      </div>
    </div>
  )
}
