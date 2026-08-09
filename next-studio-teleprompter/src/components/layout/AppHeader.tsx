import { Link, NavLink } from 'react-router-dom'
import { Button } from '../ui/Button'
import type { useCamera } from '../../hooks/useCamera'
import type { useMicrophone } from '../../hooks/useMicrophone'

type CameraController = ReturnType<typeof useCamera>
type MicrophoneController = ReturnType<typeof useMicrophone>

export function AppHeader({ camera, microphone }: { camera: CameraController; microphone: MicrophoneController }) {
  return (
    <header className="app-header">
      <Link to="/studio" className="brand" aria-label="Next Studio home">
        {/* The supplied original logo belongs at src/assets/branding/next-studio-logo.png. */}
        <span className="brand-logo-slot" aria-label="Next Studio logo" role="img" />
        <span><strong>Next Studio</strong><small>Teleprompter Video Recorder</small></span>
      </Link>
      <nav className="header-actions" aria-label="Primary actions">
        <Link to="/scripts/new" className="header-link">New Script</Link>
        <NavLink to="/scripts" className="header-link">Open</NavLink>
        <button className="header-link" type="button">Save</button>
      </nav>
      <nav className="header-settings" aria-label="Studio settings">
        <button className="header-link" type="button" onClick={() => camera.stream ? camera.stopCamera() : camera.startCamera()}>{camera.stream ? 'Camera On' : 'Camera'}</button>
        {camera.stream && camera.cameras.length > 1 && <label className="header-camera-select"><span className="sr-only">Select camera</span><select value={camera.selectedDeviceId} onChange={(event) => camera.selectCamera(event.target.value)}>{camera.cameras.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}</select></label>}
        <button className="header-link" type="button" onClick={() => microphone.isActive ? microphone.stopMicrophone() : microphone.startMicrophone()}>{microphone.isActive ? 'Mic On' : 'Mic Off'}</button>
        {microphone.isActive && microphone.microphones.length > 1 && <label className="header-camera-select"><span className="sr-only">Select microphone</span><select value={microphone.selectedDeviceId} onChange={(event) => microphone.selectMicrophone(event.target.value)}>{microphone.microphones.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}</select></label>}
        <NavLink to="/settings" className="header-link">Settings</NavLink>
      </nav>
      <div className="header-cta">
        <Button variant="primary">Start</Button>
        <Button variant="record"><span className="record-dot" />Record</Button>
      </div>
    </header>
  )
}
