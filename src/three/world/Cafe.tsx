import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { wedding } from '../../content/wedding'
import { useStore } from '../../state/useStore'
import { scrollState, smooth } from '../../scroll/scrollState'
import { Couple, seatHeight } from '../components/Couple'
import { mat, glow, PALETTE } from '../components/materials'
import { brickTexture, canvasTexture, HAND, memoTex, textTexture, woodTexture, SERIF } from '../components/textures'
import { Blob, Chair, DioramaBase, Plant } from '../components/Props'
import { makeRainMaterial } from '../shaders/rain'
import { Cups } from './Cups'
import { Steam } from './Steam'
import { CAFE, CAFE_LOCAL } from './layout'

const W = 10.4
const D = 9.4
const WALL_H = 5.4
const BACK_Z = -D / 2 + 0.15
const LEFT_X = -W / 2 + 0.15
const WIN = { z0: -2.7, z1: 0.3, y0: 1.5, y1: 4.1 }

/** Café closing-time dimmer: 1 = open, 0 = lights out. Staggered so lights dim one by one. */
export const closingDim = (from: number, to: number) => 1 - smooth(from, to, scrollState.local.closing ?? 0) * 0.92

function EdisonBulb() {
  const light = useRef<THREE.PointLight>(null!)
  const filMat = useRef<THREE.MeshBasicMaterial>(null!)
  const halo = useRef<THREE.Mesh>(null!)
  const [x, y, z] = CAFE_LOCAL.bulb

  const bulbGeo = useMemo(() => {
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      const yy = -0.28 + t * 0.4
      const r = t < 0.7 ? Math.sin((t / 0.7) * Math.PI * 0.95) * 0.17 + 0.01 : 0.06 + (1 - t) * 0.05
      pts.push(new THREE.Vector2(Math.max(0.005, r), yy))
    }
    return new THREE.LatheGeometry(pts, 24)
  }, [])

  const filament = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * 0.07, -0.12 + (i % 2) * 0.1, Math.sin(a) * 0.07))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, 0.006, 5, true)
  }, [])

  const haloTex = useMemo(
    () =>
      memoTex('halo', () =>
        canvasTexture(128, 128, (ctx, w, h) => {
          const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
          g.addColorStop(0, 'rgba(255,190,110,0.9)')
          g.addColorStop(0.3, 'rgba(255,160,70,0.25)')
          g.addColorStop(1, 'rgba(255,140,50,0)')
          ctx.fillStyle = g
          ctx.fillRect(0, 0, w, h)
        }),
      ),
    [],
  )

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime
    const flicker = 0.93 + Math.sin(t * 13) * 0.02 + Math.sin(t * 7.3 + 1) * 0.025 + (Math.sin(t * 31) > 0.97 ? -0.08 : 0)
    const dim = closingDim(0.55, 0.85)
    light.current.intensity = 7 * flicker * dim
    filMat.current.color.setRGB(4.5 * flicker * dim, 2.4 * flicker * dim, 0.9 * flicker * dim)
    halo.current.quaternion.copy(camera.quaternion)
    ;(halo.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * dim
  })

  return (
    <group>
      {/* sconce: back plate, arm, cord, socket */}
      <mesh position={[x, y + 0.6, BACK_Z + 0.17]} rotation={[Math.PI / 2, 0, 0]} material={mat(PALETTE.brass, { metal: 0.8, rough: 0.35 })}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 20]} />
      </mesh>
      <mesh position={[x, y + 0.6, (BACK_Z + z) / 2 + 0.1]} rotation={[Math.PI / 2, 0, 0]} material={mat(PALETTE.brass, { metal: 0.8, rough: 0.35 })}>
        <cylinderGeometry args={[0.025, 0.025, Math.abs(z - BACK_Z), 8]} />
      </mesh>
      <mesh position={[x, y + 0.38, z]} material={mat('#1a1a1a')}>
        <cylinderGeometry args={[0.008, 0.008, 0.44, 5]} />
      </mesh>
      <mesh position={[x, y + 0.17, z]} material={mat(PALETTE.brass, { metal: 0.8, rough: 0.3 })}>
        <cylinderGeometry args={[0.05, 0.06, 0.12, 16]} />
      </mesh>
      <group position={[x, y, z]}>
        <mesh geometry={bulbGeo}>
          <meshStandardMaterial color="#ffe2b8" transparent opacity={0.35} roughness={0.05} metalness={0.2} emissive="#ff9a3c" emissiveIntensity={0.9} depthWrite={false} />
        </mesh>
        <mesh geometry={filament}>
          <meshBasicMaterial ref={filMat} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.02, 0]} material={mat('#555')}>
          <cylinderGeometry args={[0.003, 0.003, 0.24, 4]} />
        </mesh>
        <mesh ref={halo} renderOrder={5}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial map={haloTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <pointLight ref={light} color="#FFB347" distance={12} decay={1.8} />
      </group>
    </group>
  )
}

function RainWindow() {
  const tier = useStore((s) => s.tier)
  const wipe = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    return { c, ctx, t }
  }, [])
  const material = useMemo(() => makeRainMaterial(tier === 'high' ? 2 : tier === 'medium' ? 1 : 0, wipe.t), [tier, wipe])
  const ww = WIN.z1 - WIN.z0
  const wh = WIN.y1 - WIN.y0
  useEffect(() => {
    material.uniforms.uAspect.value = ww / wh
  }, [material])
  let last = 0
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    // cleared glass slowly fogs back
    if (clock.elapsedTime - last > 0.1) {
      last = clock.elapsedTime
      wipe.ctx.fillStyle = 'rgba(0,0,0,0.035)'
      wipe.ctx.fillRect(0, 0, 128, 128)
      wipe.t.needsUpdate = true
    }
  })
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv || e.pointerType === 'touch') return
    const { ctx } = wipe
    const g = ctx.createRadialGradient(e.uv.x * 128, (1 - e.uv.y) * 128, 0, e.uv.x * 128, (1 - e.uv.y) * 128, 14)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    wipe.t.needsUpdate = true
  }
  const frame = mat(PALETTE.woodDark, { rough: 0.6 })
  const cz = (WIN.z0 + WIN.z1) / 2
  const cy = (WIN.y0 + WIN.y1) / 2
  return (
    <group>
      <mesh position={[LEFT_X + 0.02, cy, cz]} rotation={[0, Math.PI / 2, 0]} material={material} onPointerMove={onMove}>
        <planeGeometry args={[ww, wh]} />
      </mesh>
      {/* warm glow spilling out of the window, seen from outside the diorama */}
      <mesh position={[LEFT_X - 0.17, cy, cz]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ww, wh]} />
        <meshBasicMaterial color={new THREE.Color('#ffb060').multiplyScalar(1.6)} toneMapped={false} />
      </mesh>
      {/* frame + mullions */}
      {[
        [0.12, wh + 0.2, 0.12, cz - ww / 2],
        [0.12, wh + 0.2, 0.12, cz + ww / 2],
        [0.12, 0.08, ww, cz],
      ].map(([sx, sy, sz, z], i) => (
        <mesh key={i} position={[LEFT_X + 0.05, cy, z]} material={frame}>
          <boxGeometry args={[sx, sy, sz]} />
        </mesh>
      ))}
      <mesh position={[LEFT_X + 0.05, cy, cz]} material={frame}>
        <boxGeometry args={[0.08, wh, 0.07]} />
      </mesh>
      <mesh position={[LEFT_X + 0.05, WIN.y1 + 0.05, cz]} material={frame}>
        <boxGeometry args={[0.14, 0.12, ww + 0.2]} />
      </mesh>
      <mesh position={[LEFT_X + 0.18, WIN.y0 - 0.04, cz]} material={frame}>
        <boxGeometry args={[0.4, 0.08, ww + 0.3]} />
      </mesh>
    </group>
  )
}

function Walls() {
  const brick = useMemo(() => {
    const t = memoTex('brick', brickTexture)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3, 1.6)
    return t
  }, [])
  const floor = useMemo(() => {
    const t = memoTex('cafe-floor', () => woodTexture('#7A4E2E', '#4E3019', 8))
    return t
  }, [])
  const plaster = mat('#E8D2B5', { rough: 0.95 })
  const wains = mat(PALETTE.mocha, { rough: 0.7 })
  const len = D - 0.3
  const zMid = (BACK_Z + D / 2) / 2
  // left wall pieces around the window opening
  const pieces: [number, number, number, number][] = [
    // [y0, y1, z0, z1]
    [0, WIN.y0, BACK_Z, D / 2],
    [WIN.y1, WALL_H, BACK_Z, D / 2],
    [WIN.y0, WIN.y1, BACK_Z, WIN.z0],
    [WIN.y0, WIN.y1, WIN.z1, D / 2],
  ]
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[W, 0.1, D]} />
        <meshStandardMaterial map={floor} roughness={0.7} />
      </mesh>
      <mesh position={[0, WALL_H / 2, BACK_Z - 0.15]}>
        <boxGeometry args={[W, WALL_H, 0.3]} />
        <meshStandardMaterial map={brick} roughness={0.95} />
      </mesh>
      {pieces.map(([y0, y1, z0, z1], i) => (
        <mesh key={i} position={[LEFT_X - 0.15, (y0 + y1) / 2, (z0 + z1) / 2]} material={plaster}>
          <boxGeometry args={[0.3, y1 - y0, z1 - z0]} />
        </mesh>
      ))}
      <mesh position={[LEFT_X + 0.02, 0.6, zMid]} material={wains}>
        <boxGeometry args={[0.06, 1.1, len]} />
      </mesh>
    </group>
  )
}

function Shelf() {
  const jarCols = ['#C98B4E', '#E8D2B5', '#6F4E37', '#8A9A7B', '#D98A8A']
  return (
    <group position={[-2.4, 4.05, BACK_Z + 0.25]}>
      <RoundedBox args={[2.7, 0.08, 0.45]} radius={0.02} smoothness={2} material={mat(PALETTE.woodDark, { rough: 0.6 })} />
      {jarCols.map((c, i) => (
        <group key={i} position={[-1.1 + i * 0.52, 0.04, 0]}>
          <mesh position={[0, 0.2, 0]} material={mat(c, { rough: 0.5 })}>
            <cylinderGeometry args={[0.13, 0.13, 0.38, 14]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={mat(PALETTE.brass, { metal: 0.7, rough: 0.35 })}>
            <cylinderGeometry args={[0.14, 0.14, 0.06, 14]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Chalkboard() {
  const tex = useMemo(
    () =>
      memoTex('menu-board', () =>
        canvasTexture(768, 512, (ctx, w, h) => {
          ctx.fillStyle = '#2B2B28'
          ctx.fillRect(0, 0, w, h)
          ctx.fillStyle = 'rgba(255,255,255,0.04)'
          for (let i = 0; i < 300; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 30, 2)
          ctx.fillStyle = '#F3EEE3'
          ctx.textAlign = 'center'
          ctx.font = `700 76px ${HAND}`
          ctx.fillText('Menu', w / 2, 90)
          ctx.font = `500 46px ${HAND}`
          ctx.textAlign = 'left'
          ;[['Espresso', '♥'], ['Latte', '♥♥'], ['Chai', '♥'], ['Love', 'on the house']].forEach(([a, b], i) => {
            ctx.fillText(a, 70, 180 + i * 72)
            ctx.textAlign = 'right'
            ctx.fillText(b, w - 70, 180 + i * 72)
            ctx.textAlign = 'left'
          })
        }),
      ),
    [],
  )
  const [x, y, z] = CAFE_LOCAL.chalkboard
  return (
    <group position={[x, y, BACK_Z + 0.03]}>
      <RoundedBox args={[2.4, 1.7, 0.08]} radius={0.03} smoothness={2} material={mat(PALETTE.woodDark)} />
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[2.2, 1.5]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
    </group>
  )
}

function StringLights() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const count = 22
  const mat0 = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc070').multiplyScalar(3), toneMapped: false }), [])
  useEffect(() => {
    const o = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      const x = -W / 2 + 0.4 + t * (W - 0.8)
      const sag = Math.sin((t * 3) % 1 * Math.PI) * 0.35
      o.position.set(x, WALL_H - 0.35 - sag, BACK_Z + 0.2)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [])
  useFrame(() => {
    const d = closingDim(0.1, 0.35)
    mat0.color.setRGB(3 * d, 2.25 * d, 1.3 * d)
  })
  return (
    <instancedMesh ref={ref} args={[undefined, mat0, count]}>
      <sphereGeometry args={[0.055, 8, 6]} />
    </instancedMesh>
  )
}

function Door() {
  const sign = useRef<THREE.Group>(null!)
  const [x, , ] = CAFE_LOCAL.door
  const front = useMemo(() => textTexture('OPEN', { w: 256, h: 128, size: 70, font: SERIF, color: '#FFF8EE', bg: '#6F4E37', weight: '700' }), [])
  const back = useMemo(() => textTexture('See you there ♥', { w: 256, h: 128, size: 44, color: '#FFF8EE', bg: '#D98A8A' }), [])
  const doorGlow = useRef<THREE.MeshBasicMaterial>(null!)
  useFrame((_, dt) => {
    const flip = (scrollState.local.closing ?? 0) > 0.45 ? Math.PI : 0
    sign.current.rotation.y += (flip - sign.current.rotation.y) * Math.min(1, dt * 5)
    const d = closingDim(0.35, 0.55)
    doorGlow.current.color.setRGB(2.2 * d, 1.5 * d, 0.7 * d)
  })
  return (
    <group position={[x, 0, BACK_Z + 0.02]}>
      <mesh position={[0, 1.4, 0.02]} material={mat(PALETTE.woodDark)}>
        <boxGeometry args={[1.5, 2.8, 0.08]} />
      </mesh>
      <mesh position={[0, 1.35, 0.07]} material={mat('#7B3F2A', { rough: 0.6 })}>
        <boxGeometry args={[1.25, 2.6, 0.05]} />
      </mesh>
      <mesh position={[0, 1.95, 0.1]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial ref={doorGlow} toneMapped={false} />
      </mesh>
      <mesh position={[0.45, 1.3, 0.12]} material={mat(PALETTE.brass, { metal: 0.8, rough: 0.3 })}>
        <sphereGeometry args={[0.05, 10, 8]} />
      </mesh>
      <group ref={sign} position={[0, 1.2, 0.2]}>
        <mesh>
          <planeGeometry args={[0.8, 0.4]} />
          <meshStandardMaterial map={front} side={THREE.FrontSide} />
        </mesh>
        <mesh rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.8, 0.4]} />
          <meshStandardMaterial map={back} side={THREE.FrontSide} />
        </mesh>
      </group>
    </group>
  )
}

function CafeTable() {
  const [x, , z] = CAFE_LOCAL.table
  const top = CAFE_LOCAL.tableTop - 0.1
  return (
    <group position={[x, 0.1, z]}>
      <mesh position={[0, top - 0.03, 0]} material={mat('#A0714A', { rough: 0.5 })}>
        <cylinderGeometry args={[CAFE_LOCAL.tableRadius, CAFE_LOCAL.tableRadius, 0.06, 40]} />
      </mesh>
      <mesh position={[0, (top - 0.06) / 2, 0]} material={mat('#2a2220', { metal: 0.5, rough: 0.4 })}>
        <cylinderGeometry args={[0.05, 0.05, top - 0.06, 10]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} material={mat('#2a2220', { metal: 0.5, rough: 0.4 })}>
        <cylinderGeometry args={[0.35, 0.4, 0.05, 20]} />
      </mesh>
      <Blob position={[0, 0.01, 0]} size={2.6} opacity={0.45} />
    </group>
  )
}

/** The café: open-front diorama on a base. Everything in this group is café-local. */
export default function Cafe() {
  const [tx, , tz] = CAFE_LOCAL.table
  const cs = CAFE_LOCAL.coupleSize
  const co = CAFE_LOCAL.chairOffset
  const chs = CAFE_LOCAL.chairScale
  // each chair's seat is set so that person's feet reach the floor
  const seatA = seatHeight('abhay', cs)
  const seatJ = seatHeight('jyoti', cs)
  const titleMask = useMemo(() => textTexture(wedding.cafe.chapterTitle, { w: 2048, h: 512, size: 300, color: '#fff', weight: '700' }), [])
  return (
    <group position={CAFE}>
      <DioramaBase size={[W + 0.6, D + 0.6]} plate={wedding.cafe.plate}>
        <Walls />
        <RainWindow />
        <EdisonBulb />
        <Shelf />
        <Chalkboard />
        <StringLights />
        <Door />
        <Plant position={[-4.3, 0.1, BACK_Z + 0.6]} scale={1.3} />
        <Plant position={[4.5, 0.1, BACK_Z + 0.7]} scale={1.1} />
        <CafeTable />
        <Chair position={[tx - co, 0.1, tz]} rotation={Math.PI / 2} scale={chs} seat={seatJ / chs} />
        <Chair position={[tx + co, 0.1, tz]} rotation={-Math.PI / 2} scale={chs} seat={seatA / chs} />
        <Couple who="jyoti" size={cs} sit={seatJ} hold="table" reach={[1.15, 0.42]} flourish position={[tx - co, 0.1, tz]} rotation={[0, Math.PI / 2, 0]} />
        <Couple who="abhay" size={cs} sit={seatA} hold="table" flourish position={[tx + co, 0.1, tz]} rotation={[0, -Math.PI / 2, 0]} />
        <Blob position={[tx - co, 0.11, tz]} size={1.4} opacity={0.35} />
        <Blob position={[tx + co, 0.11, tz]} size={1.4} opacity={0.35} />
        <Cups />
        {/* steam that writes "How it started…" above the miniature */}
        <Steam
          position={CAFE_LOCAL.title}
          width={CAFE_LOCAL.titleSize[0]}
          height={CAFE_LOCAL.titleSize[1]}
          opacity={1}
          solid
          mask={titleMask}
          drive={() => {
            const p = scrollState.beatPos
            const on = smooth(2.55, 3.0, p) * (1 - smooth(3.35, 3.7, p))
            return { form: on, opacity: on }
          }}
        />
      </DioramaBase>
    </group>
  )
}
