import { useEffect, useState } from 'react'
import { wedding } from '../content/wedding'
import { useStore } from '../state/useStore'
import { cupsBus } from '../state/cupsBus'
import { Section, Sticky } from './Section'
import { Countdown } from './Countdown'
import { BEATS } from '../scroll/beats'
import { scrollState } from '../scroll/scrollState'
import { lenis } from '../scroll/useSmoothScroll'

/**
 * Once the date is revealed there's nothing left to do on this screen, but the section still has
 * most of its scroll length to go, so it felt like the site had ended. After the reveal, the first
 * scroll down glides straight into the move to the next scene.
 */
function useSkipAfterReveal(revealed: boolean) {
  useEffect(() => {
    if (!revealed) return
    let armed = false
    let done = false
    let lastY = window.scrollY
    const arm = setTimeout(() => (armed = true), 900) // let the date land first
    const onScroll = () => {
      const y = window.scrollY
      const down = y > lastY + 2
      lastY = y
      if (!armed || done || !down) return
      const end = scrollState.holds[BEATS.findIndex((b) => b.id === 'cups')]?.[1]
      done = true
      if (end === undefined || y >= end - 4) return // already past the hold: normal scrolling
      const target = end + window.innerHeight * 0.4 // a little into the transition, so the camera visibly moves
      if (lenis) lenis.scrollTo(target, { duration: 1.4, lock: true, force: true })
      else window.scrollTo({ top: target, behavior: 'smooth' })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(arm)
      window.removeEventListener('scroll', onScroll)
    }
  }, [revealed])
}

export function CupsSection() {
  const revealed = useStore((s) => s.dateRevealed)
  const { cups, couple, date } = wedding
  const [seenHint] = useState(true)
  useSkipAfterReveal(revealed)
  const key = (i: 0 | 1) => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') cupsBus.rotate(i, -45)
    if (e.key === 'ArrowRight') cupsBus.rotate(i, 45)
  }
  return (
    <Section id="cups" label="The date">
      <Sticky className="flex flex-col items-center justify-between px-4 pb-[calc(6vh+64px)] pt-[9vh] text-center md:pb-[6vh]">
        {/* top: the big date once the cups line up */}
        <div className={`transition-all duration-1000 ${revealed ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0'}`} aria-live="polite">
          {revealed && (
            <>
              <h2 className="font-serif text-4xl text-foam drop-shadow-lg md:text-6xl">{date.display}</h2>
              <p className="mt-1 font-hand text-3xl text-amber drop-shadow">{date.city}</p>
            </>
          )}
        </div>

        {/* bottom: hint + controls, or the countdown (lifted on phones to clear the scroll cue) */}
        <div className="pointer-events-auto w-full max-w-xl">
          {!revealed ? (
            <div className="reveal-on-active flex flex-col items-center gap-3">
              {seenHint && <p className="font-hand text-3xl text-foam drop-shadow">{cups.hint}</p>}
              <p className="font-sans text-sm text-latte/80">Drag or tap a cup to turn it.</p>
              <div className="flex gap-2">
                <button className="chip" onKeyDown={key(0)} onClick={() => cupsBus.rotate(0, 90)} aria-label={`Turn ${couple.bride}'s cup (arrow keys rotate)`}>
                  ↻ {couple.bride}
                </button>
                <button className="chip" onKeyDown={key(1)} onClick={() => cupsBus.rotate(1, 90)} aria-label={`Turn ${couple.groom}'s cup (arrow keys rotate)`}>
                  ↻ {couple.groom}
                </button>
              </div>
              <button className="min-h-[44px] font-sans text-sm text-latte underline underline-offset-4" onClick={() => cupsBus.revealNow()}>
                {cups.skip}
              </button>
            </div>
          ) : (
            <div className="fade-up flex flex-col items-center gap-4">
              <Countdown />
            </div>
          )}
        </div>
      </Sticky>
    </Section>
  )
}
