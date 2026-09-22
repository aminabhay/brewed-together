import { useState } from 'react'
import { wedding } from '../content/wedding'
import { useStore } from '../state/useStore'
import { cupsBus } from '../state/cupsBus'
import { Section, Sticky } from './Section'
import { Countdown } from './Countdown'
import { downloadIcs, googleCalendarUrl, mainEvent } from './calendar'

export function CupsSection() {
  const revealed = useStore((s) => s.dateRevealed)
  const { cups, couple, date } = wedding
  const [seenHint] = useState(true)
  const key = (i: 0 | 1) => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') cupsBus.rotate(i, -45)
    if (e.key === 'ArrowRight') cupsBus.rotate(i, 45)
  }
  return (
    <Section id="cups" label="The date">
      <Sticky className="flex flex-col items-center justify-between px-4 pb-[6vh] pt-[9vh] text-center">
        {/* top: the big date once the cups line up */}
        <div className={`transition-all duration-1000 ${revealed ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0'}`} aria-live="polite">
          {revealed && (
            <>
              <h2 className="font-serif text-4xl text-foam drop-shadow-lg md:text-6xl">{date.display}</h2>
              <p className="mt-1 font-hand text-3xl text-amber drop-shadow">{date.city}</p>
            </>
          )}
        </div>

        {/* bottom: hint + controls, or countdown + calendar */}
        <div className="pointer-events-auto w-full max-w-xl">
          {!revealed ? (
            <div className="reveal-on-active flex flex-col items-center gap-3">
              {seenHint && <p className="font-hand text-3xl text-foam drop-shadow">{cups.hint}</p>}
              <p className="hidden font-sans text-sm text-latte/80 md:block">Drag or click a cup to turn it. Arrow keys work too.</p>
              <p className="font-sans text-sm text-latte/80 md:hidden">Swipe sideways on a cup, or tap it.</p>
              <div className="flex gap-2">
                <button className="chip" onKeyDown={key(0)} onClick={() => cupsBus.rotate(0, 90)} aria-label={`Turn ${couple.groom}'s cup (arrow keys rotate)`}>
                  ↻ {couple.groom}
                </button>
                <button className="chip" onKeyDown={key(1)} onClick={() => cupsBus.rotate(1, 90)} aria-label={`Turn ${couple.bride}'s cup (arrow keys rotate)`}>
                  ↻ {couple.bride}
                </button>
              </div>
              <button className="min-h-[44px] font-sans text-sm text-latte underline underline-offset-4" onClick={() => cupsBus.revealNow()}>
                {cups.skip}
              </button>
            </div>
          ) : (
            <div className="fade-up flex flex-col items-center gap-4">
              <Countdown />
              <div className="flex flex-wrap justify-center gap-2">
                <a className="btn" href={googleCalendarUrl(mainEvent())} target="_blank" rel="noreferrer">
                  Add to Google Calendar
                </a>
                <button className="btn-ghost" onClick={() => downloadIcs(mainEvent())}>
                  Download .ics
                </button>
              </div>
            </div>
          )}
        </div>
      </Sticky>
    </Section>
  )
}
