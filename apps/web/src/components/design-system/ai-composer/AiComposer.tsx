import { useState, useRef, useCallback } from 'react'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './AiComposer.css'
import { useAiComposerKeydown } from './ai-composer-hook'

// ---------- Static data ----------

const DEFAULT_TOOLS = [
  { id: 'terminal', label: 'Terminal',    icon: 'terminal' },
  { id: 'files',    label: 'File search', icon: 'folder_open' },
  { id: 'search',   label: 'Search',      icon: 'search' },
]

const AGENT_MODES = [
  { id: 'plan', label: 'Plan', icon: null   },
  { id: 'code', label: 'Code', icon: 'code' },
  { id: 'chat', label: 'Chat', icon: 'forum' },
]

const REASONING_LEVELS = [
  { id: 'low',    label: 'Low'    },
  { id: 'medium', label: 'Medium' },
  { id: 'high',   label: 'High'   },
]

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

// ---------- Progress ring (battery) ----------

interface RingProps {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
}

function Ring({ value, size = 26, stroke = 2.4, color = '#34D399', track = 'rgba(255,255,255,0.10)' }: RingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - clamp(value, 0, 100) / 100)
  return (
    <div className="tb-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset calc(480ms * var(--anim-mult,1)) cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="tb-ring-num">{Math.round(value)}</div>
    </div>
  )
}

// ---------- Types ----------

interface Tool {
  id: string
  label: string
  icon: string
}

interface AiComposerProps {
  placeholder?: string
  models?: string[]
  initialModel?: string
  tools?: Tool[]
  onSend?: (text: string, cfg: { model: string; agentMode: string; reasoning: string; activeTool: string | null }) => void
}

// ---------- Composer ----------

export default function AiComposer({
  placeholder = 'Type a message…',
  models = ['GPT 5.5', 'Sonnet 4.5', 'Gemini 2.5'],
  initialModel = 'GPT 5.5',
  tools = DEFAULT_TOOLS,
  onSend,
}: AiComposerProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [toolbarOpen, setToolbarOpen] = useState(false)
  const [toolbarClosing, setToolbarClosing] = useState(false)
  const toolbarCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Config state
  const [agentMode,  setAgentMode]  = useState('plan')
  const [reasoning,  setReasoning]  = useState('low')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [model, setModel]           = useState(initialModel)
  const [modelMenu, setModelMenu]   = useState(false)

  // ---- Custom top-edge vertical resize (no native diagonal grip) ----
  const BASE_INPUT_HEIGHT = 14
  const MAX_EXTRA = 200
  const [extraHeight, setExtraHeight] = useState(0)
  const [resizing, setResizing] = useState(false)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(true)
    const startY = e.clientY
    const startExtra = extraHeight
    const onMove = (ev: MouseEvent) => {
      const dy = startY - ev.clientY  // up = positive (grow), down = negative (shrink)
      setExtraHeight(Math.max(0, Math.min(MAX_EXTRA, startExtra + dy)))
    }
    const onUp = () => {
      setResizing(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [extraHeight])

  // System status (demo values)
  const battery = 85
  const host = 'M2 Air'
  const branch = 'main'

  // Derived: configured indicator
  const configured = !!(activeTool || agentMode !== 'plan' || reasoning !== 'low')

  const closeToolbar = useCallback(() => {
    if (toolbarCloseTimer.current) clearTimeout(toolbarCloseTimer.current)
    // Remove is-open immediately so tbBounceIn stops winning the cascade;
    // is-closing holds the row at 1fr and plays tbBounceOut for the exit.
    setToolbarOpen(false)
    setToolbarClosing(true)
    toolbarCloseTimer.current = setTimeout(() => {
      setToolbarClosing(false)
    }, 340)
  }, [])

  const toggleTools = () => {
    if (toolbarOpen) {
      closeToolbar()
    } else {
      if (toolbarCloseTimer.current) clearTimeout(toolbarCloseTimer.current)
      setToolbarClosing(false)
      setToolbarOpen(true)
      inputRef.current?.blur()
    }
  }

  // Escape key: closes model menu first, then toolbar.
  // Handled via a window keydown listener managed by a callback-ref hook.
  // The hook stores the handler in an internal ref updated via setEscapeHandler
  // (called from the rootRef callback, not during render).
  const { rootRef, setEscapeHandler } = useAiComposerKeydown(() => {
    // Initial no-op; overwritten by setEscapeHandler on mount
  })

  // Attach the root element: also update the escape handler inside the hook's ref.
  // We pass a combined ref that does both: mount the DOM listener AND store the
  // latest escape closure via setEscapeHandler.
  const rootCombinedRef = useCallback((el: HTMLDivElement | null) => {
    rootRef(el)
    if (el) {
      // Update escape handler with current closures at mount time.
      // This is safe: it runs in a callback-ref (not during render).
      setEscapeHandler(() => {
        setModelMenu(prev => {
          if (prev) return false
          closeToolbar()
          return false
        })
      })
    }
  }, [rootRef, setEscapeHandler, closeToolbar])

  const cycle = (arr: { id: string }[], current: string, setter: (v: string) => void) => {
    const idx = arr.findIndex(x => x.id === current)
    setter(arr[(idx + 1) % arr.length].id)
  }
  const cycleAgent     = () => cycle(AGENT_MODES, agentMode, setAgentMode)
  const cycleReasoning = () => cycle(REASONING_LEVELS, reasoning, setReasoning)

  const send = () => {
    if (!value.trim()) return
    onSend?.(value, { model, agentMode, reasoning, activeTool })
    setValue('')
    inputRef.current?.focus()
  }

  const currentAgent     = AGENT_MODES.find(m => m.id === agentMode)!
  const currentReasoning = REASONING_LEVELS.find(r => r.id === reasoning)!

  return (
    <div ref={rootCombinedRef} className={`composer-dock ${toolbarOpen ? 'open' : ''}`}>
      {/* "Close toolbar" floating pill — above the merged container */}
      <button
        type="button"
        className="close-toolbar-btn"
        onClick={closeToolbar}
        aria-label="Close toolbar"
      >
        <span className="material-symbols-outlined">keyboard_arrow_down</span>
        Close toolbar
      </button>

      {/* MERGED container — white input + black toolbar in one rounded shape */}
      <div className="composer-merged">
        {/* Input section */}
        <div className="input-bar">
          {/* Custom top-edge resize handle */}
          <hr
            className={`resize-handle ${resizing ? 'dragging' : ''}`}
            onMouseDown={startResize}
            aria-orientation="horizontal"
            aria-label="Resize message input"
            title="Drag to resize"
          />

          <textarea
            ref={inputRef}
            className="input-field"
            placeholder={placeholder}
            value={value}
            style={{ height: `${BASE_INPUT_HEIGHT + extraHeight}px` }}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            aria-label="Message"
          />

          <div className="ac-input-row">
            {/* + (attachment) */}
            <button className="ac-icon-btn" type="button" aria-label="Attach">
              <span className="material-symbols-outlined">add</span>
            </button>

            {/* Tools (wrench) */}
            <button
              className={`tools-btn ${toolbarOpen ? 'active' : ''} ${configured ? 'configured' : ''}`}
              type="button"
              aria-pressed={toolbarOpen}
              aria-expanded={toolbarOpen}
              aria-controls="composer-toolbar"
              aria-label={toolbarOpen ? 'Close tools' : `Open tools${configured ? ' (configured)' : ''}`}
              onClick={toggleTools}
            >
              <span className="material-symbols-outlined">handyman</span>
              <span className="badge-dot" aria-hidden="true" />
            </button>

            {/* Model pill */}
            <div style={{ position: 'relative' }}>
              <button
                className="model-pill"
                type="button"
                aria-haspopup="menu"
                aria-expanded={modelMenu}
                onClick={() => setModelMenu(v => !v)}
              >
                <span className="ac-glyph">
                  <span className="material-symbols-outlined">psychology</span>
                </span>
                {model}
              </button>
              {modelMenu && (
                <div
                  role="menu"
                  aria-label="Select model"
                  style={{
                    position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
                    background: '#0F172A',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: 6,
                    minWidth: 168,
                    boxShadow: '0 14px 40px -8px rgba(15,23,42,0.4), 0 4px 8px rgba(15,23,42,0.18)',
                    zIndex: 40,
                    display: 'flex', flexDirection: 'column', gap: 1,
                    animation: 'tbItemRise calc(220ms * var(--anim-mult,1)) cubic-bezier(.22,1,.36,1) both',
                  }}
                  onMouseLeave={() => setModelMenu(false)}
                >
                  {models.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="menuitemradio"
                      aria-checked={model === m}
                      onClick={() => { setModel(m); setModelMenu(false) }}
                      style={{
                        background: model === m ? 'rgba(16,185,129,0.12)' : 'transparent',
                        color: model === m ? '#34D399' : '#F1F5F9',
                        border: 'none', textAlign: 'left',
                        fontFamily: 'Montserrat', fontSize: 12.5, fontWeight: 700,
                        padding: '8px 12px',
                        borderRadius: 8, cursor: 'pointer',
                        letterSpacing: '-0.005em',
                        transition: 'background 140ms',
                      }}
                      onMouseEnter={(e) => { if (model !== m) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={(e) => { if (model !== m) e.currentTarget.style.background = 'transparent' }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ac-spacer" />

            {/* Mic */}
            <button
              className="ac-icon-btn"
              style={{ background: 'transparent' }}
              type="button"
              aria-label="Voice input"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ai-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span className="material-symbols-outlined">mic</span>
            </button>

            {/* Send */}
            <button
              className={`send-btn ${value.trim() ? 'ready' : ''}`}
              type="button"
              aria-label="Send"
              onClick={send}
              disabled={!value.trim()}
            >
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
          </div>
        </div>

        {/* TOOLBAR — in the same merged container, expands below the input.
            Always mounted; visibility/pointer-events toggled via CSS class. */}
        <section
          id="composer-toolbar"
          className={`toolbar ${toolbarOpen ? 'is-open' : ''} ${toolbarClosing ? 'is-closing' : ''}`}
          aria-label="Tools toolbar"
          aria-hidden={!toolbarOpen}
        >
          <div className="toolbar-inner">
            <div className="tb-row-top">
              <button
                className={`tb-chip ${agentMode !== 'plan' ? 'is-on' : ''}`}
                type="button"
                onClick={cycleAgent}
                aria-label={`Agent mode: ${currentAgent.label}, click to change`}
                style={{ animation: toolbarOpen ? 'tbItemRise calc(380ms * var(--anim-mult,1)) cubic-bezier(.22,1,.36,1) calc(100ms * var(--anim-mult,1)) both' : 'none' }}
              >
                {currentAgent.icon && <span className="material-symbols-outlined">{currentAgent.icon}</span>}
                {currentAgent.label}
                <span className="material-symbols-outlined caret">cached</span>
              </button>

              <button
                className={`tb-chip ${reasoning !== 'low' ? 'is-on' : ''}`}
                type="button"
                onClick={cycleReasoning}
                aria-label={`Reasoning: ${currentReasoning.label}, click to change`}
                style={{ animation: toolbarOpen ? 'tbItemRise calc(380ms * var(--anim-mult,1)) cubic-bezier(.22,1,.36,1) calc(160ms * var(--anim-mult,1)) both' : 'none' }}
              >
                <span className="material-symbols-outlined">bolt</span>
                {currentReasoning.label}
                <span className="material-symbols-outlined caret">cached</span>
              </button>

              <div className="tb-status">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span className="material-symbols-outlined">laptop_mac</span>
                  {host}
                </span>
                <span className="sep" />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span className="material-symbols-outlined">network_node</span>
                  {branch}
                </span>
                <span className="sep" />
                <Ring value={battery} />
              </div>
            </div>

            <div className="tb-actions">
              {tools.map((t, i) => (
                <button
                  key={t.id}
                  className={`tb-action ${activeTool === t.id ? 'is-active' : ''}`}
                  type="button"
                  aria-pressed={activeTool === t.id}
                  onClick={() => setActiveTool(prev => prev === t.id ? null : t.id)}
                  style={{ animation: toolbarOpen ? `tbItemRise calc(380ms * var(--anim-mult,1)) cubic-bezier(.22,1,.36,1) calc(${220 + i * 60}ms * var(--anim-mult,1)) both` : 'none' }}
                >
                  <span className="material-symbols-outlined">{t.icon}</span>
                  <span className="tb-action-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
