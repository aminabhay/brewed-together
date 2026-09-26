import { useState } from 'react'
import { wedding } from '../content/wedding'
import { Countdown } from './Countdown'
import { downloadIcs, googleCalendarUrl, mainEvent } from './calendar'

/** Static illustrated version for browsers without WebGL. Same story, same RSVP & FAQ (rendered by App). */
export function FallbackStory() {
  const [shown, setShown] = useState(false)
  const scenes = ['🏫', '💬', '🚪', '📝', '💻', '🗓️']
  return (
    <div className="fallback relative z-10 mx-auto max-w-2xl px-4 pt-16 text-center text-foam">
      <div className="text-6xl" aria-hidden>
        ☕💡
      </div>
      <h1 className="mt-6 font-hand text-6xl">{wedding.hero.headline}</h1>
      <p className="mt-2 font-serif text-2xl text-latte">
        {wedding.couple.brideFull} &amp; {wedding.couple.groomFull}
      </p>

      <div className="paper mx-auto mt-12 max-w-md rounded-2xl p-6 text-espresso">
        <div className="flex justify-center gap-6 text-5xl" aria-hidden>
          <span>☕</span>
          <span>☕</span>
        </div>
        {shown ? (
          <div className="fade-up mt-4">
            <p className="font-serif text-3xl">{wedding.date.display}</p>
            <p className="font-hand text-2xl text-mocha">{wedding.date.city}</p>
            <div className="mt-4">
              <Countdown />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a className="btn" href={googleCalendarUrl(mainEvent())} target="_blank" rel="noreferrer">
                Add to Google Calendar
              </a>
              <button className="btn-ghost !text-espresso" onClick={() => downloadIcs(mainEvent())}>
                Download .ics
              </button>
            </div>
          </div>
        ) : (
          <button className="btn mt-4" onClick={() => setShown(true)}>
            Tap to reveal the date
          </button>
        )}
      </div>

      <h2 className="mt-16 font-hand text-5xl">{wedding.cafe.chapterTitle}</h2>
      <div className="mt-6 flex flex-col gap-6">
        {wedding.story.map((s, i) => (
          <article key={s.id} className="paper rounded-2xl p-6 text-left text-espresso">
            <div className="text-5xl" aria-hidden>
              {scenes[i]}
            </div>
            <h3 className="mt-2 font-hand text-4xl">{s.title}</h3>
            <p className="font-serif text-lg">{s.text}</p>
          </article>
        ))}
      </div>
      <div className="mt-12 space-y-2 font-serif text-3xl">
        {wedding.sheStayed.lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
        <p className="font-hand text-5xl text-rose">{wedding.sheStayed.finale}</p>
      </div>
      <p className="mt-16 font-serif text-3xl">{wedding.fullCircle.line1}</p>
      <p className="font-hand text-4xl text-amber">{wedding.fullCircle.line2}</p>
    </div>
  )
}
