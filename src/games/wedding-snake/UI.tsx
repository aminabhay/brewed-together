import { useEffect, useState } from 'react'
import { weddingConfig, weddingTitle } from './config'
import { useSnake } from './GameState'
import { newRun } from './GameManager'
import { audio } from './AudioManager'
import type { CoupleConfig } from '../types'

const C = weddingConfig
const Dg = C.dialogue

// ── intro: THE WEDDING IS IN TROUBLE ─────────────────────
export function Intro({ ready, couple }: { ready: boolean; couple: CoupleConfig }) {
  const phase = useSnake((s) => s.phase)
  const checklist = useSnake((s) => s.checklist)
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!ready || phase !== 'INTRO') return
    const t = [setTimeout(() => setStep(1), 300), setTimeout(() => setStep(2), 1500), setTimeout(() => setStep(3), 2700)]
    return () => t.forEach(clearTimeout)
  }, [ready, phase])
  if (phase !== 'INTRO') return null
  const go = () => {
    audio.unlock()
    useSnake.getState().setPhase('READY')
  }
  return (
    <div className="ws-intro" data-no-steer>
      <h1 className={`ws-intro-title ${step >= 1 ? 'is-in' : ''}`}>{Dg.intro1}</h1>
      <p className={`ws-intro-sub ${step >= 2 ? 'is-in' : ''}`}>{Dg.intro2.replace('{bride}', couple.brideName).replace('{groom}', couple.groomName)}</p>
      <div className={`ws-card ${step >= 3 ? 'is-in' : ''}`}>
        <p className="ws-card-title">{Dg.checklistTitle}</p>
        <ul className="ws-list">
          {checklist.map((c) => (
            <li key={c.id}>
              <span className="ws-box" />
              <span>{c.label}</span>
              <span className="ws-emoji">{c.emoji}</span>
            </li>
          ))}
        </ul>
        <p className="ws-howto">{Dg.howTo}</p>
        <button className="ws-btn ws-btn--primary" onClick={go} disabled={step < 3}>
          {Dg.start}
        </button>
      </div>
    </div>
  )
}

// ── in-game HUD ──────────────────────────────────────────
export function HUD() {
  const phase = useSnake((s) => s.phase)
  const checklist = useSnake((s) => s.checklist)
  const hearts = useSnake((s) => s.hearts)
  const popup = useSnake((s) => s.popup)
  const toast = useSnake((s) => s.toast)
  const focus = useSnake((s) => s.focus)
  const playing = phase === 'READY' || phase === 'PLAYING' || phase === 'MISTAKE'
  if (!playing && phase !== 'COMPLETED') return null
  return (
    <>
      <div className={`ws-hud ${phase === 'COMPLETED' ? 'is-done' : ''}`}>
        <div className="ws-hearts" aria-label={`${hearts} hearts left`}>
          {Array.from({ length: C.difficulty.hearts }, (_, i) => (
            <span key={i} className={i < hearts ? 'is-full' : ''}>
              ♥
            </span>
          ))}
        </div>
        <ul className="ws-chips">
          {checklist.map((c, i) => (
            <li key={c.id} className={c.done ? 'is-done' : ''} style={{ transitionDelay: phase === 'COMPLETED' ? `${i * 90}ms` : undefined }} title={c.label}>
              <span>{c.emoji}</span>
              {c.done && <b>✓</b>}
            </li>
          ))}
        </ul>
      </div>
      {phase === 'READY' && <div className="ws-ready">{Dg.howTo}</div>}
      {toast && (
        <div key={toast.id} className="ws-toast">
          {toast.text}
        </div>
      )}
      {popup && (
        <div key={popup.id} className={`ws-popup ws-popup--${popup.tone}`}>
          {popup.emoji && <div className="ws-popup-emoji">{popup.emoji}</div>}
          <p className="ws-popup-title">{popup.title}</p>
          {popup.line && <p className="ws-popup-line">{popup.line}</p>}
        </div>
      )}
      {focus && <div className="ws-focus">FOCUS.</div>}
    </>
  )
}

// ── finale: WAIT… WE ACTUALLY HAVE EVERYTHING. ────────────
export function Finale() {
  const phase = useSnake((s) => s.phase)
  const step = useSnake((s) => s.finalStep)
  if (phase !== 'COMPLETED') return null
  return (
    <div className="ws-final">
      {Dg.final.map((line, i) => (
        <p key={i} className={`ws-final-line ws-final-line--${i} ${step === i + 1 ? 'is-in' : step > i + 1 ? 'is-gone' : ''}`}>
          {line}
        </p>
      ))}
    </div>
  )
}

// ── reveal ───────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', ...o }).format(d)
  const day = Number(part({ day: 'numeric' }))
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] ?? 'th'
  return { date: `${day}${suffix} ${part({ month: 'long' })}, ${part({ year: 'numeric' })}`, weekday: part({ weekday: 'long' }) }
}

export function Reveal({ couple }: { couple: CoupleConfig }) {
  const phase = useSnake((s) => s.phase)
  const stats = useSnake((s) => s.stats)
  const [stage, setStage] = useState(0)
  const on = phase === 'REVEAL'
  useEffect(() => {
    if (!on) return setStage(0)
    const t = [setTimeout(() => setStage(1), 300), setTimeout(() => setStage(2), 1300), setTimeout(() => setStage(3), 2500)]
    return () => t.forEach(clearTimeout)
  }, [on])
  if (!on) return null

  const { date, weekday } = formatDate(couple.weddingStartISO)
  const again = () => {
    newRun()
    useSnake.getState().setPhase('READY')
  }

  return (
    <div className="ws-reveal" data-no-steer>
      <div className={`ws-reveal-top ${stage >= 1 ? 'is-in' : ''}`}>
        <p className="ws-kicker">{C.reveal.kicker}</p>
        <h1 className="ws-names">
          <span>{couple.brideName}</span>
          <span className="ws-amp">&amp;</span>
          <span>{couple.groomName}</span>
        </h1>
        <p className={`ws-date ${stage >= 2 ? 'is-in' : ''}`}>{date}</p>
        <p className={`ws-weekday ${stage >= 2 ? 'is-in' : ''}`}>{weekday}</p>
      </div>
      <div className={`ws-reveal-bottom ${stage >= 3 ? 'is-in' : ''}`}>
        <p className="ws-line">{C.reveal.line}</p>
        {stats && (
          <p className="ws-stat">
            <b>{weddingTitle(stats)}</b>
            <span>
              Found everything in {Math.round(stats.seconds)}s · {stats.wrong === 0 ? 'no distractions' : `${stats.wrong} distraction${stats.wrong > 1 ? 's' : ''}`}
            </span>
          </p>
        )}
        <div className="ws-actions">
          <button className="ws-btn ws-btn--primary" onClick={again}>
            {C.reveal.playAgain}
          </button>
        </div>
      </div>
    </div>
  )
}
