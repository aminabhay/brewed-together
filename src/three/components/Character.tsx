import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mat, PALETTE } from './materials'
import { wedding } from '../../content/wedding'

export type Pose = 'sit' | 'stand' | 'point' | 'phone' | 'table' | 'wave'
export type Hair = 'short' | 'long' | 'curly' | 'bun'
export type Idle = 'breathe' | 'laugh' | 'tilt' | 'none'

export interface CharacterProps {
  shirt: string
  pants?: string
  hair?: Hair
  glasses?: boolean
  dress?: boolean
  beard?: boolean
  /** colour of a headband worn across the hairline */
  headband?: string
  skin?: string
  /** 'floral' wraps the top in a dark floral print */
  print?: 'floral'
  pose?: Pose
  idle?: Idle
  /** seat height in world units (only for sitting poses) */
  seat?: number
  /** mutable animation inputs read every frame (no re-render): walk 0..1 swings legs */
  anim?: { walk?: number }
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

const S = 0.8 // global character scale: standing ≈ 1.6 world units tall

// shared geometries
const G = {
  torso: new THREE.CapsuleGeometry(0.27, 0.42, 6, 14),
  limb: new THREE.CapsuleGeometry(0.1, 0.36, 4, 10),
  arm: new THREE.CapsuleGeometry(0.075, 0.38, 4, 10),
  hand: new THREE.SphereGeometry(0.08, 10, 8),
  head: new THREE.SphereGeometry(0.26, 20, 16),
  hairCap: new THREE.SphereGeometry(0.278, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
  pony: new THREE.CapsuleGeometry(0.08, 0.34, 4, 8),
  bun: new THREE.SphereGeometry(0.11, 10, 8),
  eye: new THREE.SphereGeometry(0.028, 8, 6),
  lens: new THREE.TorusGeometry(0.065, 0.012, 6, 18),
  bridge: new THREE.BoxGeometry(0.06, 0.012, 0.012),
  skirt: new THREE.CylinderGeometry(0.26, 0.42, 0.5, 16, 1, true),
  shoe: new THREE.SphereGeometry(0.11, 10, 8),
  curl: new THREE.SphereGeometry(0.09, 8, 6),
  hairBack: new THREE.SphereGeometry(0.3, 16, 12),
  topBun: new THREE.SphereGeometry(0.12, 12, 10),
  band: new THREE.TorusGeometry(0.281, 0.03, 6, 28),
  // lower-front band of the head: cheeks and chin
  beard: new THREE.SphereGeometry(0.268, 18, 10, Math.PI / 2 - 1.0, 2.0, Math.PI * 0.6, Math.PI * 0.32),
}

/** Shoulder-length curls around the back and sides of the head (head-local positions). */
const CURLS: [number, number, number][] = []
for (let i = 0; i < 14; i++) {
  const a = Math.PI * 0.35 + (i / 13) * Math.PI * 1.3 // sides + back, never the face
  const layer = i % 3
  CURLS.push([Math.cos(a) * 0.27, 0.12 - layer * 0.12, -Math.abs(Math.sin(a)) * 0.2 - 0.04])
}

let floralMat: THREE.MeshStandardMaterial | null = null
function floral() {
  if (floralMat) return floralMat
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#231a1c'
  ctx.fillRect(0, 0, 256, 256)
  const cols = ['#D9983A', '#E8E0EE', '#8E3F7A', '#C98B4E', '#B9A6C9']
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const r = 3 + Math.random() * 7
    ctx.fillStyle = cols[i % cols.length]
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2
      ctx.beginPath()
      ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.7, r * 0.35, a, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 2)
  floralMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })
  return floralMat
}

export const Character = forwardRef<THREE.Group, CharacterProps>(function Character(
  { shirt, pants = '#3A3F4B', hair = 'short', glasses = false, dress = false, beard = false, headband, skin: skinColour = PALETTE.skin, print, pose = 'stand', idle = 'breathe', seat = 0.72, anim, position, rotation, scale = 1 },
  ref,
) {
  const sitting = pose === 'sit' || pose === 'table'
  const hips = sitting ? seat / S : 0.62
  const root = useRef<THREE.Group>(null!)
  useImperativeHandle(ref, () => root.current)
  const torso = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const seed = useMemo(() => Math.random() * 100, [])

  const skin = mat(skinColour, { rough: 0.7 })
  const shirtM = print === 'floral' ? floral() : mat(shirt, { rough: 0.85 })
  const pantsM = mat(pants, { rough: 0.9 })
  const hairM = mat(PALETTE.hair, { rough: 0.6 })
  const dark = mat('#1a120e', { rough: 0.4 })
  const frame = mat('#111111', { rough: 0.3, metal: 0.2 })

  const armRot = (side: 1 | -1): [number, number, number] => {
    switch (pose) {
      case 'point':
        return side === 1 ? [-2.0, 0, 0.25] : [0, 0, -0.12]
      case 'wave':
        return side === 1 ? [0, 0, 2.5] : [0, 0, -0.12]
      case 'table':
        return [-1.05, 0, side * -0.25]
      case 'phone':
        return [-1.25, 0, side * -0.45]
      default:
        return [0, 0, side * 0.12]
    }
  }

  useFrame(({ clock }) => {
    const g = torso.current
    if (!g || !head.current) return
    const t = clock.elapsedTime + seed
    let o: THREE.Object3D | null = root.current
    while (o) {
      if (!o.visible) return
      o = o.parent
    }
    const breathe = idle === 'none' ? 0 : Math.sin(t * 1.6) * 0.012
    g.scale.set(1, 1 + breathe, 1)
    let tilt = 0
    let bob = 0
    if (idle === 'tilt') tilt = Math.sin(t * 0.5) > 0.6 ? Math.sin(t * 0.5 - 0.6) * 0.35 : 0
    if (idle === 'laugh') {
      const phase = t % 7
      if (phase < 1.4) {
        bob = Math.abs(Math.sin(phase * 14)) * 0.035 * (1 - phase / 1.4)
        tilt = -0.18 * Math.sin((phase / 1.4) * Math.PI)
      } else tilt = Math.sin(t * 0.7) * 0.06
    }
    head.current.rotation.z = tilt
    head.current.rotation.x = idle === 'laugh' ? -bob * 3 : 0
    g.position.y = bob
    const w = anim?.walk ?? 0
    if (legL.current && legR.current) {
      const swing = Math.sin(t * 9) * 0.45 * w
      legL.current.rotation.x = swing
      legR.current.rotation.x = -swing
    }
    if (armR.current && pose === 'wave') armR.current.rotation.x = Math.sin(t * 6) * 0.25
  })

  return (
    <group ref={root} position={position} rotation={rotation} scale={S * scale}>
      {/* legs */}
      {sitting ? (
        ([-1, 1] as const).map((s) => (
          <group key={s}>
            <mesh geometry={G.limb} material={pantsM} position={[s * 0.13, hips, 0.22]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={G.limb} material={pantsM} position={[s * 0.13, hips / 2, 0.44]} scale={[1, hips / 0.56, 1]} />
            <mesh geometry={G.shoe} material={dark} position={[s * 0.13, 0.06, 0.5]} scale={[1, 0.6, 1.4]} />
          </group>
        ))
      ) : (
        <>
          <group ref={legL} position={[-0.13, hips, 0]}>
            <mesh geometry={G.limb} material={pantsM} position={[0, -0.3, 0]} />
            <mesh geometry={G.shoe} material={dark} position={[0, -0.56, 0.05]} scale={[1, 0.6, 1.4]} />
          </group>
          <group ref={legR} position={[0.13, hips, 0]}>
            <mesh geometry={G.limb} material={pantsM} position={[0, -0.3, 0]} />
            <mesh geometry={G.shoe} material={dark} position={[0, -0.56, 0.05]} scale={[1, 0.6, 1.4]} />
          </group>
        </>
      )}

      <group ref={torso}>
        {dress && <mesh geometry={G.skirt} material={shirtM} position={[0, hips + 0.12, sitting ? 0.06 : 0]} />}
        <mesh geometry={G.torso} material={shirtM} position={[0, hips + 0.42, 0]} />

        {/* arms: pivot at the shoulders */}
        {([-1, 1] as const).map((s) => (
          <group key={s} ref={s === 1 ? armR : undefined} position={[s * 0.34, hips + 0.72, 0]} rotation={armRot(s)}>
            <mesh geometry={G.arm} material={shirtM} position={[0, -0.24, 0]} />
            <mesh geometry={G.hand} material={skin} position={[0, -0.5, 0]} />
          </group>
        ))}

        {/* head: pivot at the neck */}
        <group ref={head} position={[0, hips + 0.94, 0]}>
          <mesh geometry={G.head} material={skin} position={[0, 0.24, 0]} />
          <mesh geometry={G.hairCap} material={hairM} position={[0, 0.25, -0.02]} rotation={[-0.35, 0, 0]} scale={hair === 'curly' ? 1.08 : 1} />
          {hair === 'long' && (
            <>
              <mesh geometry={G.bun} material={hairM} position={[0, 0.34, -0.26]} />
              <mesh geometry={G.pony} material={hairM} position={[0, 0.06, -0.3]} rotation={[0.25, 0, 0]} />
            </>
          )}
          {hair === 'bun' && <mesh geometry={G.topBun} material={hairM} position={[0, 0.54, -0.1]} scale={[1.1, 0.9, 1]} />}
          {hair === 'curly' && (
            <>
              <mesh geometry={G.hairBack} material={hairM} position={[0, 0.2, -0.1]} scale={[1.02, 1, 0.9]} />
              {CURLS.map((p, i) => (
                <mesh key={i} geometry={G.curl} material={hairM} position={[p[0], 0.24 + p[1], p[2]]} scale={1 + (i % 3) * 0.15} />
              ))}
            </>
          )}
          {headband && <mesh geometry={G.band} material={mat(headband, { rough: 0.9 })} position={[0, 0.33, -0.03]} rotation={[Math.PI / 2 - 0.45, 0, 0]} />}
          {beard && <mesh geometry={G.beard} material={hairM} position={[0, 0.24, 0]} />}
          <mesh geometry={G.eye} material={dark} position={[-0.09, 0.25, 0.235]} />
          <mesh geometry={G.eye} material={dark} position={[0.09, 0.25, 0.235]} />
          {glasses && (
            <group position={[0, 0.25, 0.25]}>
              <mesh geometry={G.lens} material={frame} position={[-0.09, 0, 0]} scale={[1.15, 0.85, 1]} />
              <mesh geometry={G.lens} material={frame} position={[0.09, 0, 0]} scale={[1.15, 0.85, 1]} />
              <mesh geometry={G.bridge} material={frame} />
            </group>
          )}
        </group>
      </group>
    </group>
  )
})

/** The couple, pre-configured so they look identical in every scene (see wedding.theme). */
export const abhayProps: Partial<CharacterProps> & { shirt: string } = {
  shirt: wedding.theme.abhayColour,
  pants: wedding.theme.abhayPants,
  hair: 'curly',
  beard: true,
  headband: wedding.theme.abhayHeadband,
  skin: wedding.theme.abhaySkin,
  glasses: false,
}
export const jyotiProps: Partial<CharacterProps> & { shirt: string } = {
  shirt: wedding.theme.jyotiColour,
  pants: wedding.theme.jyotiPants,
  hair: 'bun',
  glasses: true,
  dress: true,
  print: 'floral',
  skin: wedding.theme.jyotiSkin,
}
