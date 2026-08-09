import { useCallback, useEffect, useRef, useState } from 'react'

export type PrompterStatus = 'ready' | 'running' | 'paused' | 'finished'

export function useTeleprompter() {
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const offsetRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef(5)
  const [status, setStatus] = useState<PrompterStatus>('ready')
  const [speed, setSpeed] = useState(5)
  const [textSize, setTextSize] = useState(42)
  const [position, setPosition] = useState(50)
  const [message, setMessage] = useState('')

  useEffect(() => { speedRef.current = speed }, [speed])

  const stopAnimation = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    lastTimeRef.current = null
  }, [])

  const reset = useCallback(() => {
    stopAnimation()
    offsetRef.current = 0
    if (scrollRef.current) scrollRef.current.style.transform = 'translateY(0)'
    setStatus('ready')
    setMessage('')
  }, [stopAnimation])

  const pause = useCallback(() => {
    stopAnimation()
    setStatus('paused')
  }, [stopAnimation])

  const start = useCallback((script: string) => {
    if (!script.trim()) {
      setMessage('Add a script before starting the teleprompter.')
      return
    }
    setMessage('')
    if (status === 'finished') return
    setStatus('running')
    const step = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time
      const elapsed = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time
      offsetRef.current += elapsed * (8 + speedRef.current * 7)
      if (scrollRef.current) scrollRef.current.style.transform = `translateY(-${offsetRef.current}px)`
      const contentHeight = scrollRef.current?.scrollHeight ?? 0
      const viewportHeight = viewportRef.current?.clientHeight ?? 0
      if (contentHeight > 0 && offsetRef.current >= Math.max(0, contentHeight - viewportHeight + 90)) {
        stopAnimation()
        setStatus('finished')
        return
      }
      frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
  }, [status, stopAnimation])

  const toggle = useCallback((script: string) => {
    if (status === 'running') pause()
    else start(script)
  }, [pause, start, status])

  useEffect(() => stopAnimation, [stopAnimation])

  return { status, speed, textSize, position, message, scrollRef, viewportRef, start, pause, reset, toggle, setSpeed, decreaseTextSize: () => setTextSize((size) => Math.max(28, size - 2)), increaseTextSize: () => setTextSize((size) => Math.min(72, size + 2)), moveUp: () => setPosition((value) => Math.max(25, value - 5)), moveDown: () => setPosition((value) => Math.min(75, value + 5)) }
}
