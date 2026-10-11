import { create } from 'zustand'
import type { ObstacleKind } from './config'

/** INTRO → READY → CHASE → FINAL_CHASE → CAUGHT → DATE_REVEAL → COMPLETE */
export type Phase = 'INTRO' | 'READY' | 'CHASE' | 'FINAL_CHASE' | 'CAUGHT' | 'DATE_REVEAL' | 'COMPLETE'

/** A comedy beat placed on the street. Mutated in place by the controller (triggered / tt). */
export interface ObstacleInstance {
  id: number
  kind: ObstacleKind
  z: number
  triggered: boolean
  tt: number // seconds since triggered
}

export interface Toast {
  id: number
  text: string
  tone?: 'big' | 'normal'
}

interface UIState {
  phase: Phase
  /** shown progress, 0–1 (throttled copy of the sim) */
  progress: number
  rapid: boolean
  idle: boolean
  toast: Toast | null
  /** the line someone is currently saying in the ending */
  line: { who: 'bride' | 'groom'; text: string } | null
  soundOn: boolean
  stats: { taps: number; maxRate: number; seconds: number } | null
  obstacles: ObstacleInstance[]
  runId: number
  setPhase: (p: Phase) => void
  showToast: (text: string, tone?: Toast['tone']) => void
  set: (s: Partial<UIState>) => void
  restart: () => void
}

let toastId = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useGame = create<UIState>((set) => ({
  phase: 'INTRO',
  progress: 0,
  rapid: false,
  idle: false,
  toast: null,
  line: null,
  soundOn: true,
  stats: null,
  obstacles: [],
  runId: 0,
  setPhase: (phase) => set({ phase }),
  showToast: (text, tone = 'normal') => {
    clearTimeout(toastTimer)
    set({ toast: { id: ++toastId, text, tone } })
    toastTimer = setTimeout(() => set({ toast: null }), tone === 'big' ? 1500 : 1200)
  },
  set: (s) => set(s),
  restart: () => {
    resetSim()
    set((s) => ({ phase: 'READY', progress: 0, rapid: false, idle: false, toast: null, line: null, stats: null, obstacles: [], runId: s.runId + 1 }))
  },
}))

/** Groom modifiers set by comedy beats (read by the controller every frame). */
export interface GroomMods {
  speedMul: number
  pause: number // seconds of standing still left
  boost: number // extra m/s from the bill
  x: number // lateral weave
  jump: number // 0–1 height
  crouch: number // 0–1
  reach: number // 0–1 (chai)
  stumble: number // 0–1
}

/**
 * The mutable simulation, read and written every frame by the controller, characters and camera.
 * Kept out of React so 60 fps never triggers re-renders.
 */
export const sim = {
  t: 0, // seconds of chase
  zG: 0, // groom position (runs towards -z)
  vG: 0,
  zB: 0, // bride position
  vB: 0,
  gap: 0,
  progress: 0,
  phaseTime: 0, // seconds in the current phase
  // taps
  taps: 0,
  tapTimes: [] as number[],
  tapRate: 0,
  maxRate: 0,
  lastTapAt: 0,
  // groom state
  mods: { speedMul: 1, pause: 0, boost: 0, x: 0, jump: 0, crouch: 0, reach: 0, stumble: 0 } as GroomMods,
  groomStride: 0,
  // bride state
  lookBack: 0,
  turn: 0, // 0 = running away, 1 = facing the groom
  slowTimer: 0,
  nextTease: 5,
  noticed: 0,
  teased: false,
  // camera
  widen: 0,
  shake: 0,
  // obstacle currently on screen (for the HUD + camera)
  activeObstacle: null as ObstacleKind | null,
  // ending
  revealZ: 0,
}

/** Move to a phase, restarting the phase clock. */
export function goto(phase: Phase) {
  sim.phaseTime = 0
  useGame.getState().setPhase(phase)
}

export function resetSim() {
  Object.assign(sim, {
    t: 0,
    zG: 0,
    vG: 0,
    zB: -10,
    vB: 0,
    gap: 10,
    progress: 0,
    phaseTime: 0,
    taps: 0,
    tapTimes: [],
    tapRate: 0,
    maxRate: 0,
    lastTapAt: 0,
    mods: { speedMul: 1, pause: 0, boost: 0, x: 0, jump: 0, crouch: 0, reach: 0, stumble: 0 },
    groomStride: 0,
    lookBack: 0,
    turn: 0,
    slowTimer: 0,
    nextTease: 5,
    noticed: 0,
    teased: false,
    widen: 0,
    shake: 0,
    activeObstacle: null,
    revealZ: 0,
  })
}
resetSim()
