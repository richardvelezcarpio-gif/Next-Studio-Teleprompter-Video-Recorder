import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useCamera } from '../../hooks/useCamera'
import { useMicrophone } from '../../hooks/useMicrophone'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  const camera = useCamera()
  const microphone = useMicrophone()
  const location = useLocation()
  const { stopCamera } = camera
  const { stopMicrophone } = microphone

  useEffect(() => {
    if (location.pathname !== '/studio') {
      stopCamera()
      stopMicrophone()
    }
  }, [location.pathname, stopCamera, stopMicrophone])

  return (
    <div className="app-shell">
      <AppHeader camera={camera} microphone={microphone} />
      <main className="app-main"><Outlet context={{ camera, microphone }} /></main>
    </div>
  )
}
