import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './NumberFlow.css'

import { useState, useCallback } from 'react'
import NumberFlow, { type Format } from '@number-flow/react'

// ---------------------------------------------------------------------------
// DsNumberFlow — reusable house-typography wrapper around @number-flow/react.
// Applies the `.nf-value` class (font-family: var(--font-display) +
// tabular-nums) directly on the custom element so app screens get the house
// numeral treatment without redefining it per-consumer.
// ---------------------------------------------------------------------------

export function DsNumberFlow({
  value,
  format,
  prefix,
  suffix,
  className = '',
}: {
  value: number
  format?: Format
  prefix?: string
  suffix?: string
  className?: string
}) {
  return (
    <NumberFlow
      value={value}
      format={format}
      prefix={prefix}
      suffix={suffix}
      className={`nf-value ${className}`.trim()}
    />
  )
}

// ---------------------------------------------------------------------------
// Demo data — fixed constants so first paint is deterministic for
// visual-regression snapshots. Shuffle re-randomizes via the onClick handler.
// ---------------------------------------------------------------------------

interface NfState {
  balance: number
  saved: number
  growth: number
}

const INITIAL_STATE: NfState = {
  balance: 84213.4,
  saved: 12480,
  growth: 0.184,
}

const CURRENCY_FORMAT: Format = {
  style: 'currency',
  currency: 'USD',
  trailingZeroDisplay: 'stripIfInteger',
}

const COMPACT_FORMAT: Format = {
  notation: 'compact',
  maximumFractionDigits: 1,
}

const PERCENT_FORMAT: Format = {
  style: 'percent',
  maximumFractionDigits: 1,
}

function randomState(): NfState {
  return {
    balance: Math.round((Math.random() * 90000 + 8000) * 100) / 100,
    saved: Math.round(Math.random() * 20000),
    growth: Math.round(Math.random() * 400) / 1000,
  }
}

// ---------------------------------------------------------------------------
// NumberFlowDemo
// ---------------------------------------------------------------------------

export default function NumberFlowDemo() {
  const [state, setState] = useState<NfState>(INITIAL_STATE)

  const handleShuffle = useCallback(() => {
    setState(randomState())
  }, [])

  return (
    <div className="nf-frame">
      <div className="shell nf-shell">
        <div className="nf-card" data-screen-label="Number flow">
          <div className="nf-eyebrow">
            <span className="material-symbols-outlined">bolt</span>
            Number Flow
          </div>

          <div className="nf-hero">
            <DsNumberFlow
              value={state.balance}
              format={CURRENCY_FORMAT}
              className="nf-hero-value"
            />
            <div className="nf-hero-label">Total balance</div>
          </div>

          <div className="nf-stats">
            <div className="nf-stat">
              <DsNumberFlow
                value={state.saved}
                format={COMPACT_FORMAT}
                prefix="$"
                className="nf-stat-value"
              />
              <div className="nf-stat-label">Saved this year</div>
            </div>
            <div className="nf-stat">
              <DsNumberFlow
                value={state.growth}
                format={PERCENT_FORMAT}
                className="nf-stat-value"
              />
              <div className="nf-stat-label">Growth</div>
            </div>
          </div>

          <button type="button" className="nf-shuffle" onClick={handleShuffle}>
            <span className="material-symbols-outlined">shuffle</span>
            Shuffle
          </button>
        </div>
      </div>
    </div>
  )
}
