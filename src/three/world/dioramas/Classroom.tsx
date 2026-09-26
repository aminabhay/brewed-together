import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { wedding } from '../../../content/wedding'
import { Couple } from '../../components/Couple'
import { Crowd, type CrowdMember } from '../../components/Crowd'
import { Desk } from '../../components/Props'
import { canvasTexture, HAND, memoTex, SANS } from '../../components/textures'
import { mat, PALETTE } from '../../components/materials'
import { Chapter, Room } from './Chapter'
import { isNear } from '../useBeatVisibility'
import { interactBus } from '../../../state/interactBus'
import { useEffect } from 'react'

const COLS = [-2.1, 0, 2.1]
const ROWS = [-0.5, 1.0, 2.5]
const EMPTY = { r: 1, c: 2 }

function Whiteboard() {
  const tex = useMemo(
    () =>
      memoTex('whiteboard', () =>
        canvasTexture(1024, 512, (ctx, w, h) => {
          ctx.fillStyle = '#FBFBF7'
          ctx.fillRect(0, 0, w, h)
          ctx.strokeStyle = '#2F5DA8'
          ctx.fillStyle = '#2F5DA8'
          ctx.lineWidth = 5
          ctx.font = `600 54px ${HAND}`
          ctx.fillText('Guest Lecture: Building for the web ✨', 40, 70)
          ctx.font = `500 34px ${SANS}`
          ctx.fillStyle = '#B03A2E'
          ;['function hello(you) {', '  return "welcome!"', '}'].forEach((l, i) => ctx.fillText(l, 50, 150 + i * 44))
          // boxes & arrows diagram
          ctx.strokeStyle = '#2A1E17'
          ctx.strokeRect(560, 130, 150, 80)
          ctx.strokeRect(800, 130, 150, 80)
          ctx.strokeRect(680, 300, 150, 80)
          ctx.beginPath()
          ctx.moveTo(710, 170); ctx.lineTo(800, 170)
          ctx.moveTo(875, 210); ctx.lineTo(780, 300)
          ctx.moveTo(635, 210); ctx.lineTo(730, 300)
          ctx.stroke()
          ctx.fillStyle = '#2A1E17'
          ctx.font = `600 30px ${HAND}`
          ctx.fillText('UI', 615, 180); ctx.fillText('API', 850, 180); ctx.fillText('DB', 735, 350)
          ctx.fillStyle = '#2F8A4E'
          ctx.font = `600 44px ${HAND}`
          ctx.fillText('Questions? ☺', 60, 420)
        }),
      ),
    [],
  )
  return (
    <group position={[-0.6, 2.1, -3.1]}>
      <mesh material={mat('#9aa0a6', { metal: 0.5, rough: 0.4 })}>
        <boxGeometry args={[4.4, 2.2, 0.08]} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[4.2, 2.0]} />
        <meshStandardMaterial map={tex} roughness={0.3} />
      </mesh>
    </group>
  )
}

function EmptyDesk() {
  const [tip, setTip] = useState(false)
  useEffect(() => {
    interactBus.deskTip = () => setTip((t) => !t)
  }, [])
  const glowRef = useRef<THREE.MeshBasicMaterial>(null!)
  const x = COLS[EMPTY.c]
  const z = ROWS[EMPTY.r]
  const ringTex = useMemo(
    () =>
      memoTex('ring', () =>
        canvasTexture(128, 128, (ctx, w, h) => {
          const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w / 2)
          g.addColorStop(0, 'rgba(255,190,110,0.8)')
          g.addColorStop(1, 'rgba(255,170,80,0)')
          ctx.fillStyle = g
          ctx.fillRect(0, 0, w, h)
        }),
      ),
    [],
  )
  useFrame(({ clock }) => {
    glowRef.current.opacity = 0.55 + Math.sin(clock.elapsedTime * 2) * 0.2
    // the tooltip is HTML, so it doesn't hide with the diorama: close it once the guest scrolls on
    if (tip && !isNear(['ch1'], 0.45)) setTip(false)
  })
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation()
        setTip(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setTip(false)
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        setTip((t) => !t)
      }}
    >
      <Desk position={[x, 0, z]} color="#C79A6B" />
      <mesh position={[x, 0.1, z + 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 2]} />
        <meshBasicMaterial ref={glowRef} map={ringTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* invisible generous hit area (≥ 44px on phones) */}
      <mesh position={[x, 0.6, z + 0.3]} visible={false}>
        <boxGeometry args={[1.8, 1.4, 1.6]} />
      </mesh>
      {tip && (
        <Html position={[x, 1.7, z]} center style={{ pointerEvents: 'none' }}>
          <div className="bubble-pop whitespace-nowrap rounded-2xl bg-foam px-4 py-2 font-hand text-2xl text-espresso shadow-lg">
            {wedding.chapterExtras.emptyDeskTooltip}
          </div>
        </Html>
      )}
    </group>
  )
}

export default function Classroom() {
  const shirts = ['#8A9A7B', '#C98B4E', '#6F8FAF', '#B56B6B', '#D9B26F', '#7C6A9E', '#5E8C7A', '#C9A0A0']
  const students = useMemo<CrowdMember[]>(() => {
    const out: CrowdMember[] = []
    let k = 0
    ROWS.forEach((z, r) =>
      COLS.forEach((x, c) => {
        if (r === EMPTY.r && c === EMPTY.c) return
        out.push({ position: [x, 0.08, z + 0.55], rotationY: Math.PI, color: shirts[k++ % shirts.length], seated: true })
      }),
    )
    return out
  }, [])
  return (
    <Chapter id="ch1">
      <Room w={9} d={7} color="#EDE3D1" floor="#A88B6C" />
      <Whiteboard />
      <Couple who="abhay" action="Present" position={[2.2, 0.08, -2.3]} rotation={[0, -0.5, 0]} />
      {ROWS.map((z, r) =>
        COLS.map((x, c) => (r === EMPTY.r && c === EMPTY.c ? null : <Desk key={`${r}${c}`} position={[x, 0.08, z]} />)),
      )}
      <Crowd members={students} />
      <EmptyDesk />
      <mesh position={[3.6, 1.1, -3.05]} material={mat(PALETTE.sage)}>
        <boxGeometry args={[0.9, 1.2, 0.05]} />
      </mesh>
    </Chapter>
  )
}
