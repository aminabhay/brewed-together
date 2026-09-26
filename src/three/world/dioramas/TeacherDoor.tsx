import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { wedding } from '../../../content/wedding'
import { Couple } from '../../components/Couple'
import { SpeechBubble } from '../../components/SpeechBubble'
import { Plant } from '../../components/Props'
import { textTexture, SERIF, canvasTexture, HAND, memoTex } from '../../components/textures'
import { mat, PALETTE } from '../../components/materials'
import { play } from '../../../audio/sounds'
import { Chapter, Room } from './Chapter'
import { interactBus } from '../../../state/interactBus'

export default function TeacherDoor() {
  const hinge = useRef<THREE.Group>(null!)
  const spill = useRef<THREE.MeshBasicMaterial>(null!)
  const [state, setState] = useState<'closed' | 'knocking' | 'open'>('closed')
  const openAmt = useRef({ v: 0 })
  const plate = useMemo(() => textTexture(wedding.chapterExtras.teacherNamePlate, { w: 512, h: 128, size: 64, font: SERIF, color: '#3B2418', bg: '#C9A45C', weight: '600' }), [])
  const notice = useMemo(
    () =>
      memoTex('notice', () =>
        canvasTexture(512, 384, (ctx, w, h) => {
          ctx.fillStyle = '#B68B5E'
          ctx.fillRect(0, 0, w, h)
          const notes = [['#FFF8EE', 'Workshop Fri!'], ['#F2C14E', 'Hackathon'], ['#D98A8A', 'Lost: umbrella'], ['#8A9A7B', 'Coding club']]
          notes.forEach(([c, t], i) => {
            ctx.save()
            ctx.translate(70 + (i % 2) * 230, 60 + Math.floor(i / 2) * 160)
            ctx.rotate((i % 2 ? 1 : -1) * 0.06)
            ctx.fillStyle = c
            ctx.fillRect(0, 0, 190, 130)
            ctx.fillStyle = '#3B2418'
            ctx.font = `600 34px ${HAND}`
            ctx.fillText(t, 14, 70)
            ctx.restore()
          })
        }),
      ),
    [],
  )

  const knock = () => {
    if (state !== 'closed') return
    setState('knocking')
    play('knock', 0.9)
    const tl = gsap.timeline()
    for (let i = 0; i < 3; i++) tl.to(hinge.current.rotation, { y: -0.05, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.inOut' }, i * 0.28)
    tl.to(openAmt.current, { v: 1, duration: 1.3, ease: 'power3.inOut' }, 1.0).add(() => setState('open'), 1.4)
  }

  useEffect(() => {
    interactBus.knock = knock
  })

  useFrame(() => {
    if (state !== 'closed') {
      if (openAmt.current.v > 0) hinge.current.rotation.y = -1.35 * openAmt.current.v
    }
    const v = openAmt.current.v
    spill.current.color.setRGB(2.4 * v + 0.05, 1.6 * v + 0.03, 0.8 * v + 0.02)
  })

  return (
    <Chapter id="ch3">
      <Room w={9} d={7} color="#E3D5BE" floor="#9C8A74" />
      {/* doorway with warm light behind */}
      <group position={[0.6, 0.08, -3.05]}>
        <mesh position={[0, 1.4, -0.08]}>
          <planeGeometry args={[1.4, 2.7]} />
          <meshBasicMaterial ref={spill} toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.85, 0.05]} material={mat(PALETTE.woodDark)}>
          <boxGeometry args={[1.8, 0.16, 0.2]} />
        </mesh>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 1.4, 0.05]} material={mat(PALETTE.woodDark)}>
            <boxGeometry args={[0.16, 2.85, 0.2]} />
          </mesh>
        ))}
        {/* door hinged on its left edge */}
        <group ref={hinge} position={[-0.7, 0, 0.05]}>
          <group
            onClick={(e) => {
              e.stopPropagation()
              knock()
            }}
            onPointerOver={() => (document.body.style.cursor = state === 'closed' ? 'pointer' : '')}
            onPointerOut={() => (document.body.style.cursor = '')}
          >
            <mesh position={[0.7, 1.38, 0]} material={mat('#7B4B2E', { rough: 0.6 })}>
              <boxGeometry args={[1.4, 2.72, 0.08]} />
            </mesh>
            <mesh position={[0.7, 2.0, 0.045]}>
              <planeGeometry args={[0.9, 0.24]} />
              <meshStandardMaterial map={plate} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[1.22, 1.3, 0.07]} material={mat(PALETTE.brass, { metal: 0.8, rough: 0.3 })}>
              <sphereGeometry args={[0.06, 10, 8]} />
            </mesh>
          </group>
        </group>
        {/* light spilling on the floor */}
        <mesh position={[0.2, 0.02, 1.3]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <planeGeometry args={[1.6, 2.6]} />
          <meshBasicMaterial color="#ffb45a" transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} ref={(m) => m && (m.opacity = state === 'open' ? 0.35 : 0)} />
        </mesh>
      </group>
      <mesh position={[-2.8, 1.9, -3.12]}>
        <planeGeometry args={[2, 1.5]} />
        <meshStandardMaterial map={notice} />
      </mesh>
      <Plant position={[3.5, 0.08, -2.6]} />
      <Couple who="jyoti" action={state === 'open' ? 'Present' : 'Idle'} flourish={state === 'closed'} position={[0.7, 0.08, -1.4]} rotation={[0, Math.PI, 0]} />
      <SpeechBubble text={wedding.chapterExtras.knockLine} position={[1.1, 2.3, -1.2]} show={state === 'open'} beat="ch3" />
      <SpeechBubble text="knock knock…" position={[-0.2, 2.9, -2.2]} show={state === 'knocking'} beat="ch3" />
    </Chapter>
  )
}
