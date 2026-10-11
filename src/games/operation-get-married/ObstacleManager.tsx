import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { gameConfig } from './config'
import { sim, useGame, type ObstacleInstance } from './GameState'
import { groom } from './CharacterController'
import { SpeechBubble } from './SpeechBubble'
import { Character } from '../../three/components/Character'
import { Blob } from '../../three/components/Props'
import { mat } from '../../three/components/materials'
import { canvasTexture, memoTex, SANS, SERIF } from '../../three/components/textures'

/** Renders the comedy beats the controller has placed on the street. */
export function ObstacleManager() {
  const obstacles = useGame((s) => s.obstacles)
  return (
    <>
      {obstacles.map((o) => (
        <Beat key={o.id} o={o} />
      ))}
    </>
  )
}

const D = gameConfig.dialogue.obstacles

function Beat({ o }: { o: ObstacleInstance }) {
  switch (o.kind) {
    case 'aunties':
      return <Aunties o={o} />
    case 'chai':
      return <Chai o={o} />
    case 'baraat':
      return <Baraat o={o} />
    case 'shoe':
      return <Shoe o={o} />
    case 'selfie':
      return <Selfie o={o} />
    case 'bags':
      return <Bags o={o} />
    case 'bill':
      return <Bill o={o} />
  }
}

/** Show a speech bubble only while the groom is approaching / passing. */
function useBubble(o: ObstacleInstance, from = 14, until = -2) {
  const [show, setShow] = useState(false)
  useFrame(() => {
    const d = sim.zG - o.z
    const s = d < from && d > until
    if (s !== show) setShow(s)
  })
  return show
}

// ── 1 · Aunties ──────────────────────────────────────────
function Aunties({ o }: { o: ObstacleInstance }) {
  const g = useRef<THREE.Group>(null!)
  const turner = useRef<THREE.Group>(null!)
  const show = useBubble(o)
  const saris = ['#C2185B', '#2F6F5E', '#E8A33D', '#7A1F2E']
  const xs = [-2.0, -0.7, 0.6, 1.9]
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // they drift across the road, chatting
    g.current.position.x = Math.sin(t * 0.6) * 0.3
    // one aunty turns to face him as he arrives
    const d = sim.zG - o.z
    turner.current.rotation.y = THREE.MathUtils.lerp(0.9, 0, THREE.MathUtils.clamp((d - 1) / 6, 0, 1))
  })
  return (
    <group position={[0, 0, o.z]}>
      <group ref={g}>
        {xs.map((x, i) =>
          i === 2 ? (
            <group key={i} ref={turner} position={[x, 0, (i % 2) * 0.5]}>
              <Character shirt={saris[i]} pants={saris[i]} hair="bun" dress pose="stand" idle="laugh" scale={0.95} />
              <Blob size={0.8} opacity={0.35} />
            </group>
          ) : (
            <group key={i} position={[x, 0, (i % 2) * 0.5]} rotation={[0, i % 2 ? -0.8 : 0.8, 0]}>
              <Character shirt={saris[i]} pants={saris[i]} hair="bun" dress pose={i === 0 ? 'wave' : 'stand'} idle="laugh" scale={0.95} />
              <Blob size={0.8} opacity={0.35} />
            </group>
          ),
        )}
      </group>
      {show && <SpeechBubble text={D.aunties.bubble} position={[0.6, 2.3, 0.5]} />}
    </group>
  )
}

// ── 2 · Chai stall ───────────────────────────────────────
function Chai({ o }: { o: ObstacleInstance }) {
  const show = useBubble(o)
  const steam = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    steam.current.position.y = 1.35 + ((clock.elapsedTime * 0.5) % 0.4)
    ;(steam.current.material as THREE.MeshBasicMaterial).opacity = 0.5 - ((clock.elapsedTime * 0.5) % 0.4)
  })
  return (
    <group position={[2.4, 0, o.z]}>
      <RoundedBox args={[1.6, 1.0, 1.1]} radius={0.05} position={[0.4, 0.5, 0]} material={mat('#8B5E3C', { rough: 0.7 })} />
      {[-0.35, 1.15].map((x) => (
        <mesh key={x} position={[x, 1.6, 0]} material={mat('#3B2418')}>
          <cylinderGeometry args={[0.04, 0.04, 2.2, 6]} />
        </mesh>
      ))}
      <mesh position={[0.4, 2.7, 0]} rotation={[0, 0, 0.12]} material={mat('#B5403A', { rough: 0.8 })}>
        <boxGeometry args={[2.0, 0.08, 1.4]} />
      </mesh>
      <mesh position={[0.6, 1.15, -0.2]} material={mat('#B8B8B8', { metal: 0.8, rough: 0.3 })}>
        <cylinderGeometry args={[0.16, 0.2, 0.32, 14]} />
      </mesh>
      {/* the vendor, holding out a glass */}
      <group position={[0.9, 0, 0.1]} rotation={[0, -1.3, 0]}>
        <Character shirt="#FFF6EA" pants="#6F4E37" hair="short" pose="phone" idle="breathe" />
      </group>
      <mesh position={[0.25, 1.08, 0.15]} material={mat('#C98B4E', { rough: 0.3 })}>
        <cylinderGeometry args={[0.06, 0.05, 0.14, 10]} />
      </mesh>
      <mesh ref={steam} position={[0.25, 1.35, 0.15]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <Blob position={[0.4, 0.01, 0]} size={[2.4, 1.8]} opacity={0.4} />
      {show && <SpeechBubble text={D.chai.bubble} position={[0.6, 2.2, 0.3]} side="right" />}
    </group>
  )
}

// ── 3 · Baraat crossing ─────────────────────────────────
function Baraat({ o }: { o: ObstacleInstance }) {
  const g = useRef<THREE.Group>(null!)
  const dancers = useRef<THREE.Group[]>([])
  const show = useBubble(o, 12, -3)
  useFrame(({ clock }) => {
    const d = sim.zG - o.z
    // the procession crosses the road just as the groom arrives
    g.current.position.x = THREE.MathUtils.clamp(d * 0.45, -7, 7)
    const t = clock.elapsedTime
    dancers.current.forEach((m, i) => {
      if (!m) return
      m.position.y = Math.abs(Math.sin(t * 7 + i)) * 0.18
      m.rotation.y = Math.sin(t * 3 + i) * 0.6 + (i % 2 ? 0.4 : -0.4)
    })
  })
  const members: { x: number; z: number; shirt: string; dhol?: boolean }[] = [
    { x: -1.6, z: 0.3, shirt: '#E8A33D', dhol: true },
    { x: 1.6, z: -0.3, shirt: '#E8A33D', dhol: true },
    { x: -0.6, z: -0.5, shirt: '#7A1F2E' },
    { x: 0.5, z: 0.6, shirt: '#2F6F5E' },
    { x: 0, z: -1.2, shirt: '#D98A94' },
  ]
  return (
    <group position={[0, 0, o.z]}>
      <group ref={g}>
        {members.map((m, i) => (
          <group key={i} position={[m.x, 0, m.z]}>
            <group ref={(el) => el && (dancers.current[i] = el)}>
              <Character shirt={m.shirt} pants="#FFF6EA" hair="short" pose={m.dhol ? 'stand' : 'wave'} idle="laugh" />
              {m.dhol && (
                <mesh position={[0, 0.95, 0.32]} rotation={[0, 0, Math.PI / 2]} material={mat('#B5403A', { rough: 0.6 })}>
                  <cylinderGeometry args={[0.22, 0.22, 0.55, 14]} />
                </mesh>
              )}
            </group>
            <Blob size={0.8} opacity={0.35} />
          </group>
        ))}
        {/* a little canopy of marigolds overhead */}
        <mesh position={[0, 2.4, 0]} material={mat('#F2A03D', { rough: 0.9 })}>
          <boxGeometry args={[3.6, 0.08, 1.6]} />
        </mesh>
        {show && <SpeechBubble text={D.baraat.bubble} position={[-1.6, 2.3, 0.3]} />}
      </group>
    </group>
  )
}

// ── 4 · The mojari flies off ────────────────────────────
function Shoe({ o }: { o: ObstacleInstance }) {
  const m = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    const t = o.tt
    m.current.visible = o.triggered && t < 0.6
    if (!o.triggered) return
    // pops off, tumbles, lands just ahead; he grabs it and it's back on
    const k = Math.min(1, t / 0.35)
    m.current.position.set(groom.x + 0.25, 0.1 + Math.sin(k * Math.PI) * 0.9, groom.z - 0.4 - k * 0.5)
    m.current.rotation.set(t * 14, t * 6, 0)
  })
  return (
    <mesh ref={m} visible={false} material={mat('#7A1F2E', { rough: 0.5 })} scale={[0.12, 0.08, 0.3]}>
      <sphereGeometry args={[1, 10, 8]} />
    </mesh>
  )
}

// ── 5 · Selfie relative ─────────────────────────────────
function Selfie({ o }: { o: ObstacleInstance }) {
  const show = useBubble(o, 12, -1)
  const flash = useRef<THREE.MeshBasicMaterial>(null!)
  useFrame(() => {
    const t = o.tt
    flash.current.opacity = o.triggered && t > 0.05 && t < 0.3 ? 1 - (t - 0.05) / 0.25 : 0
  })
  return (
    <group position={[1.1, 0, o.z]} rotation={[0, -0.4, 0]}>
      <Character shirt="#3E5C8A" pants="#2B2A33" hair="short" glasses pose="phone" idle="laugh" />
      <Blob size={0.8} opacity={0.35} />
      <mesh position={[0, 1.15, 0.45]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial ref={flash} color={new THREE.Color(4, 4, 4)} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      {show && <SpeechBubble text={D.selfie.bubble} position={[0, 2.2, 0]} side="right" />}
    </group>
  )
}

// ── 6 · Shopping bags in the path ────────────────────────
function Bags({ o }: { o: ObstacleInstance }) {
  const bags = [
    { x: -0.5, c: '#D98A94', h: 0.5 },
    { x: 0.05, c: '#E8A33D', h: 0.42 },
    { x: 0.6, c: '#2F6F5E', h: 0.55 },
  ]
  return (
    <group position={[0, 0, o.z]}>
      {bags.map((b, i) => (
        <group key={i} position={[b.x, 0, i % 2 ? 0.2 : -0.1]} rotation={[0, i * 0.4 - 0.4, 0]}>
          <mesh position={[0, b.h / 2, 0]} material={mat(b.c, { rough: 0.8 })}>
            <boxGeometry args={[0.42, b.h, 0.18]} />
          </mesh>
          <mesh position={[0, b.h + 0.08, 0]} material={mat('#3B2418', { rough: 0.6 })}>
            <torusGeometry args={[0.1, 0.015, 6, 14, Math.PI]} />
          </mesh>
        </group>
      ))}
      <Blob size={[1.8, 0.8]} opacity={0.35} />
    </group>
  )
}

// ── 7 · The giant wedding bill ──────────────────────────
function Bill({ o }: { o: ObstacleInstance }) {
  const show = useBubble(o, 13, -1)
  const scroll = useRef<THREE.Mesh>(null!)
  const tex = useMemo(
    () =>
      memoTex('ogm-bill', () =>
        canvasTexture(512, 900, (ctx, w, h) => {
          ctx.fillStyle = '#FFF6EA'
          ctx.fillRect(0, 0, w, h)
          ctx.fillStyle = '#7A1F2E'
          ctx.textAlign = 'center'
          ctx.font = `800 90px ${SERIF}`
          const [title, amount] = gameConfig.dialogue.billText.split('\n')
          ctx.fillText(title, w / 2, 120)
          ctx.font = `500 32px ${SANS}`
          ctx.fillStyle = '#3B2418'
          ctx.textAlign = 'left'
          ;['Catering … ₹ ₹ ₹', 'Decor … ₹ ₹', 'Band baaja … ₹ ₹', 'Ghodi … ₹', 'Mehendi … ₹ ₹', 'Misc … ₹ ₹ ₹ ₹'].forEach((l, i) => ctx.fillText(l, 50, 230 + i * 70))
          ctx.strokeStyle = '#3B2418'
          ctx.lineWidth = 3
          ctx.beginPath(); ctx.moveTo(40, 680); ctx.lineTo(w - 40, 680); ctx.stroke()
          ctx.textAlign = 'center'
          ctx.fillStyle = '#B5403A'
          ctx.font = `800 64px ${SANS}`
          ctx.fillText(amount, w / 2, 780)
        }),
      ),
    [],
  )
  useFrame(() => {
    // the bill unrolls as he gets close
    const d = sim.zG - o.z
    const k = THREE.MathUtils.clamp(1 - (d - 2) / 8, 0.25, 1)
    scroll.current.scale.y = k
    scroll.current.position.y = 2.3 - k * 1.0
  })
  return (
    <group position={[-1.5, 0, o.z]} rotation={[0, 0.45, 0]}>
      <Character shirt="#6F4E37" pants="#2B2A33" hair="short" glasses pose="point" idle="breathe" />
      <Blob size={0.8} opacity={0.35} />
      <mesh ref={scroll} position={[0.6, 1.3, 0.35]}>
        <planeGeometry args={[1.1, 2.0]} />
        <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      {show && <SpeechBubble text={D.bill.bubble} position={[0.3, 2.6, 0]} />}
    </group>
  )
}
