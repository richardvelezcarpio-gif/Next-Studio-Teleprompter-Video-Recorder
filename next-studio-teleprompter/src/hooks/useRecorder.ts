import { useCallback, useEffect, useRef, useState } from 'react'
import { describeTrack, reportAudioDiagnostic } from '../utils/audioDiagnostics'

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
      reportAudioDiagnostic({ error: 'MediaRecorder: camera stream has no video track' })
      return
    }
    if (requireAudio && !audioTracks.length) {
      setError('Allow microphone access before recording on mobile.')
      setStatus('error')
      reportAudioDiagnostic({ error: 'MediaRecorder: microphone stream has no audio track' })
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
      console.log('FINAL RECORDER STREAM', recorderStream)
      console.log('FINAL AUDIO TRACKS', recorderStream.getAudioTracks().map((track) => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings: track.getSettings?.(),
      })))
      console.log('FINAL VIDEO TRACKS', recorderStream.getVideoTracks().map((track) => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
      })))
      console.log('MIC TRACK IN RECORDER STREAM', {
        sourceTrackIds: audioTracks.map((track) => track.id),
        recorderTrackIds: recorderStream.getAudioTracks().map((track) => track.id),
        sameTrack: audioTracks.every((track) => recorderStream.getAudioTracks().some((recorderTrack) => recorderTrack.id === track.id)),
      })
      reportAudioDiagnostic({
        recorderAudioTracks: recorderStream.getAudioTracks().map(describeTrack),
        recorderVideoTracks: recorderStream.getVideoTracks().map(describeTrack),
        sameTrack: audioTracks.length ? audioTracks.every((track) => recorderStream.getAudioTracks().some((recorderTrack) => recorderTrack.id === track.id)) : false,
        error: '',
      })
      console.log('MEDIARECORDER MIME SUPPORT', {
        mp4AvcAac: MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2'),
        mp4: MediaRecorder.isTypeSupported('video/mp4'),
        webmVp8Opus: MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus'),
        webm: MediaRecorder.isTypeSupported('video/webm'),
        preferredType,
      })
      const recorder = preferredType ? new MediaRecorder(recorderStream, { mimeType: preferredType }) : new MediaRecorder(recorderStream)
      recorderRef.current = recorder
      setMimeType(recorder.mimeType || preferredType || 'video/webm')
      reportAudioDiagnostic({ mimeType: recorder.mimeType || preferredType || 'video/webm' })
      console.info('[Next Studio recorder diagnostic]', {
        browser: navigator.userAgent,
        videoTracks: recorderStream.getVideoTracks().length,
        audioTracks: recorderStream.getAudioTracks().length,
        audioTrack: recorderStream.getAudioTracks()[0] && {
          readyState: recorderStream.getAudioTracks()[0].readyState,
          enabled: recorderStream.getAudioTracks()[0].enabled,
          muted: recorderStream.getAudioTracks()[0].muted,
        },
        mimeType: recorder.mimeType || preferredType || 'video/webm',
      })
      recorder.ondataavailable = (event) => {
        console.log('MEDIARECORDER DATA AVAILABLE', { size: event.data.size, type: event.data.type })
        reportAudioDiagnostic({ lastBlob: { size: event.data.size, type: event.data.type } })
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
        reportAudioDiagnostic({ error: 'MediaRecorder: unable to record video' })
        recorderRef.current = null
      }
      recorder.start(250)
      setStatus('recording')
      timerRef.current = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000)
    } catch (recordingError) {
      setError('Unable to start recording.')
      setStatus('error')
      reportAudioDiagnostic({ error: `MediaRecorder: ${String(recordingError)}` })
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
