import { useCallback, useEffect, useRef, useState } from 'react'

export type StudioAudioController = ReturnType<typeof useStudioAudio>

function safeDuration(value: number) { return Number.isFinite(value) ? value : 0 }

export function useStudioAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const recordDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const microphoneSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const [fileName, setFileName] = useState('')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(70)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState('')

  if (!audioRef.current && typeof Audio !== 'undefined') {
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio
  }

  const applyGain = useCallback((nextVolume = volume, nextMuted = muted) => {
    const gain = musicGainRef.current
    if (gain) gain.gain.setValueAtTime(nextMuted ? 0 : nextVolume / 100, contextRef.current?.currentTime || 0)
  }, [muted, volume])

  const ensureGraph = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) throw new Error('unsupported')
    let context = contextRef.current
    if (!context || context.state === 'closed') {
      context = new AudioContext()
      contextRef.current = context
      const source = context.createMediaElementSource(audio)
      const musicGain = context.createGain()
      const destination = context.createMediaStreamDestination()
      source.connect(musicGain)
      musicGain.connect(context.destination)
      musicGain.connect(destination)
      sourceRef.current = source
      musicGainRef.current = musicGain
      recordDestinationRef.current = destination
      musicGain.gain.value = muted ? 0 : volume / 100
    }
    if (context.state === 'suspended') await context.resume()
    return { context, destination: recordDestinationRef.current! }
  }, [muted, volume])

  const pause = useCallback(() => { audioRef.current?.pause() }, [])

  const play = useCallback(async () => {
    if (!objectUrlRef.current || !audioRef.current) return
    setError('')
    try {
      await ensureGraph()
      await audioRef.current.play()
    } catch {
      setError('This audio format cannot be played by your browser.')
    }
  }, [ensureGraph])

  const restart = useCallback(async () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    setCurrentTime(0)
    await play()
  }, [play])

  const removeAudio = useCallback(() => {
    const audio = audioRef.current
    audio?.pause()
    if (audio) { audio.removeAttribute('src'); audio.load() }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = null
    setFileName('')
    setDuration(0)
    setCurrentTime(0)
    setIsPlaying(false)
    setError('')
  }, [])

  const loadAudio = useCallback((file: File) => {
    const audio = audioRef.current
    if (!audio) return
    removeAudio()
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setFileName(file.name)
    setError('')
    audio.src = url
    audio.load()
  }, [removeAudio])

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.max(0, Math.min(100, nextVolume))
    setVolumeState(safeVolume)
    applyGain(safeVolume, muted)
  }, [applyGain, muted])

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      applyGain(volume, !current)
      return !current
    })
  }, [applyGain, volume])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    const safeTime = Math.max(0, Math.min(safeDuration(audio.duration), time))
    audio.currentTime = safeTime
    setCurrentTime(safeTime)
  }, [])

  const startRecordingMix = useCallback(async (microphoneStream: MediaStream | null) => {
    if (!objectUrlRef.current || !audioRef.current) return microphoneStream
    setError('')
    try {
      const { context, destination } = await ensureGraph()
      microphoneSourceRef.current?.disconnect()
      microphoneSourceRef.current = null
      if (microphoneStream?.getAudioTracks().length) {
        const microphoneSource = context.createMediaStreamSource(microphoneStream)
        microphoneSource.connect(destination)
        microphoneSourceRef.current = microphoneSource
      }
      await audioRef.current.play()
      return destination.stream
    } catch {
      microphoneSourceRef.current?.disconnect()
      microphoneSourceRef.current = null
      setError('Unable to add this audio to the recording. The microphone will be used by itself.')
      return microphoneStream
    }
  }, [ensureGraph])

  const stopRecordingMix = useCallback(() => {
    audioRef.current?.pause()
    microphoneSourceRef.current?.disconnect()
    microphoneSourceRef.current = null
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const metadata = () => { setDuration(safeDuration(audio.duration)); setError('') }
    const time = () => setCurrentTime(audio.currentTime)
    const playing = () => setIsPlaying(true)
    const paused = () => setIsPlaying(false)
    const failed = () => { setIsPlaying(false); setError('This audio format cannot be played by your browser.') }
    audio.addEventListener('loadedmetadata', metadata)
    audio.addEventListener('durationchange', metadata)
    audio.addEventListener('timeupdate', time)
    audio.addEventListener('play', playing)
    audio.addEventListener('pause', paused)
    audio.addEventListener('ended', paused)
    audio.addEventListener('error', failed)
    return () => {
      audio.removeEventListener('loadedmetadata', metadata)
      audio.removeEventListener('durationchange', metadata)
      audio.removeEventListener('timeupdate', time)
      audio.removeEventListener('play', playing)
      audio.removeEventListener('pause', paused)
      audio.removeEventListener('ended', paused)
      audio.removeEventListener('error', failed)
    }
  }, [])

  useEffect(() => () => {
    audioRef.current?.pause()
    microphoneSourceRef.current?.disconnect()
    sourceRef.current?.disconnect()
    musicGainRef.current?.disconnect()
    void contextRef.current?.close()
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  return { hasAudio: Boolean(fileName), fileName, duration, currentTime, isPlaying, volume, muted, error, loadAudio, removeAudio, play, pause, restart, seek, setVolume, toggleMute, startRecordingMix, stopRecordingMix }
}
