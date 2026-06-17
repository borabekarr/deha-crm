import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_controls.css'
import '../../../../design-system/preview/_darkmode.css'
import './FileFolder.css'

import { FILES, useFileFolder } from './file-folder-hook'

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
        <div className="ff-title">
          <span className="material-symbols-outlined ff-title-ic">folder</span>
          Work files
        </div>
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
function FileRow({ file }: { file: (typeof FILES)[number] }) {
  return (
    <div className="ff-file">
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
    cardCallbackRef,
    blueFolderRef,
    redFolderRef,
    popRef,
    playAll,
    closePop,
    handleBlueClick,
    handleRedClick,
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

      {/* File list popover — role="dialog" div so opacity/scale fade works (native <dialog> is display:none when closed) */}
      <div
        className={`ff-pop-shell${popState.isOpen ? ' show' : ''}`}
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
              <div className="ff-pop-title">{popState.title}</div>
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

          <div className="ff-pop-body">
            {FILES.map((f) => (
              <FileRow key={f.name} file={f} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
