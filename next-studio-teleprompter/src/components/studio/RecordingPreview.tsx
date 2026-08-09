import { useState } from 'react'
import { Button } from '../ui/Button'
import { downloadBlob, saveRecording } from '../../utils/recordingsDb'

export function RecordingPreview({ url, blob, mimeType, duration, hasAudio, onRecordAgain }: { url: string; blob: Blob; mimeType: string; duration: number; hasAudio: boolean; onRecordAgain: () => void }) {
  const [name, setName] = useState(`Recording - ${new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const download = () => downloadBlob(blob, `next-studio-recording-${new Date().toISOString().slice(0, 19)}`, mimeType)
  const save = async () => {
    setIsSaving(true)
    setMessage('')
    try { await saveRecording({ name: name.trim() || 'Recording', createdAt: new Date().toISOString(), duration, mimeType, blob, hasAudio }); setMessage('Recording saved') } catch { setMessage('Unable to save recording locally.') } finally { setIsSaving(false) }
  }
  return <section className="recording-preview" aria-labelledby="recording-preview-title"><div><span className="eyebrow">Recording complete</span><h2 id="recording-preview-title">Recording Preview</h2><label className="recording-name">Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>{message && <p className="save-message">{message}</p>}</div><video controls src={url} /><div className="recording-preview-actions"><Button onClick={download}>Download Video</Button><Button disabled={isSaving} onClick={save}>Save Recording</Button><Button variant="primary" onClick={onRecordAgain}>Record Again</Button></div></section>
}
