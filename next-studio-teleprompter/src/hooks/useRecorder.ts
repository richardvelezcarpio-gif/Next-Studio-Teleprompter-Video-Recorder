import { useCallback, useEffect, useRef, useState } from 'react'

type RecorderStatus = 'ready' | 'recording' | 'complete' | 'error'

function supportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  return [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ].find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const urlRef = useRef<string | null>(null)
  const [status, setStatus] = useState<RecorderStatus>('ready')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [mimeType, setMimeType] = useState('video/webm')
  const [hasAudio, setHasAudio] = useState(false)
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

  const startRecording = useCallback((cameraStream: MediaStream | null, microphoneStream: MediaStream | null, requireAudio = false) => {
    if (recorderRef.current?.state === 'recording') return
    const videoTracks = cameraStream?.getVideoTracks() || []
    const audioTracks = microphoneStream?.getAudioTracks() || []
    if (!videoTracks.length) {
      setError('Turn on your camera before recording.')
      setStatus('error')
      return
    }
    if (requireAudio && !audioTracks.length) {
      setError('Allow microphone access before recording on mobile.')
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
      setRecordedBlob(null)
      setElapsedSeconds(0)
      setError('')
      const recorderStream = new MediaStream([
        ...videoTracks,
        ...audioTracks,
      ])
      setHasAudio(Boolean(audioTracks.length))
      const preferredType = supportedMimeType()
      const recorder = preferredType ? new MediaRecorder(recorderStream, { mimeType: preferredType }) : new MediaRecorder(recorderStream)
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
        setRecordedBlob(blob)
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
    setRecordedBlob(null)
    setElapsedSeconds(0)
    setError('')
    setStatus('ready')
  }, [clearTimer, revokeUrl])

  useEffect(() => () => {
    clearTimer()
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [clearTimer])

  return { status, elapsedSeconds, recordedUrl, recordedBlob, mimeType, hasAudio, error, isRecording: status === 'recording', startRecording, stopRecording, resetRecording }
}
