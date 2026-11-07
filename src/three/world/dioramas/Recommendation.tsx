import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { Character } from '../../components/Character'
import { Couple } from '../../components/Couple'
import { Desk, Chair } from '../../components/Props'
import { canvasTexture, HAND, memoTex } from '../../components/textures'
import { mat } from '../../components/materials'
import { Chapter, Room } from './Chapter'

const DESK_TOP = 0.08 + 0.75 + 0.035
const NOTE: [number, number] = [-1.4, 0.6] // x, z (diorama-local) of the note on the professor's desk

/** The professor's note: a handwritten recommendation for Jyoti. */
function noteTexture() {
  return canvasTexture(512, 360, (ctx, w, h) => {
    ctx.fillStyle = '#FFF8EE'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(111,78,55,0.25)'
    for (let y = 60; y < h; y += 44) {
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(w - 20, y); ctx.stroke()
    }
    ctx.fillStyle = '#2A1E17'
    ctx.font = `700 64px ${HAND}`
    ctx.fillText('Jyoti:', 40, 110)
    ctx.font = `600 52px ${HAND}`
    ctx.fillText('brilliant student.', 60, 190)
    ctx.fillStyle = '#B03A2E'
    ctx.fillText('Take her as an intern!', 40, 280)
  })
}

export default function Recommendation() {
  const lineRef = useRef<any>(null)
  const tex = useMemo(() => memoTex('note-recommend', () => noteTexture()), [])
  const points = useMemo(() => {
    const a = new THREE.Vector3(-1.72, 1.08, -0.12) // the professor's phone
    const b = new THREE.Vector3(2.6, 1.85, -0.6) // Abhay
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 1.3, 0.4))
    return new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(40)
  }, [])

  useFrame((_, dt) => {
    if (lineRef.current?.material) lineRef.current.material.dashOffset -= dt * 0.8
  })

  return (
    <Chapter id="ch4">
      <Room w={9} d={7} color="#E6D8C3" floor="#A3876B" />
      {/* the professor's desk: on the phone to Abhay */}
      <Desk position={[-1.9, 0.08, 0.5]} w={2.6} d={1.3} color="#8B5E3C" />
      <Chair position={[-1.8, 0.08, -1.2]} seat={0.72} />
      <Character shirt="#6F8FAF" pants="#3A3F4B" hair="short" glasses pose="phone" idle="tilt" position={[-1.8, 0.08, -0.5]} rotation={[0, 0.25, 0]} />
      <mesh position={[-1.72, 1.04, -0.14]} rotation={[-0.5, 0.25, 0]} material={mat('#1d1d1f', { rough: 0.3 })}>
        <boxGeometry args={[0.18, 0.32, 0.03]} />
      </mesh>
      <mesh position={[NOTE[0], DESK_TOP + 0.002, NOTE[1]]} rotation={[-Math.PI / 2, 0, 0.08]}>
        <planeGeometry args={[1.3, 0.91]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      {/* Abhay at his own desk, across the room */}
      <Desk position={[2.6, 0.08, -0.2]} w={1.4} d={0.8} />
      <Chair position={[2.6, 0.08, -1.0]} seat={0.72} />
      <Couple who="abhay" sit={0.72} hold="table" flourish position={[2.6, 0.08, -1.0]} />
      <mesh position={[2.6, 0.08 + 0.75 + 0.14, -0.1]} rotation={[-0.3, 0, 0]} material={mat('#333', { rough: 0.3 })}>
        <boxGeometry args={[0.6, 0.02, 0.4]} />
      </mesh>
      <Line ref={lineRef} points={points} color="#FFB347" lineWidth={3} dashed dashSize={0.18} gapSize={0.14} />
    </Chapter>
  )
}
