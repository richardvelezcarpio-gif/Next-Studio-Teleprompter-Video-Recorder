import { useOutletContext } from 'react-router-dom'
import { CameraPreview } from '../components/studio/CameraPreview'
import { ScriptPanel } from '../components/studio/ScriptPanel'
import { StudioControls } from '../components/studio/StudioControls'

import type { useCamera } from '../hooks/useCamera'
import type { useMicrophone } from '../hooks/useMicrophone'
import type { useTeleprompter } from '../hooks/useTeleprompter'
import type { useRecorder } from '../hooks/useRecorder'
import type { useStudioAudio } from '../hooks/useStudioAudio'
import { RecordingPreview } from '../components/studio/RecordingPreview'

type CameraController = ReturnType<typeof useCamera>
type MicrophoneController = ReturnType<typeof useMicrophone>
type Teleprompter = ReturnType<typeof useTeleprompter>
type Recorder = ReturnType<typeof useRecorder>

export function StudioPage() {
  const { camera, microphone, studioAudio, script, setScript, teleprompter, recorder, onProcessedStream, onToggleRecording, processedVideo } = useOutletContext<{ camera: CameraController; microphone: MicrophoneController; studioAudio: ReturnType<typeof useStudioAudio>; script: string; setScript: (script: string) => void; scriptTitle: string; teleprompter: Teleprompter; recorder: Recorder; onProcessedStream: (stream: MediaStream | null, active: boolean) => void; onToggleRecording: () => Promise<void>; processedVideo: { stream: MediaStream | null; active: boolean } }>()
  const language = localStorage.getItem('nextStudioLanguage') === 'es' ? 'es' : 'en'
  return <div className="studio-page"><div className="studio-workspace"><ScriptPanel value={script} onChange={setScript} disabled={teleprompter.status === 'running'} /><CameraPreview camera={camera} microphone={microphone} studioAudio={studioAudio} script={script} teleprompter={teleprompter} isRecording={recorder.isRecording} language={language} onProcessedStream={onProcessedStream} onToggleRecording={onToggleRecording} recordingReady={!processedVideo.active || Boolean(processedVideo.stream)} /></div><StudioControls microphone={microphone} teleprompter={teleprompter} script={script} recorder={recorder} />{recorder.recordedUrl && recorder.recordedBlob && <RecordingPreview url={recorder.recordedUrl} blob={recorder.recordedBlob} mimeType={recorder.mimeType} duration={recorder.elapsedSeconds} hasAudio={recorder.hasAudio} onRecordAgain={recorder.resetRecording} />}</div>
}
