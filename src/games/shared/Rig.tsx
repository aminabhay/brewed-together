import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { fairerSkin, recolourKurti } from '../../three/components/Couple'
import { Character } from '../../three/components/Character'
import { ErrorBoundary } from '../../ui/ErrorBoundary'
import type { Pose } from './pose'

/**
 * A rigged GLB character driven by a Pose.
 * Clips come from the file (Idle, Walk, Wave, Present, HandsOnHips, LookAround, …); running,
 * looking back, crouching, reaching and stumbling are procedural layers on the same bones,
 * so any model with the standard bone names (Hips, Spine, Chest, Head, UpperArm_L/R, Forearm_L/R,
 * Thigh_L/R, Shin_L/R) gets the full set of comedy animation.
 */
export interface RigProps {
  url: string
  /** standing height in metres */
  height: number
  pose: Pose
  fairSkin?: boolean
  outfit?: string | null
  /** fallback figure colours while loading / if the model fails */
  placeholder: { shirt: string; pants: string; hair: 'curly' | 'bun' | 'short' | 'long'; dress?: boolean; glasses?: boolean; beard?: boolean }
}

const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)
const qa = new THREE.Quaternion()
const tmpQ = new THREE.Quaternion()
const rot = (axis: THREE.Vector3, a: number) => qa.setFromAxisAngle(axis, a)

const BONES = ['Hips', 'Spine', 'Chest', 'Head', 'UpperArm_L', 'UpperArm_R', 'Forearm_L', 'Forearm_R', 'Thigh_L', 'Thigh_R', 'Shin_L', 'Shin_R'] as const
type BoneName = (typeof BONES)[number]

function Model({ url, height, pose, fairSkin, outfit }: Omit<RigProps, 'placeholder'>) {
  const { scene, animations } = useGLTF(url)
  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)

  const rig = useMemo(() => {
    if (fairSkin) fairerSkin(scene)
    const model = cloneSkinned(scene) as THREE.Object3D
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.frustumCulled = false
    })
    if (outfit) recolourKurti(model, outfit)
    const box = new THREE.Box3().setFromObject(model)
    const modelHeight = Math.max(0.5, box.max.y - box.min.y)
    const mixer = new THREE.AnimationMixer(model)
    const actions = Object.fromEntries(animations.map((c) => [c.name, mixer.clipAction(c)])) as Record<string, THREE.AnimationAction>
    const bones = {} as Record<BoneName, THREE.Bone | undefined>
    const rest = {} as Record<BoneName, THREE.Quaternion>
    for (const n of BONES) {
      const b = model.getObjectByName(n) as THREE.Bone | undefined
      bones[n] = b
      rest[n] = b ? b.quaternion.clone() : new THREE.Quaternion()
    }
    return { model, mixer, actions, bones, rest, scale: height / modelHeight }
  }, [scene, animations, fairSkin, outfit, height])

  useEffect(() => () => void rig.mixer.stopAllAction(), [rig])

  const state = useRef({ current: '', phase: Math.random() * 6 })
  const target = useMemo(() => new THREE.Quaternion(), [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const { mixer, actions, bones: b, rest } = rig
    const p = pose
    root.current.visible = p.visible
    if (!p.visible) return
    root.current.position.set(p.x, p.y, p.z)
    // turn smoothly towards the requested yaw
    const yaw = root.current.rotation.y
    let dy = p.yaw - yaw
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    root.current.rotation.y = yaw + dy * Math.min(1, dt * 10)

    // base clip (cross-faded)
    const s = state.current
    const want = actions[p.clip] ? p.clip : 'Idle'
    if (s.current !== want && actions[want]) {
      const next = actions[want]
      next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play()
      const prev = actions[s.current]
      if (prev) prev.crossFadeTo(next, 0.3, true)
      s.current = want
    }
    for (const n of BONES) b[n]?.quaternion.copy(rest[n])
    mixer.update(dt)

    // ── procedural run cycle, blended over the clip by p.run
    const w = p.run
    const speedF = Math.min(1, p.speed / 9)
    s.phase += dt * Math.PI * 2 * Math.max(1.4, p.speed / 1.55) * (1 + p.rapid * 0.55)
    const ph = s.phase
    const sin = Math.sin(ph)
    if (w > 0.001) {
      const A = 0.55 + speedF * 0.4 + p.rapid * 0.35 // leg swing
      const B = 0.5 + speedF * 0.5 + p.rapid * 1.2 // arm swing (windmills when frantic)
      const lean = 0.12 + speedF * 0.22 + p.rapid * 0.12
      const set = (n: BoneName, q: THREE.Quaternion) => {
        const bone = b[n]
        if (!bone) return
        target.copy(rest[n]).multiply(q)
        bone.quaternion.slerp(target, w)
      }
      set('Thigh_L', rot(X, -sin * A))
      set('Thigh_R', rot(X, sin * A))
      set('Shin_L', rot(X, 0.25 + 0.95 * Math.max(0, Math.sin(ph + 1.3))))
      set('Shin_R', rot(X, 0.25 + 0.95 * Math.max(0, Math.sin(ph + 1.3 + Math.PI))))
      set('UpperArm_L', tmpQ.setFromAxisAngle(X, sin * B).multiply(rot(Z, 0.12)))
      set('UpperArm_R', tmpQ.setFromAxisAngle(X, -sin * B).multiply(rot(Z, -0.12)))
      set('Forearm_L', rot(X, -1.15))
      set('Forearm_R', rot(X, -1.15))
      set('Spine', rot(X, lean))
      set('Head', rot(X, -lean * 0.6))
    }
    // look back over the shoulder
    if (p.lookBack > 0.001) {
      b.Chest?.quaternion.multiply(rot(Y, p.lookBack * 0.75))
      b.Head?.quaternion.multiply(rot(Y, p.lookBack * 0.85))
    }
    // reach out for the chai
    if (p.reach > 0.001 && b.UpperArm_R) {
      target.copy(rest.UpperArm_R).multiply(rot(X, -1.45))
      b.UpperArm_R.quaternion.slerp(target, p.reach)
      if (b.Forearm_R) b.Forearm_R.quaternion.slerp(tmpQ.copy(rest.Forearm_R).multiply(rot(X, -0.2)), p.reach)
    }
    // crouch / duck
    if (p.crouch > 0.001) {
      b.Thigh_L?.quaternion.multiply(rot(X, -0.9 * p.crouch))
      b.Thigh_R?.quaternion.multiply(rot(X, -0.9 * p.crouch))
      b.Shin_L?.quaternion.multiply(rot(X, 1.5 * p.crouch))
      b.Shin_R?.quaternion.multiply(rot(X, 1.5 * p.crouch))
      b.Spine?.quaternion.multiply(rot(X, 0.55 * p.crouch))
    }
    // body: bob while running, sink when crouching, wobble when stumbling
    const bob = Math.abs(sin) * 0.06 * w * (1 + speedF)
    body.current.position.y = bob - p.crouch * 0.32 * (height / 1.8)
    body.current.rotation.x = p.stumble * Math.sin(ph * 2.2) * 0.35 + p.stumble * 0.2
    body.current.rotation.z = p.stumble * Math.sin(ph * 1.7) * 0.25
  })

  return (
    <group ref={root}>
      <group ref={body}>
        <primitive object={rig.model} scale={rig.scale} />
      </group>
    </group>
  )
}

/** Simple stand-in figure (the site's procedural character) while loading / if the GLB is missing. */
function Placeholder({ pose, height, placeholder }: Pick<RigProps, 'pose' | 'height' | 'placeholder'>) {
  const g = useRef<THREE.Group>(null!)
  const anim = useRef({ walk: 0 })
  useFrame(() => {
    g.current.visible = pose.visible
    g.current.position.set(pose.x, pose.y, pose.z)
    g.current.rotation.y = pose.yaw
    anim.current.walk = pose.run
  })
  return (
    <group ref={g}>
      <Character {...placeholder} pose="stand" anim={anim.current} scale={height / 1.6} />
    </group>
  )
}

export function Rig(props: RigProps) {
  const fallback = <Placeholder pose={props.pose} height={props.height} placeholder={props.placeholder} />
  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Model url={props.url} height={props.height} pose={props.pose} fairSkin={props.fairSkin} outfit={props.outfit} />
      </Suspense>
    </ErrorBoundary>
  )
}
