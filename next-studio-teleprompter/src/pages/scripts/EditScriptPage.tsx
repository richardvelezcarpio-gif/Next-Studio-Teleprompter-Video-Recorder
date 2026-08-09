import { useParams } from 'react-router-dom'
import { PageContainer } from '../../components/layout/PageContainer'
import { EmptyState } from '../../components/ui/EmptyState'

export function EditScriptPage() { const { id } = useParams(); return <PageContainer><p className="eyebrow">Script</p><h1>Script Editor</h1><EmptyState title="Script ready for editing" description={`Script “${id}” will be available here once saved scripts are introduced.`} /></PageContainer> }
