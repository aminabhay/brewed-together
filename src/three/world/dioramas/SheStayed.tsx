import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { wedding } from '../../../content/wedding'
import { Character, abhayProps, jyotiProps } from '../../components/Character'
import { Crowd, type CrowdMember } from '../../components/Crowd'
import { Desk, Chair, Plant, Blob } from '../../components/Props'
import { canvasTexture, memoTex, textTexture, SERIF, SANS } from '../../components/textures'
import { mat, PALETTE } from '../../components/materials'
import { scrollState, smooth, clamp01 } from '../../../scroll/scrollState'
import { play } from '../../../audio/sounds'
import { Chapter } from './Chapter'
import { Offices } from './Offices'

/** Time-lapse runs over this share of the section's scroll; the rest is the text + finale. */
const TL_END = 0.6
const tl = () => clamp01((scrollState.local.ch6 ?? 0) / TL_END)

function Calendar() {
  const years = wedding.sheStayed.years
  const texes = useMemo(
    () =>
      years.map((y) =>
        memoTex(`cal-${y}`, () =>
          canvasTexture(256, 300, (ctx, w, h) => {
            ctx.fillStyle = '#FFF8EE'
            ctx.fillRect(0, 0, w, h)
            ctx.fillStyle = '#C0392B'
            ctx.fillRect(0, 0, w, 70)
            ctx.fillStyle = '#fff'
            ctx.font = `700 34px ${SANS}`
            ctx.textAlign = 'center'
            ctx.fillText('YEAR', w / 2, 48)
            ctx.fillStyle = '#2A1E17'
            ctx.font = `700 92px ${SERIF}`
            ctx.fillText(y, w / 2, 200)
          }),
        ),
      ),
    [],
  )
  const face = useRef<THREE.MeshStandardMaterial>(null!)
  const pages = useRef<THREE.InstancedMesh>(null!)
  const N = years.length * 4
  const lastIdx = useRef(0)
  const o = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(() => Array.from({ length: N }, () => [Math.random() - 0.5, Math.random(), Math.random() - 0.5]), [N])
  const base = new THREE.Vector3(-2.4, 2.1, 0.5)
  useFrame(() => {
    const t = tl()
    const idx = Math.min(years.length - 1, Math.floor(t * years.length))
    face.current.map = texes[idx]
    if (idx !== lastIdx.current) {
      if (idx > lastIdx.current) play('page', 0.5)
      lastIdx.current = idx
    }
    // pages tear off in order and fly away; fully determined by t, so it scrubs both ways
    for (let j = 0; j < N; j++) {
      const tj = (j / N) * 0.98
      const age = (t - tj) / 0.09
      const [sx, sy, sz] = seeds[j]
      if (age <= 0 || age >= 1 || t >= 0.999) {
        o.scale.setScalar(0.0001)
      } else {
        o.position.set(base.x + age * (2 + sx * 3), base.y + Math.sin(age * Math.PI) * (1 + sy) + age * 1.5, base.z + age * (2.5 + sz * 2))
        o.rotation.set(age * 6 * (sx + 0.5), age * 4 * sz, age * 5 * sy)
        o.scale.setScalar(1 - age * 0.3)
      }
      o.updateMatrix()
      pages.current.setMatrixAt(j, o.matrix)
    }
    pages.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <group position={base.toArray()}>
        <mesh position={[0, -1, -0.05]} material={mat(PALETTE.woodDark)}>
          <boxGeometry args={[0.08, 2.1, 0.08]} />
        </mesh>
        <mesh>
          <planeGeometry args={[1.0, 1.17]} />
          <meshStandardMaterial ref={face} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <instancedMesh ref={pages} args={[undefined, undefined, N]} frustumCulled={false}>
        <planeGeometry args={[0.9, 1.05]} />
        <meshStandardMaterial color="#FFF8EE" side={THREE.DoubleSide} roughness={0.9} />
      </instancedMesh>
    </group>
  )
}

export default function SheStayed() {
  const abhay = useRef<THREE.Group>(null!)
  const anim = useRef({ walk: 0 })
  const colleagues = useMemo<CrowdMember[]>(() => {
    const cols = ['#8A9A7B', '#C98B4E', '#6F8FAF', '#B56B6B', '#D9B26F', '#7C6A9E', '#5E8C7A', '#C9A0A0']
    const spots: [number, number][] = [[-3, -1.2], [2.8, -1.1], [-3, 2.3], [0, -1.5], [3, 2.1], [-1.2, -1.6], [1.4, -1.6], [3.2, -0.4], [-3.1, 0.6], [2.2, 2.6], [-1.8, 2.7], [0.9, -2.9]]
    return Array.from({ length: 16 }, (_, i) => {
      const [x, z] = spots[i % spots.length]
      return { position: [x + (i > 11 ? 0.4 : 0), 0.08, z + 0.35], rotationY: Math.PI + (i % 3) * 0.3, color: cols[i % cols.length] }
    })
  }, [])
  const windows = useMemo(() => colleagues.map((_, i) => {
    const a = (i / colleagues.length) * 0.8 + Math.random() * 0.05
    return [a, a + 0.12 + Math.random() * 0.15]
  }), [colleagues])

  useFrame(() => {
    const t = tl()
    const local = scrollState.local.ch6 ?? 0
    // Abhay walks over on "…and so did he."
    const w = smooth(0.84, 0.95, local)
    abhay.current.position.x = THREE.MathUtils.lerp(5.6, 1.35, w)
    abhay.current.visible = local > 0.8
    anim.current.walk = w > 0.01 && w < 0.99 ? 1 : 0
    abhay.current.rotation.y = w < 0.99 ? -Math.PI / 2 : THREE.MathUtils.lerp(abhay.current.rotation.y, -0.35, 0.1)
  })

  return (
    <Chapter id="ch6" size={[10, 8]}>
      <Offices tl={tl} />
      <Crowd
        members={colleagues}
        scaleOf={(i) => {
          const t = tl()
          const [a, b] = windows[i]
          if (t >= 0.999) return 0.0001
          return smooth(a, a + 0.03, t) * (1 - smooth(b - 0.03, b, t))
        }}
      />
      {/* what never changes: her desk, her chair, her */}
      <group position={[0, 0.08, 0.6]}>
        <Desk position={[0, 0, 0]} w={1.7} d={0.9} color="#A0714A" />
        <Chair position={[0, 0, -0.85]} seat={0.72} />
        <Character {...jyotiProps} pose="table" idle="breathe" seat={0.72} position={[0, 0, -0.85]} />
        <mesh position={[0, 0.8, 0.1]} material={mat('#333', { rough: 0.3 })}>
          <boxGeometry args={[0.6, 0.03, 0.4]} />
        </mesh>
        <mesh position={[0.6, 0.86, 0.15]} material={mat(PALETTE.foam)}>
          <cylinderGeometry args={[0.07, 0.06, 0.14, 12]} />
        </mesh>
        <Blob position={[0, 0.01, -0.3]} size={3} opacity={0.5} />
      </group>
      <Calendar />
      <Character ref={abhay} {...abhayProps} pose="stand" idle="breathe" anim={anim.current} position={[5.6, 0.08, 1.0]} rotation={[0, -Math.PI / 2, 0]} />
    </Chapter>
  )
}
