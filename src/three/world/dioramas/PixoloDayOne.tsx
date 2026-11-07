import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { wedding } from '../../../content/wedding'
import { Couple } from '../../components/Couple'
import { Desk, Chair, Plant } from '../../components/Props'
import { canvasTexture, HAND, SANS, memoTex } from '../../components/textures'
import { mat, PALETTE } from '../../components/materials'
import { isNear } from '../useBeatVisibility'
import { Chapter, Room } from './Chapter'

/** The Pixolo wall logo: chunky lowercase maroon letters, like the real sign. */
export function PixoloSign({ position = [0.4, 2.7, -3.12] as [number, number, number], width = 3.4 }: { position?: [number, number, number]; width?: number }) {
  const [logo, setLogo] = useState<THREE.Texture | null>(null)
  const url = wedding.chapterExtras.pixoloLogoUrl
  useEffect(() => {
    if (!url) return
    new THREE.TextureLoader().load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      setLogo(t)
    })
  }, [url])
  const letters = useMemo(
    () =>
      memoTex('pixolo-sign', () =>
        canvasTexture(1024, 320, (ctx, w, h) => {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.font = `800 230px ${SANS}`
          // extruded depth, then the face
          for (let d = 14; d > 0; d -= 2) {
            ctx.fillStyle = '#2E1B22'
            ctx.fillText('pixolo', w / 2 + d * 0.6, h / 2 + d)
          }
          ctx.fillStyle = '#8A3A4E'
          ctx.fillText('pixolo', w / 2, h / 2)
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'
          ctx.lineWidth = 3
          ctx.strokeText('pixolo', w / 2, h / 2)
        }),
      ),
    [],
  )
  return (
    <mesh position={position}>
      <planeGeometry args={logo ? [width * 0.6, width * 0.3] : [width, width * 0.31]} />
      <meshStandardMaterial map={logo ?? letters} transparent roughness={0.7} depthWrite={false} />
    </mesh>
  )
}

function Laptop({ position }: { position: [number, number, number] }) {
  const screen = useRef<THREE.MeshBasicMaterial>(null!)
  const boot = useRef({ v: 0 })
  const tex = useMemo(
    () =>
      memoTex('boot', () =>
        canvasTexture(256, 160, (ctx, w, h) => {
          ctx.fillStyle = '#1b2a4a'
          ctx.fillRect(0, 0, w, h)
          ctx.fillStyle = '#fff'
          ctx.textAlign = 'center'
          ctx.font = `700 40px ${HAND}`
          ctx.fillText('Pixolo', w / 2, h / 2)
          ctx.font = `500 16px ${SANS}`
          ctx.fillText('welcome, Jyoti', w / 2, h / 2 + 34)
        }),
      ),
    [],
  )
  useFrame((_, dt) => {
    const target = isNear(['ch5'], 0.4) ? 1 : 0
    boot.current.v += (target - boot.current.v) * Math.min(1, dt * 1.5)
    const v = boot.current.v
    screen.current.color.setScalar(0.05 + v * 1.6)
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.015, 0]} material={mat('#9aa0a6', { metal: 0.6, rough: 0.35 })}>
        <boxGeometry args={[0.7, 0.03, 0.46]} />
      </mesh>
      <group position={[0, 0.03, -0.22]} rotation={[-0.25, 0, 0]}>
        <mesh position={[0, 0.22, 0]} material={mat('#9aa0a6', { metal: 0.6, rough: 0.35 })}>
          <boxGeometry args={[0.7, 0.45, 0.02]} />
        </mesh>
        <mesh position={[0, 0.22, 0.012]}>
          <planeGeometry args={[0.64, 0.4]} />
          <meshBasicMaterial ref={screen} map={tex} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

function IdCard() {
  const drop = useRef<THREE.Group>(null!)
  const flipper = useRef<THREE.Group>(null!)
  const dropped = useRef(false)
  const { jyotiJoiningYear } = wedding.chapterExtras
  // Hi-res, unlit card faces so the text stays crisp from across the table
  const front = useMemo(
    () =>
      canvasTexture(1024, 640, (ctx, w, h) => {
        ctx.fillStyle = '#FFF8EE'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#7A1F2E'
        ctx.fillRect(0, 0, w, 150)
        ctx.fillStyle = '#FFF8EE'
        ctx.font = `800 84px ${SANS}`
        ctx.textBaseline = 'middle'
        ctx.fillText('PIXOLO', 48, 78)
        ctx.font = `700 50px ${SANS}`
        ctx.textAlign = 'right'
        ctx.fillText('INTERN', w - 48, 80)
        ctx.textAlign = 'left'
        // photo
        ctx.fillStyle = '#E8D2B5'
        ctx.fillRect(56, 200, 250, 330)
        ctx.fillStyle = '#6F4E37'
        ctx.beginPath(); ctx.arc(181, 320, 70, 0, Math.PI * 2); ctx.fill()
        ctx.fillRect(101, 410, 160, 120)
        ctx.fillStyle = '#2A1E17'
        ctx.font = `700 150px ${HAND}`
        ctx.fillText(wedding.couple.bride, 350, 330)
        ctx.font = `600 54px ${SANS}`
        ctx.fillStyle = '#6F4E37'
        ctx.fillText(`Since ${jyotiJoiningYear}`, 356, 460)
      }),
    [],
  )
  useFrame(() => {
    if (!dropped.current && isNear(['ch5'], 0.3)) {
      dropped.current = true
      gsap.fromTo(drop.current.position, { y: 7 }, { y: 2.2, duration: 1.4, ease: 'bounce.out' })
    }
    flipper.current.rotation.z = Math.sin(performance.now() / 900) * 0.03
  })
  return (
    <group ref={drop} position={[1.9, 7, 1.2]} scale={2.1}>
      <mesh position={[0, 3, 0]} material={mat('#D98A8A')}>
        <boxGeometry args={[0.04, 6, 0.01]} />
      </mesh>
      <group ref={flipper}>
        <RoundedBox args={[1.3, 0.82, 0.03]} radius={0.04} smoothness={2} material={mat('#ffffff')} />
        <mesh position={[0, 0, 0.017]}>
          <planeGeometry args={[1.26, 0.78]} />
          <meshBasicMaterial map={front} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

export default function PixoloDayOne() {
  return (
    <Chapter id="ch5">
      <Room w={9} d={7} color="#E4E0D4" floor="#C8B69B" />
      <PixoloSign />
      {[-2.4, 0.4].map((x) => (
        <group key={x}>
          <Desk position={[x, 0.08, -1.6]} w={1.8} d={0.9} color="#D8C3A5" />
          <Chair position={[x, 0.08, -0.8]} rotation={Math.PI} color={PALETTE.sage} />
          <Plant position={[x + 0.7, 0.08 + 0.78, -1.8]} scale={0.45} />
        </group>
      ))}
      <Desk position={[-1.2, 0.08, 1.0]} w={1.8} d={0.9} color="#D8C3A5" />
      <Laptop position={[-1.2, 0.08 + 0.785, 1.0]} />
      {/* day one: she wore a green kurti */}
      <Couple who="jyoti" kurti="#4F8A4B" flourish position={[-1.2, 0.08, 1.9]} rotation={[0, Math.PI, 0]} />
      <Plant position={[3.6, 0.08, -2.4]} scale={1.2} />
      <IdCard />
    </Chapter>
  )
}
