import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { AppLayout } from '../components/layout/AppLayout'
import { HelpPage } from '../pages/HelpPage'
import { StudioPage } from '../pages/StudioPage'
import { RecordingDetailsPage } from '../pages/recordings/RecordingDetailsPage'
import { RecordingsPage } from '../pages/recordings/RecordingsPage'
import { EditScriptPage } from '../pages/scripts/EditScriptPage'
import { NewScriptPage } from '../pages/scripts/NewScriptPage'
import { ScriptsPage } from '../pages/scripts/ScriptsPage'
import { AudioSettingsPage } from '../pages/settings/AudioSettingsPage'
import { GeneralSettingsPage } from '../pages/settings/GeneralSettingsPage'
import { PrompterSettingsPage } from '../pages/settings/PrompterSettingsPage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { VideoSettingsPage } from '../pages/settings/VideoSettingsPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/scripts" element={<ScriptsPage />} />
          <Route path="/scripts/new" element={<NewScriptPage />} />
          <Route path="/scripts/:id" element={<EditScriptPage />} />
          <Route path="/recordings" element={<RecordingsPage />} />
          <Route path="/recordings/:id" element={<RecordingDetailsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/video" element={<VideoSettingsPage />} />
          <Route path="/settings/audio" element={<AudioSettingsPage />} />
          <Route path="/settings/prompter" element={<PrompterSettingsPage />} />
          <Route path="/settings/general" element={<GeneralSettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/studio" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
