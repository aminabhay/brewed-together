import { Howl, Howler } from 'howler'
import { useStore } from '../state/useStore'

/** Swap these files for real royalty-free recordings (README → Audio). */
const SRC = {
  ambience: 'audio/cafe-ambience.wav',
  rain: 'audio/rain.wav',
  piano: 'audio/piano.wav',
  clink: 'audio/clink.wav',
  knock: 'audio/knock.wav',
  stamp: 'audio/stamp.wav',
  printer: 'audio/printer.wav',
  page: 'audio/page.wav',
} as const

type Name = keyof typeof SRC
const LOOPS: Partial<Record<Name, number>> = { ambience: 0.35, rain: 0.25, piano: 0.4 }

const howls: Partial<Record<Name, Howl>> = {}
let started = false

const get = (name: Name) =>
  (howls[name] ??= new Howl({
    src: [import.meta.env.BASE_URL + SRC[name]],
    loop: name in LOOPS,
    volume: name in LOOPS ? 0 : 0.7,
    preload: true,
    onloaderror: () => console.warn(`[audio] could not load ${SRC[name]}`),
  }))

/** Called from the "Come in" click, which satisfies browser autoplay rules. */
export function startAudio() {
  if (started) return
  started = true
  Howler.volume(1)
  ;(['ambience', 'rain', 'piano'] as Name[]).forEach((n) => {
    const h = get(n)
    h.play()
  })
  setMood(false)
  ;(['clink', 'knock', 'stamp', 'printer', 'page'] as Name[]).forEach(get)
}

let romantic = false
/** Cross-fade café ambience ↔ piano (piano takes over from "She stayed" onward). */
export function setMood(isRomantic: boolean) {
  if (!started) return
  romantic = isRomantic
  const f = (n: Name, v: number) => {
    const h = howls[n]
    if (h) h.fade(h.volume(), v, 1800)
  }
  f('ambience', isRomantic ? 0.08 : LOOPS.ambience!)
  f('rain', isRomantic ? 0.08 : LOOPS.rain!)
  f('piano', isRomantic ? LOOPS.piano! : 0)
}
export const isRomantic = () => romantic

export function play(name: Exclude<Name, 'ambience' | 'rain' | 'piano'>, volume = 0.7) {
  if (!started || !useStore.getState().soundOn) return
  const h = get(name)
  h.volume(volume)
  h.play()
}

export function setMuted(muted: boolean) {
  Howler.mute(muted)
}
