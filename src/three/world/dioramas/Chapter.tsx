import { useRef, type ReactNode } from 'react'
import type * as THREE from 'three'
import { DioramaBase } from '../../components/Props'
import { CHAPTERS } from '../layout'
import { useBeatVisibility } from '../useBeatVisibility'
import { wedding } from '../../../content/wedding'

type Id = keyof typeof CHAPTERS

/**
 * Positions a chapter diorama on the big table and culls it when the camera is far away.
 * To swap in a .glb: replace `children` with <primitive object={useGLTF(url).scene} />.
 */
export function Chapter({ id, size = [9, 7], rotationY = 0, children }: { id: Id; size?: [number, number]; rotationY?: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!)
  useBeatVisibility(ref, [id], 1.2)
  const plate = wedding.story.find((s) => s.id === id)!.plate
  return (
    <group ref={ref} position={CHAPTERS[id]} rotation={[0, rotationY, 0]}>
      <DioramaBase size={size} plate={plate}>
        {children}
      </DioramaBase>
    </group>
  )
}

/** A back wall + optional side wall shell shared by the indoor dioramas. */
export function Room({ w, d, h = 3.6, color = '#E8D2B5', floor = '#B89A7A', side = true }: { w: number; d: number; h?: number; color?: string; floor?: string; side?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[w - 0.3, 0.08, d - 0.3]} />
        <meshStandardMaterial color={floor} roughness={0.85} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + 0.25]}>
        <boxGeometry args={[w - 0.3, h, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {side && (
        <mesh position={[-w / 2 + 0.25, h / 2, 0]}>
          <boxGeometry args={[0.2, h, d - 0.3]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      )}
    </group>
  )
}
