import { useEffect, useState } from 'react'
import { gameConfig } from './config'
import { goto, sim, useGame } from './GameState'

const D = gameConfig.dialogue

/**
 * INTRO: a short dark-screen checklist. READY: the groom alone, "WE'RE MISSING THE BRIDE.",
 * she appears and runs off, then "CATCH HER." + TAP TO START.
 */
export function IntroScreen({ ready }: { ready: boolean }) {
  const phase = useGame((s) => s.phase)
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!ready) return
    setT(0)
    const start = performance.now()
    // READY follows the game's own clock, so the prompt never runs ahead of the bride's entrance on slow devices
    const id = setInterval(() => setT(phase === 'READY' ? sim.phaseTime : (performance.now() - start) / 1000), 100)
    return () => clearInterval(id)
  }, [phase, ready])

  // the intro hands over to READY by itself
  useEffect(() => {
    if (phase === 'INTRO' && ready && t > 7.2) goto('READY')
  }, [t, phase, ready])

  if (phase === 'INTRO') {
    const shown = (at: number) => (ready && t >= at ? 'ogm-in' : 'ogm-out')
    const checklistGone = t > 5.3
    return (
      <div className="ogm-intro" aria-live="polite">
        <div className={`ogm-intro-block ${checklistGone ? 'ogm-out' : ''}`}>
          <p className={`ogm-intro-lead ${shown(0.4)}`}>{D.introOpening}</p>
          <ul className="ogm-checklist">
            {D.introChecklist.map((c, i) => {
              const at = 1.7 + i * 1.0
              return (
                <li key={c.q} className={shown(at)}>
                  <span>{c.q}</span>
                  <span className={`ogm-tick ${shown(at + 0.45)}`}>{c.a}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <p className={`ogm-intro-problem ${shown(5.6)}`}>{D.introProblem}</p>
        <p className={`ogm-skip ${shown(1.2)}`}>tap to skip</p>
      </div>
    )
  }

  if (phase === 'READY') {
    return (
      <div className="ogm-ready" aria-live="polite">
        <h1 className={`ogm-headline ${t < 2.6 ? 'ogm-slam' : 'ogm-out'}`}>{D.missingBride}</h1>
        <div className={`ogm-catch ${t >= 2.9 ? 'ogm-in' : 'ogm-out'}`}>
          <h2 className="ogm-headline ogm-slam">{D.catchHer}</h2>
        </div>
        <div className={`ogm-start ${t >= 2.9 ? 'ogm-in' : 'ogm-out'}`}>
          <p className="ogm-cta">{D.tapToStart}</p>
          <p className="ogm-hint">{D.tapHint}</p>
        </div>
      </div>
    )
  }
  return null
}
