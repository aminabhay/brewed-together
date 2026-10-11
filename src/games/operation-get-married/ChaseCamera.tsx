import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gameConfig } from './config'
import { sim, useGame } from './GameState'
import { groom, bride } from './CharacterController'

const T = gameConfig.tuning
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => x * x * (3 - 2 * x)

/** Third-person chase camera: behind and above the groom, the bride visible ahead. */
export function ChaseCamera() {
  const { camera, size } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const pos = useMemo(() => new THREE.Vector3(0, 2.2, 4.2), [])
  const look = useMemo(() => new THREE.Vector3(0, 1.4, -6), [])
  const curLook = useMemo(() => new THREE.Vector3(0, 1.4, -6), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const phase = useGame.getState().phase
    const t = sim.phaseTime
    let fov = 58
    let rate = 5
    const speedF = clamp01((sim.vG - T.minSpeed) / (T.maxSpeed - T.minSpeed))
    // portrait phones see a narrow slice horizontally: back off for the two-shots
    const wide = size.width < size.height ? Math.min(1.9, 0.9 / (size.width / size.height)) : 1

    switch (phase) {
      case 'INTRO':
        pos.set(0.9, 1.7, groom.z + 3.4)
        look.set(0, 1.4, groom.z)
        break
      case 'READY': {
        // starts on the lonely groom, then rises to show the bride in the distance
        const k = ease(clamp01((t - 1.4) / 1.8))
        pos.set(THREE.MathUtils.lerp(0.9, 0, k), THREE.MathUtils.lerp(1.7, 3.0, k), groom.z + THREE.MathUtils.lerp(3.4, 6.2, k))
        // aim a little low so the groom sits higher in frame, clear of the TAP TO START button
        look.set(0, THREE.MathUtils.lerp(1.3, 0.35, k), THREE.MathUtils.lerp(groom.z, bride.z * 0.6, k))
        rate = 3
        break
      }
      case 'CHASE':
      case 'FINAL_CHASE': {
        const final = phase === 'FINAL_CHASE' ? 1 : 0
        const dist = 6.4 - speedF * 1.3 + sim.widen * 1.4 - final * 1.6 // push in when accelerating
        const h = 3.1 - speedF * 0.3 + sim.widen * 0.5 - final * 0.9 // lower for the final stretch
        pos.set(groom.x * 0.4, h, groom.z + dist)
        look.set(groom.x * 0.2, 1.2, groom.z - 9)
        fov = 58 + speedF * 5 + sim.widen * 6 + final * 4
        // a little shake at very high speed (never nauseating)
        if (sim.shake > 0.01) {
          pos.x += (Math.random() - 0.5) * 0.06 * sim.shake
          pos.y += (Math.random() - 0.5) * 0.05 * sim.shake
        }
        break
      }
      case 'CAUGHT': {
        // slow cinematic orbit around the couple
        const mid = tmp.set((groom.x + bride.x) / 2, 1.35, (groom.z + bride.z) / 2)
        const a = ease(clamp01(t / 4.5)) * 1.75
        const r = (4.4 - ease(clamp01(t / 4.5)) * 0.9) * wide
        pos.set(mid.x + Math.sin(a) * r, 1.9 + (wide - 1) * 0.6 - a * 0.15, mid.z + Math.cos(a) * r)
        look.copy(mid)
        fov = 50
        rate = 2.2
        break
      }
      case 'DATE_REVEAL':
      case 'COMPLETE': {
        // beyond the arch, looking back as they walk to it; slow push in
        const k = ease(clamp01(t / 7))
        pos.set(0, THREE.MathUtils.lerp(2.2, 1.55, k), sim.revealZ - THREE.MathUtils.lerp(9.5, 6.4, k) * Math.min(1.4, wide))
        look.set(0, THREE.MathUtils.lerp(1.6, 1.9, k), sim.revealZ + 1.2)
        fov = 48
        rate = 1.6
        break
      }
    }

    const s = 1 - Math.exp(-dt * rate)
    camera.position.lerp(pos, s)
    curLook.lerp(look, s)
    camera.lookAt(curLook)
    if (Math.abs(cam.fov - fov) > 0.05) {
      cam.fov += (fov - cam.fov) * s
      cam.updateProjectionMatrix()
    }
  })
  return null
}
