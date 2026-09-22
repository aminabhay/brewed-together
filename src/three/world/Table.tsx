import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, smooth } from '../../scroll/scrollState'
import { beatIndex } from '../../scroll/beats'
import { memoTex, woodTexture, textTexture, SERIF } from '../components/textures'
import { mat, PALETTE } from '../components/materials'
import { Blob } from '../components/Props'
import { useStore } from '../../state/useStore'

/** How far the table has dissolved into the city map (0 = solid table, 1 = gone). */
export const mapReveal = () => {
  const m = beatIndex('map')
  const p = scrollState.beatPos
  return smooth(m - 0.75, m - 0.1, p) * (1 - smooth(m + 0.35, m + 0.9, p))
}

/** Giant everyday objects on the table: they make the dioramas read as miniatures. */
function GiantProps() {
  return (
    <group>
      {/* a huge mug */}
      <group position={[-11, 0, -6]}>
        <mesh position={[0, 3, 0]} material={mat('#E9DCC8', { rough: 0.35 })}>
          <cylinderGeometry args={[2.6, 2.3, 6, 40]} />
        </mesh>
        <mesh position={[2.6, 3.2, 0]} rotation={[0, 0, -Math.PI / 2]} material={mat('#E9DCC8', { rough: 0.35 })}>
          <torusGeometry args={[1.3, 0.35, 12, 24, Math.PI]} />
        </mesh>
        <mesh position={[0, 5.7, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#3a2012', { rough: 0.2 })}>
          <circleGeometry args={[2.45, 40]} />
        </mesh>
        <Blob position={[0.3, 0.01, 0.3]} size={8} opacity={0.6} />
      </group>
      {/* a pencil */}
      <group position={[10, 0.45, 8]} rotation={[0, 0.5, Math.PI / 2]}>
        <mesh material={mat('#F2B233', { rough: 0.6 })}>
          <cylinderGeometry args={[0.45, 0.45, 12, 6]} />
        </mesh>
        <mesh position={[0, 6.8, 0]} material={mat('#E8C9A0')}>
          <coneGeometry args={[0.45, 1.6, 6]} />
        </mesh>
        <mesh position={[0, -6.4, 0]} material={mat('#D98A8A')}>
          <cylinderGeometry args={[0.46, 0.46, 0.9, 12]} />
        </mesh>
      </group>
      {/* a notebook */}
      <group position={[-12, 0.2, 9]} rotation={[0, -0.3, 0]}>
        <mesh material={mat('#8A9A7B', { rough: 0.8 })}>
          <boxGeometry args={[9, 0.4, 12]} />
        </mesh>
        <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 11]} />
          <meshStandardMaterial map={memoTex('nb', () => textTexture('our story', { w: 512, h: 700, size: 90, color: '#3B2418', bg: '#F3E5D0', font: SERIF }))} />
        </mesh>
        <Blob position={[0, -0.19, 0]} size={[12, 15]} opacity={0.5} />
      </group>
    </group>
  )
}

/** Scattered coffee beans (one instanced draw call). */
function Beans() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const count = useStore((s) => (s.tier === 'low' ? 40 : 120))
  useEffect(() => {
    const o = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const x = -20 + Math.random() * 140
      const z = 6 + Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1.6)
      o.position.set(x, 0.18, z)
      o.rotation.set(0, Math.random() * Math.PI, 0)
      o.scale.set(1, 0.55, 0.7)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [count])
  return (
    <instancedMesh ref={ref} args={[undefined, mat(PALETTE.espresso, { rough: 0.35 }), count]} key={count}>
      <sphereGeometry args={[0.32, 10, 8]} />
    </instancedMesh>
  )
}

/** Distant warm light points → lovely bokeh circles through the depth of field. */
function BokehLights() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const count = 60
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb870').multiplyScalar(2.2), toneMapped: false }), [])
  useEffect(() => {
    const o = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      o.position.set(-40 + Math.random() * 190, 6 + Math.random() * 22, -45 - Math.random() * 30)
      o.scale.setScalar(0.25 + Math.random() * 0.5)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, m, count]}>
      <sphereGeometry args={[1, 8, 6]} />
    </instancedMesh>
  )
}

/** The big wooden table everything stands on. Fades away to reveal the city map. */
export default function Table() {
  const group = useRef<THREE.Group>(null!)
  const material = useMemo(() => {
    const t = memoTex('table-wood', () => woodTexture('#8E5E38', '#5C3A22', 5))
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(10, 4)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, transparent: true })
  }, [])
  const props = useRef<THREE.Group>(null!)
  useFrame(() => {
    const r = mapReveal()
    material.opacity = 1 - r
    material.transparent = r > 0.001
    material.depthWrite = r < 0.5
    group.current.visible = r < 0.99
    props.current.visible = r < 0.25
  })
  return (
    <group>
      <group ref={group}>
        <mesh position={[45, -0.5, -4]} material={material}>
          <boxGeometry args={[240, 1, 90]} />
        </mesh>
        <group ref={props}>
          <GiantProps />
          <Beans />
        </group>
      </group>
      <BokehLights />
    </group>
  )
}
