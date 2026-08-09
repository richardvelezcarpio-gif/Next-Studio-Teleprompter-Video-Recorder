import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import type { useCamera } from '../../hooks/useCamera'
import type { useMicrophone } from '../../hooks/useMicrophone'
import type { useTeleprompter } from '../../hooks/useTeleprompter'
import type { useRecorder } from '../../hooks/useRecorder'
import nextStudioLogo from '../../assets/branding/next-studio-logo.png'

type CameraController = ReturnType<typeof useCamera>
type MicrophoneController = ReturnType<typeof useMicrophone>
type Teleprompter = ReturnType<typeof useTeleprompter>
type Recorder = ReturnType<typeof useRecorder>

export function AppHeader({ camera, microphone, script, teleprompter, recorder, onSave, onNew }: { camera: CameraController; microphone: MicrophoneController; script: string; teleprompter: Teleprompter; recorder: Recorder; onSave: () => void; onNew: () => boolean }) {
  const navigate = useNavigate()
  return (
    <header className="app-header">
      <Link to="/studio" className="brand" aria-label="Next Studio home">
        <img className="brand-logo" src={nextStudioLogo} alt="Next Studio" />
        <span><strong>Next Studio</strong><small>Teleprompter Video Recorder</small></span>
      </Link>
      <nav className="header-actions" aria-label="Primary actions">
        <button className="header-link" type="button" onClick={() => { if (onNew()) navigate('/studio') }}>New Script</button>
        <NavLink to="/scripts" className="header-link">Open</NavLink>
        <button className="header-link" type="button" onClick={onSave}>Save</button>
      </nav>
      <nav className="header-settings" aria-label="Studio settings">
        <button className="header-link" type="button" disabled={recorder.isRecording} onClick={() => camera.stream ? camera.stopCamera() : camera.startCamera()}>{camera.stream ? 'Camera On' : 'Camera'}</button>
        {camera.stream && camera.cameras.length > 1 && <label className="header-camera-select"><span className="sr-only">Select camera</span><select disabled={recorder.isRecording} value={camera.selectedDeviceId} onChange={(event) => camera.selectCamera(event.target.value)}>{camera.cameras.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}</select></label>}
        <button className="header-link" type="button" disabled={recorder.isRecording} onClick={() => microphone.isActive ? microphone.stopMicrophone() : microphone.startMicrophone()}>{microphone.isActive ? 'Mic On' : 'Mic Off'}</button>
        {microphone.isActive && microphone.microphones.length > 1 && <label className="header-camera-select"><span className="sr-only">Select microphone</span><select disabled={recorder.isRecording} value={microphone.selectedDeviceId} onChange={(event) => microphone.selectMicrophone(event.target.value)}>{microphone.microphones.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}</select></label>}
        <NavLink to="/settings" className="header-link">Settings</NavLink>
      </nav>
      <div className="header-cta">
        <Button variant="primary" onClick={() => teleprompter.toggle(script)}>{teleprompter.status === 'running' ? 'Pause' : teleprompter.status === 'paused' ? 'Resume' : 'Start'}</Button>
        <Button variant="record" onClick={() => recorder.isRecording ? recorder.stopRecording() : recorder.startRecording(camera.stream, microphone.stream)}><span className="record-dot" />{recorder.isRecording ? 'Stop' : 'Record'}</Button>
      </div>
    </header>
  )
}
