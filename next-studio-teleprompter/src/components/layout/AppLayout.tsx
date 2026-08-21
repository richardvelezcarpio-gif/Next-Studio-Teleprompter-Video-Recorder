import { Outlet, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import { useMicrophone } from '../../hooks/useMicrophone'
import { useTeleprompter } from '../../hooks/useTeleprompter'
import { useRecorder } from '../../hooks/useRecorder'
import { AppHeader } from './AppHeader'
import { createScript, updateScript } from '../../utils/scriptsDb'

export function AppLayout() {
  const camera = useCamera()
  const microphone = useMicrophone()
  const teleprompter = useTeleprompter()
  const recorder = useRecorder()
  const [script, setScript] = useState('')
  const [scriptId, setScriptId] = useState<string | null>(null)
  const [scriptTitle, setScriptTitle] = useState('')
  const [processedVideo, setProcessedVideo] = useState<{ stream: MediaStream | null; active: boolean }>({ stream: null, active: false })
  const location = useLocation()
  const { stopCamera } = camera
  const { stopMicrophone } = microphone
  const { pause } = teleprompter
  const { stopRecording } = recorder
  const handleProcessedStream = useCallback((stream: MediaStream | null, active: boolean) => setProcessedVideo({ stream, active }), [])
  const handleRecording = async () => {
    if (recorder.isRecording) {
      recorder.stopRecording()
      return
    }
    const isMobileBrowser = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    const microphoneStream = isMobileBrowser && !microphone.stream?.getAudioTracks().length
      ? await microphone.startMicrophone()
      : microphone.stream
    if (processedVideo.active && !processedVideo.stream) return
    recorder.startRecording(processedVideo.active ? processedVideo.stream : camera.stream, microphoneStream || null, isMobileBrowser)
  }

  useEffect(() => {
    const opened = location.state?.script as { id: string; title: string; content: string } | undefined
    if (location.pathname === '/studio' && opened) { setScript(opened.content); setScriptId(opened.id); setScriptTitle(opened.title) }
  }, [location])

  const saveScript = async () => {
    const title = scriptTitle || window.prompt('Script name:', 'Untitled Script') || ''
    if (!title) return
    const saved = scriptId ? await updateScript(scriptId, title, script) : await createScript(title, script)
    setScriptId(saved.id); setScriptTitle(saved.title)
  }
  const newScript = () => { if (script && !window.confirm('Discard unsaved changes?')) return false; setScript(''); setScriptId(null); setScriptTitle(''); teleprompter.reset(); return true }

  useEffect(() => {
    if (location.pathname !== '/studio') {
      stopCamera()
      stopMicrophone()
      stopRecording()
      pause()
    }
  }, [location.pathname, pause, stopCamera, stopMicrophone, stopRecording])

  return (
    <div className="app-shell">
      <AppHeader camera={camera} microphone={microphone} script={script} teleprompter={teleprompter} recorder={recorder} processedVideo={processedVideo} onToggleRecording={handleRecording} onSave={() => void saveScript()} onNew={newScript} />
      <main className="app-main"><Outlet context={{ camera, microphone, script, setScript, scriptTitle, teleprompter, recorder, onProcessedStream: handleProcessedStream, onToggleRecording: handleRecording, processedVideo }} /></main>
    </div>
  )
}
