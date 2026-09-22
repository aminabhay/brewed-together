import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { makeSteamMaterial } from '../shaders/steam'

interface Props {
  position?: [number, number, number]
  width?: number
  height?: number
  color?: string
  opacity?: number
  mask?: THREE.Texture
  /** Called every frame; returns { form, opacity } so parents can drive the steam without re-rendering. */
  drive?: () => { form?: number; opacity?: number }
  billboard?: boolean
}

let pointerX = 0
if (typeof window !== 'undefined')
  window.addEventListener('pointermove', (e) => (pointerX = (e.clientX / window.innerWidth) * 2 - 1), { passive: true })

export function Steam({ position = [0, 0, 0], width = 0.3, height = 0.8, color, opacity = 0.5, mask, drive, billboard = true }: Props) {
  const material = useMemo(() => makeSteamMaterial(color), [color])
  const mesh = useRef<THREE.Mesh>(null)
  useEffect(() => {
    material.uniforms.uMask.value = mask ?? null
    material.uniforms.uHasMask.value = mask ? 1 : 0
  }, [mask, material])
  useEffect(() => () => material.dispose(), [material])
  useFrame(({ clock, camera }) => {
    if (!mesh.current?.visible) return
    const u = material.uniforms
    u.uTime.value = clock.elapsedTime
    u.uWind.value += (pointerX - u.uWind.value) * 0.03
    const d = drive?.()
    u.uForm.value = d?.form ?? 0
    u.uOpacity.value = opacity * (d?.opacity ?? 1)
    if (billboard) {
      // yaw-only billboard so the column stays upright
      const p = mesh.current.getWorldPosition(tmp)
      const parentYaw = mesh.current.parent ? e.setFromQuaternion(mesh.current.parent.getWorldQuaternion(q), 'YXZ').y : 0
      mesh.current.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z) - parentYaw
    }
  })
  return (
    <mesh ref={mesh} position={[position[0], position[1] + height / 2, position[2]]} material={material} renderOrder={10}>
      <planeGeometry args={[width, height, 1, 8]} />
    </mesh>
  )
}
const tmp = new THREE.Vector3()
const q = new THREE.Quaternion()
const e = new THREE.Euler()
