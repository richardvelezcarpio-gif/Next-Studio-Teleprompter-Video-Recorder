import { Button } from '../ui/Button'
import type { useMicrophone } from '../../hooks/useMicrophone'
import type { useTeleprompter } from '../../hooks/useTeleprompter'

type MicrophoneController = ReturnType<typeof useMicrophone>
type Teleprompter = ReturnType<typeof useTeleprompter>

export function StudioControls({ microphone, teleprompter, script }: { microphone: MicrophoneController; teleprompter: Teleprompter; script: string }) {
  return <section className="studio-controls" aria-label="Studio controls">
    <div className="control-group"><span className="control-label">Prompt</span><Button className="prompt-button" onClick={() => teleprompter.toggle(script)}>{teleprompter.status === 'running' ? 'Ⅱ Pause' : teleprompter.status === 'paused' ? '▶ Resume' : '▶ Prompt'}</Button></div>
    <div className="control-group"><span className="control-label">Speed</span><div className="inline-controls"><Button onClick={() => teleprompter.setSpeed(Math.max(1, teleprompter.speed - 1))}>−</Button><input aria-label="Prompt speed" type="range" min="1" max="10" value={teleprompter.speed} onChange={(event) => teleprompter.setSpeed(Number(event.target.value))} /><Button onClick={() => teleprompter.setSpeed(Math.min(10, teleprompter.speed + 1))}>+</Button></div></div>
    <div className="control-group"><span className="control-label">Text Size</span><div className="inline-controls"><Button onClick={teleprompter.decreaseTextSize}>A−</Button><Button onClick={teleprompter.increaseTextSize}>A+</Button></div></div>
    <div className="control-group"><span className="control-label">Position</span><div className="inline-controls"><Button onClick={teleprompter.moveUp}>↑</Button><Button onClick={teleprompter.moveDown}>↓</Button></div></div>
    <div className="control-group"><span className="control-label">Prompt</span><Button onClick={teleprompter.reset}>Reset</Button></div>
    <div className="control-group"><span className="control-label">Timer</span><strong className="timer">00:00:00</strong></div>
    <div className="control-group mic-meter"><span className="control-label">Audio Level</span><div className="meter-row"><span className={microphone.isActive ? 'mic-state active' : 'mic-state'}>Mic: {microphone.isActive ? 'On' : 'Off'}</span><div className="level-meter" aria-label={`Audio level ${microphone.level}%`}><span style={{ width: `${microphone.level}%` }} /></div></div>{microphone.error && <button type="button" className="meter-error" onClick={() => microphone.startMicrophone()}>Try Again</button>}</div>
    <div className="control-group status"><span className="control-label">Status</span><span className="status-value"><i />Prompt {teleprompter.status}</span>{teleprompter.message && <span className="prompter-message">{teleprompter.message}</span>}</div>
  </section>
}
