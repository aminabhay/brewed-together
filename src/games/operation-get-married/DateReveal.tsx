import { useEffect, useState } from 'react'
import { funnyStat, gameConfig } from './config'
import { useGame } from './GameState'
import { audio } from './AudioManager'
import { resetCharacters } from './CharacterController'
import type { CoupleConfig } from '../types'

const E = gameConfig.ending

/** "9th December, 2026" and "Wednesday", from the wedding date (in Indian time). */
function formatDate(iso: string) {
  const d = new Date(iso)
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', ...o }).format(d)
  const day = Number(part({ day: 'numeric' }))
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] ?? 'th'
  return { date: `${day}${suffix} ${part({ month: 'long' })}, ${part({ year: 'numeric' })}`, weekday: part({ weekday: 'long' }) }
}

/** The elegant, cinematic half: SAVE THE DATE, names, date, then Play again. */
export function DateReveal({ couple }: { couple: CoupleConfig }) {
  const phase = useGame((s) => s.phase)
  const stats = useGame((s) => s.stats)
  const [stage, setStage] = useState(0)
  const on = phase === 'DATE_REVEAL' || phase === 'COMPLETE'

  useEffect(() => {
    if (!on) return setStage(0)
    const timers = [setTimeout(() => setStage(1), 900), setTimeout(() => setStage(2), 2000), setTimeout(() => setStage(3), 3400)]
    return () => timers.forEach(clearTimeout)
  }, [on])

  if (!on) return null
  const { date, weekday } = formatDate(couple.weddingStartISO)
  const playAgain = () => {
    audio.stopAll()
    resetCharacters()
    useGame.getState().restart()
  }

  return (
    <div className="ogm-reveal" data-no-tap>
      <div className={`ogm-reveal-top ${stage >= 1 ? 'is-in' : ''}`}>
        <p className="ogm-kicker">{E.kicker}</p>
        <h1 className="ogm-names">
          <span>{couple.brideName}</span>
          <span className="ogm-amp">&amp;</span>
          <span>{couple.groomName}</span>
        </h1>
        <p className={`ogm-date ${stage >= 2 ? 'is-in' : ''}`}>{date}</p>
        <p className={`ogm-place ${stage >= 2 ? 'is-in' : ''}`}>{weekday}</p>
      </div>
      <div className={`ogm-reveal-bottom ${stage >= 3 ? 'is-in' : ''}`}>
        <p className="ogm-line">{E.line}</p>
        {stats && (
          <>
            <p className="ogm-caught">Caught in {Math.round(stats.seconds)} seconds.</p>
            <p className="ogm-stat">{funnyStat(stats)}</p>
          </>
        )}
        <div className="ogm-actions">
          <button className="ogm-btn ogm-btn--primary" onClick={playAgain}>
            {E.playAgain}
          </button>
        </div>
      </div>
    </div>
  )
}
