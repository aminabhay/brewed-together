import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { wedding } from '../../content/wedding'
import { useStore } from '../../state/useStore'
import { cupsBus } from '../../state/cupsBus'
import { scrollState } from '../../scroll/scrollState'
import { play } from '../../audio/sounds'
import { canvasTexture, HAND, memoTex, heartTexture } from '../components/textures'
import { makeCoffeeMaterial } from '../shaders/coffee'
import { mat, PALETTE } from '../components/materials'
import { Steam } from './Steam'
import { Blob } from '../components/Props'
import { CAFE_LOCAL } from './layout'

const R_TOP = 0.12
const R_BOT = 0.095
const H = 0.26
const STEP = Math.PI / 4
const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches

/** Cup wrap: name on the front (u = 0, facing the viewer), date half on the back (u = 0.5). */
export function cupTexture(name: string, date: string) {
  return canvasTexture(1024, 288, (ctx, w, h) => {
    ctx.fillStyle = '#FFF8EE'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(111,78,55,0.18)'
    ctx.fillRect(0, h * 0.82, w, h * 0.05)
    const drawAt = (text: string, u: number, size: number, color: string, rot = -0.06) => {
      ctx.font = `700 ${size}px ${HAND}`
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const x of [u * w, u * w - w, u * w + w]) {
        ctx.save()
        ctx.translate(x, h * 0.46)
        ctx.rotate(rot)
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }
    }
    drawAt(name, 0, 120, '#2A1E17')
    drawAt('♥', 0.12, 50, '#D98A8A', 0.2)
    drawAt(date, 0.5, 118, '#9C3D2E', 0.03)
  })
}

interface CupProps {
  index: 0 | 1
  name: string
  date: string
  position: [number, number, number]
  angle: React.MutableRefObject<{ a: number; target: number; vel: number }>
  groupRef: React.RefObject<THREE.Group>
  onHover: (i: number | null) => void
}

function Cup({ index, name, date, position, angle, groupRef, onHover }: CupProps) {
  const tex = useMemo(() => memoTex(`cup-${name}-${date}`, () => cupTexture(name, date)), [name, date])
  const coffee = useMemo(() => makeCoffeeMaterial(), [])
  const spin = useRef<THREE.Group>(null!)
  const drag = useRef<{ x: number; t: number; moved: number; last: number } | null>(null)

  const body = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }), [tex])

  useFrame(({ clock }, dt) => {
    coffee.uniforms.uTime.value = clock.elapsedTime
    const s = angle.current
    if (!drag.current) {
      // inertia, then spring toward the snapped target
      if (Math.abs(s.vel) > 0.02) {
        s.a += s.vel * dt
        s.vel *= Math.pow(0.04, dt)
        s.target = Math.round(s.a / STEP) * STEP
      } else {
        s.vel = 0
        s.a += (s.target - s.a) * Math.min(1, dt * 8)
      }
    }
    spin.current.rotation.y = s.a
  })

  const down = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    drag.current = { x: e.clientX, t: performance.now(), moved: 0, last: performance.now() }
    angle.current.vel = 0
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const now = performance.now()
    drag.current.x = e.clientX
    drag.current.moved += Math.abs(dx)
    const d = dx * 0.013
    angle.current.a += d
    angle.current.vel = d / Math.max(0.008, (now - drag.current.last) / 1000)
    drag.current.last = now
  }
  const up = (e: ThreeEvent<PointerEvent>) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    const s = angle.current
    if (d.moved < 6 && performance.now() - d.t < 400) {
      // tap: quarter turn
      s.vel = 0
      s.target = Math.round(s.a / STEP) * STEP + Math.PI / 2
    } else {
      s.vel = THREE.MathUtils.clamp(s.vel, -14, 14)
      s.target = Math.round(s.a / STEP) * STEP
    }
  }

  return (
    <group ref={groupRef} position={position}>
      <Blob position={[0, 0.003, 0]} size={0.42} opacity={0.5} />
      <group ref={spin}>
        <mesh
          position={[0, H / 2, 0]}
          material={body}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerOver={() => {
            document.body.style.cursor = 'grab'
            onHover(index)
          }}
          onPointerOut={() => {
            document.body.style.cursor = ''
            onHover(null)
          }}
        >
          <cylinderGeometry args={[R_TOP, R_BOT, H, 48, 1, true]} />
        </mesh>
        <mesh position={[0, H / 2, 0]}>
          <cylinderGeometry args={[R_TOP * 0.93, R_BOT * 0.93, H * 0.99, 32, 1, true]} />
          <meshStandardMaterial color="#EFE3D2" side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat(PALETTE.foam, { rough: 0.4 })}>
          <circleGeometry args={[R_BOT, 32]} />
        </mesh>
        <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat(PALETTE.foam, { rough: 0.3 })}>
          <torusGeometry args={[R_TOP * 0.965, 0.008, 8, 48]} />
        </mesh>
        {/* handle on the right-hand side */}
        <mesh position={[R_TOP * 0.95, H * 0.55, 0]} rotation={[0, 0, -Math.PI / 2]} material={mat(PALETTE.foam, { rough: 0.35 })}>
          <torusGeometry args={[0.055, 0.014, 8, 20, Math.PI]} />
        </mesh>
        <mesh position={[0, H - 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} material={coffee}>
          <circleGeometry args={[R_TOP * 0.93, 40]} />
        </mesh>
      </group>
    </group>
  )
}

/** The two interactive cups: turn both until the date lines up. */
export function Cups() {
  const { couple, date, cups } = wedding
  const a = useRef({ a: 0, target: 0, vel: 0 })
  const b = useRef({ a: 0, target: 0, vel: 0 })
  const ga = useRef<THREE.Group>(null!)
  const gb = useRef<THREE.Group>(null!)
  const heart = useMemo(() => memoTex('heart', heartTexture), [])
  const form = useRef({ separate: 1, heart: 0 })
  const revealed = useStore((s) => s.dateRevealed)
  const done = useRef(false)
  const [hover, setHover] = useState<number | null>(null)

  const top = CAFE_LOCAL.tableTop
  const posA: [number, number, number] = [CAFE_LOCAL.cupA[0], top, CAFE_LOCAL.cupA[2]]
  const posB: [number, number, number] = [CAFE_LOCAL.cupB[0], top, CAFE_LOCAL.cupB[2]]

  const facing = (x: number) => {
    const m = ((x % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    return Math.abs(m - Math.PI) < 0.2
  }

  const celebrate = (withClink: boolean) => {
    if (done.current) return
    done.current = true
    const tl = gsap.timeline()
    tl.to(ga.current.position, { x: posA[0] + 0.09, duration: 0.55, ease: 'power2.in' }, 0)
      .to(gb.current.position, { x: posB[0] - 0.09, duration: 0.55, ease: 'power2.in' }, 0)
      .to(ga.current.rotation, { z: -0.12, duration: 0.2, yoyo: true, repeat: 1 }, 0.45)
      .to(gb.current.rotation, { z: 0.12, duration: 0.2, yoyo: true, repeat: 1 }, 0.45)
      .add(() => {
        if (withClink) {
          play('clink', 0.9)
          useStore.getState().shake()
        }
      }, 0.55)
      .to(form.current, { separate: 0, duration: 1.2 }, 0.7)
      .to(form.current, { heart: 1, duration: 2.2, ease: 'power2.out' }, 0.8)
      .add(() => useStore.getState().revealDate(), 0.9)
  }

  const autoReveal = () => {
    if (done.current) return
    a.current.target = Math.PI
    b.current.target = Math.PI
    a.current.vel = b.current.vel = 0
  }

  useEffect(() => {
    cupsBus.rotate = (i, deg) => {
      const s = i === 0 ? a.current : b.current
      s.vel = 0
      s.target = Math.round(s.a / STEP) * STEP + THREE.MathUtils.degToRad(deg)
    }
    cupsBus.revealNow = autoReveal
  }, [])

  // if the page loads already revealed (e.g. replay), keep the cups solved
  useEffect(() => {
    if (revealed && !done.current) {
      a.current.a = a.current.target = Math.PI
      b.current.a = b.current.target = Math.PI
      celebrate(false)
    }
  }, [revealed])

  useFrame(() => {
    if (done.current) return
    // scrolled past without solving → turn them for the guest
    if ((scrollState.local.cups ?? 0) > 0.82 || scrollState.beatPos > 2.6) autoReveal()
    const sa = a.current
    const sb = b.current
    if (facing(sa.a) && facing(sb.a) && Math.abs(sa.vel) < 0.1 && Math.abs(sb.vel) < 0.1) celebrate(true)
  })

  const mid: [number, number, number] = [(posA[0] + posB[0]) / 2, top + H, posA[2]]

  return (
    <group>
      <Cup index={0} name={couple.groom} date={date.cupA} position={posA} angle={a} groupRef={ga} onHover={setHover} />
      <Cup index={1} name={couple.bride} date={date.cupB} position={posB} angle={b} groupRef={gb} onHover={setHover} />
      <Steam position={[posA[0], top + H, posA[2]]} width={0.2} height={0.55} opacity={0.45} drive={() => ({ opacity: form.current.separate })} />
      <Steam position={[posB[0], top + H, posB[2]]} width={0.2} height={0.55} opacity={0.45} drive={() => ({ opacity: form.current.separate })} />
      <Steam position={[mid[0], mid[1] + 0.01, mid[2]]} width={0.34} height={0.36} opacity={0.9} mask={heart} drive={() => ({ form: form.current.heart, opacity: form.current.heart })} />
      {!isTouch && hover !== null && !revealed && (
        <Html position={[hover === 0 ? posA[0] : posB[0], top + H + 0.12, posA[2]]} center style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-full bg-foam/90 px-3 py-1 font-hand text-lg text-espresso shadow">{cups.spin}</div>
        </Html>
      )}
    </group>
  )
}
