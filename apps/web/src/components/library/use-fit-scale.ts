/**
 * use-fit-scale.ts
 *
 * Callback-ref hook that scales a fixed-design-width preview down to fit its
 * scroll container on narrow viewports (Xcode/Figma preview behavior).
 * Nodes are tracked in state (not a plain ref) so the useLayoutEffect below
 * re-fires when a node mounts -- `contentRef`'s target is conditionally
 * rendered only once `scale < 1`, so a ref-only dependency list would miss
 * that later mount. The ResizeObserver/MutationObserver setup and disconnect
 * live in the effect (literal-effect shape, matching smooth-drawer-hook.ts)
 * so react-doctor's effect-needs-cleanup sees an inline disconnect() cleanup.
 *
 * Content can be intrinsically wider than the registry's designWidth (e.g.
 * a fixed-layout table). `contentRef` measures the inner wrapper's real
 * scrollWidth so scale is computed against effective width =
 * max(designWidth, contentWidth) -- the scaled box then never overflows
 * its container regardless of how wide the content actually renders.
 */

import { useCallback, useLayoutEffect, useRef, useState } from 'react'

interface UseFitScaleResult {
  ref: (node: HTMLDivElement | null) => void
  contentRef: (node: HTMLDivElement | null) => void
  scale: number
  contentWidth?: number
}

const DESKTOP_QUERY = '(min-width: 768px)'

export function useFitScale(designWidth?: number): UseFitScaleResult {
  const [scale, setScale] = useState(1)
  const [contentWidth, setContentWidth] = useState<number | undefined>(designWidth)
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null)
  const availableRef = useRef(0)
  const actualWidthRef = useRef(designWidth ?? 0)

  const recompute = useCallback(() => {
    if (!designWidth) return
    if (typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches) {
      setScale(1)
      return
    }
    const effective = Math.max(designWidth, actualWidthRef.current)
    setContentWidth(effective)
    setScale(availableRef.current > 0 ? Math.min(1, availableRef.current / effective) : 1)
  }, [designWidth])

  // Stable callback ref: only stores the node, via state so the effect below
  // re-fires when the node itself mounts. useLayoutEffect (not useEffect)
  // keeps the pre-paint measure() timing the old ref-time synchronous call
  // had, avoiding a flash of unscaled content.
  const ref = useCallback((n: HTMLDivElement | null) => {
    setNode(n)
  }, [])

  useLayoutEffect(() => {
    if (!node) return
    if (!designWidth) {
      setScale(1)
      return
    }
    const measure = () => {
      const style = window.getComputedStyle(node)
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      availableRef.current = node.clientWidth - paddingX
      recompute()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, designWidth, recompute])

  const contentRef = useCallback((n: HTMLDivElement | null) => {
    setContentNode(n)
  }, [])

  useLayoutEffect(() => {
    if (!contentNode || !designWidth) return
    const measure = () => {
      actualWidthRef.current = contentNode.scrollWidth
      recompute()
    }
    measure()
    // ResizeObserver only fires when the node's own border-box changes; it
    // misses content that overflows without growing the box (overflow is
    // visible by design here). A MutationObserver catches children that
    // mount/resize asynchronously (e.g. data-driven rows) and re-measures
    // scrollWidth, which does account for overflowing content.
    const mutationObserver = new MutationObserver(measure)
    mutationObserver.observe(contentNode, { childList: true, subtree: true, attributes: true })
    const observer = new ResizeObserver(measure)
    observer.observe(contentNode)
    return () => {
      mutationObserver.disconnect()
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentNode, designWidth, recompute])

  return { ref, contentRef, scale, contentWidth }
}
