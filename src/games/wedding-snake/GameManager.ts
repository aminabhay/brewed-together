import { weddingConfig, type BonusId, type RequiredId, type WrongId } from './config'
import { sim, useSnake, resetSim, type Entity, type Phase } from './GameState'
import { audio, buzz } from './AudioManager'

const C = weddingConfig
const D = C.difficulty
const A = C.arena
/** the mandap at the top of the courtyard, where the partner waits (solid) */
export const MANDAP = { x: 0, z: -A.halfZ + 2.0, r: 1.9 }
export const TRAIL_SPACING = 1.05

let nextId = 1
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const shuffle = <T,>(a: T[]) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
const angleTo = (cur: number, target: number) => Math.atan2(Math.sin(target - cur), Math.cos(target - cur))

/** A free spot in the courtyard, away from the player, the mandap and everything else. */
function freeSpot(minFromPlayer = 3.2) {
  for (let i = 0; i < 80; i++) {
    const x = rand(-A.halfX + 1, A.halfX - 1)
    const z = rand(-A.halfZ + 1, A.halfZ - 1)
    if (Math.hypot(x - MANDAP.x, z - MANDAP.z) < MANDAP.r + 1.6) continue
    if (Math.hypot(x - sim.x, z - sim.z) < minFromPlayer) continue
    if (sim.entities.some((e) => !e.taken && Math.hypot(e.x - x, e.z - z) < 2.2)) continue
    return { x, z }
  }
  return { x: rand(-A.halfX + 1, A.halfX - 1), z: rand(-2, 6) }
}

function spawn(kind: Entity['kind'], key: Entity['key'], minFromPlayer?: number) {
  const p = freeSpot(minFromPlayer)
  const e: Entity = { id: nextId++, kind, key, x: p.x, z: p.z, taken: false, revealed: kind !== 'wrong' }
  sim.entities.push(e)
  useSnake.getState().set({ entities: [...sim.entities] })
  return e
}

/** Fresh, randomised run: new item set, new positions, new wrong items. */
export function newRun(keepIntro = false) {
  resetSim()
  mapsSpawned = secondChai = false
  const picks = shuffle(C.required.pool).slice(0, C.required.count - 1)
  const checklist = [...picks, C.required.final].map((r) => ({ id: r.id, label: r.label, emoji: r.emoji, done: false }))
  useSnake.getState().set({ checklist, hearts: D.hearts, entities: [], trail: [], popup: null, toast: null, focus: false, finalStep: 0, stats: null })
  for (const r of picks) spawn('required', r.id)
  for (const w of shuffle(C.wrong.pool).slice(0, C.wrong.count)) spawn('wrong', w.id)
  spawn('bonus', 'chai')
  if (!keepIntro) useSnake.getState().set({ runId: useSnake.getState().runId + 1 })
}

/** Steering input: one of four directions (radians of world yaw). */
export function steer(yaw: number) {
  const s = useSnake.getState()
  if (s.phase !== 'PLAYING') return
  if (Math.abs(angleTo(sim.targetHeading, yaw)) > 0.1) audio.turn()
  sim.targetHeading = yaw
}
export const DIR = { up: Math.PI, down: 0, left: -Math.PI / 2, right: Math.PI / 2 }

/** The item the arrow / mummy's hint should point at. */
export function hintTarget(): Entity | undefined {
  const open = sim.entities.filter((e) => e.kind === 'required' && !e.taken)
  const rings = open.find((e) => e.key === C.required.final.id)
  if (rings) return rings
  return open.sort((a, b) => Math.hypot(a.x - sim.x, a.z - sim.z) - Math.hypot(b.x - sim.x, b.z - sim.z))[0]
}

let mapsSpawned = false
let secondChai = false

export function update(dt: number) {
  const ui = useSnake.getState()
  sim.phaseTime += dt
  const phase = ui.phase as Phase
  if (phase === 'READY') {
    sim.moving = false
    if (sim.phaseTime > 1.3) ui.setPhase('PLAYING')
  } else if (phase === 'PLAYING') play(dt)
  else if (phase === 'MISTAKE') {
    sim.moving = false
    if (sim.gameOver) {
      if (sim.phaseTime > 2.4) {
        newRun(true)
        ui.setPhase('READY')
      }
    } else if (sim.phaseTime > D.mistakeFreeze) ui.setPhase('PLAYING')
  } else if (phase === 'COMPLETED') finale(dt)
  else sim.moving = false
}

function play(dt: number) {
  const ui = useSnake.getState()
  sim.t += dt

  // ── steering: ease the heading round towards the chosen direction
  sim.heading += angleTo(sim.heading, sim.targetHeading) * Math.min(1, dt * D.turnRate)
  let v = D.speed
  if (sim.t < sim.slowUntil) v *= sim.slowFactor
  if (sim.t < sim.boostUntil) v *= D.chaiBoost
  sim.speed = v
  sim.moving = true
  let nx = sim.x + Math.sin(sim.heading) * v * dt
  let nz = sim.z + Math.cos(sim.heading) * v * dt

  // ── collisions: walls and the mandap gently turn you, they never stop the game
  const m = 0.45
  if (Math.abs(nx) > A.halfX - m) {
    nx = Math.sign(nx) * (A.halfX - m)
    if (Math.abs(angleTo(sim.targetHeading, nx > 0 ? DIR.right : DIR.left)) < 0.8) sim.targetHeading = nz > 0 ? DIR.up : DIR.down
  }
  if (Math.abs(nz) > A.halfZ - m) {
    nz = Math.sign(nz) * (A.halfZ - m)
    if (Math.abs(angleTo(sim.targetHeading, nz > 0 ? DIR.down : DIR.up)) < 0.8) sim.targetHeading = nx > 0 ? DIR.left : DIR.right
  }
  const dmx = nx - MANDAP.x
  const dmz = nz - MANDAP.z
  const dm = Math.hypot(dmx, dmz)
  if (dm < MANDAP.r) {
    nx = MANDAP.x + (dmx / dm) * MANDAP.r
    nz = MANDAP.z + (dmz / dm) * MANDAP.r
    // slide round it: pick the four-way direction closest to the tangent you were heading along
    const tangent = Math.atan2(-dmz, dmx) // perpendicular to the normal
    const options = [DIR.up, DIR.down, DIR.left, DIR.right]
    const want = Math.abs(angleTo(sim.heading, tangent)) < Math.PI / 2 ? tangent : tangent + Math.PI
    sim.targetHeading = options.sort((a, b) => Math.abs(angleTo(want, a)) - Math.abs(angleTo(want, b)))[0]
  }
  const moved = Math.hypot(nx - sim.x, nz - sim.z)
  sim.x = nx
  sim.z = nz

  // ── breadcrumbs for the procession
  recordPath(moved)

  // ── pickups
  for (const e of sim.entities) {
    if (e.taken) continue
    const d = Math.hypot(e.x - sim.x, e.z - sim.z)
    if (e.kind === 'wrong' && d < D.revealDistance) e.revealed = true
    if (d > D.pickupRadius) continue
    e.taken = true
    if (e.kind === 'required') collect(e)
    else if (e.kind === 'wrong') mistake(e.key as WrongId)
    else bonus(e.key as BonusId)
    ui.set({ entities: [...sim.entities] })
    if (ui.phase !== 'PLAYING') return
  }

  // ── bonus schedule
  if (!mapsSpawned && sim.t > 8) {
    mapsSpawned = true
    spawn('bonus', 'maps')
  }
  if (!secondChai && sim.t > 18) {
    secondChai = true
    spawn('bonus', 'chai')
  }
}

function recordPath(moved: number) {
  const p = sim.path
  // p[0] is the live head; p[1…] are crumbs dropped every 0.12 units
  if (!p.length) p.push({ x: sim.x, z: sim.z, d: 0 })
  if (moved > 0) {
    p[0].x = sim.x
    p[0].z = sim.z
    if (p.length < 2 || Math.hypot(p[1].x - sim.x, p[1].z - sim.z) > 0.12) p.splice(1, 0, { x: sim.x, z: sim.z, d: 0 })
  }
  // distances from the player along the path; trim what the trail no longer needs
  const need = (useSnake.getState().trail.length + 2) * TRAIL_SPACING + 2
  let d = 0
  for (let i = 0; i < p.length; i++) {
    if (i > 0) d += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z)
    p[i].d = d
    if (d > need) {
      p.length = i + 1
      break
    }
  }
}

/** Point on the path `dist` behind the player (for trail links). */
export function pointBehind(dist: number, out: { x: number; z: number; yaw: number }) {
  const p = sim.path
  if (p.length < 2) {
    out.x = sim.x - Math.sin(sim.heading) * dist
    out.z = sim.z - Math.cos(sim.heading) * dist
    out.yaw = sim.heading
    return out
  }
  for (let i = 1; i < p.length; i++) {
    if (p[i].d >= dist) {
      const a = p[i - 1]
      const b = p[i]
      const k = (dist - a.d) / Math.max(0.0001, b.d - a.d)
      out.x = a.x + (b.x - a.x) * k
      out.z = a.z + (b.z - a.z) * k
      out.yaw = Math.atan2(a.x - b.x, a.z - b.z)
      return out
    }
  }
  const last = p[p.length - 1]
  out.x = last.x
  out.z = last.z
  return out
}

function collect(e: Entity) {
  const ui = useSnake.getState()
  const item = ui.checklist.find((c) => c.id === e.key)!
  const checklist = ui.checklist.map((c) => (c.id === e.key ? { ...c, done: true } : c))
  const trail = [...ui.trail, { key: e.key as RequiredId, emoji: item.emoji }]
  const got = checklist.filter((c) => c.done).length
  // a couple of relatives join the procession along the way
  if (got === 3) trail.push({ key: 'aunty', emoji: '👵' })
  if (got === 5) trail.push({ key: 'uncle', emoji: '👴' })
  ui.set({ checklist, trail })
  sim.longest = Math.max(sim.longest, trail.length)
  sim.burst = { x: e.x, z: e.z, at: performance.now() / 1000, colour: '#F4C542' }
  ui.showToast(`${item.emoji} ${item.label.toUpperCase()} ✓`)
  audio.collect(got)
  buzz(12)

  if (e.key === C.required.final.id) {
    // the rings: we have everything
    ui.set({ stats: { wrong: sim.wrong, seconds: sim.t, longest: sim.longest, collected: got } })
    ui.setPhase('COMPLETED')
    audio.fanfare()
    buzz(40)
    return
  }
  const left = checklist.filter((c) => !c.done && c.id !== C.required.final.id)
  if (!left.length && !sim.ringsOut) {
    sim.ringsOut = true
    spawn('required', C.required.final.id, 6)
    spawn('bonus', 'momcall', 3)
    setTimeout(() => useSnake.getState().showPopup({ title: C.dialogue.ringsAppear, emoji: '💍', tone: 'good' }, 1500), 500)
  }
}

function mistake(key: WrongId) {
  const ui = useSnake.getState()
  const w = C.wrong.pool.find((x) => x.id === key)!
  sim.wrong++
  const hearts = ui.hearts - 1
  ui.set({ hearts })
  audio.wrong()
  buzz(60)
  sim.moving = false
  if (hearts <= 0) {
    sim.gameOver = true
    audio.gameOver()
    ui.showPopup({ title: C.dialogue.gameOverTitle, line: C.dialogue.gameOverLine, emoji: '👵👵👵', tone: 'gameover' }, 2300)
    ui.setPhase('MISTAKE')
    return
  }
  ui.showPopup({ title: w.title, line: w.line, emoji: w.effect === 'cry' ? '💸😭' : w.emoji, tone: 'wrong' }, D.mistakeFreeze * 1000 + 600)
  if (w.effect === 'slow') {
    sim.slowUntil = sim.t + D.effectSeconds
    sim.slowFactor = D.slowFactor
  } else if (w.effect === 'veryslow') {
    sim.slowUntil = sim.t + D.effectSeconds
    sim.slowFactor = D.verySlowFactor
  } else if (w.effect === 'focus') {
    ui.set({ focus: true })
    setTimeout(() => useSnake.getState().set({ focus: false }), 1200)
  }
  audio.heart()
  ui.setPhase('MISTAKE')
}

function bonus(key: BonusId) {
  const ui = useSnake.getState()
  const b = C.bonuses.find((x) => x.id === key)!
  audio.bonus()
  buzz(15)
  sim.burst = { x: sim.x, z: sim.z, at: performance.now() / 1000, colour: '#8FD3FF' }
  if (key === 'chai') sim.boostUntil = sim.t + D.chaiSeconds
  if (key === 'momcall') sim.hintUntil = sim.t + D.hintSeconds
  if (key === 'maps') sim.mapsUntil = sim.t + D.mapsSeconds
  ui.showPopup({ title: b.title, line: b.line || undefined, emoji: b.emoji, tone: 'bonus' }, 1500)
}

// ── the finale ────────────────────────────────────────────
function finale(dt: number) {
  const ui = useSnake.getState()
  const t = sim.phaseTime
  const step = t > 2.7 ? 3 : t > 1.5 ? 2 : t > 0.4 ? 1 : 0
  if (step !== ui.finalStep) ui.set({ finalStep: step })
  // walk up to the couple at the mandap (round the side, never through the pillars), then face the camera
  if (t > 3.0) {
    const spot = { x: MANDAP.x + 1.3, z: MANDAP.z + 2.5 }
    const frontZ = MANDAP.z + MANDAP.r + 0.8
    if (!sim.route.length && !sim.arrived) {
      if (sim.z < frontZ) {
        const sx = MANDAP.x + (sim.x >= MANDAP.x ? 1 : -1) * (MANDAP.r + 1.0)
        sim.route.push({ x: sx, z: sim.z }, { x: sx, z: frontZ })
      }
      sim.route.push({ x: spot.x, z: frontZ }, spot)
    }
    const goal = sim.route[0]
    if (goal) {
      const dx = goal.x - sim.x
      const dz = goal.z - sim.z
      const d = Math.hypot(dx, dz)
      let left = d
      for (let i = 1; i < sim.route.length; i++) left += Math.hypot(sim.route[i].x - sim.route[i - 1].x, sim.route[i].z - sim.route[i - 1].z)
      // quick enough to arrive by ~6.3 s however far away the rings were
      const v = Math.min(7, Math.max(2.2, left / Math.max(0.6, 6.3 - t)))
      const step = Math.min(d, v * dt)
      if (d > 1e-4) {
        sim.x += (dx / d) * step
        sim.z += (dz / d) * step
        sim.heading = sim.targetHeading = Math.atan2(dx, dz)
      }
      sim.moving = true
      sim.speed = v
      if (d - step < 0.02) {
        sim.route.shift()
        if (!sim.route.length) sim.arrived = true
      }
    } else {
      sim.moving = false
      sim.heading = -0.35 // face the camera, turned a little towards the couple
    }
  } else sim.moving = false
  if (t > 7.6 && sim.arrived) ui.setPhase('REVEAL')
}

