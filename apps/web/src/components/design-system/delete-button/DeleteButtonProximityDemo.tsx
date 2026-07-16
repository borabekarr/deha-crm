import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DeleteButton.css'
import './DeleteButtonProximityDemo.css'

import DeleteButton from './DeleteButton'
import { useProximityGroup } from '@/lib/hooks'

// ---------------------------------------------------------------------------
// DeleteButtonProximityDemo -- proximity wrapper for the locked DeleteButton.
// Mirrors the Buttons.tsx row 4 pattern exactly: a stationary .btn-prox-wrap
// [data-proximity] element hosts the locked DeleteButton unmodified.
// DeleteButton.tsx itself is NOT edited (locked).
// ---------------------------------------------------------------------------

export default function DeleteButtonProximityDemo() {
  const rowRef = useProximityGroup<HTMLDivElement>()

  return (
    <div className="db-prox-page-root" ref={rowRef}>
      <span className="btn-prox-wrap" data-proximity>
        <DeleteButton onDelete={() => undefined} />
      </span>
    </div>
  )
}
