import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { Character } from '../../components/Character'
import { Couple } from '../../components/Couple'
import { Bubble } from '../../components/Bubble'
import { Desk } from '../../components/Props'
import { canvasTexture, memoTex, textTexture, SERIF } from '../../components/textures'
import { mat, PALETTE } from '../../components/materials'
import { useStore } from '../../../state/useStore'
import { Chapter, Room } from './Chapter'

function Phone() {
  const screen = useRef<THREE.MeshBasicMaterial>(null!)
  const open = useStore((s) => s.setPhoneOpen)
  useFrame(({ clock }) => {
    const k = 1.6 + Math.sin(clock.elapsedTime * 3) * 0.4
    screen.current.color.setRGB(0.55 * k, 0.75 * k, 1 * k)
  })
  return (
    <group
      position={[0, 0.95, 0.29]}
      rotation={[-0.5, 0, 0]}
      onClick={(e) => {
        e.stopPropagation()
        open(true)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <RoundedBox args={[0.2, 0.36, 0.03]} radius={0.015} smoothness={2} material={mat('#1d1d1f', { rough: 0.3 })} />
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[0.17, 0.32]} />
        <meshBasicMaterial ref={screen} toneMapped={false} />
      </mesh>
      {/* big invisible hit area so a thumb can find it */}
      <mesh visible={false}>
        <boxGeometry args={[0.8, 0.8, 0.5]} />
      </mesh>
    </group>
  )
}

export default function Canteen() {
  const tiles = useMemo(
    () =>
      memoTex('tiles', () => {
        const t = canvasTexture(256, 256, (ctx, w, h) => {
          for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
            ctx.fillStyle = (x + y) % 2 ? '#E9DDC8' : '#C9B79A'
            ctx.fillRect((x * w) / 8, (y * h) / 8, w / 8, h / 8)
          }
        })
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(3, 2.4)
        t.magFilter = THREE.NearestFilter
        return t
      }),
    [],
  )
  const sign = useMemo(() => textTexture('CANTEEN', { w: 512, h: 128, size: 80, font: SERIF, color: '#FFF8EE', bg: '#6F4E37', weight: '700' }), [])
  return (
    <Chapter id="ch2">
      <Room w={9} d={7} color="#D8C7A6" floor="#C9B79A" />
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.6, 6.6]} />
        <meshStandardMaterial map={tiles} roughness={0.6} />
      </mesh>
      <mesh position={[-1.5, 3.0, -3.1]}>
        <planeGeometry args={[2.4, 0.6]} />
        <meshStandardMaterial map={sign} />
      </mesh>
      {/* counter with chai urns */}
      <RoundedBox args={[4, 1.1, 0.8]} radius={0.05} position={[-1.5, 0.6, -2.5]} material={mat(PALETTE.mocha)} />
      {[-2.6, -1.9].map((x) => (
        <mesh key={x} position={[x, 1.45, -2.55]} material={mat('#B8B8B8', { metal: 0.8, rough: 0.3 })}>
          <cylinderGeometry args={[0.22, 0.25, 0.6, 16]} />
        </mesh>
      ))}
      <Desk position={[2.6, 0.08, -1.6]} w={1.6} d={1} color="#A0714A" />
      <Desk position={[2.6, 0.08, 1.4]} w={1.6} d={1} color="#A0714A" />

      {/* Jyoti with her phone, friends around her */}
      <group position={[-0.4, 0.08, 0.8]}>
        <Couple who="jyoti" hold="phone" />
        <Phone />
      </group>
      <Character shirt="#8A9A7B" pants="#4A4A55" hair="long" dress pose="wave" idle="laugh" position={[-1.6, 0.08, 0.2]} rotation={[0, 0.9, 0]} />
      <Character shirt="#C98B4E" pants="#3A3F4B" hair="short" pose="stand" idle="laugh" position={[0.8, 0.08, 0.1]} rotation={[0, -0.8, 0]} />
      <Character shirt="#7C6A9E" pants="#F3E5D0" hair="long" dress pose="stand" idle="tilt" position={[-1.3, 0.08, 1.8]} rotation={[0, 2.3, 0]} />
      <Bubble text="!!" position={[-1.6, 2.2, 0.2]} width={1.2} pop delay={0} />
      <Bubble text="…" position={[0.8, 2.2, 0.1]} width={1.2} pop delay={1.3} />
      <Bubble text="😮" position={[-1.3, 2.2, 1.8]} width={1.2} pop delay={2.4} />
    </Chapter>
  )
}
