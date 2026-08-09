import type { useTeleprompter } from '../../hooks/useTeleprompter'
import type { CSSProperties } from 'react'

type Teleprompter = ReturnType<typeof useTeleprompter>

export function TeleprompterOverlay({ script, teleprompter }: { script: string; teleprompter: Teleprompter }) {
  if (!script.trim() || teleprompter.status === 'ready') return null
  return <div className="teleprompter-overlay" ref={teleprompter.viewportRef} style={{ '--reading-position': `${teleprompter.position}%` } as CSSProperties} aria-live="polite"><div className="reading-guide" /><div className="prompter-scroll" ref={teleprompter.scrollRef} style={{ fontSize: `${teleprompter.textSize}px` }}>{script.split('\n').map((line, index) => <p key={`${line}-${index}`}>{line || '\u00a0'}</p>)}</div></div>
}
