import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '../../components/layout/PageContainer'
import { Button } from '../../components/ui/Button'
import { deleteRecording, downloadBlob, formatDuration, formatFileSize, getRecording, type SavedRecording } from '../../utils/recordingsDb'

export function RecordingDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [recording, setRecording] = useState<SavedRecording | null>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { let objectUrl = ''; void getRecording(id).then((saved) => { if (!saved) { setError('Recording not found.'); return } objectUrl = URL.createObjectURL(saved.blob); setRecording(saved); setUrl(objectUrl) }).catch(() => setError('Unable to load recording.')); return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) } }, [id])
  const remove = async () => { if (!recording || !window.confirm('Delete this recording?')) return; try { await deleteRecording(recording.id); navigate('/recordings') } catch { setError('Unable to delete recording.') } }
  return <PageContainer><p className="eyebrow">Recording</p>{error ? <><h1>Recording Preview</h1><p className="storage-error">{error}</p><Link to="/recordings"><Button>Back to Recordings</Button></Link></> : recording && <><div className="page-heading"><div><h1>{recording.name}</h1><p>{new Date(recording.createdAt).toLocaleString()} · {formatDuration(recording.duration)} · {formatFileSize(recording.size)}</p></div></div><div className="recording-detail"><video controls src={url} /><div className="recording-preview-actions"><Button onClick={() => downloadBlob(recording.blob, recording.name, recording.mimeType)}>Download</Button><Button onClick={() => void remove()}>Delete</Button><Link to="/recordings"><Button variant="primary">Back to Recordings</Button></Link></div></div></>}</PageContainer>
}
