import { useEffect, useState } from 'react'
import { wedding } from '../content/wedding'

export function Countdown() {
  const target = new Date(wedding.date.iso).getTime()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const d = Math.max(0, target - now)
  const parts = [
    ['days', Math.floor(d / 864e5)],
    ['hours', Math.floor((d / 36e5) % 24)],
    ['minutes', Math.floor((d / 6e4) % 60)],
    ['seconds', Math.floor((d / 1e3) % 60)],
  ] as const
  return (
    <div className="flex items-start justify-center gap-2 md:gap-4" role="timer" aria-label="Countdown to the wedding">
      {parts.map(([label, v], i) => (
        <div key={label} className="flex items-start gap-2 md:gap-4">
          <div className="min-w-[3.6rem] rounded-xl bg-foam/90 px-2 py-2 text-center text-espresso shadow md:min-w-[4.8rem]">
            <div className="font-serif text-2xl tabular-nums md:text-4xl">{String(v).padStart(2, '0')}</div>
            <div className="font-sans text-[10px] uppercase tracking-widest text-mocha">{label}</div>
          </div>
          {i < 3 && <span className="pt-2 font-serif text-2xl text-latte md:text-4xl">:</span>}
        </div>
      ))}
    </div>
  )
}
