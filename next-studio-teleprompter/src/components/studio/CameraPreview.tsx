export function CameraPreview() {
  return <section className="studio-panel camera-panel" aria-labelledby="camera-title">
    <div className="panel-heading"><span className="eyebrow" id="camera-title">Camera Preview</span><label className="ratio-select">Aspect ratio<select defaultValue="16:9" aria-label="Aspect ratio"><option>16:9</option><option>9:16</option><option>1:1</option><option>4:5</option></select></label></div>
    <div className="camera-surface"><div className="camera-placeholder"><span className="camera-icon" aria-hidden="true">▣</span><p>Camera preview will appear here</p></div></div>
  </section>
}
