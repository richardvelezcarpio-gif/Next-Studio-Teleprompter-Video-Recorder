import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useCamera } from '../../hooks/useCamera'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  const camera = useCamera()
  const location = useLocation()
  const { stopCamera } = camera

  useEffect(() => {
    if (location.pathname !== '/studio') stopCamera()
  }, [location.pathname, stopCamera])

  return (
    <div className="app-shell">
      <AppHeader camera={camera} />
      <main className="app-main"><Outlet context={camera} /></main>
    </div>
  )
}
