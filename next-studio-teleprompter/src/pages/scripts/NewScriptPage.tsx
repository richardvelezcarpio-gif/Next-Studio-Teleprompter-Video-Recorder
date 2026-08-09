import { Link } from 'react-router-dom'
import { PageContainer } from '../../components/layout/PageContainer'
import { Button } from '../../components/ui/Button'

export function NewScriptPage() { return <PageContainer><div className="page-heading"><div><p className="eyebrow">Script editor</p><h1>New Script</h1><p>Prepare your script for the teleprompter.</p></div><Link to="/studio"><Button>Back to Studio</Button></Link></div><textarea className="page-editor" aria-label="New script" placeholder="Write or paste your script here..." /></PageContainer> }
