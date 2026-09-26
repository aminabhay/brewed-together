import { useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { BeatId } from '../../scroll/beats'
import { isNear } from '../world/useBeatVisibility'

/**
 * A crisp HTML speech bubble pinned to a point in the scene. Real text (not a texture), so it stays
 * sharp and readable at phone sizes. Hidden automatically once the camera leaves `beat`.
 */
export function SpeechBubble({ text, position, show, beat }: { text: string; position: [number, number, number]; show: boolean; beat: BeatId }) {
  const [near, setNear] = useState(false)
  useFrame(() => {
    const n = isNear([beat], 0.45)
    if (n !== near) setNear(n)
  })
  if (!show || !near) return null
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="bubble-pop relative whitespace-nowrap rounded-2xl border-2 border-espresso bg-foam px-4 py-2 font-serif text-lg font-semibold text-espresso shadow-xl md:px-5 md:text-2xl">
        {text}
        <span className="absolute -bottom-[9px] left-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-espresso bg-foam" aria-hidden />
      </div>
    </Html>
  )
}
