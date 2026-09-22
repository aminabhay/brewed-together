import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import type * as THREE from 'three'
import { beatIndex, type BeatId } from '../../scroll/beats'
import { scrollState } from '../../scroll/scrollState'

/** Show a group only while the camera is within `margin` beats of any of the given beats. */
export function isNear(ids: BeatId[], margin = 1.05) {
  const p = scrollState.beatPos
  return ids.some((id) => Math.abs(p - beatIndex(id)) <= margin)
}

export function useBeatVisibility(ref: RefObject<THREE.Object3D>, ids: BeatId[], margin = 1.05) {
  useFrame(() => {
    if (ref.current) ref.current.visible = isNear(ids, margin)
  })
}
