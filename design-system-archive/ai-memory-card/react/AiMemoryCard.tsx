import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './AiMemoryCard.css'

// ── Static content (verbatim from prototype) ─────────────────────────────────

const SINGLE_MEMORY = {
  title: 'New memory added',
  memories: [
    {
      label: 'Memory',
      text: 'Is a professional designer leading teams building AI products. They are researching AI UX patterns, especially memory and adaptive interfaces, and apply this work across the full product lifecycle from concept to production.',
    },
  ],
}

const MULTI_MEMORY = {
  title: '2 memories added',
  memories: [
    {
      label: 'Memory 1',
      text: 'Prefers concise, bullet-point responses when reviewing technical specifications or implementation plans.',
    },
    {
      label: 'Memory 2',
      text: 'Works primarily in real estate CRM with a focus on lead scoring and AI-assisted pipeline management.',
    },
  ],
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MemoryBlockProps {
  label: string
  text: string
}

function MemoryBlock({ label, text }: MemoryBlockProps) {
  return (
    <div className="mem-block">
      <div className="mem-content">
        <div className="mem-content-top">
          <span className="mem-num-tag">
            <span className="material-icons">memory</span>
            {label}
          </span>
          <button className="mem-edit-btn">
            <span className="material-icons">edit</span>
            Edit
          </button>
        </div>
        <p className="mem-text">{text}</p>
      </div>
    </div>
  )
}

interface MemCardProps {
  title: string
  memories: { label: string; text: string }[]
}

function MemCard({ title, memories }: MemCardProps) {
  return (
    <div className="mem-outer">
      <div className="mem-card">
        <div className="mem-card-body">
          <div className="mem-head">
            <div className="mem-head-row">
              <span className="mem-head-icon-tag">
                <span className="material-icons">tips_and_updates</span>
              </span>
              <span className="mem-head-title">{title}</span>
            </div>
          </div>
          {memories.map((m) => (
            <MemoryBlock key={m.label} label={m.label} text={m.text} />
          ))}
        </div>
        <div className="mem-footer">
          <span className="mem-footer-label">Manage all memories</span>
          <span className="material-icons mem-footer-arrow">chevron_right</span>
        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AiMemoryCard() {
  return (
    <div
      className="card"
      style={{
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        background: '#F8FAFC',
        backgroundImage:
          'radial-gradient(ellipse at top right, rgba(16,185,129,0.06) 0%, #F8FAFC 55%)',
      }}
    >
      <MemCard title={SINGLE_MEMORY.title} memories={SINGLE_MEMORY.memories} />
      <MemCard title={MULTI_MEMORY.title} memories={MULTI_MEMORY.memories} />
    </div>
  )
}
