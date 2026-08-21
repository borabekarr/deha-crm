import './AnimationsRegistry.css'
import type { ComponentType } from 'react'
import { registry } from '@/lib/component-registry'
import { GUIDES } from './guides'
import AnimatedListDemo from '../animated-list/AnimatedList'
import NumberFlowDemo from '../number-flow/NumberFlowDemo'
import PrizeSheetDemo from '../prize-sheet/PrizeSheet'
import ShimmerDemo from '../shimmer/Shimmer'

// Card entrance rides the route-level reveal engine: the registry entry sets
// revealSelector: '.areg-card' and components.$slug.tsx attaches
// makeRevealRef for us (same convention as Cards.tsx / card-accent), so
// --anim-mult scaling and prefers-reduced-motion come from
// make-reveal-ref.ts without duplicating that logic here.

const DEMOS: Record<string, ComponentType> = {
  'animated-list': AnimatedListDemo,
  'number-flow': NumberFlowDemo,
  'prize-sheet': PrizeSheetDemo,
  shimmer: ShimmerDemo,
}

export default function AnimationsRegistry() {
  const cards = registry.filter(
    (e) => e.category === 'Animations' && e.status === 'Finished' && e.slug !== 'animations-registry',
  )

  return (
    <div className="card areg-outer" style={{ padding: 0 }}>
      <div className="areg-grid">
        {cards.map((entry) => {
          const Demo = DEMOS[entry.slug]
          const guide = GUIDES[entry.slug]
          return (
            <div className="areg-card" key={entry.slug}>
              <div className="areg-title">{entry.name}</div>
              <div className="areg-stage">
                <div className="areg-stage-inner">{Demo ? <Demo /> : null}</div>
              </div>
              {guide && (
                <div className="areg-guide">
                  <p className="areg-guide-line">
                    <span className="areg-guide-label">When: </span>
                    {guide.when}
                  </p>
                  <p className="areg-guide-line">
                    <span className="areg-guide-label">Tokens: </span>
                    {guide.tokens}
                  </p>
                  <p className="areg-guide-line">
                    <span className="areg-guide-label">Do: </span>
                    {guide.doLine}
                  </p>
                  <p className="areg-guide-line">
                    <span className="areg-guide-label">Don't: </span>
                    {guide.dontLine}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
