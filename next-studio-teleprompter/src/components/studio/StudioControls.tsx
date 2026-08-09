import { Button } from '../ui/Button'
import type { useMicrophone } from '../../hooks/useMicrophone'

type MicrophoneController = ReturnType<typeof useMicrophone>

export function StudioControls({ microphone }: { microphone: MicrophoneController }) {
  return <section className="studio-controls" aria-label="Studio controls">
    <div className="control-group"><span className="control-label">Prompt</span><Button className="prompt-button">▶&nbsp; Prompt</Button></div>
    <div className="control-group"><span className="control-label">Speed</span><div className="inline-controls"><Button>−</Button><input aria-label="Prompt speed" type="range" min="1" max="10" defaultValue="5" /><Button>+</Button></div></div>
    <div className="control-group"><span className="control-label">Text Size</span><div className="inline-controls"><Button>A−</Button><Button>A+</Button></div></div>
    <div className="control-group"><span className="control-label">Position</span><div className="inline-controls"><Button>↑</Button><Button>↓</Button></div></div>
    <div className="control-group"><span className="control-label">Timer</span><strong className="timer">00:00:00</strong></div>
    <div className="control-group mic-meter"><span className="control-label">Audio Level</span><div className="meter-row"><span className={microphone.isActive ? 'mic-state active' : 'mic-state'}>Mic: {microphone.isActive ? 'On' : 'Off'}</span><div className="level-meter" aria-label={`Audio level ${microphone.level}%`}><span style={{ width: `${microphone.level}%` }} /></div></div>{microphone.error && <button type="button" className="meter-error" onClick={() => microphone.startMicrophone()}>Try Again</button>}</div>
    <div className="control-group status"><span className="control-label">Status</span><span className="status-value"><i />Ready to record</span></div>
  </section>
}
