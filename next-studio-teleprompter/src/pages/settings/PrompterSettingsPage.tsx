import { PageContainer } from '../../components/layout/PageContainer'
import { Card } from '../../components/ui/Card'

export function PrompterSettingsPage() { return <PageContainer><p className="eyebrow">Settings</p><h1>Teleprompter Settings</h1><div className="settings-list"><Card><span>Default Speed</span><strong>5</strong></Card><Card><span>Default Text Size</span><strong>Medium</strong></Card><Card><span>Default Position</span><strong>Center</strong></Card></div></PageContainer> }
