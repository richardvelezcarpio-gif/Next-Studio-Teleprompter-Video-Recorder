import { useEffect, useRef, useState } from 'react'
import type { BackgroundSelection } from '../../hooks/useBackground'
import { Button } from '../ui/Button'

type Language = 'en' | 'es'

const colors: BackgroundSelection[] = [
  { type: 'color', id: 'black', value: '#05070b' }, { type: 'color', id: 'white', value: '#ffffff' },
  { type: 'color', id: 'navy', value: '#071b3d' }, { type: 'color', id: 'dark-blue', value: '#0a3475' },
  { type: 'color', id: 'light-blue', value: '#9ed8ff' }, { type: 'color', id: 'gray', value: '#7b8798' },
]
const gradients: BackgroundSelection[] = [
  { type: 'gradient', id: 'navy-blue', value: 'linear-gradient(135deg,#061a3a,#1769e0)' },
  { type: 'gradient', id: 'light-white', value: 'linear-gradient(135deg,#8fd3ff,#ffffff)' },
  { type: 'gradient', id: 'blue-purple', value: 'linear-gradient(135deg,#092d68,#6d39b9)' },
  { type: 'gradient', id: 'black-navy', value: 'linear-gradient(135deg,#020409,#0b2d62)' },
  { type: 'gradient', id: 'blue-cyan', value: 'linear-gradient(135deg,#0b4fd3,#16d8e8)' },
]
const scenes: BackgroundSelection[] = [
  { type: 'image', id: 'professional-blue', value: 'radial-gradient(circle at 28% 28%,#31a2ff55,transparent 23%),linear-gradient(135deg,#061936,#0b5bc8)' },
  { type: 'image', id: 'modern-office', value: 'linear-gradient(90deg,#eef5fb 0 18%,#b9d1e4 18% 21%,#f9fcff 21% 48%,#9db5c8 48% 51%,#e8f0f7 51% 75%,#b0c7da 75% 78%,#f8fbff 78%)' },
  { type: 'image', id: 'dark-studio', value: 'radial-gradient(circle at 50% 20%,#426d9f 0 3%,#17273d 28%,#05080e 72%)' },
  { type: 'image', id: 'light-studio', value: 'radial-gradient(circle at 50% 35%,#ffffff 0 18%,#d9ebf8 48%,#a9c7dc 100%)' },
  { type: 'image', id: 'next-studio', value: 'radial-gradient(circle at 18% 20%,#20d4ff55,transparent 25%),radial-gradient(circle at 82% 75%,#2075ff66,transparent 30%),linear-gradient(145deg,#06152f,#0a4db4)' },
]
const original: BackgroundSelection = { type: 'original', id: 'original', value: '' }
const blurs: BackgroundSelection[] = [
  { type: 'blur', id: 'blur-light', value: '8' },
  { type: 'blur', id: 'blur-medium', value: '16' },
  { type: 'blur', id: 'blur-strong', value: '28' },
]

const copy = {
  en: { title: 'Background', original: 'Original', blur: 'Blur', blurNames: ['Light', 'Medium', 'Strong'], colors: 'Solid Colors', gradients: 'Gradients', backgrounds: 'Backgrounds', upload: 'Upload Background', remove: 'Remove Background', colorNames: ['Black', 'White', 'Navy', 'Dark Blue', 'Light Blue', 'Gray'], gradientNames: ['Navy to Blue', 'Light Blue to White', 'Dark Blue to Purple', 'Black to Navy', 'Blue to Cyan'], sceneNames: ['Professional Blue', 'Modern Office', 'Dark Studio', 'Light Studio', 'Next Studio Style'] },
  es: { title: 'Fondo', original: 'Original', blur: 'Desenfoque', blurNames: ['Suave', 'Medio', 'Fuerte'], colors: 'Colores sólidos', gradients: 'Degradados', backgrounds: 'Fondos', upload: 'Subir fondo', remove: 'Quitar fondo', colorNames: ['Negro', 'Blanco', 'Azul marino', 'Azul oscuro', 'Azul claro', 'Gris'], gradientNames: ['Azul marino a azul', 'Azul claro a blanco', 'Azul oscuro a morado', 'Negro a azul marino', 'Azul a cian'], sceneNames: ['Azul profesional', 'Oficina moderna', 'Estudio oscuro', 'Estudio claro', 'Estilo Next Studio'] },
}

function Option({ option, label, selected, disabled, onSelect }: { option: BackgroundSelection; label: string; selected: boolean; disabled?: boolean; onSelect: () => void }) {
  const style = option.type === 'color' ? { background: option.value } : option.type === 'blur' ? { backgroundImage: 'linear-gradient(135deg,#b8c7da,#536b88)', filter: `blur(${Number(option.value) / 5}px)` } : { backgroundImage: option.value }
  return <button type="button" className={`background-option background-option-${option.type}${selected ? ' selected' : ''}`} disabled={disabled} onClick={onSelect} aria-pressed={selected} title={label}>
    <span className="background-swatch" style={style}>{selected && <b aria-hidden="true">✓</b>}</span><span>{label}</span>
  </button>
}

export function BackgroundPanel({ language, selection, disabled, onSelect, onUpload }: { language: Language; selection: BackgroundSelection; disabled?: boolean; onSelect: (selection: BackgroundSelection) => void; onUpload: (file: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<'blur' | 'virtual'>(selection.type === 'blur' ? 'blur' : 'virtual')
  const t = copy[language]
  useEffect(() => { if (selection.type === 'blur') setView('blur'); else if (selection.type !== 'original') setView('virtual') }, [selection.type])
  return <aside className="background-panel" aria-label={t.title}>
    <div className="background-panel-heading"><span className="panel-heading-icon" aria-hidden="true">✦</span><strong>{t.title}</strong></div>
    <button type="button" className={selection.type === 'original' ? 'original-background selected' : 'original-background'} disabled={disabled} onClick={() => onSelect(original)} aria-pressed={selection.type === 'original'}><span className="original-preview" aria-hidden="true">◉</span><span><strong>{t.original}</strong><small>{language === 'es' ? 'Sin efecto' : 'No effect'}</small></span>{selection.type === 'original' && <b aria-hidden="true">✓</b>}</button>
    <div className="background-mode-tabs" role="tablist" aria-label={t.title}>
      <button type="button" role="tab" aria-selected={view === 'blur'} className={view === 'blur' ? 'active' : ''} onClick={() => setView('blur')}>{t.blur}</button>
      <button type="button" role="tab" aria-selected={view === 'virtual'} className={view === 'virtual' ? 'active' : ''} onClick={() => setView('virtual')}>{language === 'es' ? 'Fondo virtual' : 'Virtual background'}</button>
    </div>
    {view === 'blur' ? <section className="background-section active-section"><h3>{t.blur}</h3><p>{language === 'es' ? 'Mantén el enfoque en ti.' : 'Keep the focus on you.'}</p><div className="background-options blur-options">{blurs.map((option, index) => <Option key={option.id} option={option} label={t.blurNames[index]} selected={selection.id === option.id} disabled={disabled} onSelect={() => onSelect(option)} />)}</div></section> : <div className="virtual-background-sections">
      <section><h3>{t.colors}</h3><div className="background-options">{colors.map((option, index) => <Option key={option.id} option={option} label={t.colorNames[index]} selected={selection.id === option.id} disabled={disabled} onSelect={() => onSelect(option)} />)}</div></section>
      <section><h3>{t.gradients}</h3><div className="background-options">{gradients.map((option, index) => <Option key={option.id} option={option} label={t.gradientNames[index]} selected={selection.id === option.id} disabled={disabled} onSelect={() => onSelect(option)} />)}</div></section>
      <section><h3>{t.backgrounds}</h3><div className="background-options scene-options">{scenes.map((option, index) => <Option key={option.id} option={option} label={t.sceneNames[index]} selected={selection.id === option.id} disabled={disabled} onSelect={() => onSelect(option)} />)}<button type="button" className="background-option upload-background-card" disabled={disabled} onClick={() => fileRef.current?.click()}><span className="background-swatch"><b aria-hidden="true">+</b></span><span>{t.upload}</span></button></div></section>
    </div>}
    {selection.type === 'uploaded' && <div className="uploaded-background-preview" style={{ backgroundImage: `url("${selection.value}")` }}><span>✓</span></div>}
    <input ref={fileRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.target.value = '' }} />
    {selection.type !== 'original' && <div className="background-panel-actions"><Button disabled={disabled} onClick={() => onSelect(original)}>{t.remove}</Button></div>}
  </aside>
}
