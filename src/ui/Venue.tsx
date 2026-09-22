import { useEffect, useRef, useState } from 'react'
import { wedding } from '../content/wedding'
import { useStore } from '../state/useStore'
import { Section } from './Section'
import { downloadIcs, googleCalendarUrl, type CalEvent } from './calendar'

function LazyMap() {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShow(true), { rootMargin: '300px' })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-latte">
      {show && <iframe title={`Map of ${wedding.venue.name}`} src={wedding.venue.embedUrl} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
    </div>
  )
}

/** Venue photos (and optional videos) from wedding.ts, lazy-loaded with fixed aspect ratios so nothing shifts. */
function Gallery() {
  const { photos, videos } = wedding.venue
  const [open, setOpen] = useState<number | null>(null)
  if (!photos.length && !videos.length) return null
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        {photos.map((p, i) => (
          <button key={p.src} onClick={() => setOpen(i)} className={`overflow-hidden rounded-xl bg-latte ${i === 0 ? 'col-span-2 aspect-[3/2]' : 'aspect-square'}`} aria-label={`View photo: ${p.alt}`}>
            <img src={p.src} alt={p.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
          </button>
        ))}
      </div>
      {videos.map((src) => (
        <video key={src} src={src} className="mt-2 aspect-video w-full rounded-xl bg-espresso" controls playsInline preload="none" />
      ))}
      {open !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/90 p-4" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label="Venue photo">
          <img src={photos[open].src} alt={photos[open].alt} className="max-h-[85svh] max-w-full rounded-xl shadow-2xl" />
          <button className="chip absolute right-4 top-4" onClick={() => setOpen(null)} autoFocus>
            Close ✕
          </button>
        </div>
      )}
    </div>
  )
}

const TABS = [
  ['byAir', 'By Air ✈️'],
  ['byTrain', 'By Train 🚆'],
  ['byRoad', 'By Road 🚗'],
] as const

export function Venue({ staticMode = false }: { staticMode?: boolean }) {
  const v = wedding.venue
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('byAir')
  const focus = useStore((s) => s.mapFocus)
  const setFocus = useStore((s) => s.setMapFocus)
  return (
    <Section id="map" auto label="Venue and travel">
      {!staticMode && <div className="h-[110svh]" aria-hidden />}
      <div className="pointer-events-none relative mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-[40vh] md:items-end md:px-8">
        <article className="paper pointer-events-auto w-full rounded-2xl p-5 md:max-w-lg md:p-7">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-mocha">The venue</p>
          <h2 className="mt-1 font-serif text-3xl text-espresso md:text-4xl">{v.name}</h2>
          <p className="mt-1 font-sans text-espresso/80">{v.address}</p>
          <a href={v.mapsUrl} target="_blank" rel="noreferrer" className="btn mt-4 inline-flex">
            Open in Google Maps
          </a>
          <Gallery />
          <LazyMap />
          <div className="mt-6" role="tablist" aria-label="How to get there">
            <div className="flex flex-wrap gap-2">
              {TABS.map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-[44px] rounded-full px-4 font-sans text-sm transition ${tab === k ? 'bg-espresso text-foam' : 'bg-latte text-espresso'}`}>
                  {label}
                </button>
              ))}
            </div>
            <p role="tabpanel" className="mt-3 font-sans leading-relaxed text-espresso/90">
              {v[tab]}
            </p>
          </div>
          {v.hotels.length > 0 && (
            <>
          <h3 className="mt-6 font-hand text-3xl text-espresso">Where to stay</h3>
          <ul className="mt-2 divide-y divide-mocha/15">
            {v.hotels.map((h) => (
              <li key={h.name} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <div className="font-serif text-lg text-espresso">{h.name}</div>
                  <div className="font-sans text-sm text-mocha">{h.note}</div>
                </div>
                <a href={h.url} target="_blank" rel="noreferrer" className="btn-small shrink-0">
                  View
                </a>
              </li>
            ))}
          </ul>
            </>
          )}
          <h3 className="mt-6 font-hand text-3xl text-espresso">Parking</h3>
          <p className="font-sans text-espresso/90">{v.parking}</p>
        </article>

        <div className="pointer-events-auto flex w-full flex-col gap-4 md:max-w-lg">
          <h2 className="font-hand text-5xl text-foam drop-shadow">{wedding.events.length > 1 ? 'The schedule' : 'The big day'}</h2>
          {wedding.events.map((e, i) => {
            const cal: CalEvent = { title: `${e.name} · ${wedding.couple.groom} & ${wedding.couple.bride}`, start: e.startISO, end: e.endISO, location: `${e.venue}, ${e.address}` }
            return (
              <article
                key={e.id}
                onClick={() => setFocus(focus === i ? null : i)}
                className={`paper cursor-pointer rounded-2xl p-5 transition-all duration-300 ${focus === i ? 'scale-[1.02] ring-4 ring-amber' : ''}`}
                style={{ borderLeft: `8px solid ${e.colour}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl text-espresso">{e.name}</h3>
                    <p className="font-sans text-sm text-mocha">
                      {e.date} · {e.time}
                    </p>
                  </div>
                  <span className="mt-1 flex items-center gap-2 font-sans text-xs text-espresso/80">
                    <span className="inline-block h-5 w-5 rounded-full border border-espresso/20" style={{ background: e.colour }} aria-hidden />
                    {e.dressCode}
                  </span>
                </div>
                <p className="mt-2 font-sans text-espresso/90">
                  {e.venue} · <span className="text-espresso/70">{e.address}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2" onClick={(ev) => ev.stopPropagation()}>
                  <a className="btn-small" href={googleCalendarUrl(cal)} target="_blank" rel="noreferrer">
                    + Google Calendar
                  </a>
                  <button className="btn-small" onClick={() => downloadIcs(cal)}>
                    .ics
                  </button>
                  <a className="btn-small" href={e.mapsUrl} target="_blank" rel="noreferrer">
                    Directions
                  </a>
                  <button className="btn-small" onClick={() => setFocus(i)} aria-label={`Show ${e.name} on the map`}>
                    📍 On the map
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
