import { useCallback, useEffect, useRef, useState } from 'react'

type RecorderStatus = 'ready' | 'recording' | 'complete' | 'error'

function supportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  return ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const urlRef = useRef<string | null>(null)
  const [status, setStatus] = useState<RecorderStatus>('ready')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('video/webm')
  const [error, setError] = useState('')

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const revokeUrl = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setRecordedUrl(null)
  }, [])

  const startRecording = useCallback((cameraStream: MediaStream | null, microphoneStream: MediaStream | null) => {
    if (!cameraStream?.getVideoTracks().length) {
      setError('Turn on your camera before recording.')
      setStatus('error')
      return
    }
    if (typeof MediaRecorder === 'undefined') {
      setError('Recording is not supported in this browser.')
      setStatus('error')
      return
    }
    try {
      revokeUrl()
      chunksRef.current = []
      setElapsedSeconds(0)
      setError('')
      const recordingStream = new MediaStream([
        ...cameraStream.getVideoTracks(),
        ...(microphoneStream?.getAudioTracks() || []),
      ])
      const preferredType = supportedMimeType()
      const recorder = preferredType ? new MediaRecorder(recordingStream, { mimeType: preferredType }) : new MediaRecorder(recordingStream)
      recorderRef.current = recorder
      setMimeType(recorder.mimeType || preferredType || 'video/webm')
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        clearTimer()
        if (!chunksRef.current.length) {
          setError('Unable to create recording.')
          setStatus('error')
          return
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || preferredType || 'video/webm' })
        const nextUrl = URL.createObjectURL(blob)
        urlRef.current = nextUrl
        setRecordedUrl(nextUrl)
        setStatus('complete')
        recorderRef.current = null
      }
      recorder.onerror = () => {
        clearTimer()
        setError('Unable to record video.')
        setStatus('error')
        recorderRef.current = null
      }
      recorder.start(250)
      setStatus('recording')
      timerRef.current = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000)
    } catch {
      setError('Unable to start recording.')
      setStatus('error')
    }
  }, [clearTimer, revokeUrl])

  const stopRecording = useCallback(() => {
    try {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    } catch {
      clearTimer()
      setError('Unable to stop recording.')
      setStatus('error')
    }
  }, [clearTimer])

  const resetRecording = useCallback(() => {
    clearTimer()
    revokeUrl()
    chunksRef.current = []
    setElapsedSeconds(0)
    setError('')
    setStatus('ready')
  }, [clearTimer, revokeUrl])

  useEffect(() => () => {
    clearTimer()
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [clearTimer])

  return { status, elapsedSeconds, recordedUrl, mimeType, error, isRecording: status === 'recording', startRecording, stopRecording, resetRecording }
}
