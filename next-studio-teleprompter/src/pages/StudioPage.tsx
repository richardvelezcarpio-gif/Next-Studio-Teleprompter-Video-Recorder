import { useOutletContext } from 'react-router-dom'
import { CameraPreview } from '../components/studio/CameraPreview'
import { ScriptPanel } from '../components/studio/ScriptPanel'
import { StudioControls } from '../components/studio/StudioControls'

import type { useCamera } from '../hooks/useCamera'

type CameraController = ReturnType<typeof useCamera>

export function StudioPage() {
  const camera = useOutletContext<CameraController>()
  return <div className="studio-page"><div className="studio-workspace"><ScriptPanel /><CameraPreview camera={camera} /></div><StudioControls /></div>
}
