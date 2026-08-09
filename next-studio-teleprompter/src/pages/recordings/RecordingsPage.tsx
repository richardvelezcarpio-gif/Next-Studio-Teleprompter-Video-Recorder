import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../components/layout/PageContainer'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { deleteRecording, downloadBlob, formatDuration, formatFileSize, getRecordings, type SavedRecording } from '../../utils/recordingsDb'

export function RecordingsPage() {
  const [recordings, setRecordings] = useState<SavedRecording[]>([])
  const [error, setError] = useState('')
  const load = async () => { try { setRecordings(await getRecordings()) } catch { setError('Unable to load saved recordings.') } }
  useEffect(() => { void load() }, [])
  const remove = async (id: string) => { if (!window.confirm('Delete this recording?')) return; try { await deleteRecording(id); await load() } catch { setError('Unable to delete recording.') } }
  return <PageContainer><div className="page-heading"><div><p className="eyebrow">Library</p><h1>Recordings</h1><p>Saved locally on this device.</p></div><Link to="/studio"><Button variant="primary">Go to Studio</Button></Link></div>{error && <p className="storage-error">{error}</p>}{recordings.length ? <div className="recordings-list">{recordings.map((recording) => <article className="saved-recording" key={recording.id}><div><h2>{recording.name}</h2><p>{new Date(recording.createdAt).toLocaleString()} · {formatDuration(recording.duration)} · {formatFileSize(recording.size)}</p></div><div className="saved-recording-actions"><Link to={`/recordings/${recording.id}`}><Button>Open</Button></Link><Button onClick={() => downloadBlob(recording.blob, recording.name, recording.mimeType)}>Download</Button><Button onClick={() => void remove(recording.id)}>Delete</Button></div></article>)}</div> : <EmptyState title="No saved recordings yet." description="Your saved recordings will appear here." action={<Link to="/studio"><Button variant="primary">Go to Studio</Button></Link>} />}</PageContainer>
}
