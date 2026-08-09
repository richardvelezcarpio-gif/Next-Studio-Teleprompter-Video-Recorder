import { useCallback, useEffect, useRef, useState } from 'react'

type CameraError = 'Camera permission denied.' | 'No camera found.' | 'Camera is being used by another application.' | 'Unable to access camera.' | null

function messageFor(error: unknown): Exclude<CameraError, null> {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') return 'Camera permission denied.'
    if (error.name === 'NotFoundError') return 'No camera found.'
    if (error.name === 'NotReadableError') return 'Camera is being used by another application.'
  }
  return 'Unable to access camera.'
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function useCamera() {
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<CameraError>(null)

  const stopCamera = useCallback(() => {
    stopTracks(streamRef.current)
    streamRef.current = null
    setStream(null)
  }, [])

  const refreshCameras = useCallback(async (activeDeviceId?: string) => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoInputs = devices.filter((device) => device.kind === 'videoinput')
    setCameras(videoInputs)
    setSelectedDeviceId((current) => current || activeDeviceId || videoInputs[0]?.deviceId || '')
  }, [])

  const startCamera = useCallback(async (deviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Unable to access camera.')
      return
    }

    setIsLoading(true)
    setError(null)
    stopCamera()
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      })
      streamRef.current = nextStream
      setStream(nextStream)
      const activeDeviceId = nextStream.getVideoTracks()[0]?.getSettings().deviceId
      await refreshCameras(activeDeviceId)
    } catch (cameraError) {
      setError(messageFor(cameraError))
    } finally {
      setIsLoading(false)
    }
  }, [refreshCameras, stopCamera])

  const selectCamera = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    await startCamera(deviceId)
  }, [startCamera])

  useEffect(() => stopCamera, [stopCamera])

  return { stream, cameras, selectedDeviceId, isLoading, error, startCamera, stopCamera, selectCamera }
}
