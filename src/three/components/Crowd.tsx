import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from './materials'

export interface CrowdMember {
  position: [number, number, number]
  rotationY?: number
  color: string
  seated?: boolean
}

const body = new THREE.CapsuleGeometry(0.22, 0.34, 4, 10)
const head = new THREE.SphereGeometry(0.21, 12, 10)
const hair = new THREE.SphereGeometry(0.222, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55)
const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.85 })
const skinMat = new THREE.MeshStandardMaterial({ color: PALETTE.skin, roughness: 0.7 })
const hairMat = new THREE.MeshStandardMaterial({ color: PALETTE.hair, roughness: 0.6 })

/**
 * Instanced background figures (students, colleagues): 3 draw calls for any number of people.
 * `scaleOf(i, t)` lets a parent pop figures in/out every frame (used by the time-lapse).
 */
export function Crowd({ members, scaleOf }: { members: CrowdMember[]; scaleOf?: (i: number, t: number) => number }) {
  const b = useRef<THREE.InstancedMesh>(null!)
  const h = useRef<THREE.InstancedMesh>(null!)
  const hr = useRef<THREE.InstancedMesh>(null!)
  const n = members.length
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const write = (t: number) => {
    members.forEach((m, i) => {
      const s = scaleOf ? scaleOf(i, t) : 1
      const base = (m.seated ? 0.55 : 0.8) * 0.8
      const bob = Math.sin(t * 1.5 + i) * 0.01
      const [x, y, z] = m.position
      tmp.rotation.set(0, m.rotationY ?? 0, 0)
      tmp.scale.setScalar(Math.max(0.0001, s) * 0.8)
      tmp.position.set(x, y + base * s + bob, z)
      tmp.updateMatrix()
      b.current.setMatrixAt(i, tmp.matrix)
      tmp.position.set(x, y + (base + 0.62) * s + bob, z)
      tmp.updateMatrix()
      h.current.setMatrixAt(i, tmp.matrix)
      tmp.position.y += 0.01 * s
      tmp.updateMatrix()
      hr.current.setMatrixAt(i, tmp.matrix)
    })
    b.current.instanceMatrix.needsUpdate = h.current.instanceMatrix.needsUpdate = hr.current.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    members.forEach((m, i) => b.current.setColorAt(i, color.set(m.color)))
    if (b.current.instanceColor) b.current.instanceColor.needsUpdate = true
    write(0)
  }, [members])

  useFrame(({ clock }) => {
    let o: THREE.Object3D | null = b.current
    while (o) {
      if (!o.visible) return
      o = o.parent
    }
    write(clock.elapsedTime)
  })

  return (
    <group>
      <instancedMesh ref={b} args={[body, bodyMat, n]} frustumCulled={false} />
      <instancedMesh ref={h} args={[head, skinMat, n]} frustumCulled={false} />
      <instancedMesh ref={hr} args={[hair, hairMat, n]} frustumCulled={false} />
    </group>
  )
}
