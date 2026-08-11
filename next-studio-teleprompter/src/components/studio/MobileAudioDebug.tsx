import { useState, useSyncExternalStore } from 'react'
import { getAudioDiagnostic, subscribeAudioDiagnostic, type TrackDiagnostic } from '../../utils/audioDiagnostics'

function TrackDetails({ track }: { track?: TrackDiagnostic }) {
  if (!track) return <span>None</span>
  return <span>{track.label || 'Default microphone'}<br />ID: {track.id}<br />enabled: {String(track.enabled)} · muted: {String(track.muted)} · {track.readyState}</span>
}

export function MobileAudioDebug() {
  const [isOpen, setIsOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const diagnostic = useSyncExternalStore(subscribeAudioDiagnostic, getAudioDiagnostic, getAudioDiagnostic)
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  if (!isMobile) return null

  const copyDiagnostic = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostic, null, 2))
      setCopyStatus('Copied')
    } catch {
      setCopyStatus('Copy failed')
    }
  }

  return <section className="mobile-audio-debug" aria-label="Mobile audio diagnostic">
    <button type="button" className="audio-debug-toggle" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen}>Audio Debug</button>
    {isOpen && <div className="audio-debug-panel">
      <div><b>Browser</b><span>{diagnostic.browser}</span></div>
      <div><b>Microphone permission</b><span>{diagnostic.permission}</span></div>
      <div><b>Original mic</b><span>audioTracks: {diagnostic.originalMicTracks.length}</span><TrackDetails track={diagnostic.originalMicTracks[0]} /></div>
      <div><b>Mic signal</b><span>signal detected: {diagnostic.signalDetected ? 'YES' : 'NO'} · average: {diagnostic.averageLevel.toFixed(1)}</span></div>
      <div><b>Final recorder stream</b><span>audioTracks: {diagnostic.recorderAudioTracks.length} · videoTracks: {diagnostic.recorderVideoTracks.length}</span></div>
      <div><b>Final audio track</b><TrackDetails track={diagnostic.recorderAudioTracks[0]} /></div>
      <div><b>Same track</b><span>{diagnostic.sameTrack === null ? 'Not recorded yet' : diagnostic.sameTrack ? 'YES' : 'NO'}</span></div>
      <div><b>MediaRecorder</b><span>{diagnostic.mimeType || 'Not started'}</span></div>
      <div><b>Data available</b><span>{diagnostic.lastBlob ? `${diagnostic.lastBlob.size} bytes · ${diagnostic.lastBlob.type || 'unknown type'}` : 'No blob yet'}</span></div>
      <div><b>Error</b><span>{diagnostic.error || 'None'}</span></div>
      <button type="button" className="audio-debug-copy" onClick={() => void copyDiagnostic()}>Copy Diagnostic</button>{copyStatus && <span className="audio-debug-copy-status">{copyStatus}</span>}
    </div>}
  </section>
}
