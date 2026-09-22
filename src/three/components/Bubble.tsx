import { useMemo, useRef } from 'react'
import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { canvasTexture, HAND, memoTex } from './textures'

/** A little speech bubble drawn to a canvas; `pop` animates a looping pop-in. */
export function Bubble({ text, position, width = 1.2, pop = false, delay = 0, visible = true }: { text: string; position: [number, number, number]; width?: number; pop?: boolean; delay?: number; visible?: boolean }) {
  const tex = useMemo(
    () =>
      memoTex(`bubble:${text}`, () =>
        canvasTexture(512, 256, (ctx, w, h) => {
          ctx.fillStyle = '#FFF8EE'
          ctx.strokeStyle = '#3B2418'
          ctx.lineWidth = 8
          ctx.beginPath()
          ctx.roundRect(12, 12, w - 24, h * 0.72, 60)
          ctx.moveTo(w * 0.42, h * 0.72 + 8)
          ctx.lineTo(w * 0.36, h - 14)
          ctx.lineTo(w * 0.54, h * 0.72 + 8)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = '#FFF8EE'
          ctx.fillRect(w * 0.4, h * 0.72 - 6, w * 0.16, 16)
          ctx.fillStyle = '#3B2418'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          let size = 110
          ctx.font = `700 ${size}px ${HAND}`
          while (ctx.measureText(text).width > w - 80 && size > 30) ctx.font = `700 ${(size -= 4)}px ${HAND}`
          ctx.fillText(text, w / 2, h * 0.38)
        }),
      ),
    [text],
  )
  const ref = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (!ref.current) return
    let s = visible ? 1 : 0
    if (pop && visible) {
      const t = (clock.elapsedTime + delay) % 4
      s = t < 0.25 ? t / 0.25 : t < 2.6 ? 1 : t < 2.85 ? 1 - (t - 2.6) / 0.25 : 0
      s = s * (1 + 0.15 * Math.sin(Math.min(1, t / 0.25) * Math.PI))
    }
    const cur = ref.current.scale.x
    ref.current.scale.setScalar(cur + (s - cur) * 0.25 + 0.0001)
  })
  return (
    <Billboard position={position}>
      <group ref={ref} scale={0.0001}>
        <mesh position={[0, width * 0.25, 0]}>
          <planeGeometry args={[width, width * 0.5]} />
          <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </Billboard>
  )
}
