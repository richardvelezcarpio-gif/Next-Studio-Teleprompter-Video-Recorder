import { Button } from '../ui/Button'

export function ScriptPanel() {
  return <section className="studio-panel script-panel" aria-labelledby="script-title">
    <div className="panel-heading"><span className="eyebrow" id="script-title">Script</span><span className="panel-note">Draft</span></div>
    <textarea aria-label="Script editor" placeholder="Write or paste your script here..." />
    <div className="script-footer"><Button>Import .txt</Button><Button>Clear</Button></div>
  </section>
}
