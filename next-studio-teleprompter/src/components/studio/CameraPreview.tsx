import { useCallback, useEffect, useRef, useState } from 'react'
import type { useCamera } from '../../hooks/useCamera'
import { Button } from '../ui/Button'
import { TeleprompterOverlay } from './TeleprompterOverlay'
import type { useTeleprompter } from '../../hooks/useTeleprompter'
import { useBackground } from '../../hooks/useBackground'
import { BackgroundPanel } from './BackgroundPanel'
import { useVirtualBackground } from '../../hooks/useVirtualBackground'

type CameraController = ReturnType<typeof useCamera>
type Ratio = '16:9' | '9:16' | '1:1' | '4:5'
const ratioValues: Record<Ratio, string> = { '16:9': '16 / 9', '9:16': '9 / 16', '1:1': '1 / 1', '4:5': '4 / 5' }

type Teleprompter = ReturnType<typeof useTeleprompter>
export function CameraPreview({ camera, script, teleprompter, isRecording, language, recordingReady, onProcessedStream, onToggleRecording }: { camera: CameraController; script: string; teleprompter: Teleprompter; isRecording: boolean; language: 'en' | 'es'; recordingReady: boolean; onProcessedStream: (stream: MediaStream | null, active: boolean) => void; onToggleRecording: () => Promise<void> }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ratio, setRatio] = useState<Ratio>('16:9')
  const [unsupportedNotice, setUnsupportedNotice] = useState(false)
  const { background, backgroundStyle, selectBackground, uploadBackground } = useBackground()
  const useOriginalAfterFailure = useCallback(() => {
    setUnsupportedNotice(true)
    selectBackground({ type: 'original', id: 'original', value: '' })
  }, [selectBackground])
  const { status } = useVirtualBackground({ videoRef, canvasRef, cameraStream: camera.stream, background, ratio, onProcessedStream, onUnsupported: useOriginalAfterFailure })

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = camera.stream
  }, [camera.stream])

  useEffect(() => {
    if (!unsupportedNotice) return
    const timeout = window.setTimeout(() => setUnsupportedNotice(false), 5000)
    return () => window.clearTimeout(timeout)
  }, [unsupportedNotice])

  const processed = background.type !== 'original'

  return <section className="studio-panel camera-panel" aria-labelledby="camera-title">
    <div className="camera-panel-heading"><span className="camera-title-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7.5h10.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Zm12.5 3.1 4-2.4a1 1 0 0 1 1.5.86v5.88a1 1 0 0 1-1.5.86l-4-2.4Z" /></svg></span><span><strong id="camera-title">{language === 'es' ? 'Vista previa de cámara' : 'Camera Preview'}</strong><small><i className={camera.stream ? 'active' : ''} />{language === 'es' ? 'Así te verán en tu grabación' : 'This is how you will look in your recording'}</small></span></div>
    <div className="camera-preview-layout">
      <div className="camera-main-column">
        <div className="camera-stage">
          <div className={`camera-surface ratio-${ratio.replace(':', '-')} background-${background.type}`} style={{ aspectRatio: ratioValues[ratio], ...backgroundStyle }} data-background-type={background.type}>
        {camera.stream ? <><video ref={videoRef} className={processed ? 'processing-video' : ''} autoPlay playsInline muted /><canvas ref={canvasRef} className={processed ? 'composite-canvas visible' : 'composite-canvas'} aria-label={language === 'es' ? 'Vista previa con fondo virtual' : 'Virtual background preview'} />{status === 'loading' && <div className="virtual-background-message"><span className="virtual-background-spinner" />{language === 'es' ? 'Preparando fondo virtual...' : 'Preparing virtual background...'}</div>}<Button className="camera-toggle" disabled={isRecording} onClick={camera.stopCamera}>{language === 'es' ? 'Apagar cámara' : 'Turn Off Camera'}</Button></> : <div className="camera-placeholder">{camera.error ? <><p>{camera.error}</p><Button variant="primary" onClick={() => camera.startCamera()}>{language === 'es' ? 'Intentar de nuevo' : 'Try Again'}</Button></> : <><span className="camera-icon" aria-hidden="true">▣</span><p>{language === 'es' ? 'La cámara está apagada' : 'Camera is off'}</p><Button variant="primary" disabled={camera.isLoading} onClick={() => camera.startCamera()}>{camera.isLoading ? (language === 'es' ? 'Iniciando cámara…' : 'Starting camera…') : (language === 'es' ? 'Encender cámara' : 'Turn On Camera')}</Button></>}</div>}
        {camera.stream && status !== 'loading' && <div className="record-ready-badge"><i />{language === 'es' ? 'Listo para grabar' : 'Ready to record'}</div>}
        {unsupportedNotice && <div className="virtual-background-message error">{language === 'es' ? 'El fondo virtual no es compatible con este dispositivo.' : 'Virtual background is not supported on this device.'}</div>}
        <TeleprompterOverlay script={script} teleprompter={teleprompter} />
          </div>
        </div>
        <div className="camera-action-bar">
          <div className="camera-secondary-actions"><Button disabled>{language === 'es' ? 'Voltear cámara' : 'Flip camera'}</Button><label className="ratio-select"><span>{language === 'es' ? 'Proporción' : 'Aspect ratio'}</span><select disabled={isRecording} value={ratio} onChange={(event) => setRatio(event.target.value as Ratio)} aria-label={language === 'es' ? 'Proporción' : 'Aspect ratio'}><option>16:9</option><option>9:16</option><option>1:1</option><option>4:5</option></select></label></div>
          <Button variant="primary" className={isRecording ? 'studio-record-button recording' : 'studio-record-button'} disabled={!isRecording && (!camera.stream || !recordingReady)} onClick={() => void onToggleRecording()}><span className="record-dot" />{isRecording ? (language === 'es' ? 'Detener grabación' : 'Stop recording') : (language === 'es' ? 'Iniciar grabación' : 'Start recording')}</Button>
        </div>
        <p className="camera-help"><span aria-hidden="true">☀</span>{language === 'es' ? 'Consejo: Asegúrate de tener buena iluminación frontal para mejores resultados.' : 'Tip: Make sure you have good front lighting for the best results.'}</p>
      </div>
      <BackgroundPanel language={language} selection={background} disabled={isRecording} onSelect={selectBackground} onUpload={uploadBackground} />
    </div>
  </section>
}
