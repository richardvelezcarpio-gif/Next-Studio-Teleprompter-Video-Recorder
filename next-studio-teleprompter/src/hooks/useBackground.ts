import { useCallback, useEffect, useMemo, useState } from 'react'

export type BackgroundType = 'original' | 'blur' | 'color' | 'gradient' | 'image' | 'uploaded'
export type BackgroundSelection = { type: BackgroundType; value: string; id: string }

const storageKey = 'nextStudioStudioBackground'
const originalBackground: BackgroundSelection = { type: 'original', value: '', id: 'original' }

function loadBackground(): BackgroundSelection {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '') as BackgroundSelection
    if (saved && ['original', 'blur', 'color', 'gradient', 'image'].includes(saved.type) && typeof saved.value === 'string' && typeof saved.id === 'string') return saved
  } catch {
    // Invalid saved data falls back to the original camera view.
  }
  return originalBackground
}

export function useBackground() {
  const [background, setBackground] = useState<BackgroundSelection>(loadBackground)

  useEffect(() => {
    if (background.type !== 'uploaded') localStorage.setItem(storageKey, JSON.stringify(background))
  }, [background])

  useEffect(() => () => {
    if (background.type === 'uploaded' && background.value.startsWith('blob:')) URL.revokeObjectURL(background.value)
  }, [background])

  const backgroundStyle = useMemo(() => {
    if (background.type === 'original' || background.type === 'blur') return undefined
    if (background.type === 'color') return { background: background.value }
    return { backgroundImage: background.type === 'uploaded' ? `url("${background.value}")` : background.value }
  }, [background])

  const selectBackground = useCallback((selection: BackgroundSelection) => setBackground((current) => {
    if (current.type === 'uploaded' && current.value.startsWith('blob:')) URL.revokeObjectURL(current.value)
    return selection
  }), [])

  const uploadBackground = useCallback((file: File) => selectBackground({ type: 'uploaded', value: URL.createObjectURL(file), id: 'uploaded' }), [selectBackground])

  return { background, backgroundStyle, selectBackground, uploadBackground }
}
