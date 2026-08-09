import { Link } from 'react-router-dom'
import { PageContainer } from '../../components/layout/PageContainer'

const settings = [['Video', 'Camera and video preferences', '/settings/video'], ['Audio', 'Microphone preferences', '/settings/audio'], ['Teleprompter', 'Prompt defaults and display', '/settings/prompter'], ['General', 'General preferences', '/settings/general']]
export function SettingsPage() { return <PageContainer><p className="eyebrow">Workspace</p><h1>Settings</h1><p className="page-intro">Set up your studio preferences.</p><div className="settings-grid">{settings.map(([name, description, to]) => <Link className="settings-card" to={to} key={to}><span>↗</span><h2>{name}</h2><p>{description}</p></Link>)}</div></PageContainer> }
