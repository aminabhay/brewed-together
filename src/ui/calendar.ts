import { wedding } from '../content/wedding'

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export interface CalEvent {
  title: string
  start: string
  end: string
  location: string
  details?: string
}

export const mainEvent = (): CalEvent => {
  const w = wedding.events.find((e) => e.id === 'wedding') ?? wedding.events[0]
  return {
    title: `${wedding.couple.bride} & ${wedding.couple.groom}'s ${w?.name ?? 'Wedding'}`,
    start: w?.startISO ?? wedding.date.iso,
    end: w?.endISO ?? wedding.date.iso,
    location: `${w?.venue ?? wedding.venue.name}, ${w?.address ?? wedding.venue.address}`,
    details: `See you there! ${window.location.origin}`,
  }
}

export function googleCalendarUrl(e: CalEvent) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${stamp(e.start)}/${stamp(e.end)}`,
    details: e.details ?? '',
    location: e.location,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export function downloadIcs(e: CalEvent) {
  const esc = (s: string) => s.replace(/[,;\\]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Brewed Together//EN',
    'BEGIN:VEVENT',
    `UID:${stamp(e.start)}-${Math.random().toString(36).slice(2)}@brewed-together`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(e.location)}`,
    `DESCRIPTION:${esc(e.details ?? '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${e.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
