export type TrackDiagnostic = { id: string; label: string; enabled: boolean; muted: boolean; readyState: string }

export type AudioDiagnostic = {
  browser: string
  permission: string
  originalMicTracks: TrackDiagnostic[]
  signalDetected: boolean
  averageLevel: number
  recorderAudioTracks: TrackDiagnostic[]
  recorderVideoTracks: TrackDiagnostic[]
  sameTrack: boolean | null
  mimeType: string
  lastBlob: { size: number; type: string } | null
  error: string
}

let diagnostic: AudioDiagnostic = {
  browser: typeof navigator === 'undefined' ? 'Unknown' : navigator.userAgent,
  permission: 'unknown',
  originalMicTracks: [],
  signalDetected: false,
  averageLevel: 0,
  recorderAudioTracks: [],
  recorderVideoTracks: [],
  sameTrack: null,
  mimeType: '',
  lastBlob: null,
  error: '',
}

const listeners = new Set<() => void>()

export function describeTrack(track: MediaStreamTrack): TrackDiagnostic {
  return { id: track.id, label: track.label, enabled: track.enabled, muted: track.muted, readyState: track.readyState }
}

export function reportAudioDiagnostic(update: Partial<AudioDiagnostic>) {
  diagnostic = { ...diagnostic, ...update }
  listeners.forEach((listener) => listener())
}

export function getAudioDiagnostic() { return diagnostic }

export function subscribeAudioDiagnostic(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
