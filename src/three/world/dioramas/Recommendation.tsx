import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Line, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { wedding } from '../../../content/wedding'
import { Character } from '../../components/Character'
import { Couple } from '../../components/Couple'
import { Desk, Chair } from '../../components/Props'
import { canvasTexture, HAND, memoTex } from '../../components/textures'
import { mat, PALETTE } from '../../components/materials'
import { useStore } from '../../../state/useStore'
import { play } from '../../../audio/sounds'
import { Chapter, Room } from './Chapter'
import { interactBus } from '../../../state/interactBus'

const DESK_TOP = 0.08 + 0.75 + 0.035
const NOTE: [number, number] = [-1.4, 0.6] // x, z (diorama-local) of the note on the teacher's desk
const STAMP_REST: [number, number] = [-2.55, 0.55]


function noteTexture(stamped: boolean) {
  return canvasTexture(512, 360, (ctx, w, h) => {
    ctx.fillStyle = '#FFF8EE'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(111,78,55,0.25)'
    for (let y = 60; y < h; y += 44) {
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(w - 20, y); ctx.stroke()
    }
    ctx.fillStyle = '#2A1E17'
    ctx.font = `700 72px ${HAND}`
    ctx.fillText('Jyoti: ______.', 40, 130)
    if (stamped) {
      ctx.save()
      ctx.translate(w / 2, h * 0.66)
      ctx.rotate(-0.12)
      ctx.strokeStyle = '#C0392B'
      ctx.fillStyle = '#C0392B'
      ctx.lineWidth = 8
      ctx.globalAlpha = 0.9
      ctx.strokeRect(-220, -48, 440, 96)
      ctx.font = `800 50px "Inter", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(wedding.chapterExtras.stampText, 0, 4)
      ctx.restore()
    }
  })
}

function Ink({ burst }: { burst: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const n = 24
  const seeds = useMemo(() => Array.from({ length: n }, () => [Math.random() * Math.PI * 2, 0.3 + Math.random() * 0.7, 0.6 + Math.random()]), [])
  const start = useRef(-10)
  useEffect(() => {
    if (burst) start.current = performance.now() / 1000
  }, [burst])
  const o = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    const t = performance.now() / 1000 - start.current
    for (let i = 0; i < n; i++) {
      const [a, r, up] = seeds[i]
      const k = Math.min(1, t / 0.6)
      o.position.set(NOTE[0] + Math.cos(a) * r * k, DESK_TOP + 0.05 + up * 0.5 * Math.sin(k * Math.PI), NOTE[1] + Math.sin(a) * r * k * 0.6)
      o.scale.setScalar(t > 0 && t < 0.8 ? 0.04 * (1 - k * 0.6) : 0.0001)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, mat('#C0392B', { rough: 0.3 }), n]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
    </instancedMesh>
  )
}

function Stamp({ onStamp, stamped }: { onStamp: () => void; stamped: boolean }) {
  const g = useRef<THREE.Group>(null!)
  const dragging = useRef(false)
  const moved = useRef(0)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])

  const slam = () => {
    const p = g.current.position
    gsap
      .timeline()
      .to(p, { x: NOTE[0], z: NOTE[1], y: DESK_TOP + 0.45, duration: 0.45, ease: 'power2.inOut' })
      .to(p, { y: DESK_TOP + 0.02, duration: 0.14, ease: 'power3.in' })
      .add(onStamp)
      .to(p, { y: DESK_TOP + 0.35, duration: 0.3, ease: 'power2.out' }, '+=0.15')
      .to(p, { x: STAMP_REST[0], z: STAMP_REST[1], y: DESK_TOP, duration: 0.6, ease: 'power2.inOut' })
  }
  useEffect(() => {
    interactBus.stamp = () => !stamped && slam()
  }, [stamped])

  const down = (e: ThreeEvent<PointerEvent>) => {
    if (stamped) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragging.current = true
    moved.current = 0
    // drag plane at stamp height, in world space
    const wp = g.current.getWorldPosition(new THREE.Vector3())
    plane.constant = -(wp.y + 0.3)
    document.body.style.cursor = 'grabbing'
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    if (!e.ray.intersectPlane(plane, hit)) return
    const local = g.current.parent!.worldToLocal(hit.clone())
    moved.current += Math.abs(local.x - g.current.position.x) + Math.abs(local.z - g.current.position.z)
    g.current.position.set(THREE.MathUtils.clamp(local.x, -3.8, 3.8), DESK_TOP + 0.3, THREE.MathUtils.clamp(local.z, -2.8, 2.8))
  }
  const up = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    dragging.current = false
    document.body.style.cursor = ''
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    const p = g.current.position
    const overNote = Math.abs(p.x - NOTE[0]) < 0.8 && Math.abs(p.z - NOTE[1]) < 0.6
    if (overNote || moved.current < 0.05) slam()
    else gsap.to(p, { x: STAMP_REST[0], z: STAMP_REST[1], y: DESK_TOP, duration: 0.5, ease: 'power2.out' })
  }

  return (
    <group ref={g} position={[STAMP_REST[0], DESK_TOP, STAMP_REST[1]]} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onPointerOver={() => !stamped && (document.body.style.cursor = 'grab')}
      onPointerOut={() => !dragging.current && (document.body.style.cursor = '')}
    >
      <group scale={1.6}>
        <RoundedBox args={[0.42, 0.1, 0.28]} radius={0.02} position={[0, 0.05, 0]} material={mat('#C0392B', { rough: 0.5 })} />
        <mesh position={[0, 0.17, 0]} material={mat(PALETTE.woodDark, { rough: 0.5 })}>
          <cylinderGeometry args={[0.05, 0.06, 0.16, 10]} />
        </mesh>
        <mesh position={[0, 0.3, 0]} material={mat(PALETTE.woodDark, { rough: 0.5 })}>
          <sphereGeometry args={[0.1, 12, 10]} />
        </mesh>
      </group>
      {/* forgiving touch target */}
      <mesh position={[0, 0.2, 0]} visible={false}>
        <boxGeometry args={[0.9, 0.7, 0.9]} />
      </mesh>
    </group>
  )
}

export default function Recommendation() {
  const [stamped, setStamped] = useState(false)
  const [burst, setBurst] = useState(0)
  const lineRef = useRef<any>(null)
  const texA = useMemo(() => memoTex('note-a', () => noteTexture(false)), [])
  const texB = useMemo(() => memoTex('note-b', () => noteTexture(true)), [])
  const points = useMemo(() => {
    const a = new THREE.Vector3(-1.72, 1.08, -0.12) // teacher's phone
    const b = new THREE.Vector3(2.6, 1.85, -0.6) // Abhay
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 1.3, 0.4))
    return new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(40)
  }, [])

  useFrame((_, dt) => {
    if (lineRef.current?.material) lineRef.current.material.dashOffset -= dt * 0.8
  })

  const onStamp = () => {
    setStamped(true)
    setBurst((b) => b + 1)
    play('stamp', 1)
    useStore.getState().shake()
  }

  return (
    <Chapter id="ch4">
      <Room w={9} d={7} color="#E6D8C3" floor="#A3876B" />
      {/* teacher's desk */}
      <Desk position={[-1.9, 0.08, 0.5]} w={2.6} d={1.3} color="#8B5E3C" />
      <Chair position={[-1.8, 0.08, -1.2]} seat={0.72} />
      <Character shirt="#6F8FAF" pants="#3A3F4B" hair="short" glasses pose="phone" idle="tilt" position={[-1.8, 0.08, -0.5]} rotation={[0, 0.25, 0]} />
      <mesh position={[-1.72, 1.04, -0.14]} rotation={[-0.5, 0.25, 0]} material={mat('#1d1d1f', { rough: 0.3 })}>
        <boxGeometry args={[0.18, 0.32, 0.03]} />
      </mesh>
      <mesh position={[NOTE[0], DESK_TOP + 0.002, NOTE[1]]} rotation={[-Math.PI / 2, 0, 0.08]}>
        <planeGeometry args={[1.3, 0.91]} />
        <meshStandardMaterial map={stamped ? texB : texA} roughness={0.9} />
      </mesh>
      <Stamp onStamp={onStamp} stamped={stamped} />
      <Ink burst={burst} />
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
