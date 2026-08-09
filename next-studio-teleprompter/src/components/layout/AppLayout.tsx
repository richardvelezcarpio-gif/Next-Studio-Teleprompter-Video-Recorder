import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import { useMicrophone } from '../../hooks/useMicrophone'
import { useTeleprompter } from '../../hooks/useTeleprompter'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  const camera = useCamera()
  const microphone = useMicrophone()
  const teleprompter = useTeleprompter()
  const [script, setScript] = useState('')
  const location = useLocation()
  const { stopCamera } = camera
  const { stopMicrophone } = microphone
  const { pause } = teleprompter

  useEffect(() => {
    if (location.pathname !== '/studio') {
      stopCamera()
      stopMicrophone()
      pause()
    }
  }, [location.pathname, pause, stopCamera, stopMicrophone])

  return (
    <div className="app-shell">
      <AppHeader camera={camera} microphone={microphone} script={script} teleprompter={teleprompter} />
      <main className="app-main"><Outlet context={{ camera, microphone, script, setScript, teleprompter }} /></main>
    </div>
  )
}
