import { useRef, type ReactNode } from 'react'
import type { BackgroundSelection } from '../../hooks/useBackground'
import { BackgroundPanel } from './BackgroundPanel'
import type { StudioAudioController } from '../../hooks/useStudioAudio'

export type VideoEffects = {
  retouchEnabled: boolean
  smoothing: number
  skinDetail: number
  faceBrightness: number
  skinTone: number
  brightness: number
  contrast: number
  saturation: number
  temperature: number
  text: string
  textSecondary: string
  textVisible: boolean
  textSize: number
  textColor: string
  textFont: string
  textBold: boolean
  textItalic: boolean
  textOpacity: number
  textAlign: 'left' | 'center' | 'right'
  textPosition: 'top' | 'center' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom'
  textX: number
  textY: number
  textBackground: boolean
  textBackgroundColor: string
  textBackgroundOpacity: number
  textPadding: number
  textRadius: number
  textOutline: boolean
  textOutlineColor: string
  textOutlineWidth: number
  textShadow: 'none' | 'soft' | 'medium' | 'strong'
  captionEnabled: boolean
  captionText: string
  captionInterim: boolean
  captionLanguage: 'es-US' | 'en-US'
  captionStyle: 'clean' | 'subtitle' | 'bold' | 'social' | 'highlight'
  captionSize: number
  captionColor: string
  captionPosition: 'top' | 'center' | 'bottom'
  captionBackground: boolean
  captionHighlight: boolean
  captionHighlightColor: string
  captionCaps: 'normal' | 'uppercase' | 'capitalize'
}

type Section = 'retouch' | 'color' | 'background' | 'text' | 'audio'

function ToolSection({ id, title, icon, open, onToggle, children }: { id: Section; title: string; icon: string; open: boolean; onToggle: (id: Section) => void; children: ReactNode }) {
  return <section className={`studio-tool-section${open ? ' open' : ''}`}>
    <button type="button" className="studio-tool-heading" aria-expanded={open} aria-controls={`tool-${id}`} onClick={() => onToggle(id)}><span aria-hidden="true">{icon}</span><strong>{title}</strong><i aria-hidden="true">⌄</i></button>
    {open && <div id={`tool-${id}`} className="studio-tool-content">{children}</div>}
  </section>
}

function Slider({ label, value, min = 0, max = 100, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return <label className="effect-slider"><span>{label}<b>{value}</b></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>
}

function formatAudioTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function AudioPanel({ audio, language, disabled }: { audio: StudioAudioController; language: 'en' | 'es'; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const es = language === 'es'
  if (!audio.hasAudio) return <div className="audio-empty"><button type="button" className="audio-upload-button" disabled={disabled} onClick={() => inputRef.current?.click()}><span aria-hidden="true">＋</span>{es ? 'Agregar audio' : 'Add audio'}</button><small>{es ? 'Selecciona un archivo que tu navegador pueda reproducir (por ejemplo MP3 o WAV).' : 'Choose a file your browser can play (for example MP3 or WAV).'}</small><input ref={inputRef} className="sr-only" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac" onChange={(event) => { const file = event.target.files?.[0]; if (file) audio.loadAudio(file); event.target.value = '' }} /></div>
  return <div className="audio-editor">
    <div className="audio-file-row"><span className="audio-file-icon" aria-hidden="true">♪</span><span className="audio-file-info"><strong title={audio.fileName}>{audio.fileName}</strong><small>{audio.isPlaying ? (es ? 'Reproduciendo' : 'Playing') : (es ? 'En pausa' : 'Paused')} · {formatAudioTime(audio.currentTime)} / {formatAudioTime(audio.duration)}</small></span><button type="button" className="audio-remove" disabled={disabled} onClick={audio.removeAudio} aria-label={es ? 'Eliminar audio' : 'Remove audio'}>×</button></div>
    <input className="audio-seek" aria-label={es ? 'Posición del audio' : 'Audio position'} type="range" min="0" max={Math.max(0, audio.duration)} step="0.1" value={Math.min(audio.currentTime, audio.duration || 0)} onChange={(event) => audio.seek(Number(event.target.value))} />
    <div className="audio-transport"><button type="button" disabled={disabled} onClick={() => void (audio.isPlaying ? audio.pause() : audio.play())}>{audio.isPlaying ? 'Ⅱ' : '▶'} <span>{audio.isPlaying ? (es ? 'Pausa' : 'Pause') : 'Play'}</span></button><button type="button" disabled={disabled} onClick={() => void audio.restart()}>↺ <span>{es ? 'Reiniciar' : 'Restart'}</span></button><button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>⇄ <span>{es ? 'Cambiar' : 'Change'}</span></button></div>
    <div className="audio-volume-row"><button type="button" className={audio.muted ? 'muted' : ''} onClick={audio.toggleMute} aria-pressed={audio.muted}>{audio.muted ? '🔇' : '🔊'} <span>{es ? 'Música' : 'Music'}</span></button><input aria-label={es ? 'Volumen de música' : 'Music volume'} type="range" min="0" max="100" value={audio.volume} onChange={(event) => audio.setVolume(Number(event.target.value))} /><b>{audio.volume}%</b></div>
    {audio.error && <p className="audio-error" role="alert">{es ? (audio.error.startsWith('This audio') ? 'Este formato de audio no es compatible con tu navegador.' : 'No se pudo agregar este audio a la grabación. Se usará solamente el micrófono.') : audio.error}</p>}
    <input ref={inputRef} className="sr-only" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac" onChange={(event) => { const file = event.target.files?.[0]; if (file) audio.loadAudio(file); event.target.value = '' }} />
  </div>
}

const fonts = ['Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Impact', 'Trebuchet MS', 'Verdana']
const quickColors = ['#ffffff', '#05070b', '#ffd43b', '#ef3340', '#1769e0']

function TextProPanel({ effects, update, apply, language, captionSupported, captionError }: { effects: VideoEffects; update: <K extends keyof VideoEffects>(key: K, value: VideoEffects[K]) => void; apply: (values: Partial<VideoEffects>) => void; language: 'en' | 'es'; captionSupported: boolean; captionError: string }) {
  const es = language === 'es'
  const applyPreset = (preset: 'title' | 'subtitle' | 'lower-third' | 'cta') => {
    const shared = { textVisible: true, textBold: true, textItalic: false, textOpacity: 100, textOutline: false }
    if (preset === 'title') return apply({ ...shared, textSize: 72, textAlign: 'center', textPosition: 'center', textX: 0.5, textY: 0.5, textBackground: false, textShadow: 'medium' })
    if (preset === 'subtitle') return apply({ ...shared, textSize: 38, textAlign: 'center', textPosition: 'bottom', textX: 0.5, textY: 0.84, textBackground: true, textBackgroundColor: '#05070b', textBackgroundOpacity: 68, textShadow: 'soft' })
    if (preset === 'lower-third') return apply({ ...shared, textSize: 40, textAlign: 'left', textPosition: 'bottom-left', textX: 0.12, textY: 0.8, textBackground: true, textBackgroundColor: '#0a398c', textBackgroundOpacity: 88, textShadow: 'soft' })
    apply({ ...shared, textSize: 58, textAlign: 'center', textPosition: 'bottom', textX: 0.5, textY: 0.78, textBackground: true, textBackgroundColor: '#1769e0', textBackgroundOpacity: 95, textShadow: 'medium' })
  }
  const resetText = () => apply({ text: '', textSecondary: '', textVisible: false, textSize: 42, textColor: '#ffffff', textFont: 'Inter', textBold: true, textItalic: false, textOpacity: 100, textAlign: 'center', textPosition: 'bottom', textX: 0.5, textY: 0.82, textBackground: false, textBackgroundColor: '#05070b', textBackgroundOpacity: 68, textPadding: 14, textRadius: 10, textOutline: false, textOutlineColor: '#05070b', textOutlineWidth: 3, textShadow: 'soft' })
  return <div className="text-pro-panel">
    <div className="text-pro-title"><strong>Text Pro</strong><label className="compact-switch"><input type="checkbox" checked={effects.textVisible} onChange={(event) => update('textVisible', event.target.checked)} /><span>{effects.textVisible ? 'ON' : 'OFF'}</span></label></div>
    <div className="text-presets"><button type="button" onClick={() => applyPreset('title')}>Title</button><button type="button" onClick={() => applyPreset('subtitle')}>Subtitle</button><button type="button" onClick={() => applyPreset('lower-third')}>Lower Third</button><button type="button" onClick={() => applyPreset('cta')}>CTA</button></div>
    <details open><summary>{es ? 'Contenido' : 'Content'}</summary><div className="tool-subgroup"><label className="tool-text-input"><span>{es ? 'Texto principal' : 'Main text'}</span><textarea value={effects.text} maxLength={240} placeholder={es ? 'Escribe un título…' : 'Type a title…'} onChange={(event) => update('text', event.target.value)} /></label><label className="tool-text-input"><span>{es ? 'Segunda línea' : 'Second line'}</span><input value={effects.textSecondary} maxLength={100} placeholder={es ? 'Cargo o subtítulo' : 'Role or subtitle'} onChange={(event) => update('textSecondary', event.target.value)} /></label></div></details>
    <details><summary>{es ? 'Estilo' : 'Style'}</summary><div className="tool-subgroup"><label className="compact-field">{es ? 'Fuente' : 'Font'}<select value={effects.textFont} onChange={(event) => update('textFont', event.target.value)}>{fonts.map((font) => <option key={font}>{font}</option>)}</select></label><div className="segmented-controls"><button type="button" className={effects.textBold ? 'active' : ''} onClick={() => update('textBold', !effects.textBold)}>B</button><button type="button" className={effects.textItalic ? 'active italic' : 'italic'} onClick={() => update('textItalic', !effects.textItalic)}>I</button></div><Slider label={es ? 'Tamaño' : 'Size'} value={effects.textSize} min={20} max={120} onChange={(value) => update('textSize', value)} /><Slider label={es ? 'Opacidad' : 'Opacity'} value={effects.textOpacity} onChange={(value) => update('textOpacity', value)} /><div className="color-row"><input aria-label={es ? 'Color del texto' : 'Text color'} type="color" value={effects.textColor} onChange={(event) => update('textColor', event.target.value)} />{quickColors.map((color) => <button key={color} type="button" aria-label={color} style={{ background: color }} onClick={() => update('textColor', color)} />)}</div></div></details>
    <details><summary>{es ? 'Posición' : 'Position'}</summary><div className="tool-subgroup"><label className="compact-field">{es ? 'Preset' : 'Preset'}<select value={effects.textPosition} onChange={(event) => update('textPosition', event.target.value as VideoEffects['textPosition'])}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option><option value="top-left">Top Left</option><option value="top-right">Top Right</option><option value="bottom-left">Bottom Left</option><option value="bottom-right">Bottom Right</option><option value="custom">Custom</option></select></label><div className="segmented-controls three"><button type="button" className={effects.textAlign === 'left' ? 'active' : ''} onClick={() => update('textAlign', 'left')}>≡←</button><button type="button" className={effects.textAlign === 'center' ? 'active' : ''} onClick={() => update('textAlign', 'center')}>≡</button><button type="button" className={effects.textAlign === 'right' ? 'active' : ''} onClick={() => update('textAlign', 'right')}>→≡</button></div><small className="tool-note">{es ? 'También puedes arrastrar el control sobre el preview.' : 'You can also drag the handle over the preview.'}</small></div></details>
    <details><summary>{es ? 'Efectos' : 'Effects'}</summary><div className="tool-subgroup"><label className="tool-check"><input type="checkbox" checked={effects.textBackground} onChange={(event) => update('textBackground', event.target.checked)} />Background</label>{effects.textBackground && <><div className="tool-inline"><label>{es ? 'Color' : 'Color'}<input type="color" value={effects.textBackgroundColor} onChange={(event) => update('textBackgroundColor', event.target.value)} /></label></div><Slider label={es ? 'Opacidad fondo' : 'Background opacity'} value={effects.textBackgroundOpacity} onChange={(value) => update('textBackgroundOpacity', value)} /><Slider label="Padding" value={effects.textPadding} min={4} max={32} onChange={(value) => update('textPadding', value)} /><Slider label={es ? 'Redondeado' : 'Radius'} value={effects.textRadius} min={0} max={28} onChange={(value) => update('textRadius', value)} /></>}<label className="tool-check"><input type="checkbox" checked={effects.textOutline} onChange={(event) => update('textOutline', event.target.checked)} />Outline</label>{effects.textOutline && <><input aria-label="Outline color" type="color" value={effects.textOutlineColor} onChange={(event) => update('textOutlineColor', event.target.value)} /><Slider label={es ? 'Grosor borde' : 'Outline width'} value={effects.textOutlineWidth} min={1} max={10} onChange={(value) => update('textOutlineWidth', value)} /></>}<label className="compact-field">Shadow<select value={effects.textShadow} onChange={(event) => update('textShadow', event.target.value as VideoEffects['textShadow'])}><option value="none">None</option><option value="soft">Soft</option><option value="medium">Medium</option><option value="strong">Strong</option></select></label></div></details>
    <details className="caption-pro"><summary>Caption Pro</summary><div className="tool-subgroup"><label className="compact-switch"><input type="checkbox" checked={effects.captionEnabled} disabled={!captionSupported} onChange={(event) => update('captionEnabled', event.target.checked)} /><span>{effects.captionEnabled ? 'ON' : 'OFF'}</span></label>{!captionSupported && <p className="audio-error">{es ? 'Caption automático no está disponible en este navegador.' : 'Automatic captions are not available in this browser.'}</p>}<div className="tool-inline"><label>{es ? 'Idioma' : 'Language'}<select value={effects.captionLanguage} onChange={(event) => update('captionLanguage', event.target.value as VideoEffects['captionLanguage'])}><option value="es-US">Español</option><option value="en-US">English</option></select></label><label>{es ? 'Estilo' : 'Style'}<select value={effects.captionStyle} onChange={(event) => update('captionStyle', event.target.value as VideoEffects['captionStyle'])}><option value="clean">Clean</option><option value="subtitle">Subtitle</option><option value="bold">Bold</option><option value="social">Social</option><option value="highlight">Highlight</option></select></label></div><Slider label={es ? 'Tamaño caption' : 'Caption size'} value={effects.captionSize} min={24} max={72} onChange={(value) => update('captionSize', value)} /><label className="compact-field">{es ? 'Posición' : 'Position'}<select value={effects.captionPosition} onChange={(event) => update('captionPosition', event.target.value as VideoEffects['captionPosition'])}><option value="bottom">Bottom Center</option><option value="center">Center</option><option value="top">Top Center</option></select></label><div className="tool-inline"><label>{es ? 'Color' : 'Color'}<input type="color" value={effects.captionColor} onChange={(event) => update('captionColor', event.target.value)} /></label><label>{es ? 'Highlight' : 'Highlight'}<input type="color" value={effects.captionHighlightColor} onChange={(event) => update('captionHighlightColor', event.target.value)} /></label></div><label className="tool-check"><input type="checkbox" checked={effects.captionBackground} onChange={(event) => update('captionBackground', event.target.checked)} />Background</label><label className="tool-check"><input type="checkbox" checked={effects.captionHighlight} onChange={(event) => update('captionHighlight', event.target.checked)} />Highlight</label><label className="compact-field">{es ? 'Capitalización' : 'Capitalization'}<select value={effects.captionCaps} onChange={(event) => update('captionCaps', event.target.value as VideoEffects['captionCaps'])}><option value="normal">Normal</option><option value="uppercase">MAYÚSCULAS</option><option value="capitalize">Capitalize</option></select></label>{captionError && <p className="audio-error">{captionError}</p>}<button type="button" className="mini-action" onClick={() => apply({ captionStyle: 'subtitle', captionSize: 42, captionColor: '#ffffff', captionPosition: 'bottom', captionBackground: true, captionHighlight: false })}>Reset Caption</button></div></details>
    <div className="text-actions"><button type="button" onClick={resetText}>{es ? 'Reset Text' : 'Reset Text'}</button><button type="button" className="danger" onClick={() => apply({ text: '', textSecondary: '', textVisible: false })}>{es ? 'Eliminar texto' : 'Remove Text'}</button></div>
  </div>
}

export function StudioToolPanels({ language, openSection, onToggle, effects, onEffectsChange, background, audio, disabled, captionSupported, captionError, onSelectBackground, onUploadBackground }: { language: 'en' | 'es'; openSection: Section | null; onToggle: (id: Section) => void; effects: VideoEffects; onEffectsChange: (effects: VideoEffects) => void; background: BackgroundSelection; audio: StudioAudioController; disabled: boolean; captionSupported: boolean; captionError: string; onSelectBackground: (selection: BackgroundSelection) => void; onUploadBackground: (file: File) => void }) {
  const update = <K extends keyof VideoEffects>(key: K, value: VideoEffects[K]) => onEffectsChange({ ...effects, [key]: value })
  const apply = (values: Partial<VideoEffects>) => onEffectsChange({ ...effects, ...values })
  const es = language === 'es'
  return <aside className="studio-tools" aria-label={es ? 'Herramientas de edición' : 'Editing tools'}>
    <ToolSection id="retouch" icon="✦" title="Retouch" open={openSection === 'retouch'} onToggle={onToggle}>
      <label className="retouch-toggle"><span><strong>{es ? 'Retoque facial' : 'Face retouch'}</strong><small>{effects.retouchEnabled ? 'ON' : 'OFF'}</small></span><input type="checkbox" checked={effects.retouchEnabled} onChange={(event) => update('retouchEnabled', event.target.checked)} /></label>
      <div className={effects.retouchEnabled ? 'retouch-controls' : 'retouch-controls disabled'}>
        <Slider label={es ? 'Suavizado de piel' : 'Skin smoothing'} value={effects.smoothing} onChange={(value) => update('smoothing', value)} />
        <Slider label={es ? 'Detalle de piel' : 'Skin detail'} value={effects.skinDetail} onChange={(value) => update('skinDetail', value)} />
        <Slider label={es ? 'Brillo del rostro' : 'Face brightness'} value={effects.faceBrightness} min={-50} max={50} onChange={(value) => update('faceBrightness', value)} />
        <Slider label={es ? 'Tono de piel' : 'Skin tone'} value={effects.skinTone} min={-50} max={50} onChange={(value) => update('skinTone', value)} />
      </div>
      <p className="tool-note">{es ? 'Se aplica únicamente al rostro y queda incluido en la grabación.' : 'Applied only to the face and included in the recording.'}</p>
    </ToolSection>
    <ToolSection id="color" icon="◐" title={es ? 'Ajustar color' : 'Adjust Color'} open={openSection === 'color'} onToggle={onToggle}>
      <Slider label={es ? 'Brillo' : 'Brightness'} value={effects.brightness} min={50} max={150} onChange={(value) => update('brightness', value)} />
      <Slider label={es ? 'Contraste' : 'Contrast'} value={effects.contrast} min={50} max={150} onChange={(value) => update('contrast', value)} />
      <Slider label={es ? 'Saturación' : 'Saturation'} value={effects.saturation} min={0} max={200} onChange={(value) => update('saturation', value)} />
      <Slider label={es ? 'Temperatura' : 'Temperature'} value={effects.temperature} min={-50} max={50} onChange={(value) => update('temperature', value)} />
    </ToolSection>
    <ToolSection id="background" icon="▣" title={es ? 'Fondo' : 'Background'} open={openSection === 'background'} onToggle={onToggle}>
      <BackgroundPanel language={language} selection={background} disabled={disabled} onSelect={onSelectBackground} onUpload={onUploadBackground} />
    </ToolSection>
    <ToolSection id="text" icon="T" title={es ? 'Texto' : 'Text'} open={openSection === 'text'} onToggle={onToggle}>
      <TextProPanel effects={effects} update={update} apply={apply} language={language} captionSupported={captionSupported} captionError={captionError} />
    </ToolSection>
    <ToolSection id="audio" icon="♪" title="Audio" open={openSection === 'audio'} onToggle={onToggle}>
      <AudioPanel audio={audio} language={language} disabled={disabled} />
    </ToolSection>
  </aside>
}
