import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { weddingConfig } from './config'
import { MANDAP } from './GameManager'
import { useSnake, sim } from './GameState'

const C = weddingConfig.colours
const A = weddingConfig.arena

/** 0 = day, 1 = festive night (finale) */
export const nightRef = { v: 0 }

// ── little canvas textures ───────────────────────────────
const texCache = new Map<string, THREE.Texture>()
function canvasTex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const hit = texCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  texCache.set(key, t)
  return t
}

export function signTex(text: string, bg: string, fg = '#FFF6EA', w = 512, h = 128) {
  return canvasTex(`sign:${text}:${bg}`, w, h, (g) => {
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(255,220,150,0.8)'
    g.lineWidth = 6
    g.strokeRect(8, 8, w - 16, h - 16)
    g.fillStyle = fg
    g.font = `700 ${Math.round(h * 0.44)}px Fraunces, Georgia, serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, w / 2, h / 2 + 2)
  })
}

const tileTex = () =>
  canvasTex(
    'tiles',
    256,
    256,
    (g) => {
      g.fillStyle = C.ground
      g.fillRect(0, 0, 256, 256)
      g.fillStyle = C.tile
      g.fillRect(0, 0, 128, 128)
      g.fillRect(128, 128, 128, 128)
      g.strokeStyle = 'rgba(120,80,40,0.18)'
      g.lineWidth = 3
      g.strokeRect(0, 0, 256, 256)
      g.beginPath()
      g.moveTo(128, 0)
      g.lineTo(128, 256)
      g.moveTo(0, 128)
      g.lineTo(256, 128)
      g.stroke()
    },
    [A.halfX / 1.6, A.halfZ / 1.6],
  )

const rangoliTex = () =>
  canvasTex('rangoli', 512, 512, (g) => {
    const cx = 256
    const ring = (r: number, col: string, petals: number, size: number) => {
      g.fillStyle = col
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2
        g.beginPath()
        g.ellipse(cx + Math.cos(a) * r, cx + Math.sin(a) * r, size, size * 0.5, a, 0, Math.PI * 2)
        g.fill()
      }
    }
    g.fillStyle = 'rgba(255,246,234,0.9)'
    g.beginPath()
    g.arc(cx, cx, 240, 0, Math.PI * 2)
    g.fill()
    ring(200, '#C2410C', 24, 34)
    ring(150, '#E8A33D', 16, 36)
    ring(98, '#D98A94', 12, 32)
    ring(52, '#2F6F5E', 8, 26)
    g.fillStyle = '#7A1F2E'
    g.beginPath()
    g.arc(cx, cx, 24, 0, Math.PI * 2)
    g.fill()
  })

// ── pieces ───────────────────────────────────────────────
function Ground() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[80, 90]} />
        <meshStandardMaterial color={C.grass} roughness={1} />
      </mesh>
      {/* stone border */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.005, 0]}>
        <planeGeometry args={[A.halfX * 2 + 1.2, A.halfZ * 2 + 1.2]} />
        <meshStandardMaterial color={C.path} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[A.halfX * 2, A.halfZ * 2]} />
        <meshStandardMaterial map={tileTex()} roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 1.5]}>
        <circleGeometry args={[2.1, 48]} />
        <meshStandardMaterial map={rangoliTex()} transparent roughness={1} />
      </mesh>
      {/* low courtyard wall with gaps */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (A.halfX + 0.45), 0.22, 0]}>
          <boxGeometry args={[0.3, 0.44, A.halfZ * 2 + 1.2]} />
          <meshStandardMaterial color={C.ivory} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.22, A.halfZ + 0.45]}>
        <boxGeometry args={[A.halfX * 2 + 1.2, 0.44, 0.3]} />
        <meshStandardMaterial color={C.ivory} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Marigold strand: an instanced row of orange beads hanging in a catenary. */
function Strand({ from, to, sag = 0.5, count = 18, colour = '#E8A33D' }: { from: [number, number, number]; to: [number, number, number]; sag?: number; count?: number; colour?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i < count; i++) {
      const k = i / (count - 1)
      m.makeTranslation(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * sag, from[2] + (to[2] - from[2]) * k)
      ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [from, to, sag, count])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.09, 8, 6]} />
      <meshStandardMaterial color={colour} roughness={0.8} />
    </instancedMesh>
  )
}

function Mandap() {
  const { x, z } = MANDAP
  const posts: [number, number][] = [
    [-1.3, -1.1],
    [1.3, -1.1],
    [-1.3, 1.1],
    [1.3, 1.1],
  ]
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.85, 1.95, 0.24, 6]} />
        <meshStandardMaterial color={C.ivory} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.5, 6]} />
        <meshStandardMaterial color={C.maroon} roughness={0.9} />
      </mesh>
      {posts.map(([px, pz], i) => (
        <group key={i} position={[px, 0, pz]}>
          <mesh position={[0, 1.45, 0]}>
            <cylinderGeometry args={[0.09, 0.11, 2.6, 10]} />
            <meshStandardMaterial color="#E2BE6A" metalness={0.1} roughness={0.5} />
          </mesh>
          <Strand from={[0, 2.6, 0]} to={[0, 0.5, 0]} sag={0} count={14} colour={i % 2 ? '#E8A33D' : '#C2410C'} />
        </group>
      ))}
      {/* canopy */}
      <mesh position={[0, 2.85, 0]}>
        <boxGeometry args={[2.9, 0.12, 2.5]} />
        <meshStandardMaterial color={C.maroon} roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <coneGeometry args={[1.95, 0.7, 4]} />
        <meshStandardMaterial color="#C2410C" roughness={0.7} />
      </mesh>
      <Strand from={[-1.4, 2.75, 1.25]} to={[1.4, 2.75, 1.25]} sag={0.35} count={16} />
      <Strand from={[-1.4, 2.75, -1.25]} to={[1.4, 2.75, -1.25]} sag={0.35} count={16} />
      {/* sacred fire */}
      <mesh position={[0, 0.36, -0.2]}>
        <boxGeometry args={[0.4, 0.22, 0.4]} />
        <meshStandardMaterial color="#8A5A3C" />
      </mesh>
      <mesh position={[0, 0.58, -0.2]}>
        <coneGeometry args={[0.13, 0.32, 8]} />
        <meshBasicMaterial color="#FFB547" />
      </mesh>
    </group>
  )
}

function Shop({ position, rotation = 0, colour, awning, sign, w = 3 }: { position: [number, number, number]; rotation?: number; colour: string; awning: string; sign: string; w?: number }) {
  const stripes = useMemo(
    () =>
      canvasTex(`awning:${awning}`, 128, 32, (g) => {
        for (let i = 0; i < 8; i++) {
          g.fillStyle = i % 2 ? awning : '#FFF6EA'
          g.fillRect(i * 16, 0, 16, 32)
        }
      }),
    [awning],
  )
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[w, 2.6, 2]} />
        <meshStandardMaterial color={colour} roughness={0.9} />
      </mesh>
      {/* counter opening */}
      <mesh position={[0, 0.95, 1.01]}>
        <planeGeometry args={[w * 0.75, 1.1]} />
        <meshStandardMaterial color="#3A2418" roughness={1} />
      </mesh>
      <mesh position={[0, 0.5, 1.15]}>
        <boxGeometry args={[w * 0.8, 0.12, 0.35]} />
        <meshStandardMaterial color="#8A5A3C" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.75, 1.35]} rotation-x={0.5}>
        <planeGeometry args={[w + 0.2, 0.9]} />
        <meshStandardMaterial map={stripes} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.35, 1.02]}>
        <planeGeometry args={[w * 0.85, w * 0.85 * 0.25]} />
        <meshBasicMaterial map={signTex(sign, '#7A1F2E')} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Venue() {
  return (
    <group position={[0, 0, -A.halfZ - 2.6]}>
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[A.halfX * 2 + 3, 4.4, 2.4]} />
        <meshStandardMaterial color="#F3E6D2" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (A.halfX + 1), 3.6, 0.6]}>
          <sphereGeometry args={[1.0, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.gold} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 4.75, 1.25]}>
        <planeGeometry args={[6, 1.2]} />
        <meshBasicMaterial map={signTex('SHUBH VIVAH', '#7A1F2E', '#F4C542', 640, 128)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.6, 1.22]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshStandardMaterial color={C.maroon} roughness={0.9} />
      </mesh>
      <Strand from={[-A.halfX - 2, 4.2, 1.3]} to={[A.halfX + 2, 4.2, 1.3]} sag={0.6} count={40} />
    </group>
  )
}

function WeddingCar() {
  return (
    <group position={[A.halfX - 2.2, 0, A.halfZ + 2.6]} rotation-y={-0.25}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[3.6, 0.7, 1.7]} />
        <meshStandardMaterial color="#FFF6EA" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[-0.2, 1.1, 0]}>
        <boxGeometry args={[2, 0.6, 1.5]} />
        <meshStandardMaterial color="#FFF6EA" roughness={0.4} metalness={0.2} />
      </mesh>
      {[-1.2, 1.2].flatMap((x) => [-0.85, 0.85].map((z) => [x, z] as const)).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 14]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
      <Strand from={[-1.2, 1.45, 0.76]} to={[0.8, 1.45, 0.76]} sag={0.2} count={14} colour="#D98A94" />
      <Strand from={[1.8, 0.95, -0.7]} to={[1.8, 0.95, 0.7]} sag={0.2} count={10} colour="#C2410C" />
      <mesh position={[1.81, 0.62, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.2, 0.3]} />
        <meshBasicMaterial map={signTex('JUST MARRYING', '#7A1F2E', '#FFF6EA', 512, 128)} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Trees({ lowEnd }: { lowEnd: boolean }) {
  const spots = useMemo(() => {
    const s: [number, number, number][] = []
    for (let z = -A.halfZ - 1; z <= A.halfZ + 6; z += lowEnd ? 4.5 : 3) {
      s.push([-A.halfX - 6.2 + Math.sin(z) * 0.6, z, 0.9 + ((z * 7) % 3) * 0.12])
      s.push([A.halfX + 6.2 + Math.cos(z) * 0.6, z + 1.2, 0.9 + ((z * 5) % 3) * 0.12])
    }
    return s
  }, [lowEnd])
  const trunk = useRef<THREE.InstancedMesh>(null!)
  const crown = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    spots.forEach(([x, z, s], i) => {
      m.compose(new THREE.Vector3(x, 0.6 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s))
      trunk.current.setMatrixAt(i, m)
      m.compose(new THREE.Vector3(x, 1.9 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s * 1.1, s))
      crown.current.setMatrixAt(i, m)
    })
    trunk.current.instanceMatrix.needsUpdate = crown.current.instanceMatrix.needsUpdate = true
  }, [spots])
  return (
    <>
      <instancedMesh ref={trunk} args={[undefined, undefined, spots.length]}>
        <cylinderGeometry args={[0.12, 0.18, 1.2, 6]} />
        <meshStandardMaterial color="#6B4A32" />
      </instancedMesh>
      <instancedMesh ref={crown} args={[undefined, undefined, spots.length]}>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color="#5E7F4A" flatShading roughness={1} />
      </instancedMesh>
    </>
  )
}

/** Fairy lights strung across the courtyard; they glow brighter for the finale. */
function StringLights() {
  const lines = useMemo(() => {
    const out: { from: THREE.Vector3; to: THREE.Vector3 }[] = []
    for (let z = -A.halfZ + 4; z <= A.halfZ; z += 4.2) out.push({ from: new THREE.Vector3(-A.halfX - 0.4, 3.4, z), to: new THREE.Vector3(A.halfX + 0.4, 3.4, z + 1.5) })
    return out
  }, [])
  const per = 16
  const bulbs = useRef<THREE.InstancedMesh>(null!)
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    let i = 0
    for (const l of lines)
      for (let k = 0; k < per; k++) {
        const t = k / (per - 1)
        m.makeTranslation(l.from.x + (l.to.x - l.from.x) * t, l.from.y - Math.sin(t * Math.PI) * 0.7, l.from.z + (l.to.z - l.from.z) * t)
        bulbs.current.setMatrixAt(i++, m)
      }
    bulbs.current.instanceMatrix.needsUpdate = true
  }, [lines])
  useFrame(() => {
    const n = nightRef.v
    mat.current.color.setRGB(1, 0.78 + n * 0.12, 0.45 + n * 0.2).multiplyScalar(1 + n * 1.6)
  })
  return (
    <>
      <instancedMesh ref={bulbs} args={[undefined, undefined, lines.length * per]}>
        <sphereGeometry args={[0.07, 6, 4]} />
        <meshBasicMaterial ref={mat} toneMapped={false} />
      </instancedMesh>
      {lines.map((l, i) => (
        <group key={i}>
          {[l.from, l.to].map((p, j) => (
            <mesh key={j} position={[p.x, 1.75, p.z]}>
              <cylinderGeometry args={[0.05, 0.06, 3.5, 6]} />
              <meshStandardMaterial color="#6B4A32" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

/** Soft sky dome so the edges of the world never show. */
function Sky() {
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const day = useMemo(() => new THREE.Color(C.sky), [])
  const night = useMemo(() => new THREE.Color(C.night), [])
  useFrame(({ scene }) => {
    mat.current.color.copy(day).lerp(night, nightRef.v)
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(mat.current.color)
  })
  return (
    <mesh scale={120}>
      <sphereGeometry args={[1, 16, 8]} />
      <meshBasicMaterial ref={mat} side={THREE.BackSide} fog={false} />
    </mesh>
  )
}

export function Lights() {
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const sun = useRef<THREE.DirectionalLight>(null!)
  const glow = useRef<THREE.PointLight>(null!)
  useFrame((_, dt) => {
    const want = useSnake.getState().phase === 'COMPLETED' || useSnake.getState().phase === 'REVEAL' ? Math.min(1, sim.phaseTime / 3 + (useSnake.getState().phase === 'REVEAL' ? 1 : 0)) : 0
    nightRef.v += (want - nightRef.v) * Math.min(1, dt * 2)
    const n = nightRef.v
    hemi.current.intensity = 1.35 - n * 0.75
    sun.current.intensity = 1.5 - n * 1.15
    glow.current.intensity = n * 5
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#FFE9CF', '#8A6A4C', 1.35]} />
      <directionalLight ref={sun} position={[-6, 14, 9]} color="#FFD9B0" intensity={1.5} />
      <pointLight ref={glow} position={[MANDAP.x, 3.5, MANDAP.z + 1.5]} color="#FFB060" intensity={0} distance={12} decay={1.4} />
    </>
  )
}

export function World({ lowEnd }: { lowEnd: boolean }) {
  return (
    <group>
      <Sky />
      <Ground />
      <Mandap />
      <Venue />
      {/* bazaar along the sides */}
      <Shop position={[-A.halfX - 2.2, 0, -5.5]} rotation={Math.PI / 2} colour="#E8B36A" awning="#7A1F2E" sign="JEWELLERS" />
      <Shop position={[-A.halfX - 2.2, 0, 1.5]} rotation={Math.PI / 2} colour="#D98A94" awning="#2F6F5E" sign="TAILOR" />
      <Shop position={[-A.halfX - 2.2, 0, 8]} rotation={Math.PI / 2} colour="#9FC1B4" awning="#C2410C" sign="SWEETS" />
      <Shop position={[A.halfX + 2.2, 0, -4.5]} rotation={-Math.PI / 2} colour="#F6D7B0" awning="#C2410C" sign="CHAI" />
      <Shop position={[A.halfX + 2.2, 0, 2.5]} rotation={-Math.PI / 2} colour="#EADBC4" awning="#D98A94" sign="FLOWERS" />
      <Shop position={[A.halfX + 2.2, 0, 9]} rotation={-Math.PI / 2} colour="#C96F4A" awning="#2F6F5E" sign="FOOD" />
      <WeddingCar />
      <Trees lowEnd={lowEnd} />
      <StringLights />
    </group>
  )
}
