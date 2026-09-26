import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { BEATS, beatIndex } from '../scroll/beats'
import { scrollState, smooth as smoothstep } from '../scroll/scrollState'
import { useStore } from '../state/useStore'
import { wedding } from '../content/wedding'
import { mapToWorld } from './world/layout'

/** Shared with post-processing: where to focus and how much to blur. */
export const focus = { target: new THREE.Vector3(), range: 1, bokeh: 3 }

let gyro = { x: 0, y: 0 }
export function enableGyro() {
  window.addEventListener('deviceorientation', (e) => {
    gyro = { x: THREE.MathUtils.clamp((e.gamma ?? 0) / 30, -1, 1), y: THREE.MathUtils.clamp(((e.beta ?? 45) - 45) / 30, -1, 1) }
  })
}

/**
 * The camera rides two Catmull-Rom curves (position + look-at), one control point per beat.
 * Scroll → continuous beat position → curve parameter. FOV and DOF are interpolated per beat too.
 */
export function CameraRig() {
  const { camera, size } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const reduced = useStore((s) => s.reducedMotion)
  const introKey = useStore((s) => s.introKey)
  const entered = useStore((s) => s.entered)
  const intro = useRef({ v: 0 })
  const pointer = useRef({ x: 0, y: 0 })
  const fadeEl = useRef<HTMLElement | null>(null)

  const { posCurve, tgtCurve } = useMemo(() => {
    const posCurve = new THREE.CatmullRomCurve3(BEATS.map((b) => new THREE.Vector3(...b.cam.pos)), false, 'centripetal')
    const tgtCurve = new THREE.CatmullRomCurve3(BEATS.map((b) => new THREE.Vector3(...b.cam.target)), false, 'centripetal')
    return { posCurve, tgtCurve }
  }, [])

  // intro dolly: from an extreme close-up on the filament out to the first keyframe
  useEffect(() => {
    if (!entered) return
    intro.current.v = 0
    gsap.to(intro.current, { v: 1, duration: reduced ? 0.01 : 3.2, ease: 'power2.inOut', delay: 0.2 })
  }, [entered, introKey])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    fadeEl.current = document.getElementById('motion-fade')
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const pos = useMemo(() => new THREE.Vector3(), [])
  const tgt = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(), [])
  const smoothPos = useRef(new THREE.Vector3(...BEATS[0].cam.pos))
  const smoothTgt = useRef(new THREE.Vector3(...BEATS[0].cam.target))
  const smoothFocus = useRef(new THREE.Vector3(...BEATS[0].cam.target))
  const focusTgt = useMemo(() => new THREE.Vector3(), [])
  const mapFocusV = useRef(new THREE.Vector3())
  const mapFocusK = useRef(0)

  useFrame((_, dt) => {
    const n = BEATS.length
    let bp = scrollState.beatPos
    const i = Math.min(n - 2, Math.floor(bp))
    let f = bp - i

    // reduced motion: hold still, cut at mid-transition behind a gentle fade
    if (reduced) {
      const fade = 1 - Math.min(1, Math.abs(f - 0.5) * 4)
      if (fadeEl.current) fadeEl.current.style.opacity = String(f > 0.001 && f < 0.999 ? fade : 0)
      f = f < 0.5 ? 0 : 1
      bp = i + f
    }

    const u = bp / (n - 1)
    posCurve.getPoint(u, pos)
    tgtCurve.getPoint(u, tgt)
    const a = BEATS[i]
    const b = BEATS[Math.min(n - 1, i + 1)]
    const fov = THREE.MathUtils.lerp(a.cam.fov, b.cam.fov, f)
    focus.range = THREE.MathUtils.lerp(a.cam.focusRange, b.cam.focusRange, f)
    focus.bokeh = THREE.MathUtils.lerp(a.cam.bokeh, b.cam.bokeh, f)

    // narrow portrait screens: back off so the subject still fits horizontally
    const aspect = size.width / size.height
    if (aspect < 1) {
      const k = Math.min(1.9, 0.85 / aspect)
      tmp.subVectors(pos, tgt).multiplyScalar(k)
      pos.copy(tgt).add(tmp)
    }

    // leave room for the story card: shift framing sideways on desktop, upward on portrait
    const side = THREE.MathUtils.lerp(a.side ?? 0, b.side ?? 0, f)
    const portrait = size.width < size.height
    right.subVectors(tgt, pos).normalize().cross(camera.up).normalize()
    up.copy(camera.up)
    const shift = portrait ? up.multiplyScalar(-side * 0.7) : right.multiplyScalar(side)
    focusTgt.copy(tgt) // keep the subject itself in focus, not the shifted frame centre
    // beats may focus somewhere other than the look-at point (e.g. the steam title)
    for (let k = 0; k < 3; k++) {
      const oa = a.cam.focus ? a.cam.focus[k] - a.cam.target[k] : 0
      const ob = b.cam.focus ? b.cam.focus[k] - b.cam.target[k] : 0
      focusTgt.setComponent(k, focusTgt.getComponent(k) + oa + (ob - oa) * f)
    }
    pos.add(shift)
    tgt.add(shift)

    // map: a slow sweep across the town while its clockwork rises (think fantasy title sequence)
    const mapW = 1 - smoothstep(0.35, 1, Math.abs(bp - beatIndex('map')))
    if (mapW > 0 && !reduced) {
      // glide from the overview into a final frame on the venue
      // (desktop: venue in the left third, clear of the info card; portrait: centred above the card)
      const e = smoothstep(0.05, 0.95, scrollState.local.map ?? 0) * mapW
      const ev = wedding.events[0]
      if (ev) {
        const [vx, , vz] = mapToWorld(ev.mapPos[0], ev.mapPos[1])
        const off = portrait ? 0 : 14
        pos.lerp(tmp.set(vx + off, 24, vz + 36), e)
        tgt.lerp(tmp.set(vx + off, 1, vz - 4), e)
        focusTgt.lerp(tmp.set(vx, 1, vz), e)
      }
    }

    // intro: start a hair's breadth from the filament
    const iv = intro.current.v
    if (iv < 1) {
      tmp.subVectors(pos, tgt).multiplyScalar(0.18 + 0.82 * iv)
      pos.copy(tgt).add(tmp)
    }

    // map: tapping a pin glides the camera toward it
    const mf = useStore.getState().mapFocus
    const mapNear = Math.abs(bp - beatIndex('map')) < 0.5
    mapFocusK.current += ((mf !== null && mapNear ? 1 : 0) - mapFocusK.current) * Math.min(1, dt * 3)
    if (mf !== null) {
      const e = wedding.events[mf]
      if (e) mapFocusV.current.set(...mapToWorld(e.mapPos[0], e.mapPos[1]))
    }
    if (mapFocusK.current > 0.001) {
      tmp.copy(mapFocusV.current).add(new THREE.Vector3(0, 26, 22))
      pos.lerp(tmp, mapFocusK.current)
      tgt.lerp(mapFocusV.current, mapFocusK.current)
      focusTgt.lerp(mapFocusV.current, mapFocusK.current)
    }

    // parallax (mouse on desktop, gyroscope when enabled) and shake
    if (!reduced) {
      const dist = pos.distanceTo(tgt)
      const g = useStore.getState().gyro
      const px = g ? gyro.x : pointer.current.x
      const py = g ? gyro.y : pointer.current.y
      right.subVectors(tgt, pos).normalize().cross(camera.up).normalize()
      pos.addScaledVector(right, px * dist * 0.025)
      pos.y -= py * dist * 0.015
      const shakeAge = (performance.now() - useStore.getState().shakeAt) / 1000
      if (shakeAge < 0.45) {
        const k = (1 - shakeAge / 0.45) * 0.012 * dist
        pos.x += (Math.random() - 0.5) * k
        pos.y += (Math.random() - 0.5) * k
      }
    }

    // a touch of smoothing on top of Lenis keeps fast flicks cinematic
    const s = reduced ? 1 : 1 - Math.pow(0.0005, dt)
    smoothPos.current.lerp(pos, s)
    smoothTgt.current.lerp(tgt, s)
    camera.position.copy(smoothPos.current)
    camera.lookAt(smoothTgt.current)
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
    smoothFocus.current.lerp(focusTgt, s)
    focus.target.copy(smoothFocus.current)
    if (import.meta.env.DEV) (window as any).__cam = { pos: camera.position.toArray(), tgt: smoothTgt.current.toArray(), fov: cam.fov }
  })

  return null
}
