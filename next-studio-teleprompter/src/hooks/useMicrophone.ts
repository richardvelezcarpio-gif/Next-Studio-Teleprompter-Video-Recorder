import { useCallback, useEffect, useRef, useState } from 'react'
import { describeTrack, reportAudioDiagnostic } from '../utils/audioDiagnostics'

type MicrophoneError = 'Microphone permission denied.' | 'No microphone found.' | 'Microphone is being used by another application.' | 'Unable to access microphone.' | null

function messageFor(error: unknown): Exclude<MicrophoneError, null> {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') return 'Microphone permission denied.'
    if (error.name === 'NotFoundError') return 'No microphone found.'
    if (error.name === 'NotReadableError') return 'Microphone is being used by another application.'
  }
  return 'Unable to access microphone.'
}

export function useMicrophone() {
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastDiagnosticLogRef = useRef(0)
  const lastDiagnosticUpdateRef = useRef(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<MicrophoneError>(null)
  const [level, setLevel] = useState(0)

  const stopMicrophone = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    contextRef.current?.close()
    contextRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
    setLevel(0)
    reportAudioDiagnostic({ originalMicTracks: [], signalDetected: false, averageLevel: 0 })
  }, [])

  const startLevelMeter = useCallback((activeStream: MediaStream) => {
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 256
    context.createMediaStreamSource(activeStream).connect(analyser)
    contextRef.current = context
    const samples = new Uint8Array(analyser.fftSize)
    const updateLevel = () => {
      analyser.getByteTimeDomainData(samples)
      const average = samples.reduce((total, value) => total + Math.abs(value - 128), 0) / samples.length
      setLevel(Math.min(100, Math.round(average * 2.5)))
      if (Date.now() - lastDiagnosticUpdateRef.current > 250) {
        lastDiagnosticUpdateRef.current = Date.now()
        reportAudioDiagnostic({ signalDetected: average > 2, averageLevel: average })
      }
      if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) && Date.now() - lastDiagnosticLogRef.current > 1000) {
        lastDiagnosticLogRef.current = Date.now()
        console.log('MIC ANALYSER SIGNAL', { average, detectedVoiceSignal: average > 2, audioTracks: activeStream.getAudioTracks().length })
      }
      frameRef.current = requestAnimationFrame(updateLevel)
    }
    updateLevel()
  }, [])

  const refreshMicrophones = useCallback(async (activeDeviceId?: string) => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioInputs = devices.filter((device) => device.kind === 'audioinput')
    setMicrophones(audioInputs)
    setSelectedDeviceId(activeDeviceId || audioInputs[0]?.deviceId || '')
  }, [])

  const startMicrophone = useCallback(async (deviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Unable to access microphone.')
      return null
    }
    setIsLoading(true)
    setError(null)
    stopMicrophone()
    try {
      let permission = 'unavailable'
      try {
        permission = (await navigator.permissions?.query({ name: 'microphone' as PermissionName }))?.state || permission
      } catch {
        // Safari does not consistently expose microphone permission state.
      }
      console.info('[Next Studio microphone diagnostic]', { browser: navigator.userAgent, permission })
      reportAudioDiagnostic({ browser: navigator.userAgent, permission, error: '' })
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false,
      }
      let nextStream: MediaStream
      try {
        nextStream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (requestError) {
        if (deviceId && requestError instanceof DOMException && ['NotFoundError', 'OverconstrainedError'].includes(requestError.name)) {
          nextStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        } else {
          throw requestError
        }
      }
      streamRef.current = nextStream
      setStream(nextStream)
      try {
        startLevelMeter(nextStream)
      } catch (audioContextError) {
        reportAudioDiagnostic({ error: `AudioContext: ${String(audioContextError)}` })
      }
      console.log('ORIGINAL MIC STREAM', nextStream)
      console.log('ORIGINAL MIC AUDIO TRACKS', nextStream.getAudioTracks().map((track) => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings: track.getSettings?.(),
      })))
      reportAudioDiagnostic({ originalMicTracks: nextStream.getAudioTracks().map(describeTrack), error: '' })
      const activeDeviceId = nextStream.getAudioTracks()[0]?.getSettings().deviceId
      await refreshMicrophones(activeDeviceId || deviceId)
      console.info('[Next Studio microphone diagnostic]', {
        browser: navigator.userAgent,
        audioTracks: nextStream.getAudioTracks().length,
        audioTrack: nextStream.getAudioTracks()[0] && {
          readyState: nextStream.getAudioTracks()[0].readyState,
          enabled: nextStream.getAudioTracks()[0].enabled,
          muted: nextStream.getAudioTracks()[0].muted,
        },
      })
      return nextStream
    } catch (microphoneError) {
      setError(messageFor(microphoneError))
      console.info('[Next Studio microphone diagnostic]', { browser: navigator.userAgent, permission: 'request failed', error: microphoneError })
      reportAudioDiagnostic({ error: `getUserMedia: ${messageFor(microphoneError)}` })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [refreshMicrophones, startLevelMeter, stopMicrophone])

  const selectMicrophone = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    await startMicrophone(deviceId)
  }, [startMicrophone])

  useEffect(() => stopMicrophone, [stopMicrophone])

  return { stream, microphones, selectedDeviceId, isLoading, error, isActive: Boolean(stream), level, startMicrophone, stopMicrophone, selectMicrophone }
}
