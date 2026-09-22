import { useRef, useState } from 'react'
import { wedding } from '../content/wedding'
import { useStore } from '../state/useStore'
import { play } from '../audio/sounds'
import { Section } from './Section'

const ENDPOINT = import.meta.env.VITE_RSVP_ENDPOINT

interface Form {
  name: string
  phone: string
  count: number
  events: string[]
  food: string
  note: string
}

function Confetti() {
  const bits = Array.from({ length: 28 }, (_, i) => i)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      {bits.map((i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 0.6}s`,
            ['--dx' as string]: `${(Math.random() - 0.5) * 240}px`,
            ['--rot' as string]: `${Math.random() * 720 - 360}deg`,
            background: i % 3 === 0 ? '#3B2418' : i % 3 === 1 ? '#D98A8A' : '#F3B6B6',
            borderRadius: i % 3 === 0 ? '50% 50% 50% 50% / 60% 60% 40% 40%' : '60% 0 60% 0',
          }}
        />
      ))}
    </div>
  )
}

export function Rsvp() {
  const guest = useStore((s) => s.guest)
  const rsvp = useStore((s) => s.rsvp)
  const setRsvp = useStore((s) => s.setRsvp)
  const { maxGuests, deadline, foodOptions } = wedding.rsvp
  const [f, setF] = useState<Form>({ name: guest, phone: '', count: 1, events: wedding.events.map((e) => e.id), food: foodOptions[0], note: '' })
  const [err, setErr] = useState<Record<string, string>>({})
  const busy = useRef(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 2) e.name = 'Please tell us your name.'
    if (f.phone && !/^[+\d][\d\s-]{6,16}$/.test(f.phone.trim())) e.phone = 'That number looks a little off.'
    if (!f.events.length) e.events = 'Pick at least one event (or tell us in the note!).'
    setErr(e)
    return !Object.keys(e).length
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (busy.current || rsvp.status === 'sending' || !validate()) return
    busy.current = true
    setRsvp({ status: 'sending', error: undefined })
    const payload = { ...f, name: f.name.trim(), events: f.events.join(', '), submittedAt: new Date().toISOString(), invite: guest }
    try {
      if (ENDPOINT) {
        // text/plain avoids a CORS preflight, which Apps Script can't answer
        const res = await fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
        const data = await res.json().catch(() => ({ ok: res.ok }))
        if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`)
      } else {
        console.info('[rsvp] VITE_RSVP_ENDPOINT not set; simulating success', payload)
        await new Promise((r) => setTimeout(r, 900))
      }
      setRsvp({ status: 'done', name: payload.name, count: f.count })
      play('printer', 0.6)
    } catch (e) {
      setRsvp({ status: 'error', error: 'We couldn’t send your order. Check your connection and try again?' })
    } finally {
      busy.current = false
    }
  }

  const toggleEvent = (id: string) => setF((s) => ({ ...s, events: s.events.includes(id) ? s.events.filter((x) => x !== id) : [...s.events, id] }))

  return (
    <Section id="rsvp" auto label="RSVP">
      <div className="flex min-h-[150svh] items-start justify-center px-4 pt-[20vh]">
        <div className="pointer-events-auto relative w-full max-w-md">
          {rsvp.status === 'done' ? (
            <div className="relative flex flex-col items-center">
              <div className="printer-body" aria-hidden>
                <div className="printer-slot" />
              </div>
              <div className="receipt" role="status">
                <p className="text-center font-mono text-lg font-bold">ORDER CONFIRMED ☕</p>
                <p className="mt-2 border-t border-dashed border-espresso/40 pt-2 text-center font-mono">
                  Seats reserved for {rsvp.name} × {rsvp.count}
                </p>
                <p className="mt-1 text-center font-mono">See you on {wedding.date.display}</p>
                <p className="mt-3 border-t border-dashed border-espresso/40 pt-2 text-center font-hand text-2xl">thank you ♥</p>
              </div>
              <Confetti />
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="order-slip relative rounded-sm p-6 pt-8 shadow-2xl md:p-8" aria-describedby="rsvp-deadline">
              <h2 className="font-hand text-5xl text-espresso">Your Order</h2>
              <p id="rsvp-deadline" className="font-sans text-xs uppercase tracking-widest text-mocha">
                Kindly RSVP by {deadline}
              </p>

              <label className="field mt-5">
                <span>Name *</span>
                <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" required aria-invalid={!!err.name} />
                {err.name && <em>{err.name}</em>}
              </label>
              <label className="field">
                <span>Phone</span>
                <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" autoComplete="tel" aria-invalid={!!err.phone} />
                {err.phone && <em>{err.phone}</em>}
              </label>

              <fieldset className="field">
                <legend>How many cups?</legend>
                <div className="flex items-center gap-3">
                  <button type="button" className="stepper" onClick={() => setF({ ...f, count: Math.max(1, f.count - 1) })} aria-label="One fewer guest">
                    −
                  </button>
                  <div className="flex flex-wrap gap-1 text-2xl" aria-live="polite" aria-label={`${f.count} guests`}>
                    {Array.from({ length: f.count }, (_, i) => (
                      <span key={i} className="cup-pop">☕</span>
                    ))}
                  </div>
                  <button type="button" className="stepper" onClick={() => setF({ ...f, count: Math.min(maxGuests, f.count + 1) })} aria-label="One more guest">
                    +
                  </button>
                </div>
              </fieldset>

              {wedding.events.length > 1 && (
              <fieldset className="field">
                <legend>Events attending</legend>
                <div className="flex flex-wrap gap-2">
                  {wedding.events.map((e) => (
                    <label key={e.id} className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-3 font-sans text-sm ${f.events.includes(e.id) ? 'border-espresso bg-espresso text-foam' : 'border-mocha/40 text-espresso'}`}>
                      <input type="checkbox" className="sr-only" checked={f.events.includes(e.id)} onChange={() => toggleEvent(e.id)} />
                      {e.name}
                    </label>
                  ))}
                </div>
                {err.events && <em>{err.events}</em>}
              </fieldset>
              )}

              <fieldset className="field">
                <legend>Food preference</legend>
                <div className="flex gap-2">
                  {foodOptions.map((o) => (
                    <label key={o} className={`flex min-h-[44px] cursor-pointer items-center rounded-full border px-4 font-sans text-sm ${f.food === o ? 'border-espresso bg-espresso text-foam' : 'border-mocha/40 text-espresso'}`}>
                      <input type="radio" name="food" className="sr-only" checked={f.food === o} onChange={() => setF({ ...f, food: o })} />
                      {o}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="field">
                <span>A note for the couple</span>
                <textarea rows={3} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={600} />
              </label>

              {rsvp.status === 'error' && (
                <p className="mb-3 rounded bg-rose/20 p-3 font-sans text-sm text-espresso" role="alert">
                  {rsvp.error}
                </p>
              )}
              <button type="submit" className="btn w-full justify-center" disabled={rsvp.status === 'sending'}>
                {rsvp.status === 'sending' ? 'Sending your order…' : rsvp.status === 'error' ? 'Try again' : 'Place order ☕'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Section>
  )
}
