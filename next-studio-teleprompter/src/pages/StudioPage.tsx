import { useOutletContext } from 'react-router-dom'
import { CameraPreview } from '../components/studio/CameraPreview'
import { ScriptPanel } from '../components/studio/ScriptPanel'
import { StudioControls } from '../components/studio/StudioControls'

import type { useCamera } from '../hooks/useCamera'
import type { useMicrophone } from '../hooks/useMicrophone'
import type { useTeleprompter } from '../hooks/useTeleprompter'
import type { useRecorder } from '../hooks/useRecorder'
import { RecordingPreview } from '../components/studio/RecordingPreview'

type CameraController = ReturnType<typeof useCamera>
type MicrophoneController = ReturnType<typeof useMicrophone>
type Teleprompter = ReturnType<typeof useTeleprompter>
type Recorder = ReturnType<typeof useRecorder>

export function StudioPage() {
  const { camera, microphone, script, setScript, teleprompter, recorder } = useOutletContext<{ camera: CameraController; microphone: MicrophoneController; script: string; setScript: (script: string) => void; teleprompter: Teleprompter; recorder: Recorder }>()
  return <div className="studio-page"><div className="studio-workspace"><ScriptPanel value={script} onChange={setScript} disabled={teleprompter.status === 'running'} /><CameraPreview camera={camera} script={script} teleprompter={teleprompter} isRecording={recorder.isRecording} /></div><StudioControls microphone={microphone} teleprompter={teleprompter} script={script} recorder={recorder} />{recorder.recordedUrl && recorder.recordedBlob && <RecordingPreview url={recorder.recordedUrl} blob={recorder.recordedBlob} mimeType={recorder.mimeType} duration={recorder.elapsedSeconds} hasAudio={recorder.hasAudio} onRecordAgain={recorder.resetRecording} />}</div>
}
