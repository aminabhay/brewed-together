import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { mat, PALETTE } from './materials'
import { memoTex, radialTexture, textTexture, woodTexture, SERIF } from './textures'
import { BASE_H } from '../world/layout'

type V3 = [number, number, number]

/** Soft blob shadow: a baked-looking contact shadow that costs one quad. */
export function Blob({ position = [0, 0.01, 0] as V3, size = 1, opacity = 0.5 }: { position?: V3; size?: number | [number, number]; opacity?: number }) {
  const tex = memoTex('blob', () => radialTexture('rgba(20,10,5,1)', 'rgba(20,10,5,0)'))
  const [w, h] = Array.isArray(size) ? size : [size, size]
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

/** Wooden base + brass name plate every diorama stands on. Children sit on the base top. */
export function DioramaBase({ size = [9, 7] as [number, number], plate, children }: { size?: [number, number]; plate: string; children?: React.ReactNode }) {
  const wood = useMemo(() => {
    const t = memoTex('base-wood', () => woodTexture('#6E4527', '#4A2C18', 4))
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })
  }, [])
  const plateTex = useMemo(() => textTexture(plate, { w: 1024, h: 160, font: SERIF, size: 70, color: '#3B2418', bg: '#C9A45C', weight: '600' }), [plate])
  return (
    <group>
      <RoundedBox args={[size[0], BASE_H, size[1]]} radius={0.12} smoothness={3} position={[0, BASE_H / 2, 0]} material={wood} />
      <Blob position={[0, 0.005, 0]} size={[size[0] * 1.35, size[1] * 1.45]} opacity={0.55} />
      {/* brass plate on the front edge */}
      <mesh position={[0, BASE_H * 0.5, size[1] / 2 + 0.011]}>
        <planeGeometry args={[Math.min(4.2, size[0] * 0.5), 0.34]} />
        <meshStandardMaterial map={plateTex} metalness={0.6} roughness={0.35} />
      </mesh>
      <group position={[0, BASE_H, 0]}>{children}</group>
    </group>
  )
}

/** A simple desk with legs (used across classroom, office chapters). */
export function Desk({ position, rotation = 0, color = PALETTE.wood, w = 1.3, d = 0.7, h = 0.75 }: { position: V3; rotation?: number; color?: string; w?: number; d?: number; h?: number }) {
  const m = mat(color, { rough: 0.7 })
  const leg = mat(PALETTE.woodDark)
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[w, 0.07, d]} radius={0.025} smoothness={2} position={[0, h, 0]} material={m} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.08), h / 2, sz * (d / 2 - 0.08)]} material={leg}>
            <boxGeometry args={[0.06, h, 0.06]} />
          </mesh>
        )),
      )}
      <Blob position={[0, 0.01, 0]} size={[w * 1.3, d * 1.6]} opacity={0.35} />
    </group>
  )
}

export function Chair({ position, rotation = 0, color = PALETTE.mocha, seat = 0.72 }: { position: V3; rotation?: number; color?: string; seat?: number }) {
  const m = mat(color, { rough: 0.7 })
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.6, 0.07, 0.6]} radius={0.025} smoothness={2} position={[0, seat - 0.04, 0]} material={m} />
      <RoundedBox args={[0.6, 0.7, 0.07]} radius={0.025} smoothness={2} position={[0, seat + 0.35, -0.28]} material={m} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.24, seat / 2 - 0.04, sz * 0.24]} material={m}>
            <cylinderGeometry args={[0.03, 0.03, seat, 6]} />
          </mesh>
        )),
      )}
    </group>
  )
}

export function Plant({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]} material={mat('#B5643C', { rough: 0.8 })}>
        <cylinderGeometry args={[0.28, 0.2, 0.5, 12]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.sin(i * 1.3) * 0.15, 0.75 + (i % 2) * 0.2, Math.cos(i * 1.3) * 0.15]} material={mat(PALETTE.sage, { rough: 0.9 })}>
          <icosahedronGeometry args={[0.26 - i * 0.02, 0]} />
        </mesh>
      ))}
      <Blob position={[0, 0.01, 0]} size={0.9} opacity={0.4} />
    </group>
  )
}

/** Floating HTML-free speech bubble texture helper (white rounded rect + text). */
export function bubbleTexture(text: string, w = 512, h = 200) {
  return memoTex(`bubble-${text}`, () => {
    const tex = textTexture(text, { w, h, size: h * 0.38, color: '#3B2418' })
    return tex
  })
}
