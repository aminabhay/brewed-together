import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { weddingConfig } from './config'
import { useSnake, sim, type TrailLink } from './GameState'
import { MANDAP, TRAIL_SPACING, hintTarget, pointBehind } from './GameManager'
import { ItemModel } from './Items'
import { Rig } from '../shared/Rig'
import type { Pose } from '../shared/pose'
import { Character } from '../../three/components/Character'
import { Blob } from '../../three/components/Props'

const A = weddingConfig.arena
const HEIGHT = { groom: 1.8, bride: 1.6 }
const newPose = (): Pose => ({ x: 0, y: 0, z: 0, yaw: Math.PI, clip: 'Idle', run: 0, speed: 0, rapid: 0, lookBack: 0, crouch: 0, reach: 0, stumble: 0, visible: true })
const onMandap = (x: number, z: number) => (Math.hypot(x - MANDAP.x, z - MANDAP.z) < 1.55 ? 0.24 : 0)
/** where everyone stands for the finale: the couple in the mandap, you just in front to one side */
export const SPOT = {
  bride: { x: MANDAP.x - 0.55, z: MANDAP.z + 0.6 },
  groom: { x: MANDAP.x + 0.55, z: MANDAP.z + 0.6 },
  guest: { x: MANDAP.x + 1.3, z: MANDAP.z + 2.5 },
}

const placeholders = {
  groom: { shirt: '#F3E6D2', pants: '#F3E6D2', hair: 'long' as const, beard: true },
  bride: { shirt: '#D98A94', pants: '#2B2A33', hair: 'bun' as const, dress: true, glasses: true },
}

/** You, the guest: a festive stand-in figure that follows the simulation. */
export function Player() {
  const g = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const tag = useRef<HTMLDivElement>(null!)
  const anim = useRef({ walk: 0 })
  const yaw = useRef(Math.PI)
  const G = weddingConfig.guest
  useFrame(({ clock }, dt) => {
    const phase = useSnake.getState().phase
    const t = clock.elapsedTime
    g.current.position.set(sim.x, 0, sim.z)
    let dy = sim.heading - yaw.current
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    yaw.current += dy * Math.min(1, dt * 12)
    body.current.rotation.y = yaw.current
    anim.current.walk += ((sim.moving ? 1 : 0) - anim.current.walk) * Math.min(1, dt * 10)
    // a little hop while running, a wobble when you grab the wrong thing
    const hurt = phase === 'MISTAKE' && !sim.gameOver
    body.current.position.y = sim.moving ? Math.abs(Math.sin(t * 11)) * 0.06 : 0
    body.current.rotation.z = hurt ? Math.sin(t * 22) * 0.18 : 0
    // the gold "this is you" ring, and a YOU tag at the start
    const done = phase === 'COMPLETED' || phase === 'REVEAL'
    ring.current.visible = !done
    ring.current.scale.setScalar(1 + Math.sin(t * 4) * 0.06)
    tag.current.style.opacity = phase === 'READY' || (phase === 'PLAYING' && sim.t < 2.5) ? '1' : '0'
  })
  return (
    <group ref={g}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.03}>
        <ringGeometry args={[0.5, 0.62, 40]} />
        <meshBasicMaterial color="#F4C542" transparent opacity={0.85} depthWrite={false} toneMapped={false} />
      </mesh>
      <Blob size={1} opacity={0.4} />
      <group ref={body}>
        <Character shirt={G.kurta} pants={G.pants} hair={G.hair} headband={G.headband} anim={anim.current} scale={1.05} />
      </group>
      <Html position={[0, 2.2, 0]} center zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={tag} className="ws-you" style={{ opacity: 0 }}>
          {G.tag}
        </div>
      </Html>
    </group>
  )
}

/** Jyoti and Abhay, waiting at the mandap. They watch you as you run about. */
function Waiting({ who, url }: { who: 'bride' | 'groom'; url: string }) {
  const pose = useMemo(() => {
    const p = newPose()
    p.x = SPOT[who].x
    p.z = SPOT[who].z
    p.y = onMandap(p.x, p.z)
    p.yaw = 0
    return p
  }, [who])
  useFrame(() => {
    const phase = useSnake.getState().phase
    pose.clip = 'Idle'
    if (phase === 'COMPLETED' || phase === 'REVEAL') {
      // watch you walk up, then face the camera
      pose.yaw = phase === 'COMPLETED' && !sim.arrived && sim.phaseTime > 3 ? Math.atan2(sim.x - pose.x, sim.z - pose.z) : 0
    } else {
      // keep an eye on you, without turning their backs on the guests
      const look = Math.atan2(sim.x - pose.x, sim.z - pose.z)
      pose.yaw = THREE.MathUtils.clamp(look, -0.7, 0.7)
    }
  })
  return <Rig url={url} height={HEIGHT[who]} pose={pose} fairSkin={who === 'bride'} placeholder={placeholders[who]} />
}

export function Couple({ urls }: { urls: { groom: string; bride: string } }) {
  return (
    <>
      <Waiting who="bride" url={urls.bride} />
      <Waiting who="groom" url={urls.groom} />
    </>
  )
}

// ── the procession ───────────────────────────────────────
const tmp = { x: 0, z: 0, yaw: 0 }

function Link({ link, index, count }: { link: TrailLink; index: number; count: number }) {
  const g = useRef<THREE.Group>(null!)
  const inner = useRef<THREE.Group>(null!)
  const anim = useRef({ walk: 1 })
  const born = useMemo(() => performance.now() / 1000, [])
  const pos = useRef<THREE.Vector3 | null>(null)
  const person = link.key === 'aunty' || link.key === 'uncle'
  // where it ends up around the mandap for the finale
  const things = useSnake.getState().trail.filter((l) => l.key !== 'aunty' && l.key !== 'uncle')
  const slot = useMemo(() => {
    if (person) return new THREE.Vector3(MANDAP.x + (link.key === 'aunty' ? -1.55 : -2.35), 0, MANDAP.z + (link.key === 'aunty' ? 2.5 : 2.0))
    // an arch of everything you found, over the couple's heads
    const i = Math.max(0, things.findIndex((l) => l.key === link.key))
    const n = Math.max(1, things.length - 1)
    const a = -1.25 + (i / n) * 2.5
    return new THREE.Vector3(MANDAP.x + Math.sin(a) * 1.45, 2.3 + Math.cos(a) * 0.5, MANDAP.z + 1.9)
  }, [count])

  useFrame(({ clock }, dt) => {
    const phase = useSnake.getState().phase
    const t = clock.elapsedTime
    const p = pos.current ?? (pos.current = new THREE.Vector3(sim.x, 0, sim.z))
    if (phase === 'COMPLETED' || phase === 'REVEAL') {
      // the procession flies up and arranges itself round the mandap
      const go = phase === 'REVEAL' || sim.phaseTime > 1.0 + index * 0.12
      if (go) p.lerp(slot, Math.min(1, dt * (person ? 1.6 : 2.6)))
      g.current.position.copy(p)
      g.current.rotation.y = person ? Math.atan2(MANDAP.x - p.x, MANDAP.z - p.z) * 0.3 : t * 0.8 + index
      if (!person) g.current.scale.setScalar(THREE.MathUtils.lerp(g.current.scale.x, 0.5, Math.min(1, dt * 3)))
      anim.current.walk = person && p.distanceTo(slot) > 0.2 ? 1 : 0
      inner.current.position.y = person ? 0 : Math.sin(t * 2 + index) * 0.06
      inner.current.rotation.z = 0
      return
    }
    pointBehind((index + 1) * TRAIL_SPACING + (person ? 0.2 : 0), tmp)
    // ease in from the pickup spot so new links slide into line
    const k = Math.min(1, (performance.now() / 1000 - born) * 4)
    p.set(p.x + (tmp.x - p.x) * Math.max(k, Math.min(1, dt * 14)), 0, p.z + (tmp.z - p.z) * Math.max(k, Math.min(1, dt * 14)))
    g.current.position.copy(p)
    g.current.rotation.y = tmp.yaw
    const pop = Math.min(1, (performance.now() / 1000 - born) * 3)
    g.current.scale.setScalar(person ? 1 : 0.85 * (1 - Math.pow(1 - pop, 3)))
    const moving = sim.moving ? 1 : 0.3
    inner.current.position.y = person ? 0 : 0.85 + Math.abs(Math.sin(t * 9 + index * 0.9)) * 0.16 * moving
    inner.current.rotation.z = person ? 0 : Math.sin(t * 6 + index) * 0.18 * moving
    anim.current.walk = sim.moving ? 1 : 0
  })

  return (
    <group ref={g}>
      <group ref={inner}>
        {person ? (
          <Character
            shirt={link.key === 'aunty' ? '#2F6F5E' : '#F3E6D2'}
            pants={link.key === 'aunty' ? '#2F6F5E' : '#8A6A4C'}
            hair={link.key === 'aunty' ? 'bun' : 'short'}
            dress={link.key === 'aunty'}
            glasses
            anim={anim.current}
            scale={0.95}
          />
        ) : (
          <ItemModel id={link.key} />
        )}
      </group>
      {!person && <Blob size={0.6} opacity={0.25} />}
    </group>
  )
}

export function Trail() {
  const trail = useSnake((s) => s.trail)
  const runId = useSnake((s) => s.runId)
  return (
    <group key={runId}>
      {trail.map((l, i) => (
        <Link key={`${l.key}-${i}`} link={l} index={i} count={trail.length} />
      ))}
    </group>
  )
}

// ── effects ──────────────────────────────────────────────
/** Sparkle burst on every pickup. */
export function Burst() {
  const N = 16
  const ref = useRef<THREE.InstancedMesh>(null!)
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const dirs = useMemo(() => Array.from({ length: N }, (_, i) => new THREE.Vector3(Math.cos(i * 2.4), 1.2 + (i % 4) * 0.4, Math.sin(i * 2.4))), [])
  const m = useMemo(() => new THREE.Matrix4(), [])
  useFrame(() => {
    const age = performance.now() / 1000 - sim.burst.at
    const on = age < 0.75
    ref.current.visible = on
    if (!on) return
    mat.current.color.set(sim.burst.colour)
    mat.current.opacity = 1 - age / 0.75
    dirs.forEach((d, i) => {
      const r = age * 3.2
      const s = 0.12 * (1 - age / 0.75) + 0.02
      m.makeScale(s, s, s).setPosition(sim.burst.x + d.x * r, 0.8 + d.y * age * 2.2 - age * age * 3, sim.burst.z + d.z * r)
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} visible={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial ref={mat} transparent toneMapped={false} />
    </instancedMesh>
  )
}

/** Google Maps bonus: an arrow round your feet pointing at the next thing. */
export function MapsArrow() {
  const g = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const target = sim.t < sim.mapsUntil && useSnake.getState().phase !== 'COMPLETED' ? hintTarget() : undefined
    g.current.visible = !!target
    if (!target) return
    g.current.position.set(sim.x, 0.06, sim.z)
    g.current.rotation.y = Math.atan2(target.x - sim.x, target.z - sim.z)
    g.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 6) * 0.06)
  })
  return (
    <group ref={g} visible={false}>
      <mesh position={[0, 0, 1.25]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.32, 0.6, 3]} />
        <meshBasicMaterial color="#4285F4" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.75]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.16, 0.6]} />
        <meshBasicMaterial color="#4285F4" toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.62, 0.7, 32]} />
        <meshBasicMaterial color="#4285F4" transparent opacity={0.6} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ── camera ───────────────────────────────────────────────
const look = new THREE.Vector3()
const want = new THREE.Vector3()
const wantLook = new THREE.Vector3()
const proj = new THREE.Vector3()
const smooth = (t: number) => t * t * (3 - 2 * t)

/** High three-quarter view that follows you; lowers to a cinematic shot of the mandap for the finale. */
export function Camera() {
  const { camera, size } = useThree()
  const first = useRef(true)
  useFrame((_, dt) => {
    const phase = useSnake.getState().phase
    const aspect = size.width / size.height
    const k = THREE.MathUtils.clamp(0.5625 / aspect, 0.85, 1.25)
    const tx = sim.x * 0.72
    const tz = THREE.MathUtils.clamp(sim.z, -A.halfZ + 4, A.halfZ - 4.5)
    want.set(tx, 11 * k, tz + 7.2 * k)
    wantLook.set(tx, 0, tz - 0.6)
    let f = 0
    if (phase === 'COMPLETED') f = smooth(THREE.MathUtils.clamp((sim.phaseTime - 2.6) / 3, 0, 1))
    if (phase === 'REVEAL') f = 1
    if (f > 0) {
      want.lerp(proj.set(MANDAP.x + 0.2, 3.9, MANDAP.z + 9.6), f)
      wantLook.lerp(proj.set(MANDAP.x, 1.05, MANDAP.z), f)
    }
    const a = first.current ? 1 : Math.min(1, dt * (f > 0 ? 2.5 : 4))
    first.current = false
    camera.position.lerp(want, a)
    look.lerp(wantLook, a)
    camera.lookAt(look)
    // where the player is on screen (0–1), for tap-to-steer
    proj.set(sim.x, 1, sim.z).project(camera)
    sim.playerScreen.x = (proj.x + 1) / 2
    sim.playerScreen.y = (1 - proj.y) / 2
  })
  return null
}
