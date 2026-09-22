/**
 * THE PACING CONFIG. One array, top to bottom.
 * - `height`   how long (in viewport heights) the page spends on this beat
 * - `cam`      camera position, look-at target, fov, depth-of-field range (world units) & bokeh
 * - `side`     shifts the framing sideways (desktop) / upward (mobile) to leave room for a card
 */
import { CAFE_LOCAL, CHAPTERS, cafeWorld, type V3 } from '../three/world/layout'

export type BeatId =
  | 'light' | 'couple' | 'cups' | 'cafeDiorama'
  | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6'
  | 'backToCups' | 'map' | 'rsvp' | 'faq' | 'closing'

export interface Beat {
  id: BeatId
  height: number
  cam: { pos: V3; target: V3; fov: number; focusRange: number; bokeh: number }
  side?: number
}

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const bulb = cafeWorld(CAFE_LOCAL.bulb)
const cupsMid = cafeWorld([(CAFE_LOCAL.cupA[0] + CAFE_LOCAL.cupB[0]) / 2, CAFE_LOCAL.tableTop + 0.17, CAFE_LOCAL.cupA[2]])
const tableC = cafeWorld([CAFE_LOCAL.table[0], 1.3, CAFE_LOCAL.table[2]])

const chapter = (id: keyof typeof CHAPTERS, i: number): Beat => ({
  id,
  height: id === 'ch6' ? 520 : 170,
  side: id === 'ch6' ? 0 : 3.6,
  cam: {
    pos: add(CHAPTERS[id], [-2 + i * 0.3, 7.8 + i * 0.4, 14.5 + i * 0.7]),
    target: add(CHAPTERS[id], [0, 1.6, 0]),
    fov: 38,
    focusRange: id === 'ch5' ? 10 : 6 + i * 0.4,
    bokeh: 6,
  },
})

export const BEATS: Beat[] = [
  { id: 'light', height: 110, cam: { pos: add(bulb, [0.08, 0.02, 0.85]), target: bulb, fov: 40, focusRange: 0.3, bokeh: 9 } },
  { id: 'couple', height: 150, cam: { pos: add(tableC, [0.4, 1.9, 7.4]), target: add(tableC, [0, 0.55, 0]), fov: 42, focusRange: 2.5, bokeh: 5 } },
  { id: 'cups', height: 280, cam: { pos: add(cupsMid, [0, 0.26, 1.25]), target: cupsMid, fov: 38, focusRange: 0.4, bokeh: 11 } },
  { id: 'cafeDiorama', height: 170, cam: { pos: [7, 11.5, 20], target: [1.5, 2.2, -0.5], fov: 40, focusRange: 6, bokeh: 6 } },
  chapter('ch1', 0),
  chapter('ch2', 1),
  chapter('ch3', 2),
  chapter('ch4', 3),
  chapter('ch5', 4),
  chapter('ch6', 5),
  { id: 'backToCups', height: 170, cam: { pos: add(cupsMid, [0.05, 0.38, 1.45]), target: add(cupsMid, [0, 0.12, 0]), fov: 38, focusRange: 0.45, bokeh: 11 } },
  { id: 'map', height: 320, side: 0, cam: { pos: [14, 30, 44], target: [36, 2, -10], fov: 42, focusRange: 45, bokeh: 1.5 } },
  { id: 'rsvp', height: 150, cam: { pos: [4.5, 9.5, 11], target: [0.2, 1.8, -1], fov: 40, focusRange: 6, bokeh: 2.5 } },
  { id: 'faq', height: 130, cam: { pos: add(cafeWorld(CAFE_LOCAL.chalkboard), [1.6, 0.8, 5.2]), target: cafeWorld(CAFE_LOCAL.chalkboard), fov: 40, focusRange: 2.5, bokeh: 3 } },
  { id: 'closing', height: 120, cam: { pos: [3.5, 6.5, 14], target: [0.8, 2.4, -1.2], fov: 40, focusRange: 7, bokeh: 3 } },
]

export const beatIndex = (id: BeatId) => BEATS.findIndex((b) => b.id === id)
