import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useStore } from '../state/useStore'
import { startAudio } from '../audio/sounds'

/** A coffee cup that fills as the scene loads, then invites the guest in. */
export function Loader({ ready }: { ready: boolean }) {
  const { progress, active } = useProgress()
  const entered = useStore((s) => s.entered)
  const [fake, setFake] = useState(0)
  const [gone, setGone] = useState(false)

  // procedural scenes load almost instantly; a gentle minimum fill keeps the moment
  useEffect(() => {
    const t0 = performance.now()
    const id = setInterval(() => setFake(Math.min(100, ((performance.now() - t0) / 2200) * 100)), 50)
    return () => clearInterval(id)
  }, [])

  const real = active ? progress : 100
  const pct = Math.round(Math.min(fake, real, ready ? 100 : 92))
  const done = pct >= 100

  const enter = () => {
    startAudio()
    useStore.getState().setSound(true)
    useStore.getState().enter()
    setTimeout(() => setGone(true), 1200)
  }

  if (gone) return null
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-espresso text-foam transition-opacity duration-1000 ${entered ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      role="dialog"
      aria-label="Loading"
    >
      <div className="relative h-40 w-40" aria-hidden>
        <div className="loader-steam" />
        <div className="absolute bottom-[3.4rem] -right-1 h-12 w-9 rounded-r-full border-4 border-l-0 border-latte" />
        <div className="absolute bottom-3 left-1/2 h-28 w-28 -translate-x-1/2 overflow-hidden rounded-b-[2.8rem] rounded-t-md border-4 border-latte bg-espresso">
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3a2012] to-mocha transition-[height] duration-200" style={{ height: `${pct}%` }}>
            {done && <div className="latte-heart" />}
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 h-3 w-36 -translate-x-1/2 rounded-full bg-latte/80" />
      </div>
      <p className="mt-6 font-hand text-3xl" aria-live="polite">{done ? 'Freshly brewed.' : `Brewing… ${pct}%`}</p>
      <button
        onClick={enter}
        disabled={!done}
        className={`mt-6 min-h-[44px] rounded-full bg-amber px-8 py-3 font-serif text-xl text-espresso shadow-lg transition-all duration-500 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foam ${done ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
      >
        Come in
      </button>
      <p className="mt-4 font-sans text-sm text-latte/70">Best with sound 🔊</p>
    </div>
  )
}
