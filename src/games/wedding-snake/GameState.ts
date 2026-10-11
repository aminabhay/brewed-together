import { create } from 'zustand'
import type { BonusId, RequiredId, WrongId } from './config'

/** INTRO → READY → PLAYING ⇄ MISTAKE → COMPLETED → REVEAL */
export type Phase = 'INTRO' | 'READY' | 'PLAYING' | 'MISTAKE' | 'COMPLETED' | 'REVEAL'

export type EntityKind = 'required' | 'wrong' | 'bonus'
/** Something lying around the wedding village. Mutated in place by the controller. */
export interface Entity {
  id: number
  kind: EntityKind
  key: RequiredId | WrongId | BonusId
  x: number
  z: number
  taken: boolean
  /** wrong items stay wrapped as parcels until you're close */
  revealed: boolean
}

export interface ChecklistItem {
  id: RequiredId
  label: string
  emoji: string
  done: boolean
}

/** One link in the procession behind the player. */
export interface TrailLink {
  key: RequiredId | 'aunty' | 'uncle'
  emoji: string
}

export interface Popup {
  id: number
  title: string
  line?: string
  emoji?: string
  tone: 'wrong' | 'bonus' | 'good' | 'gameover'
}

interface UI {
  phase: Phase
  checklist: ChecklistItem[]
  hearts: number
  entities: Entity[] // React mirror of sim.entities (changes only on spawn / pickup)
  trail: TrailLink[]
  popup: Popup | null
  toast: { id: number; text: string } | null
  focus: boolean // the "FOCUS." screen
  finalStep: number // 0–3 lines of the finale
  stats: { wrong: number; seconds: number; longest: number; collected: number } | null
  runId: number
  set: (s: Partial<UI>) => void
  setPhase: (p: Phase) => void
  showPopup: (p: Omit<Popup, 'id'>, ms?: number) => void
  showToast: (text: string) => void
}

let n = 0
let popupTimer: ReturnType<typeof setTimeout> | undefined
let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useSnake = create<UI>((set) => ({
  phase: 'INTRO',
  checklist: [],
  hearts: 3,
  entities: [],
  trail: [],
  popup: null,
  toast: null,
  focus: false,
  finalStep: 0,
  stats: null,
  runId: 0,
  set: (s) => set(s),
  setPhase: (phase) => {
    sim.phaseTime = 0
    set({ phase })
  },
  showPopup: (p, ms = 1300) => {
    clearTimeout(popupTimer)
    set({ popup: { ...p, id: ++n } })
    popupTimer = setTimeout(() => set({ popup: null }), ms)
  },
  showToast: (text) => {
    clearTimeout(toastTimer)
    set({ toast: { id: ++n, text } })
    toastTimer = setTimeout(() => set({ toast: null }), 1100)
  },
}))

/** Per-frame simulation state, kept out of React. */
export const sim = {
  phaseTime: 0,
  t: 0, // seconds of play
  x: 0,
  z: 8,
  heading: Math.PI, // world yaw the player faces (PI = up the screen)
  targetHeading: Math.PI,
  moving: false,
  speed: 0,
  slowUntil: 0,
  slowFactor: 1,
  boostUntil: 0,
  freezeUntil: 0,
  hintUntil: 0,
  mapsUntil: 0,
  wrong: 0,
  longest: 0,
  ringsOut: false,
  path: [] as { x: number; z: number; d: number }[], // breadcrumbs, newest first, d = distance from the player
  entities: [] as Entity[],
  burst: { x: 0, z: 0, at: -10, colour: '#F4C542' }, // last pickup sparkle
  playerScreen: { x: 0, y: 0 }, // for tap-to-steer
  gameOver: false,
  route: [] as { x: number; z: number }[], // finale: waypoints to the partner
  arrived: false, // finale: standing beside the partner
}

export function resetSim() {
  Object.assign(sim, {
    phaseTime: 0,
    t: 0,
    x: 0,
    z: 8,
    heading: Math.PI,
    targetHeading: Math.PI,
    moving: false,
    speed: 0,
    slowUntil: 0,
    slowFactor: 1,
    boostUntil: 0,
    freezeUntil: 0,
    hintUntil: 0,
    mapsUntil: 0,
    wrong: 0,
    longest: 0,
    ringsOut: false,
    path: [],
    entities: [],
    burst: { x: 0, z: 0, at: -10, colour: '#F4C542' },
    gameOver: false,
    route: [],
    arrived: false,
  })
}
