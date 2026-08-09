import { useEffect, useRef, useState } from 'react'
import type { useCamera } from '../../hooks/useCamera'
import { Button } from '../ui/Button'
import { TeleprompterOverlay } from './TeleprompterOverlay'
import type { useTeleprompter } from '../../hooks/useTeleprompter'

type CameraController = ReturnType<typeof useCamera>
type Ratio = '16:9' | '9:16' | '1:1' | '4:5'
const ratioValues: Record<Ratio, string> = { '16:9': '16 / 9', '9:16': '9 / 16', '1:1': '1 / 1', '4:5': '4 / 5' }

type Teleprompter = ReturnType<typeof useTeleprompter>
export function CameraPreview({ camera, script, teleprompter, isRecording }: { camera: CameraController; script: string; teleprompter: Teleprompter; isRecording: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ratio, setRatio] = useState<Ratio>('16:9')

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = camera.stream
  }, [camera.stream])

  return <section className="studio-panel camera-panel" aria-labelledby="camera-title">
    <div className="panel-heading"><span className="eyebrow" id="camera-title">Camera Preview</span><label className="ratio-select">Aspect ratio<select value={ratio} onChange={(event) => setRatio(event.target.value as Ratio)} aria-label="Aspect ratio"><option>16:9</option><option>9:16</option><option>1:1</option><option>4:5</option></select></label></div>
    <div className="camera-surface" style={{ aspectRatio: ratioValues[ratio] }}>
      {camera.stream ? <><video ref={videoRef} autoPlay playsInline muted /><Button className="camera-toggle" disabled={isRecording} onClick={camera.stopCamera}>Turn Off Camera</Button></> : <div className="camera-placeholder">{camera.error ? <><p>{camera.error}</p><Button variant="primary" onClick={() => camera.startCamera()}>Try Again</Button></> : <><span className="camera-icon" aria-hidden="true">▣</span><p>Camera is off</p><Button variant="primary" disabled={camera.isLoading} onClick={() => camera.startCamera()}>{camera.isLoading ? 'Starting camera…' : 'Turn On Camera'}</Button></>}</div>}
      <TeleprompterOverlay script={script} teleprompter={teleprompter} />
    </div>
  </section>
}
