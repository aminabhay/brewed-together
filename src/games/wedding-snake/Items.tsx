import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { weddingConfig } from './config'
import { useSnake, sim, type Entity } from './GameState'
import { hintTarget } from './GameManager'
import { signTex } from './World'

const D = weddingConfig.difficulty

type M = { c: string; m?: number; r?: number; e?: string }
const Mat = ({ c, m = 0, r = 0.6, e }: M) => <meshStandardMaterial color={c} metalness={m} roughness={r} emissive={e ?? '#000'} emissiveIntensity={e ? 0.5 : 0} />
const Box = ({ s, p = [0, 0, 0], rot, ...m }: { s: [number, number, number]; p?: [number, number, number]; rot?: [number, number, number] } & M) => (
  <mesh position={p} rotation={rot}>
    <boxGeometry args={s} />
    <Mat {...m} />
  </mesh>
)
const Cyl = ({ a, p = [0, 0, 0], rot, ...m }: { a: [number, number, number, number?]; p?: [number, number, number]; rot?: [number, number, number] } & M) => (
  <mesh position={p} rotation={rot}>
    <cylinderGeometry args={[a[0], a[1], a[2], a[3] ?? 14]} />
    <Mat {...m} />
  </mesh>
)
const Ball = ({ rad, p = [0, 0, 0], ...m }: { rad: number; p?: [number, number, number] } & M) => (
  <mesh position={p}>
    <sphereGeometry args={[rad, 12, 10]} />
    <Mat {...m} />
  </mesh>
)
const Ring = ({ rad, t, p = [0, 0, 0], rot, ...m }: { rad: number; t: number; p?: [number, number, number]; rot?: [number, number, number] } & M) => (
  <mesh position={p} rotation={rot}>
    <torusGeometry args={[rad, t, 8, 24]} />
    <Mat {...m} />
  </mesh>
)
const Label = ({ text, p, w = 0.7, bg = '#7A1F2E' }: { text: string; p: [number, number, number]; w?: number; bg?: string }) => (
  <mesh position={p}>
    <planeGeometry args={[w, w * 0.25]} />
    <meshBasicMaterial map={signTex(text, bg, '#FFF6EA')} toneMapped={false} side={THREE.DoubleSide} />
  </mesh>
)
const GOLD = { c: '#E6B84A', m: 0.8, r: 0.25 }

/** Hand-made little models; each sits roughly in a 0.8-unit cube centred above the origin. */
export function ItemModel({ id }: { id: string }) {
  switch (id) {
    // ── the things you need ──
    case 'rings':
      return (
        <group>
          <Box s={[0.6, 0.32, 0.5]} c="#7A1F2E" r={0.4} />
          <Box s={[0.6, 0.12, 0.5]} p={[0, 0.3, -0.24]} rot={[-1.1, 0, 0]} c="#7A1F2E" r={0.4} />
          <Box s={[0.5, 0.04, 0.4]} p={[0, 0.17, 0]} c="#FFF6EA" />
          <Ring rad={0.12} t={0.035} p={[-0.1, 0.3, 0]} rot={[0, 0.3, 0]} {...GOLD} e="#E6B84A" />
          <Ring rad={0.1} t={0.03} p={[0.12, 0.28, 0.02]} rot={[0, -0.3, 0]} c="#E8EEF2" m={0.9} r={0.2} e="#ffffff" />
          <Ball rad={0.04} p={[0.12, 0.39, 0.02]} c="#BFE8FF" m={0.2} r={0.05} e="#BFE8FF" />
        </group>
      )
    case 'outfit':
      return (
        <group>
          <Ring rad={0.12} t={0.02} p={[0, 0.62, 0]} rot={[0, 0, 0]} {...GOLD} />
          <Box s={[0.7, 0.04, 0.04]} p={[0, 0.5, 0]} {...GOLD} />
          <mesh position={[0, 0.12, 0]}>
            <coneGeometry args={[0.38, 0.75, 16, 1, true]} />
            <meshStandardMaterial color="#B5303F" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
          <Ring rad={0.33} t={0.025} p={[0, -0.18, 0]} rot={[Math.PI / 2, 0, 0]} {...GOLD} />
        </group>
      )
    case 'shoes':
      return (
        <group>
          {[-0.16, 0.16].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <Box s={[0.22, 0.12, 0.55]} c="#C9A45C" m={0.4} r={0.4} />
              <mesh position={[0, 0.07, 0.3]} rotation={[0.5, 0, 0]}>
                <coneGeometry args={[0.11, 0.25, 8]} />
                <Mat c="#C9A45C" m={0.4} r={0.4} />
              </mesh>
              <Box s={[0.18, 0.06, 0.28]} p={[0, 0.08, 0.08]} c="#7A1F2E" />
            </group>
          ))}
        </group>
      )
    case 'flowers':
      return (
        <group>
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.25, 0.5, 10, 1, true]} />
            <meshStandardMaterial color="#FFF6EA" side={THREE.DoubleSide} />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const a = (i / 6) * Math.PI * 2
            const r = i === 6 ? 0 : 0.17
            return <Ball key={i} rad={0.12} p={[Math.cos(a) * r, 0.22 + (i === 6 ? 0.06 : 0), Math.sin(a) * r]} c={['#D98A94', '#E8A33D', '#C2410C'][i % 3]} r={0.8} />
          })}
        </group>
      )
    case 'invitation':
      return (
        <group rotation={[-0.5, 0, 0]}>
          <Box s={[0.7, 0.04, 0.48]} c="#C2410C" />
          <mesh position={[0, 0.025, -0.08]} rotation={[-Math.PI / 2, 0, Math.PI]}>
            <circleGeometry args={[0.25, 3]} />
            <meshStandardMaterial color="#9A2F1C" />
          </mesh>
          <Cyl a={[0.07, 0.07, 0.03]} p={[0, 0.04, 0.02]} {...GOLD} e="#E6B84A" />
        </group>
      )
    case 'mithai':
      return (
        <group>
          <Box s={[0.66, 0.24, 0.5]} c="#E8A33D" />
          <Box s={[0.68, 0.04, 0.12]} p={[0, 0.06, 0]} c="#7A1F2E" />
          {[-0.18, 0, 0.18].map((x) => (
            <Ball key={x} rad={0.08} p={[x, 0.18, 0.12]} c="#F4C542" r={0.9} />
          ))}
          <Ball rad={0.08} p={[-0.09, 0.18, -0.1]} c="#FFF6EA" r={0.9} />
          <Ball rad={0.08} p={[0.09, 0.18, -0.1]} c="#D98A94" r={0.9} />
        </group>
      )
    case 'garland':
      return (
        <group rotation={[Math.PI / 2.4, 0, 0]}>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2
            return <Ball key={i} rad={0.075} p={[Math.cos(a) * 0.3, Math.sin(a) * 0.36, 0]} c={i % 4 === 0 ? '#C2410C' : '#E8A33D'} r={0.9} />
          })}
        </group>
      )
    case 'carkey':
      return (
        <group rotation={[0, 0, 0.3]}>
          <Box s={[0.24, 0.36, 0.1]} p={[0, 0.15, 0]} c="#1F2430" r={0.4} />
          <Ball rad={0.035} p={[0, 0.22, 0.06]} c="#E8A33D" e="#E8A33D" />
          <Box s={[0.06, 0.38, 0.03]} p={[0, -0.2, 0]} c="#D9DDE2" m={0.9} r={0.2} />
          <Ring rad={0.12} t={0.02} p={[0, 0.42, 0]} c="#D9DDE2" m={0.9} r={0.2} />
        </group>
      )

    // ── the distractions ──
    case 'laptop':
      return (
        <group>
          <Box s={[0.74, 0.04, 0.5]} c="#9AA1AA" m={0.6} r={0.35} />
          <Box s={[0.74, 0.48, 0.03]} p={[0, 0.24, -0.25]} rot={[-0.2, 0, 0]} c="#9AA1AA" m={0.6} r={0.35} />
          <mesh position={[0, 0.24, -0.23]} rotation={[-0.2, 0, 0]}>
            <planeGeometry args={[0.66, 0.4]} />
            <meshBasicMaterial color="#5B8DEF" toneMapped={false} />
          </mesh>
          <Label text="EXCEL" p={[0, 0.26, -0.22]} w={0.5} bg="#1F7A47" />
        </group>
      )
    case 'controller':
      return (
        <group rotation={[-0.4, 0, 0]}>
          <Box s={[0.5, 0.12, 0.26]} c="#1F2430" r={0.4} />
          {[-0.25, 0.25].map((x) => (
            <Ball key={x} rad={0.15} p={[x, 0, 0.06]} c="#1F2430" r={0.4} />
          ))}
          <Ball rad={0.04} p={[0.22, 0.08, 0.02]} c="#E04F5F" e="#E04F5F" />
          <Ball rad={0.04} p={[0.3, 0.08, -0.04]} c="#5B8DEF" e="#5B8DEF" />
          <Cyl a={[0.05, 0.05, 0.06]} p={[-0.1, 0.09, 0.06]} c="#444" />
          <Cyl a={[0.05, 0.05, 0.06]} p={[0.1, 0.09, 0.06]} c="#444" />
        </group>
      )
    case 'football':
      // white ball with black patches
      return (
        <group>
          <mesh>
            <icosahedronGeometry args={[0.32, 1]} />
            <meshStandardMaterial color="#FAFAFA" roughness={0.5} flatShading />
          </mesh>
          {[
            [0, 1, 0],
            [0, -1, 0],
            [0.89, 0.45, 0],
            [-0.89, 0.45, 0],
            [0.28, 0.45, 0.85],
            [-0.28, -0.45, 0.85],
            [0.72, -0.45, 0.52],
            [-0.72, -0.45, -0.52],
            [0.28, 0.45, -0.85],
            [-0.72, 0.45, 0.52],
          ].map(([x, y, z], i) => {
            const n = new THREE.Vector3(x, y, z).normalize()
            return (
              <mesh key={i} position={n.clone().multiplyScalar(0.305)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n)}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 5]} />
                <meshStandardMaterial color="#1F2430" roughness={0.5} />
              </mesh>
            )
          })}
        </group>
      )
    case 'dumbbell':
      return (
        <group rotation={[0, 0, Math.PI / 2]}>
          <Cyl a={[0.04, 0.04, 0.6]} c="#9AA1AA" m={0.7} r={0.3} />
          {[-0.27, 0.27].map((y) => (
            <Cyl key={y} a={[0.18, 0.18, 0.14, 6]} p={[0, y, 0]} c="#2B2A33" r={0.5} />
          ))}
        </group>
      )
    case 'remote':
      return (
        <group rotation={[-0.6, 0.3, 0]}>
          <Box s={[0.16, 0.06, 0.62]} c="#2B2A33" r={0.5} />
          <Ball rad={0.035} p={[0, 0.04, -0.22]} c="#E04F5F" e="#E04F5F" />
          {[-0.06, 0.06, 0.18].map((z) => (
            <Box key={z} s={[0.1, 0.02, 0.06]} p={[0, 0.04, z]} c="#777" />
          ))}
        </group>
      )
    case 'cone':
      return (
        <group position={[0, -0.12, 0]}>
          <Box s={[0.5, 0.05, 0.5]} p={[0, -0.18, 0]} c="#E2622D" />
          <Cyl a={[0.04, 0.22, 0.68]} p={[0, 0.16, 0]} c="#F06A2A" r={0.5} />
          <Cyl a={[0.13, 0.17, 0.12]} p={[0, 0.12, 0]} c="#FFFFFF" />
        </group>
      )
    case 'clock':
      return (
        <group>
          <Cyl a={[0.26, 0.26, 0.14, 20]} rot={[Math.PI / 2, 0, 0]} c="#E04F5F" r={0.4} />
          <mesh position={[0, 0, 0.075]}>
            <circleGeometry args={[0.21, 20]} />
            <meshStandardMaterial color="#FFF6EA" />
          </mesh>
          <Box s={[0.02, 0.14, 0.01]} p={[0, 0.06, 0.085]} c="#222" />
          <Box s={[0.1, 0.02, 0.01]} p={[0.05, 0, 0.085]} c="#222" />
          {[-0.17, 0.17].map((x) => (
            <Ball key={x} rad={0.08} p={[x, 0.25, 0]} {...GOLD} />
          ))}
        </group>
      )
    case 'bill':
      return (
        <group rotation={[-0.6, 0, 0.15]}>
          <Box s={[0.62, 0.03, 0.4]} c="#1F2430" m={0.3} r={0.3} />
          <Box s={[0.12, 0.035, 0.09]} p={[-0.17, 0.005, -0.04]} {...GOLD} />
          <Box s={[0.62, 0.035, 0.07]} p={[0, 0.003, 0.11]} c="#444" />
          <Label text="₹₹₹₹₹" p={[0.1, 0.03, -0.06]} w={0.34} bg="#1F2430" />
        </group>
      )
    case 'ticket':
      return (
        <group rotation={[-0.7, 0, -0.2]}>
          <Box s={[0.72, 0.02, 0.32]} c="#2F6F5E" />
          <Label text="GOA ✈" p={[0, 0.016, 0]} w={0.6} bg="#2F6F5E" />
        </group>
      )
    case 'shaker':
      return (
        <group>
          <Cyl a={[0.17, 0.15, 0.55]} c="#1F2430" r={0.4} />
          <Cyl a={[0.17, 0.17, 0.12]} p={[0, 0.33, 0]} c="#E04F5F" r={0.4} />
          <Box s={[0.2, 0.18, 0.01]} p={[0, 0, 0.165]} c="#F4C542" />
        </group>
      )
    case 'boss':
      return (
        <group rotation={[-0.4, 0, 0]}>
          <Box s={[0.34, 0.62, 0.05]} c="#1F2430" r={0.3} />
          <mesh position={[0, 0, 0.027]}>
            <planeGeometry args={[0.3, 0.56]} />
            <meshBasicMaterial color="#E04F5F" toneMapped={false} />
          </mesh>
          <Label text="BOSS" p={[0, 0.08, 0.03]} w={0.28} bg="#E04F5F" />
        </group>
      )
    case 'otherinvite':
      return (
        <group rotation={[-0.5, 0, 0.2]}>
          <Box s={[0.66, 0.04, 0.46]} c="#5B8DEF" />
          <Label text="SHARMA ♥" p={[0, 0.025, 0]} w={0.56} bg="#5B8DEF" />
        </group>
      )
    case 'receipt':
      return (
        <group rotation={[-0.4, 0, 0]}>
          <Box s={[0.36, 0.72, 0.01]} c="#FFFFFF" r={0.9} />
          {[-0.2, -0.1, 0, 0.1, 0.2].map((y) => (
            <Box key={y} s={[0.26, 0.025, 0.012]} p={[0, y, 0.005]} c="#999" />
          ))}
          <Box s={[0.28, 0.05, 0.012]} p={[0, -0.3, 0.006]} c="#E04F5F" />
        </group>
      )

    // ── bonuses ──
    case 'chai':
      return (
        <group>
          <Cyl a={[0.16, 0.12, 0.34]} c="#F5F2EC" r={0.15} />
          <Cyl a={[0.15, 0.15, 0.02]} p={[0, 0.15, 0]} c="#B8763A" />
          <Ring rad={0.08} t={0.02} p={[0.18, 0.02, 0]} rot={[0, 0, Math.PI / 2]} c="#F5F2EC" />
        </group>
      )
    case 'momcall':
      return (
        <group rotation={[-0.4, 0, 0]}>
          <Box s={[0.34, 0.62, 0.05]} c="#FFF6EA" r={0.3} />
          <mesh position={[0, 0, 0.027]}>
            <planeGeometry args={[0.3, 0.56]} />
            <meshBasicMaterial color="#2F9E5A" toneMapped={false} />
          </mesh>
          <Label text="MUMMY" p={[0, 0.08, 0.03]} w={0.28} bg="#2F9E5A" />
        </group>
      )
    case 'maps':
      return (
        <group>
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.24, 16, 12]} />
            <Mat c="#E8453C" r={0.4} />
          </mesh>
          <mesh position={[0, -0.18, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.2, 0.4, 16]} />
            <Mat c="#E8453C" r={0.4} />
          </mesh>
          <Ball rad={0.09} p={[0, 0.14, 0.17]} c="#FFFFFF" />
        </group>
      )
  }
  return <Box s={[0.5, 0.5, 0.5]} c="#999" />
}

/** A wrapped gift: what wrong items look like until you get close. */
function Parcel() {
  return (
    <group>
      <Box s={[0.6, 0.48, 0.6]} c="#E9D9C2" r={0.8} />
      <Box s={[0.62, 0.5, 0.1]} c="#7A1F2E" />
      <Box s={[0.1, 0.5, 0.62]} c="#7A1F2E" />
      <Ring rad={0.1} t={0.035} p={[-0.08, 0.28, 0]} rot={[0, Math.PI / 2, 0.5]} c="#7A1F2E" />
      <Ring rad={0.1} t={0.035} p={[0.08, 0.28, 0]} rot={[0, Math.PI / 2, -0.5]} c="#7A1F2E" />
    </group>
  )
}

const ringColours = { required: '#F4C542', wrong: '#E8DCCB', bonus: '#8FD3FF' } as const
const label = (e: Entity) =>
  e.kind === 'required'
    ? [...weddingConfig.required.pool, weddingConfig.required.final].find((r) => r.id === e.key)!.label
    : e.kind === 'wrong'
      ? weddingConfig.wrong.pool.find((w) => w.id === e.key)!.label
      : weddingConfig.bonuses.find((b) => b.id === e.key)!.label

function Collectible({ e }: { e: Entity }) {
  const g = useRef<THREE.Group>(null!)
  const spin = useRef<THREE.Group>(null!)
  const glow = useRef<THREE.Mesh>(null!)
  const gift = useRef<THREE.Group>(null!)
  const real = useRef<THREE.Group>(null!)
  const tag = useRef<HTMLDivElement>(null!)
  const beam = useRef<THREE.Mesh>(null!)
  const born = useMemo(() => performance.now() / 1000, [])
  const seed = useMemo(() => Math.random() * 6, [])
  const isRings = e.key === weddingConfig.required.final.id
  const reveal = useRef(e.revealed ? 1 : 0)

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + seed
    const d = Math.hypot(e.x - sim.x, e.z - sim.z)
    const pop = Math.min(1, (performance.now() / 1000 - born) * 3)
    const s = (1 - Math.pow(1 - pop, 3)) * (isRings ? 1.25 : 1)
    g.current.position.set(e.x, 0, e.z)
    spin.current.position.y = 0.75 + Math.sin(t * 2.2) * 0.12
    spin.current.rotation.y = t * (e.kind === 'wrong' && !e.revealed ? 0.4 : 1.1)
    spin.current.scale.setScalar(s)
    // wrong items: gift wrap peels off when you're close
    reveal.current += ((e.revealed ? 1 : 0) - reveal.current) * Math.min(1, dt * 8)
    if (gift.current) {
      gift.current.visible = reveal.current < 0.98
      gift.current.scale.setScalar(Math.max(0.001, 1 - reveal.current))
      real.current.visible = reveal.current > 0.02
      real.current.scale.setScalar(Math.max(0.001, reveal.current))
    }
    const m = glow.current.material as THREE.MeshBasicMaterial
    if (e.kind === 'wrong') m.color.set(e.revealed ? '#E04F5F' : ringColours.wrong)
    m.opacity = (0.35 + Math.sin(t * 3) * 0.12) * (e.kind === 'wrong' ? (e.revealed ? 0.6 : 0.3) : 1)
    glow.current.scale.setScalar(s * (1 + Math.sin(t * 3) * 0.06))
    // labels appear when you're near (and for wrong ones, only once they're unwrapped)
    const show = d < D.labelDistance && (e.kind !== 'wrong' || e.revealed)
    tag.current.style.opacity = show ? '1' : '0'
    // mummy's hint: a beam of light over the rings (or the next thing)
    if (beam.current) {
      const on = sim.t < sim.hintUntil && hintTarget() === e
      beam.current.visible = on
      if (on) (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 8) * 0.12
    }
  })

  const wrong = e.kind === 'wrong'
  return (
    <group ref={g}>
      <mesh ref={glow} rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[0.45, 0.72, 32]} />
        <meshBasicMaterial color={ringColours[e.kind]} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={spin}>
        {wrong ? (
          <>
            <group ref={gift}>
              <Parcel />
            </group>
            <group ref={real}>
              <ItemModel id={e.key} />
            </group>
          </>
        ) : (
          <ItemModel id={e.key} />
        )}
      </group>
      {e.kind === 'required' && (
        <mesh ref={beam} position-y={3} visible={false}>
          <cylinderGeometry args={[0.45, 0.7, 6, 16, 1, true]} />
          <meshBasicMaterial color="#FFE08A" transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}
      <Html position={[0, 1.65, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={tag} className={`ws-tag ws-tag--${e.kind}`} style={{ opacity: 0 }}>
          {label(e)}
        </div>
      </Html>
    </group>
  )
}

export function Collectibles() {
  const entities = useSnake((s) => s.entities)
  // the leftover distractions clear away for the finale
  const done = useSnake((s) => s.phase === 'COMPLETED' || s.phase === 'REVEAL')
  if (done) return null
  return (
    <>
      {entities
        .filter((e) => !e.taken)
        .map((e) => (
          <Collectible key={e.id} e={e} />
        ))}
    </>
  )
}
