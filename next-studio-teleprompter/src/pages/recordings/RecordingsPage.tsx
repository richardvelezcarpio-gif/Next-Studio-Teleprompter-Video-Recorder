import { Link } from 'react-router-dom'
import { PageContainer } from '../../components/layout/PageContainer'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'

export function RecordingsPage() { return <PageContainer><p className="eyebrow">Library</p><h1>Recordings</h1><EmptyState title="No recordings yet" description="Your recordings will appear here." action={<Link to="/studio"><Button variant="primary">Go to Studio</Button></Link>} /></PageContainer> }
