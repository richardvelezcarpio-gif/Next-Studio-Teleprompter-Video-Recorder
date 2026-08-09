import { CameraPreview } from '../components/studio/CameraPreview'
import { ScriptPanel } from '../components/studio/ScriptPanel'
import { StudioControls } from '../components/studio/StudioControls'

export function StudioPage() {
  return <div className="studio-page"><div className="studio-workspace"><ScriptPanel /><CameraPreview /></div><StudioControls /></div>
}
