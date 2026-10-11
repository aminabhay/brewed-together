import { useEffect, useState } from 'react'
import { gameConfig } from './config'
import { useGame } from './GameState'
import { audio } from './AudioManager'
import { TAP_EVENT } from './TapController'

const D = gameConfig.dialogue

function Heart({ fill }: { fill: number }) {
  const path = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z'
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden>
      <defs>
        <clipPath id="ogm-heart-fill">
          <rect x="0" y={24 - 24 * fill} width="24" height="24" />
        </clipPath>
      </defs>
      <path d={path} fill="rgba(255,246,234,0.25)" stroke="#FFF6EA" strokeWidth="1.4" />
      <path d={path} fill="#E0475A" clipPath="url(#ogm-heart-fill)" />
    </svg>
  )
}

export function SoundToggle() {
  const on = useGame((s) => s.soundOn)
  return (
    <button
      className="ogm-icon-btn"
      aria-label={on ? 'Mute sound' : 'Turn sound on'}
      aria-pressed={on}
      onClick={() => {
        useGame.getState().set({ soundOn: !on })
        audio.setMuted(on)
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {on ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M17 9l5 6M22 9l-5 6" />}
      </svg>
    </button>
  )
}

export function HUD() {
  const phase = useGame((s) => s.phase)
  const progress = useGame((s) => s.progress)
  const toast = useGame((s) => s.toast)
  const idle = useGame((s) => s.idle)
  const rapid = useGame((s) => s.rapid)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  useEffect(() => {
    let id = 0
    const onTap = (e: Event) => {
      const { x, y } = (e as CustomEvent).detail
      const host = document.querySelector('.ogm-root')?.getBoundingClientRect()
      const r = { id: ++id, x: x - (host?.left ?? 0), y: y - (host?.top ?? 0) }
      setRipples((rs) => [...rs.slice(-5), r])
      setTimeout(() => setRipples((rs) => rs.filter((q) => q.id !== r.id)), 500)
    }
    window.addEventListener(TAP_EVENT, onTap)
    return () => window.removeEventListener(TAP_EVENT, onTap)
  }, [])

  const chasing = phase === 'CHASE' || phase === 'FINAL_CHASE'
  const status = D.status.find((s) => progress < s.until)?.text ?? ''

  return (
    <div className="ogm-hud">
      {chasing && (
        <div className={`ogm-progress ${progress >= 0.9 ? 'ogm-progress--hot' : ''}`} role="status">
          <Heart fill={progress} />
          <div>
            <div className="ogm-progress-label">{D.statusLabel}</div>
            <div className="ogm-progress-text" key={status}>
              {status}
            </div>
          </div>
        </div>
      )}
      <div className={`ogm-speedlines ${chasing && rapid ? 'is-on' : chasing && progress >= 0.9 ? 'is-soft' : ''}`} aria-hidden />
      {ripples.map((r) => (
        <span key={r.id} className="ogm-ripple" style={{ left: r.x, top: r.y }} aria-hidden />
      ))}
      {toast && (
        <div key={toast.id} className={`ogm-toast ${toast.tone === 'big' ? 'ogm-toast--big' : ''}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}

/** Letterbox bars for the catch: the moment the comedy turns into a film. */
export function EndingSequence() {
  const phase = useGame((s) => s.phase)
  const on = phase === 'CAUGHT'
  return (
    <div className={`ogm-letterbox ${on ? 'is-on' : ''}`} aria-hidden>
      <span />
      <span />
    </div>
  )
}
