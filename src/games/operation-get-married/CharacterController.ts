import { gameConfig, type ObstacleKind } from './config'
import { sim, useGame, type ObstacleInstance, type Phase } from './GameState'
import { audio, buzz } from './AudioManager'

import type { Pose } from '../shared/pose'
export type { Pose }

const pose = (): Pose => ({ x: 0, y: 0, z: 0, yaw: Math.PI, clip: 'Idle', run: 0, speed: 0, rapid: 0, lookBack: 0, crouch: 0, reach: 0, stumble: 0, visible: true })
export const groom = pose()
export const bride = pose()

const T = gameConfig.tuning
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const approach = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * Math.min(1, dt * rate)

// ── obstacle plan ──────────────────────────────────────────
let plan: { kind: ObstacleKind; at: number; done: boolean }[] = []
let nextId = 1
let lastSpawnZ = Infinity
const BEAT_SPACING = 11 // metres between consecutive comedy beats (enough that they never overlap)
function resetPlan() {
  const every = Math.max(1, Math.round(1 / gameConfig.obstacles.frequency))
  plan = gameConfig.obstacles.list.filter((_, i) => i % every === 0).map((o) => ({ ...o, done: false }))
}
resetPlan()

/** Called when a run (re)starts. */
export function resetCharacters() {
  Object.assign(groom, pose())
  Object.assign(bride, pose(), { z: -40, visible: false })
  resetPlan()
  lastSpawnZ = Infinity
  lastStride = 0
  rapidAnnounced = false
  finalAnnounced = false
  teaseTimer = 0
}

/** A tap during the chase: momentum, not one tap = one step. */
export function registerTap() {
  const now = performance.now() / 1000
  sim.taps++
  sim.tapTimes.push(now)
  sim.lastTapAt = now
  sim.vG = Math.min(T.maxSpeed, Math.max(sim.vG, T.minSpeed) + T.tapPower)
  if (useGame.getState().idle) useGame.getState().set({ idle: false })
  audio.footstep(true) // a step on every tap
  buzz(6)
}

// ── per-frame update ───────────────────────────────────────
let lastStride = 0
let rapidAnnounced = false
let finalAnnounced = false
let teaseTimer = 0

export function updateGame(dt: number, phase: Phase) {
  const ui = useGame.getState()
  sim.phaseTime += dt
  const now = performance.now() / 1000
  while (sim.tapTimes.length && now - sim.tapTimes[0] > 1) sim.tapTimes.shift()
  sim.tapRate = sim.tapTimes.length
  if (phase === 'CHASE' || phase === 'FINAL_CHASE') sim.maxRate = Math.max(sim.maxRate, sim.tapRate)

  switch (phase) {
    case 'INTRO':
      groom.clip = 'Idle'
      groom.run = 0
      bride.visible = false
      break
    case 'READY':
      ready(dt)
      break
    case 'CHASE':
    case 'FINAL_CHASE':
      chase(dt, phase, now)
      break
    case 'CAUGHT':
      caught(dt)
      break
    case 'DATE_REVEAL':
    case 'COMPLETE':
      reveal(dt)
      break
  }

  // throttle the HUD copy of progress
  if (Math.abs(ui.progress - sim.progress) > 0.01) ui.set({ progress: sim.progress })
  const rapid = (phase === 'CHASE' || phase === 'FINAL_CHASE') && sim.tapRate >= T.rapidTapRate
  if (rapid !== ui.rapid) ui.set({ rapid })
  if (rapid && !rapidAnnounced) {
    rapidAnnounced = true
    ui.showToast(gameConfig.dialogue.rapid)
    audio.swoosh()
  }
}

function ready(dt: number) {
  const t = sim.phaseTime
  groom.clip = 'Idle'
  groom.run = approach(groom.run, 0, 6, dt)
  groom.z = sim.zG = 0
  // the bride appears in the distance, glances back, then darts off and waits, teasing
  bride.visible = t > 1.7
  if (t < 1.7) {
    sim.zB = -13
  } else if (t < 2.7) {
    bride.clip = 'Idle'
    bride.run = 0
    bride.lookBack = approach(bride.lookBack, 1, 6, dt)
  } else if (sim.zB > -T.startGap) {
    sim.vB = 5.5
    sim.zB = Math.max(-T.startGap, sim.zB - sim.vB * dt)
    bride.run = approach(bride.run, 1, 8, dt)
    bride.lookBack = approach(bride.lookBack, 0, 6, dt)
  } else {
    sim.vB = 0
    bride.run = approach(bride.run, 0, 6, dt)
    bride.clip = 'Idle'
    bride.lookBack = approach(bride.lookBack, 1, 3, dt)
  }
  bride.z = sim.zB
  bride.speed = sim.vB
  sim.gap = sim.zG - sim.zB
}

function chase(dt: number, phase: Phase, now: number) {
  const ui = useGame.getState()
  sim.t += dt

  // ── comedy beats set the groom's modifiers for this frame
  const m = sim.mods
  Object.assign(m, { speedMul: 1, boost: 0, x: 0, jump: 0, crouch: 0, reach: 0, stumble: 0 })
  updateObstacles(dt, phase)

  // ── groom: momentum
  sim.vG -= (sim.vG - T.minSpeed) * T.drag * dt
  sim.vG = Math.min(T.maxSpeed, Math.max(T.minSpeed, sim.vG))
  let vG = (sim.vG + m.boost) * m.speedMul
  if (m.pause > 0) {
    m.pause -= dt
    vG = 0
  }
  sim.zG -= vG * dt

  // ── bride: playful, adaptive
  const idle = phase === 'CHASE' && sim.taps > 0 && now - sim.lastTapAt > T.idleSeconds
  if (idle !== ui.idle) ui.set({ idle })
  let natural = T.brideSpeed
  let look = 0
  let turn = 0
  sim.nextTease -= dt
  if (sim.nextTease <= 0 && sim.slowTimer <= 0 && phase === 'CHASE') {
    sim.slowTimer = 1.4 // she slows down… on purpose
    sim.nextTease = 5.5 + Math.random() * 2.5
  }
  if (sim.slowTimer > 0) {
    sim.slowTimer -= dt
    natural *= 0.5
    look = 1
    if (sim.gap < 7) {
      sim.slowTimer = 0
      sim.noticed = 1 // …notices him, and speeds off again
    }
  }
  if (sim.noticed > 0) {
    sim.noticed -= dt
    natural *= 1.35
    look = sim.noticed > 0.6 ? 1 : 0
  }
  if (!sim.teased && sim.progress >= 0.74) {
    sim.teased = true // the teasing turn-and-wave at ~75%
    teaseTimer = 1.7
  }
  if (teaseTimer > 0) {
    teaseTimer -= dt
    turn = 1
    natural *= 0.9
  }
  if (idle) look = 1 // "Hello? Were you planning on getting married?"; she keeps her lead
  if (phase === 'FINAL_CHASE') {
    natural = T.brideSpeed * 0.72
    look = 0.4
    turn = 0
  }

  // nobody catches her before minDuration; only fast tapping closes the gap (endless otherwise)
  const G0 = T.startGap
  const c = T.catchDistance
  const gMin = c + (G0 - c) * (1 - sim.t / T.minDuration) // holds through the final stretch too
  let vB = natural
  if (idle) vB = Math.max(vB, vG + 0.3) // no tapping, no catching
  if (sim.gap < gMin) vB = Math.max(vB, vG + (gMin - sim.gap) * 2.5)
  if (sim.gap > G0 + T.leash) vB = Math.min(vB, vG) // never runs out of sight
  sim.vB = approach(sim.vB, vB, 4, dt)
  sim.zB -= sim.vB * dt
  sim.gap = sim.zG - sim.zB
  sim.progress = clamp01(1 - (sim.gap - c) / (G0 - c))

  // ── poses
  const speedF = clamp01((vG - T.minSpeed) / (T.maxSpeed - T.minSpeed))
  const rapid = sim.tapRate >= T.rapidTapRate ? 1 : 0
  groom.z = sim.zG
  groom.x = approach(groom.x, m.x, 10, dt)
  groom.y = m.jump * 0.9
  groom.yaw = Math.PI
  groom.run = approach(groom.run, vG > 0.3 ? 1 : 0, 10, dt)
  groom.speed = vG
  groom.rapid = approach(groom.rapid, rapid, 6, dt)
  groom.crouch = approach(groom.crouch, m.crouch, 14, dt)
  groom.reach = approach(groom.reach, m.reach, 12, dt)
  groom.stumble = approach(groom.stumble, m.stumble, 12, dt)
  groom.clip = 'Idle'
  bride.z = sim.zB
  bride.x = 0
  bride.run = approach(bride.run, sim.vB > 0.4 ? 1 : 0, 6, dt)
  bride.speed = sim.vB
  bride.lookBack = approach(bride.lookBack, look, 5, dt)
  sim.turn = approach(sim.turn, turn, 6, dt)
  bride.yaw = Math.PI + sim.turn * Math.PI
  bride.clip = turn > 0.5 ? 'Wave' : sim.vB < 0.4 ? 'HandsOnHips' : 'Idle'
  bride.visible = true

  // footsteps follow the stride
  sim.groomStride += dt * vG * 1.2
  if (Math.floor(sim.groomStride) !== lastStride) {
    lastStride = Math.floor(sim.groomStride)
    audio.footstep(speedF > 0.6)
  }

  // camera hints
  sim.shake = approach(sim.shake, rapid ? 1 : speedF > 0.75 ? 0.4 : 0, 4, dt)
  audio.setIntensity(phase === 'FINAL_CHASE' ? 1 : sim.progress * 0.6)

  // ── transitions
  if (phase === 'CHASE' && sim.progress >= 0.9) {
    ui.setPhase('FINAL_CHASE')
    sim.phaseTime = 0
    if (!finalAnnounced) {
      finalAnnounced = true
      ui.showToast(gameConfig.dialogue.finalChase, 'big')
      buzz(30)
    }
  }
  if (sim.gap <= c) {
    ui.set({ stats: { taps: sim.taps, maxRate: sim.maxRate, seconds: sim.t }, idle: false, rapid: false })
    ui.setPhase('CAUGHT')
    sim.phaseTime = 0
    audio.stopChase(1.5)
    audio.thud()
    buzz(40)
  }
}

function updateObstacles(dt: number, phase: Phase) {
  const ui = useGame.getState()
  const m = sim.mods
  // spawn the next beat a little ahead of the groom, between him and the bride
  if (phase === 'CHASE') {
    for (const p of plan) {
      if (p.done || sim.progress < p.at - 0.05) continue
      if (sim.vG < gameConfig.obstacles.minSpeed) break // only when he's really running
      p.done = true
      if (sim.gap < 5) continue // too close to fit a gag in; skip it
      // keep beats well apart down the street (the chai stall must not sit on top of the aunties)
      let z = sim.zG - Math.max(3.2, Math.min(14, sim.gap * 0.6))
      if (z > lastSpawnZ - BEAT_SPACING) z = lastSpawnZ - BEAT_SPACING
      if (z < sim.zB + 2.5) {
        p.done = false // no room before the bride yet; try again next frame
        break
      }
      lastSpawnZ = z
      const o: ObstacleInstance = { id: nextId++, kind: p.kind, z, triggered: false, tt: 0 }
      ui.set({ obstacles: [...useGame.getState().obstacles, o] })
    }
  }
  let near: ObstacleKind | null = null
  const list = useGame.getState().obstacles
  for (const o of list) {
    const d = sim.zG - o.z // distance to it (positive = still ahead)
    if (d > -2 && d < 11) near = o.kind
    const triggerAt = o.kind === 'aunties' || o.kind === 'baraat' ? 2.5 : 1.2
    if (!o.triggered && d <= triggerAt && phase !== 'FINAL_CHASE') {
      o.triggered = true
      o.tt = 0
      onTrigger(o.kind)
    }
    if (o.triggered) {
      o.tt += dt
      applyEffect(o, m)
    }
  }
  sim.widen = approach(sim.widen, near ? 1 : 0, 3, dt)
  sim.activeObstacle = near
  // tidy away beats far behind, and clear the street for the final chase
  const keep = list.filter((o) => sim.zG - o.z > -25 && phase !== 'FINAL_CHASE')
  if (keep.length !== list.length) ui.set({ obstacles: keep })
}

function onTrigger(kind: ObstacleKind) {
  const ui = useGame.getState()
  ui.showToast(gameConfig.dialogue.obstacles[kind].toast)
  buzz(18)
  switch (kind) {
    case 'aunties':
      audio.crowd()
      break
    case 'chai':
      audio.chai()
      break
    case 'baraat':
      audio.dhol()
      break
    case 'shoe':
      audio.boing()
      break
    case 'selfie':
      audio.click()
      break
    case 'bags':
      audio.swoosh()
      break
    case 'bill':
      audio.cash()
      break
  }
}

function applyEffect(o: ObstacleInstance, m: typeof sim.mods) {
  const t = o.tt
  switch (o.kind) {
    case 'aunties': // weave through them
      if (t < 1.4) {
        m.speedMul = Math.min(m.speedMul, 0.72)
        m.x = Math.sin((t / 1.4) * Math.PI * 2) * 1.0
      }
      break
    case 'chai': // reaches for the chai… NOT NOW.
      if (t < 1.0) {
        m.speedMul = Math.min(m.speedMul, t < 0.6 ? 0.25 : 0.8)
        m.reach = t < 0.7 ? 1 : 0
      }
      break
    case 'baraat': // squeezes through the dancers
      if (t < 1.5) {
        m.speedMul = Math.min(m.speedMul, 0.62)
        m.x = Math.sin(t * 9) * 0.35
      }
      break
    case 'shoe': // mojari flies off: stop, grab it, go
      if (t < 0.05) m.pause = 0.55
      if (t < 1.0) {
        m.crouch = t > 0.15 && t < 0.6 ? 1 : 0
        m.stumble = t < 0.2 ? 1 : 0
      }
      break
    case 'selfie': // duck!
      if (t < 0.8) {
        m.crouch = Math.sin((t / 0.8) * Math.PI)
        m.speedMul = Math.min(m.speedMul, 0.9)
      }
      break
    case 'bags': // hop over the shopping
      if (t < 0.7) m.jump = Math.sin((t / 0.7) * Math.PI)
      break
    case 'bill': // the bill arrives. Run faster.
      if (t < 1.6) m.boost = 4.5 * (1 - t / 1.6)
      break
  }
}

// ── the catch ──────────────────────────────────────────────
function caught(dt: number) {
  const ui = useGame.getState()
  const t = sim.phaseTime
  const T_ = gameConfig.dialogue
  // groom slows to a stop just behind her
  const stopZ = sim.zB + 1.15
  sim.zG = approach(sim.zG, stopZ, 4, dt)
  groom.z = sim.zG
  groom.x = approach(groom.x, 0, 6, dt)
  groom.y = 0
  groom.run = approach(groom.run, 0, 5, dt)
  groom.crouch = approach(groom.crouch, 0, 8, dt)
  groom.reach = 0
  groom.rapid = 0
  groom.speed = 2
  // she stops and turns around
  bride.run = approach(bride.run, 0, 6, dt)
  bride.lookBack = approach(bride.lookBack, 0, 6, dt)
  sim.turn = approach(sim.turn, 1, 3.5, dt)
  bride.yaw = Math.PI + sim.turn * Math.PI
  bride.z = sim.zB

  // timed to the recorded lines: her line, then his, then she says yes
  const V = gameConfig.audio.voices
  const brideFrom = 0.8
  const brideTo = brideFrom + V.bride.speechEnd + 0.45
  const groomFrom = brideTo + 0.15
  const groomTo = groomFrom + V.groom.speechEnd + 0.35
  if (t > brideFrom && t < brideTo) {
    bride.clip = 'HandsOnHips'
    if (ui.line?.text !== T_.brideCaught) {
      ui.set({ line: { who: 'bride', text: T_.brideCaught } })
      audio.voice('bride')
    }
  } else if (t >= groomFrom && t < groomTo) {
    groom.clip = 'Present'
    bride.clip = 'Idle'
    if (ui.line?.text !== T_.groomCaught) {
      ui.set({ line: { who: 'groom', text: T_.groomCaught } })
      audio.voice('groom')
    }
  } else if (t >= groomTo) {
    groom.clip = 'Idle'
    bride.clip = 'Wave' // she smiles: yes
    if (ui.line) ui.set({ line: null })
  } else {
    groom.clip = 'Idle'
    bride.clip = 'Idle'
  }
  if (t > groomTo + 1.1) {
    sim.revealZ = Math.min(sim.zG, sim.zB) - 7
    ui.setPhase('DATE_REVEAL')
    sim.phaseTime = 0
    audio.startReveal()
    audio.sparkle()
  }
}

// ── the reveal: they walk together to the arch ─────────────
function reveal(dt: number) {
  const ui = useGame.getState()
  const t = sim.phaseTime
  const targetZ = sim.revealZ + 0.6
  const walking = groom.z > targetZ + 0.05
  const step = walking ? 1.3 * dt : 0
  groom.z = Math.max(targetZ, groom.z - step)
  bride.z = Math.max(targetZ, bride.z - step * 1.05)
  // side by side, walking towards the camera beyond the arch: bride on screen-left, groom on screen-right
  // (the camera looks back along +z there, so screen-left is +x)
  groom.x = approach(groom.x, -0.5, 2, dt)
  bride.x = approach(bride.x, 0.5, 2, dt)
  groom.yaw = Math.PI
  sim.turn = approach(sim.turn, 0, 3, dt)
  bride.yaw = Math.PI + sim.turn * Math.PI
  groom.run = 0
  bride.run = 0
  groom.clip = walking ? 'Walk' : t > 6 ? 'Idle' : 'Wave'
  bride.clip = walking ? 'Walk' : t > 6 ? 'Idle' : 'Wave'
  if (ui.phase === 'DATE_REVEAL' && t > 4.2) ui.setPhase('COMPLETE')
}

export const groomPose = groom
export const bridePose = bride
