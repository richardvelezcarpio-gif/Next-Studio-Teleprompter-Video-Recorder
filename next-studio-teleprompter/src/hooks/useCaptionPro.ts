import { useEffect, useRef, useState } from 'react'

type SpeechAlternativeLike = { transcript: string }
type SpeechResultLike = { isFinal: boolean; 0: SpeechAlternativeLike; length: number }
type SpeechEventLike = { results: ArrayLike<SpeechResultLike> }
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function recognitionConstructor() {
  const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null
}

function readableCaption(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).slice(-14).join(' ')
}

export function useCaptionPro({ enabled, recording, language }: { enabled: boolean; recording: boolean; language: 'es-US' | 'en-US' }) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const shouldRunRef = useRef(false)
  const restartTimerRef = useRef<number | null>(null)
  const [text, setText] = useState('')
  const [interim, setInterim] = useState(false)
  const [error, setError] = useState('')
  const supported = typeof window !== 'undefined' && Boolean(recognitionConstructor())

  useEffect(() => {
    shouldRunRef.current = enabled && recording && supported
    if (!shouldRunRef.current) {
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setText('')
      setInterim(false)
      return
    }
    const Constructor = recognitionConstructor()
    if (!Constructor) return
    let disposed = false
    const startRecognition = () => {
      if (disposed || !shouldRunRef.current || recognitionRef.current) return
      const recognition = new Constructor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language
      recognitionRef.current = recognition
      recognition.onresult = (event) => {
        let finalText = ''
        let interimText = ''
        for (let index = 0; index < event.results.length; index += 1) {
          const result = event.results[index]
          if (result.isFinal) finalText += ` ${result[0].transcript}`
          else interimText += ` ${result[0].transcript}`
        }
        const nextText = readableCaption(interimText || finalText)
        if (nextText) setText(nextText)
        setInterim(Boolean(interimText.trim()))
      }
      recognition.onerror = () => setError('Speech recognition stopped. It will retry while recording.')
      recognition.onend = () => {
        recognitionRef.current = null
        if (!disposed && shouldRunRef.current) restartTimerRef.current = window.setTimeout(startRecognition, 450)
      }
      try { recognition.start(); setError('') } catch { recognitionRef.current = null }
    }
    startRecognition()
    return () => {
      disposed = true
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [enabled, language, recording, supported])

  return { supported, text, interim, error }
}
