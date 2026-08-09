import { useOutletContext } from 'react-router-dom'
import { CameraPreview } from '../components/studio/CameraPreview'
import { ScriptPanel } from '../components/studio/ScriptPanel'
import { StudioControls } from '../components/studio/StudioControls'

import type { useCamera } from '../hooks/useCamera'
import type { useMicrophone } from '../hooks/useMicrophone'
import type { useTeleprompter } from '../hooks/useTeleprompter'

type CameraController = ReturnType<typeof useCamera>
type MicrophoneController = ReturnType<typeof useMicrophone>
type Teleprompter = ReturnType<typeof useTeleprompter>

export function StudioPage() {
  const { camera, microphone, script, setScript, teleprompter } = useOutletContext<{ camera: CameraController; microphone: MicrophoneController; script: string; setScript: (script: string) => void; teleprompter: Teleprompter }>()
  return <div className="studio-page"><div className="studio-workspace"><ScriptPanel value={script} onChange={setScript} disabled={teleprompter.status === 'running'} /><CameraPreview camera={camera} script={script} teleprompter={teleprompter} /></div><StudioControls microphone={microphone} teleprompter={teleprompter} script={script} /></div>
}
