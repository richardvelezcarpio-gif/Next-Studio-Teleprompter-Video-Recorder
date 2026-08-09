import { Button } from '../ui/Button'

export function ScriptPanel({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  return <section className="studio-panel script-panel" aria-labelledby="script-title">
    <div className="panel-heading"><span className="eyebrow" id="script-title">Script</span><span className="panel-note">Draft</span></div>
    <textarea aria-label="Script editor" placeholder="Write or paste your script here..." value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    <div className="script-footer"><Button>Import .txt</Button><Button disabled={disabled || !value} onClick={() => onChange('')}>Clear</Button></div>
  </section>
}
