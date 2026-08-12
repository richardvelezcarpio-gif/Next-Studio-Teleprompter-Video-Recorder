import { useCallback, useEffect, useRef, useState } from 'react'

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
      startLevelMeter(nextStream)
      const activeDeviceId = nextStream.getAudioTracks()[0]?.getSettings().deviceId
      await refreshMicrophones(activeDeviceId || deviceId)
      return nextStream
    } catch (microphoneError) {
      setError(messageFor(microphoneError))
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
