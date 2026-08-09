import { useOutletContext } from 'react-router-dom'
import { CameraPreview } from '../components/studio/CameraPreview'
import { ScriptPanel } from '../components/studio/ScriptPanel'
import { StudioControls } from '../components/studio/StudioControls'

import type { useCamera } from '../hooks/useCamera'
import type { useMicrophone } from '../hooks/useMicrophone'

type CameraController = ReturnType<typeof useCamera>
type MicrophoneController = ReturnType<typeof useMicrophone>

export function StudioPage() {
  const { camera, microphone } = useOutletContext<{ camera: CameraController; microphone: MicrophoneController }>()
  return <div className="studio-page"><div className="studio-workspace"><ScriptPanel /><CameraPreview camera={camera} /></div><StudioControls microphone={microphone} /></div>
}
