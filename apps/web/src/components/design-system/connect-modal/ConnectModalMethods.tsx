// Render-only split of ConnectModal's method list + expanding API-key panel
// (react-doctor no-giant-component). Class names, DOM order and markup are
// unchanged from the parent; all state, timers and refs stay in ConnectModal
// and arrive here as props/callbacks.
import { iconClass } from '../../../lib/iconClass'
import InlineEdit from '../inline-edit/InlineEdit'
import { CheckPath, type ConnectMethod } from './ConnectModal'

interface ConnectModalMethodsProps {
  methods: ConnectMethod[]
  method: string | null
  valid: boolean
  selectMethod: (id: string) => void
  needsKey: boolean
  token: string
  sampleKey: string
  secure: boolean
  pasted: boolean
  targetName: string
  commitKey: (next: string) => void
  clearToken: () => void
  handlePaste: () => void
}

export function ConnectModalMethods({
  methods,
  method,
  valid,
  selectMethod,
  needsKey,
  token,
  sampleKey,
  secure,
  pasted,
  targetName,
  commitKey,
  clearToken,
  handlePaste,
}: ConnectModalMethodsProps) {
  return (
    <div className="cm-methods" role="radiogroup" aria-label="Connection method">
      {methods.map((m) => (
        // radio group members: button + role="radio" is the correct ARIA pattern
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <button
          type="button"
          key={m.id}
          className="cm-method"
          role="radio"
          aria-checked={method === m.id}
          aria-label={m.label}
          onClick={() => selectMethod(m.id)}
        >
          <span
            className="cm-icontile"
            data-active={method === m.id && valid ? 'true' : undefined}
            aria-hidden="true"
          >
            <span className={iconClass(m.icon)}>{m.icon}</span>
          </span>
          <span className="cm-mbody">
            <span className="cm-mhead">
              <span className="cm-mname">{m.label}</span>
              {m.recommended && (
                <span className="cm-badge-rec">
                  <span className={iconClass('verified')}>verified</span>
                  Recommended
                </span>
              )}
            </span>
            <span className="cm-mdesc">{m.desc}</span>
          </span>
          <span className="cm-radio" aria-hidden="true">
            <span className="cm-ring" />
            <span className="cm-fill">
              <CheckPath />
            </span>
          </span>
        </button>
      ))}

      {/* expanding API-key panel */}
      <div className="cm-expand" data-open={needsKey ? 'true' : undefined}>
        <div className="cm-expand-inner">
          <div className="cm-keypad">
            <span className="cm-keylabel">Enter your {targetName} API key</span>
            {/*
              cm-field composes the shared InlineEdit (design-system/inline-edit/InlineEdit.tsx)
              with the lock icon and paste/clear button either side. InlineEdit is imported
              unmodified: click-to-edit, Enter-to-commit, Escape/click-outside-to-cancel are all
              its own normal behavior. Its edit/save pencil button and "saved" toast are hidden
              via cm-keypad-scoped CSS -- Bora's ask is no separate edit button here.
            */}
            <div className="cm-field" data-filled={token.length > 0 ? 'true' : undefined}>
              <span
                className="cm-lock"
                data-secure={secure ? 'true' : undefined}
                data-filled={token.length > 0 ? 'true' : undefined}
                aria-hidden="true"
              >
                <span className={iconClass(token.length > 0 ? 'lock' : 'lock_open_right')}>
                  {token.length > 0 ? 'lock' : 'lock_open_right'}
                </span>
              </span>
              <InlineEdit
                fieldLabel={`${targetName} API key`}
                prefix={false}
                value={token || sampleKey}
                onCommit={commitKey}
              />

              {token.length > 0 ? (
                <button
                  type="button"
                  className={`cm-paste${pasted ? ' cm-pasteflash' : ''}`}
                  data-proximity
                  data-variant="clear"
                  aria-label="Remove key"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={clearToken}
                >
                  <span className={iconClass(pasted ? 'check' : 'close')}>
                    {pasted ? 'check' : 'close'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="cm-paste"
                  data-proximity
                  aria-label="Paste from clipboard"
                  data-variant="paste"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handlePaste}
                >
                  <span className={iconClass('content_paste')}>content_paste</span>
                  <span aria-hidden="true">Paste</span>
                  <span className="cm-tip" role="tooltip">
                    Paste from clipboard
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
