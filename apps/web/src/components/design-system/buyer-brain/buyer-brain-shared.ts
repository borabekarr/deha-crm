// Non-component values shared between BuyerBrain.tsx and
// BuyerBrainDetailCard.tsx, split out of BuyerBrain.tsx so the component
// file only exports its component (react-doctor/only-export-components --
// value exports alongside a component defeat Fast Refresh).
export type Side = 'left' | 'right' | 'top-l' | 'top-r' | 'bottom'

// Detail-card scale-open origin: approximates "grows from the piece that was
// clicked" by mapping the piece's side within the brain grid to the nearest
// edge of the card (the card sits to the right of the stage).
export const CARD_ORIGIN: Record<Side, string> = {
  left: '0% 50%',
  right: '100% 50%',
  'top-l': '50% 0%',
  'top-r': '50% 0%',
  bottom: '50% 100%',
}
