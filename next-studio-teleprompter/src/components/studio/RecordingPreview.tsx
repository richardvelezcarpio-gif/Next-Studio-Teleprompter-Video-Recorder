import { Button } from '../ui/Button'

function extensionFor(mimeType: string) { return mimeType.includes('mp4') ? 'mp4' : 'webm' }

export function RecordingPreview({ url, mimeType, onRecordAgain }: { url: string; mimeType: string; onRecordAgain: () => void }) {
  const download = () => {
    const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `next-studio-recording-${date}.${extensionFor(mimeType)}`
    anchor.click()
  }
  return <section className="recording-preview" aria-labelledby="recording-preview-title"><div><span className="eyebrow">Recording complete</span><h2 id="recording-preview-title">Recording Preview</h2></div><video controls src={url} /><div className="recording-preview-actions"><Button onClick={download}>Download Video</Button><Button variant="primary" onClick={onRecordAgain}>Record Again</Button></div></section>
}
