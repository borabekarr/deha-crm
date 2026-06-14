import { useCallback, useRef, useState } from 'react'

export type ViewMode = 'list' | 'grid'

export interface FileItem {
  name: string
  ext: string
  type: string
  size: string
  color: string
}

export const FILES: FileItem[] = [
  { name: 'Q4 Strategy',      ext: 'PDF', type: 'Document', size: '2.4 MB', color: '#EF4444' },
  { name: 'Brand Roadmap',    ext: 'FIG', type: 'Figma',    size: '8.1 MB', color: '#A855F7' },
  { name: 'Budget 2025',      ext: 'XLS', type: 'Sheet',    size: '1.2 MB', color: '#10B981' },
  { name: 'Meeting Notes',    ext: 'DOC', type: 'Document',  size: '48 KB',  color: '#3B82F6' },
  { name: 'Cover Art',        ext: 'PNG', type: 'Image',     size: '640 KB', color: '#F97316' },
  { name: 'Demo Walkthrough', ext: 'MP4', type: 'Video',     size: '48 MB',  color: '#EC4899' },
  { name: 'Contract v3',      ext: 'PDF', type: 'Document',  size: '820 KB', color: '#EF4444' },
  { name: 'Logo Pack',        ext: 'ZIP', type: 'Archive',   size: '12 MB',  color: '#64748B' },
]

export interface FolderState {
  isPlaying: boolean
  isTapped: boolean
}

export interface PopState {
  isOpen: boolean
  title: string
  subtitle: string
  view: ViewMode
}

export function useFileFolder() {
  const [blueState, setBlueState] = useState<FolderState>({ isPlaying: false, isTapped: false })
  const [redState, setRedState] = useState<FolderState>({ isPlaying: false, isTapped: false })
  const [popState, setPopState] = useState<PopState>({
    isOpen: false,
    title: 'Work files',
    subtitle: '2,386 files · Notes & More',
    view: 'list',
  })

  const cardRef = useRef<HTMLDivElement>(null)
  const blueFolderRef = useRef<HTMLDivElement>(null)
  const redFolderRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const playTimerBlue = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playTimerRed = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapTimerBlue = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapTimerRed = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playFolder = useCallback((
    setFolderState: React.Dispatch<React.SetStateAction<FolderState>>,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFolderState({ isPlaying: false, isTapped: false })
    requestAnimationFrame(() => {
      setFolderState(s => ({ ...s, isPlaying: true }))
      timerRef.current = setTimeout(() => {
        setFolderState(s => ({ ...s, isPlaying: false }))
      }, 1700)
    })
  }, [])

  const playAll = useCallback(() => {
    playFolder(setBlueState, playTimerBlue)
    playFolder(setRedState, playTimerRed)
  }, [playFolder])

  const positionPop = useCallback((folderEl: HTMLDivElement | null) => {
    if (!folderEl || !cardRef.current || !popRef.current) return
    const cardRect = cardRef.current.getBoundingClientRect()
    const fRect = folderEl.getBoundingClientRect()
    const w = 300
    let left = (fRect.left - cardRect.left) + fRect.width / 2 - w / 2
    left = Math.max(12, Math.min(left, cardRect.width - w - 12))
    const top = (fRect.top - cardRect.top) + 34
    popRef.current.style.left = `${left}px`
    popRef.current.style.top = `${top}px`
  }, [])

  const openPop = useCallback((isHot: boolean, folderEl: HTMLDivElement | null) => {
    const subtitle = (isHot ? 'Active · ' : '') + '2,386 files · Notes & More'
    setPopState(s => ({ ...s, isOpen: true, title: 'Work files', subtitle }))
    requestAnimationFrame(() => positionPop(folderEl))
  }, [positionPop])

  const closePop = useCallback(() => {
    setPopState(s => ({ ...s, isOpen: false }))
  }, [])

  const handleFolderClick = useCallback((
    isHot: boolean,
    folderEl: HTMLDivElement | null,
    setFolderState: React.Dispatch<React.SetStateAction<FolderState>>,
    tapTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => {
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    setFolderState(s => ({ ...s, isTapped: true }))
    tapTimerRef.current = setTimeout(() => {
      setFolderState(s => ({ ...s, isTapped: false }))
    }, 430)
    openPop(isHot, folderEl)
  }, [openPop])

  const handleBlueClick = useCallback(() => {
    handleFolderClick(false, blueFolderRef.current, setBlueState, tapTimerBlue)
  }, [handleFolderClick])

  const handleRedClick = useCallback(() => {
    handleFolderClick(true, redFolderRef.current, setRedState, tapTimerRed)
  }, [handleFolderClick])

  const setView = useCallback((view: ViewMode) => {
    setPopState(s => ({ ...s, view }))
  }, [])

  // Entrance play on mount — via callback ref on card
  const cardCallbackRef = useCallback((node: HTMLDivElement | null) => {
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    if (node) {
      requestAnimationFrame(() => {
        playFolder(setBlueState, playTimerBlue)
        playFolder(setRedState, playTimerRed)
      })
    }
  }, [playFolder])

  return {
    blueState,
    redState,
    popState,
    cardRef,
    cardCallbackRef,
    blueFolderRef,
    redFolderRef,
    popRef,
    playAll,
    closePop,
    handleBlueClick,
    handleRedClick,
    setView,
  }
}
