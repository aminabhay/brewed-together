import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { Character, abhayProps, jyotiProps, type Pose } from './Character'
import { ErrorBoundary } from '../../ui/ErrorBoundary'

/**
 * Abhay & Jyoti as their rigged, animated models (public/models/*.glb).
 * Clips in both files: Idle, Walk, Wave, HandsOnHips, Present, LookAround, BindPose,
 * plus ArmsCrossed (Abhay) and AdjustGlasses (Jyoti).
 * There is no sitting clip, so `sit` bends the hip/knee bones on top of Idle.
 */
export type Who = 'abhay' | 'jyoti'
export type CoupleAction = 'Idle' | 'Walk' | 'Wave' | 'HandsOnHips' | 'Present' | 'LookAround' | 'ArmsCrossed' | 'AdjustGlasses'

const BASE = import.meta.env.BASE_URL
const MODELS: Record<Who, { url: string; modelHeight: number; kneeToSole: number; height: number; flourishes: CoupleAction[]; fairer?: boolean }> = {
  // modelHeight / kneeToSole are measured from the .glb bind pose; height = how tall they stand in the miniatures.
  // Abhay is kept clearly taller than Jyoti.
  abhay: { url: `${BASE}models/abhay.glb`, modelHeight: 2.073, kneeToSole: 0.542, height: 1.8, flourishes: ['LookAround', 'ArmsCrossed'] },
  jyoti: { url: `${BASE}models/jyoti.glb`, modelHeight: 1.526, kneeToSole: 0.387, height: 1.5, flourishes: ['LookAround', 'AdjustGlasses'], fairer: true },
}

/** Seat height at which this character's feet rest on the floor (legs are stylised and short). */
export function seatHeight(who: Who, size = 1) {
  const m = MODELS[who]
  return m.kneeToSole * (m.height / m.modelHeight) * size - 0.03
}

/**
 * Lighten the skin tones in a vertex-coloured model (warm tans only; hair, clothes and jewellery are
 * outside this hue/lightness band). Runs once per source geometry.
 */
/** Jyoti's skin tone: lightness of shadows → highlights, and saturation. Tweak freely; edits apply live. */
const SKIN = { shadow: 0.66, highlight: 0.8, saturation: 0.46 }

export function fairerSkin(scene: THREE.Object3D) {
  const c = new THREE.Color()
  const hsl = { h: 0, s: 0, l: 0 }
  const key = JSON.stringify(SKIN)
  scene.traverse((o) => {
    const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined
    const col = g?.getAttribute('color') as THREE.BufferAttribute | undefined
    if (!g || !col || g.userData.skinKey === key) return
    // always remap from the model's original colours, so changing SKIN takes effect without a reload
    const original: Float32Array = (g.userData.originalColors ??= Float32Array.from(col.array as ArrayLike<number>))
    g.userData.skinKey = key
    for (let i = 0; i < col.count; i++) {
      c.setRGB(original[i * 3], original[i * 3 + 1], original[i * 3 + 2], THREE.LinearSRGBColorSpace)
      c.getHSL(hsl, THREE.SRGBColorSpace)
      const deg = hsl.h * 360
      if (deg >= 12 && deg <= 30 && hsl.s >= 0.25 && hsl.s <= 0.6 && hsl.l >= 0.45 && hsl.l <= 0.68) {
        // remap the tan range onto a fair, warm tone, keeping the model's light-to-shadow shading
        const l = SKIN.shadow + ((hsl.l - 0.45) / 0.23) * (SKIN.highlight - SKIN.shadow)
        const sat = SKIN.saturation + (hsl.s - 0.25) * 0.35
        c.setHSL(0.07, sat, l, THREE.SRGBColorSpace)
      }
      col.setXYZ(i, c.r, c.g, c.b)
    }
    col.needsUpdate = true
  })
}

/**
 * Give one placement its own geometry and recolour the pink kurti (pinks between knee and shoulder
 * height in the bind pose, so lips/face stay untouched), keeping the model's shading.
 */
export function recolourKurti(model: THREE.Object3D, colour: string) {
  const target = { h: 0, s: 0, l: 0 }
  new THREE.Color(colour).getHSL(target, THREE.SRGBColorSpace)
  const c = new THREE.Color()
  const hsl = { h: 0, s: 0, l: 0 }
  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry.getAttribute('color')) return
    mesh.geometry = mesh.geometry.clone()
    const col = mesh.geometry.getAttribute('color') as THREE.BufferAttribute
    const pos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < col.count; i++) {
      const y = pos.getY(i)
      if (y < 0.3 || y > 1.24) continue
      c.setRGB(col.getX(i), col.getY(i), col.getZ(i), THREE.LinearSRGBColorSpace)
      c.getHSL(hsl, THREE.SRGBColorSpace)
      const deg = hsl.h * 360
      const pink = (deg >= 340 || deg <= 10) && hsl.s >= 0.2 && hsl.l >= 0.25
      if (!pink) continue
      c.setHSL(target.h, THREE.MathUtils.clamp(target.s + (hsl.s - 0.5) * 0.4, 0, 1), THREE.MathUtils.clamp(target.l * (hsl.l / 0.72), 0, 0.92), THREE.SRGBColorSpace)
      col.setXYZ(i, c.r, c.g, c.b)
    }
    col.needsUpdate = true
  })
}

useGLTF.preload(MODELS.abhay.url)
useGLTF.preload(MODELS.jyoti.url)

export interface CoupleProps {
  who: Who
  /** the clip to play (Walk is chosen automatically while anim.walk > 0) */
  action?: CoupleAction
  /** seat height above the group origin: sits the character down */
  sit?: number
  /** arm pose layered on top of Idle: forearms resting on a table, or holding a phone */
  hold?: 'table' | 'phone'
  /** for hold="table": [upper arm, forearm] forward rotation in radians, to put the forearms on the table top */
  reach?: [number, number]
  /** now and then play a character flourish (LookAround, AdjustGlasses, ArmsCrossed) */
  flourish?: boolean
  anim?: { walk?: number; action?: CoupleAction }
  /** recolour Jyoti's (pink) kurti for this placement only, e.g. '#4F8A4B' for a green kurti */
  kurti?: string
  /** size multiplier on top of the character's standard height */
  size?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

const qx = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a)
const qz = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a)
const SIT_THIGH = qx(-Math.PI / 2 + 0.08)
const SIT_SHIN = qx(Math.PI / 2 - 0.15)
const PHONE_UPPER_L = qx(-0.45).multiply(qz(0.3))
const PHONE_UPPER_R = qx(-0.45).multiply(qz(-0.3))
const PHONE_FORE = qx(-1.35)

function isShown(o: THREE.Object3D | null) {
  while (o) {
    if (!o.visible) return false
    o = o.parent
  }
  return true
}

const CoupleModel = forwardRef<THREE.Group, CoupleProps>(function CoupleModel(
  { who, action = 'Idle', sit, hold, reach = [0.75, 0.85], flourish = false, anim, size = 1, kurti, position, rotation },
  ref,
) {
  const cfg = MODELS[who]
  const { scene, animations } = useGLTF(cfg.url)
  const root = useRef<THREE.Group>(null!)
  useImperativeHandle(ref, () => root.current)

  // each placement gets its own skeleton + mixer
  const { model, mixer, actions, bones, rest, hipY } = useMemo(() => {
    if (cfg.fairer) fairerSkin(scene)
    const model = cloneSkinned(scene) as THREE.Object3D
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.frustumCulled = false // animated bounds differ from bind pose
    })
    if (kurti) recolourKurti(model, kurti)
    const mixer = new THREE.AnimationMixer(model)
    const actions = Object.fromEntries(animations.map((c) => [c.name, mixer.clipAction(c)])) as Record<string, THREE.AnimationAction>
    const bone = (n: string) => model.getObjectByName(n) as THREE.Bone | undefined
    const bones = {
      thighL: bone('Thigh_L'),
      thighR: bone('Thigh_R'),
      shinL: bone('Shin_L'),
      shinR: bone('Shin_R'),
      upperL: bone('UpperArm_L'),
      upperR: bone('UpperArm_R'),
      foreL: bone('Forearm_L'),
      foreR: bone('Forearm_R'),
    }
    const hips = bone('Hips')
    // rest poses of the bones we layer rotations onto (clips don't key every bone every frame)
    const rest = Object.values(bones)
      .filter((b): b is THREE.Bone => !!b)
      .map((b) => [b, b.quaternion.clone()] as const)
    return { model, mixer, actions, bones, rest, hipY: hips ? hips.position.y : cfg.modelHeight * 0.5 }
  }, [scene, animations, kurti])

  useEffect(() => () => void mixer.stopAllAction(), [mixer])

  const scale = (cfg.height / cfg.modelHeight) * size
  const [tableUpper, tableFore] = useMemo(() => [qx(-reach[0]), qx(-reach[1])], [reach[0], reach[1]])
  const state = useRef({ current: '' as string, flourishUntil: 0, nextFlourish: 3 + Math.random() * 6, flourishName: '' })

  const play = (name: string, fade = 0.35) => {
    const s = state.current
    if (s.current === name) return
    const next = actions[name]
    if (!next) return
    const prev = actions[s.current]
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play()
    if (prev) prev.crossFadeTo(next, fade, true)
    s.current = name
  }

  useFrame(({ clock }, dt) => {
    if (!isShown(root.current)) return
    const t = clock.elapsedTime
    const s = state.current

    // choose the clip: walking > flourish > requested action
    let want: string = anim?.action ?? action
    if ((anim?.walk ?? 0) > 0.5) want = 'Walk'
    else if (flourish && want === 'Idle') {
      if (t > s.nextFlourish && !s.flourishName) {
        s.flourishName = cfg.flourishes[Math.floor(Math.random() * cfg.flourishes.length)]
        s.flourishUntil = t + (actions[s.flourishName]?.getClip().duration ?? 3)
      }
      if (s.flourishName && t > s.flourishUntil) {
        s.flourishName = ''
        s.nextFlourish = t + 7 + Math.random() * 8
      }
      if (s.flourishName) want = s.flourishName
    }
    play(want)
    // reset layered bones first, so our offsets never accumulate on bones a clip leaves untouched
    for (const [b, q] of rest) b.quaternion.copy(q)
    mixer.update(Math.min(dt, 0.1))

    // pose layers on top of the clip
    const b = bones
    if (sit !== undefined) {
      b.thighL?.quaternion.multiply(SIT_THIGH)
      b.thighR?.quaternion.multiply(SIT_THIGH)
      b.shinL?.quaternion.multiply(SIT_SHIN)
      b.shinR?.quaternion.multiply(SIT_SHIN)
    }
    if (s.current === 'Idle' || s.current === 'LookAround') {
      if (hold === 'table') {
        b.upperL?.quaternion.multiply(tableUpper)
        b.upperR?.quaternion.multiply(tableUpper)
        b.foreL?.quaternion.multiply(tableFore)
        b.foreR?.quaternion.multiply(tableFore)
      } else if (hold === 'phone') {
        b.upperL?.quaternion.multiply(PHONE_UPPER_L)
        b.upperR?.quaternion.multiply(PHONE_UPPER_R)
        b.foreL?.quaternion.multiply(PHONE_FORE)
        b.foreR?.quaternion.multiply(PHONE_FORE)
      }
    }
  })

  // seated: drop the hips to the seat
  const y = sit !== undefined ? sit + 0.05 - hipY * scale : 0
  return (
    <group ref={root} position={position} rotation={rotation}>
      <primitive object={model} position={[0, y, 0]} scale={scale} />
    </group>
  )
})

/** Placeholder pose used while the model streams in (or if it fails to load). */
function fallbackPose(p: CoupleProps): Pose {
  if (p.sit !== undefined) return 'table'
  if (p.hold === 'phone') return 'phone'
  if (p.action === 'Present') return 'point'
  if (p.action === 'Wave') return 'wave'
  return 'stand'
}

export const Couple = forwardRef<THREE.Group, CoupleProps>(function Couple(props, ref) {
  const look = props.who === 'abhay' ? abhayProps : jyotiProps
  const fallback = (
    <Character ref={ref} {...look} pose={fallbackPose(props)} seat={props.sit !== undefined ? props.sit / (props.size ?? 1) : undefined} scale={props.size} anim={props.anim} position={props.position} rotation={props.rotation} />
  )
  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <CoupleModel ref={ref} {...props} />
      </Suspense>
    </ErrorBoundary>
  )
})
