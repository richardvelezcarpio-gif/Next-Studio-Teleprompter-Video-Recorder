import { PageContainer } from '../../components/layout/PageContainer'
import { Card } from '../../components/ui/Card'
export function SettingsPlaceholder({ title, description }: { title: string; description: string }) { return <PageContainer><p className="eyebrow">Settings</p><h1>{title}</h1><Card><p className="placeholder-copy">{description}</p></Card></PageContainer> }
