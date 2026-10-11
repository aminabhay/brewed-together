import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sim, useGame } from './GameState'
import { groom } from './CharacterController'
import { gameConfig } from './config'
import { mat } from '../../three/components/materials'

const C = gameConfig.colours

/** Little dust puffs at the groom's feet on every tap (and footfalls at speed). */
export function Dust({ count = 28 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const puffs = useMemo(() => Array.from({ length: count }, () => ({ age: 9, x: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0 })), [count])
  const last = useRef({ taps: 0, i: 0 })
  const o = useMemo(() => new THREE.Object3D(), [])
  useFrame((_, dt) => {
    const l = last.current
    const spawn = (n: number) => {
      for (let k = 0; k < n; k++) {
        const p = puffs[l.i++ % count]
        Object.assign(p, { age: 0, x: groom.x + (Math.random() - 0.5) * 0.4, z: groom.z + 0.2, vx: (Math.random() - 0.5) * 1.0, vy: 0.4 + Math.random() * 0.4, vz: 0.6 + Math.random() * 0.6, s: 0.05 + Math.random() * 0.04 })
      }
    }
    if (sim.taps > l.taps) {
      spawn(Math.min(3, sim.taps - l.taps) * 2)
      l.taps = sim.taps
    }
    if (sim.taps < l.taps) l.taps = sim.taps // restart
    puffs.forEach((p, i) => {
      p.age += dt
      const life = 0.45
      const k = p.age / life
      if (k >= 1) o.scale.setScalar(0.0001)
      else {
        o.position.set(p.x + p.vx * p.age, 0.08 + p.vy * p.age - 0.8 * p.age * p.age, p.z + p.vz * p.age)
        o.scale.setScalar(p.s * (1 + k * 1.5) * (1 - k))
      }
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#F1E3CC" roughness={1} transparent opacity={0.75} />
    </instancedMesh>
  )
}

/** The wedding arch the couple walk to, with marigolds, fairy lights and a red runner. */
export function Arch() {
  const g = useRef<THREE.Group>(null!)
  const lights = useRef<THREE.PointLight[]>([])
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFE2A8'), toneMapped: false }), [])
  const flowers = useRef<THREE.InstancedMesh>(null!)
  const bulbs = useRef<THREE.InstancedMesh>(null!)
  const k = useRef(0)
  const R = 1.9
  const pts = useMemo(() => Array.from({ length: 34 }, (_, i) => (i / 33) * Math.PI), [])
  useFrame((_, dt) => {
    const phase = useGame.getState().phase
    const on = phase === 'DATE_REVEAL' || phase === 'COMPLETE'
    g.current.visible = on || k.current > 0.01
    k.current += ((on ? 1 : 0) - k.current) * Math.min(1, dt * 1.8)
    g.current.position.z = sim.revealZ
    g.current.scale.setScalar(Math.max(0.001, k.current) * 0.85) // a touch compact: leaves dark sky for the title
    lights.current.forEach((l) => l && (l.intensity = 6 * k.current))
    const tw = (performance.now() / 1000) % 1
    bulbMat.color.setRGB(2.2 + tw * 0.2, 1.7, 0.9)
    // place flowers along the arch once
    if (flowers.current.userData.done) return
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    pts.forEach((a, i) => {
      o.position.set(Math.cos(a) * R, 2.2 + Math.sin(a) * R, 0)
      o.scale.setScalar(1)
      o.updateMatrix()
      flowers.current.setMatrixAt(i, o.matrix)
      flowers.current.setColorAt(i, c.set(i % 3 === 0 ? '#F4C542' : i % 3 === 1 ? '#F2A03D' : '#D98A94'))
      o.position.set(Math.cos(a) * (R - 0.25), 2.2 + Math.sin(a) * (R - 0.25) - 0.15, 0.1)
      o.updateMatrix()
      bulbs.current.setMatrixAt(i, o.matrix)
    })
    flowers.current.instanceMatrix.needsUpdate = true
    if (flowers.current.instanceColor) flowers.current.instanceColor.needsUpdate = true
    bulbs.current.instanceMatrix.needsUpdate = true
    flowers.current.userData.done = true
  })
  const ivory = mat(C.ivory, { rough: 0.6 })
  const gold = mat('#C9A45C', { rough: 0.35, metal: 0.6 })
  return (
    <group ref={g} visible={false}>
      {[-R, R].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 1.1, 0]} material={ivory}>
            <cylinderGeometry args={[0.16, 0.2, 2.2, 14]} />
          </mesh>
          {[0.3, 1.9].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={gold}>
              <cylinderGeometry args={[0.21, 0.21, 0.08, 14]} />
            </mesh>
          ))}
          {/* a diya at the foot of each pillar */}
          <mesh position={[0, 0.08, 0.5]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color={new THREE.Color(3, 1.8, 0.6)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.2, 0]} material={mat(C.primary, { rough: 0.7 })}>
        <torusGeometry args={[R, 0.12, 10, 48, Math.PI]} />
      </mesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, pts.length]}>
        <icosahedronGeometry args={[0.16, 1]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={bulbs} args={[undefined, bulbMat, pts.length]}>
        <sphereGeometry args={[0.045, 6, 4]} />
      </instancedMesh>
      {/* red runner leading to the arch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 3]} material={mat('#9C2F3A', { rough: 0.95 })}>
        <planeGeometry args={[1.8, 8]} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <pointLight key={s} ref={(l) => l && (lights.current[i] = l)} position={[s * 1.4, 2.6, 1.2]} color="#FFC07A" intensity={0} distance={8} decay={1.6} />
      ))}
    </group>
  )
}

/** Flower petals drifting down during the reveal. */
export function Petals({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const g = useRef<THREE.Group>(null!)
  const seeds = useMemo(
    () => Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 7, y: Math.random() * 6, z: (Math.random() - 0.5) * 8, s: 0.6 + Math.random() * 0.8, r: Math.random() * 6, v: 0.4 + Math.random() * 0.5 })),
    [count],
  )
  const o = useMemo(() => new THREE.Object3D(), [])
  useFrame(({ clock }, dt) => {
    const phase = useGame.getState().phase
    const on = phase === 'DATE_REVEAL' || phase === 'COMPLETE'
    g.current.visible = on
    if (!on) return
    g.current.position.z = sim.revealZ + 2
    const t = clock.elapsedTime
    seeds.forEach((p, i) => {
      p.y -= p.v * dt
      if (p.y < 0) p.y += 6
      o.position.set(p.x + Math.sin(t * 0.8 + p.r) * 0.4, p.y, p.z)
      o.rotation.set(t * p.v * 2 + p.r, t * 0.7 + p.r, t * 0.5)
      o.scale.setScalar(p.s)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  useLayoutEffect(() => {
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) ref.current.setColorAt(i, c.set(['#B5303F', '#D98A94', '#E8A33D', '#F4C542', '#C2185B'][i % 5]))
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [count])
  return (
    <group ref={g} visible={false}>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
        <planeGeometry args={[0.09, 0.06]} />
        <meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
      </instancedMesh>
    </group>
  )
}
