import { Link } from 'react-router-dom'
import { PageContainer } from '../../components/layout/PageContainer'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'

export function ScriptsPage() { return <PageContainer><div className="page-heading"><div><p className="eyebrow">Library</p><h1>Scripts</h1><p>Your saved teleprompter scripts will appear here.</p></div><Link to="/scripts/new"><Button variant="primary">New Script</Button></Link></div><EmptyState title="No scripts yet" description="Create a script to start your next recording." /></PageContainer> }
