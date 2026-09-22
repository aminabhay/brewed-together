import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { wedding, type VenuePreset } from '../../content/wedding'
import { useStore } from '../../state/useStore'
import { scrollState, smooth } from '../../scroll/scrollState'
import { beatIndex } from '../../scroll/beats'
import { canvasTexture, memoTex, HAND, SERIF } from '../components/textures'
import { CAFE, MAP, mapToWorld } from './layout'
import { mapReveal } from './Table'

/**
 * The venue map, in the spirit of a certain fantasy show's opening titles:
 * an inked parchment world, brass clockwork buildings that twist up out of the map on turning gears,
 * and an armillary sphere hanging over it all.
 */

const W = MAP.half * 2
const D = MAP.half * 1.4
const X0 = MAP.center[0] - W / 2
const Z0 = MAP.center[2] - D / 2
const HILLS_Z = Z0 + D * 0.24 // the far band is hill country
const CREEK_X = X0 + W * 0.9 // water on the east edge

const rng = (() => {
  let s = 42
  return () => (s = (s * 16807) % 2147483647) / 2147483647
})()

/** 0 → 1 as the map section plays (drives buildings rising, the route drawing, the banner dropping). */
export const mapT = () => {
  const m = beatIndex('map')
  return smooth(m - 0.5, m + 0.05, scrollState.beatPos) * (1 - smooth(m + 0.5, m + 0.9, scrollState.beatPos))
}

const hill = (x: number, z: number) => {
  if (z > HILLS_Z + 4) return 0
  const k = smooth(HILLS_Z + 4, HILLS_Z - 6, z)
  return k * Math.max(0, Math.sin(x * 0.21) * Math.cos(z * 0.33) + Math.sin(x * 0.09 + 1.3) * 0.8) * 2.6
}

type Brass = ReturnType<typeof useBrass>

/** Shared brass look: a small procedural environment gives the metal something to reflect. */
function useBrass() {
  const gl = useThree((s) => s.gl)
  return useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    const make = (color: string, rough = 0.32) => new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: rough, envMap: env, envMapIntensity: 1.1 })
    return {
      brass: make('#C9A45C'),
      bronze: make('#8C6B3F', 0.4),
      dark: make('#5A4630', 0.45),
      instanced: make('#ffffff', 0.28),
    }
  }, [gl])
}

// ── Parchment ───────────────────────────────────────────────
const toPx = (x: number, z: number, cw: number, ch: number): [number, number] => [((x - X0) / W) * cw, ((z - Z0) / D) * ch]

function parchmentTexture(venue: THREE.Vector3) {
  return canvasTexture(2048, 1434, (ctx, cw, ch) => {
    // aged paper
    const g = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.1, cw / 2, ch / 2, cw * 0.7)
    g.addColorStop(0, '#E4CFA3')
    g.addColorStop(0.7, '#CDB283')
    g.addColorStop(1, '#8E7148')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, cw, ch)
    const stains = rngSeq(7)
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(110,80,40,${0.03 + stains() * 0.05})`
      ctx.beginPath()
      ctx.arc(stains() * cw, stains() * ch, 20 + stains() * 120, 0, Math.PI * 2)
      ctx.fill()
    }
    const ink = '#4A3420'

    // the creek on the east, with hatching
    const cx = toPx(CREEK_X, 0, cw, ch)[0]
    ctx.fillStyle = 'rgba(70,95,105,0.28)'
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    for (let y = 0; y <= ch; y += 20) ctx.lineTo(cx + Math.sin(y * 0.01) * 40 + Math.sin(y * 0.037) * 14, y)
    ctx.lineTo(cw, ch)
    ctx.lineTo(cw, 0)
    ctx.fill()
    ctx.strokeStyle = 'rgba(60,70,70,0.35)'
    ctx.lineWidth = 2
    for (let y = 20; y < ch; y += 26) {
      ctx.beginPath()
      ctx.moveTo(cx + 60 + Math.sin(y * 0.01) * 40, y)
      ctx.quadraticCurveTo(cx + 110, y - 8, cx + 160, y)
      ctx.stroke()
    }

    // hills: little inked peaks along the far band
    ctx.strokeStyle = ink
    ctx.lineWidth = 3
    const peaks = rngSeq(11)
    for (let i = 0; i < 26; i++) {
      const [px, py] = toPx(X0 + 6 + (i / 26) * W * 0.8 + peaks() * 3, Z0 + 3 + peaks() * D * 0.18, cw, ch)
      const s = 18 + peaks() * 22
      ctx.beginPath()
      ctx.moveTo(px - s, py + s * 0.6)
      ctx.lineTo(px, py - s * 0.6)
      ctx.lineTo(px + s, py + s * 0.6)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(px, py - s * 0.6)
      ctx.lineTo(px + s * 0.35, py + s * 0.6)
      ctx.stroke()
    }

    // lanes, then the main road drawn boldly
    ctx.strokeStyle = 'rgba(74,52,32,0.35)'
    ctx.lineWidth = 3
    for (let x = X0 + 4; x < CREEK_X - 4; x += 6) {
      const [px] = toPx(x, 0, cw, ch)
      ctx.beginPath(); ctx.moveTo(px, toPx(0, HILLS_Z, cw, ch)[1]); ctx.lineTo(px, ch); ctx.stroke()
    }
    for (let z = HILLS_Z + 3; z < Z0 + D; z += 6) {
      const [, py] = toPx(0, z, cw, ch)
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(cx, py); ctx.stroke()
    }
    ctx.strokeStyle = ink
    ctx.lineWidth = 9
    const r0 = toPx(X0, Z0 + D * 0.7, cw, ch)
    const r1 = toPx(X0 + W * 0.35, Z0 + D * 0.62, cw, ch)
    const r2 = toPx(venue.x - 4, venue.z + 5, cw, ch)
    const r3 = toPx(CREEK_X, Z0 + D * 0.3, cw, ch)
    ctx.beginPath()
    ctx.moveTo(r0[0], r0[1])
    ctx.bezierCurveTo(r1[0], r1[1], r2[0], r2[1], r3[0], r3[1])
    ctx.stroke()

    // labels
    const label = (text: string, x: number, z: number, size: number, rot = 0, font = SERIF, weight = '600', spacing = '0px') => {
      const [px, py] = toPx(x, z, cw, ch)
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(rot)
      ctx.font = `${weight} ${size}px ${font}`
      ;(ctx as any).letterSpacing = spacing
      ctx.textAlign = 'center'
      ctx.fillStyle = ink
      ctx.fillText(text, 0, 0)
      ctx.restore()
    }
    label('THANE', MAP.center[0] - 4, Z0 + D * 0.5, 96, 0, SERIF, '700', '14px')
    label('Yeoor Hills', X0 + W * 0.5, Z0 + D * 0.12, 54, 0, SERIF, 'italic 500', '4px')
    label('Thane Creek', CREEK_X + 5, Z0 + D * 0.55, 46, Math.PI / 2, SERIF, 'italic 500', '4px')
    label('Ghodbunder Road', X0 + W * 0.3, Z0 + D * 0.67, 42, -0.12, SERIF, 'italic 500', '3px')
    label('where it all brews', CAFE[0] + 1, CAFE[2] + 10, 50, 0, HAND, '700')

    // compass rose, bottom-left
    const rx = cw * 0.1
    const ry = ch * 0.83
    ctx.strokeStyle = ink
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(rx, ry, 80, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(rx, ry, 64, 0, Math.PI * 2); ctx.stroke()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 ? 60 : 110
      ctx.beginPath()
      ctx.moveTo(rx + Math.cos(a - 0.35) * 16, ry + Math.sin(a - 0.35) * 16)
      ctx.lineTo(rx + Math.cos(a) * r, ry + Math.sin(a) * r)
      ctx.lineTo(rx + Math.cos(a + 0.35) * 16, ry + Math.sin(a + 0.35) * 16)
      ctx.fillStyle = i % 2 ? '#8E7148' : ink
      ctx.fill()
    }
    ctx.fillStyle = ink
    ctx.font = `700 44px ${SERIF}`
    ctx.textAlign = 'center'
    ctx.fillText('N', rx, ry - 122)

    // ornamental border
    ctx.strokeStyle = 'rgba(74,52,32,0.8)'
    ctx.lineWidth = 10
    ctx.strokeRect(24, 24, cw - 48, ch - 48)
    ctx.lineWidth = 3
    ctx.strokeRect(46, 46, cw - 92, ch - 92)
  })
}

function rngSeq(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function Parchment({ venue }: { venue: THREE.Vector3 }) {
  const tex = useMemo(() => memoTex('parchment', () => parchmentTexture(venue)), [venue])
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(W, D, 140, 100)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setY(i, hill(p.getX(i) + MAP.center[0], p.getZ(i) + MAP.center[2]))
    g.computeVertexNormals()
    return g
  }, [])
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    // the hills rise with the rest of the clockwork
    ref.current.scale.y = Math.max(0.001, smooth(0.05, 0.5, mapT()))
  })
  return (
    <mesh ref={ref} geometry={geo} position={[MAP.center[0], -0.12, MAP.center[2]]}>
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  )
}

// ── Clockwork buildings ─────────────────────────────────────
function gearGeometry(teeth = 12) {
  const shape = new THREE.Shape()
  const R = 1
  const r = 0.82
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2
    const rad = i % 2 ? r : R
    if (i === 0) shape.moveTo(Math.cos(a0) * rad, Math.sin(a0) * rad)
    else shape.lineTo(Math.cos(a0) * rad, Math.sin(a0) * rad)
    shape.lineTo(Math.cos(a1) * rad, Math.sin(a1) * rad)
  }
  const hole = new THREE.Path()
  hole.absarc(0, 0, 0.35, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false, curveSegments: 4 })
  g.rotateX(-Math.PI / 2)
  return g
}

interface Block {
  x: number
  z: number
  w: number
  d: number
  h: number
  c: string
  tower: boolean
  delay: number
}

function Clockwork({ avoid, brass }: { avoid: THREE.Vector3[]; brass: Brass }) {
  const blocks = useRef<THREE.InstancedMesh>(null!)
  const roofs = useRef<THREE.InstancedMesh>(null!)
  const gears = useRef<THREE.InstancedMesh>(null!)
  const tier = useStore((s) => s.tier)
  const gearGeo = useMemo(() => gearGeometry(), [])
  const data = useMemo(() => {
    const b: Block[] = []
    const cols = ['#B8863B', '#9A6F33', '#C99A48', '#7E5A2C', '#A67C3D']
    for (let x = X0 + 4; x < CREEK_X - 3; x += 6)
      for (let z = HILLS_Z + 3; z < Z0 + D - 3; z += 6) {
        const wx = x + 1.6
        const wz = z + 1.6
        if (Math.hypot(CAFE[0] - wx, CAFE[2] - wz) < 9) continue // keep the café diorama clear
        if (avoid.some((p) => Math.hypot(p.x - wx, p.z - wz) < 8)) continue
        if (rng() < 0.18) continue // little squares
        const dist = Math.hypot(wx - MAP.center[0], wz - MAP.center[2])
        const tower = rng() < 0.22
        b.push({
          x: wx,
          z: wz,
          w: tower ? 1.4 : 2 + rng() * 1.8,
          d: tower ? 1.4 : 2 + rng() * 1.8,
          h: tower ? 4 + rng() * 5 : 0.8 + rng() * rng() * 4,
          c: cols[Math.floor(rng() * cols.length)],
          tower,
          delay: Math.min(0.35, dist / 160 + rng() * 0.06), // ripple outward from the centre
        })
      }
    return tier === 'low' ? b.filter((_, i) => i % 2 === 0) : b
  }, [tier])
  const towerCount = useMemo(() => data.filter((d) => d.tower).length, [data])
  const o = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  useEffect(() => {
    data.forEach((b, i) => blocks.current.setColorAt(i, color.set(b.c)))
    if (blocks.current.instanceColor) blocks.current.instanceColor.needsUpdate = true
  }, [data])

  useFrame(({ clock }) => {
    if (!blocks.current.parent?.parent?.visible) return
    const t = mapT()
    const time = clock.elapsedTime
    let ti = 0
    data.forEach((b, i) => {
      const k = smooth(b.delay + 0.1, b.delay + 0.45, t)
      const h = Math.max(0.01, b.h * k)
      // twist up out of the map, like clockwork
      o.position.set(b.x, h / 2 - 0.05, b.z)
      o.rotation.set(0, (1 - k) * Math.PI * 1.5, 0)
      o.scale.set(b.w * (0.4 + 0.6 * k), h, b.d * (0.4 + 0.6 * k))
      o.updateMatrix()
      blocks.current.setMatrixAt(i, o.matrix)
      // a gear under every building, spinning as it rises
      const gs = Math.max(0.001, Math.max(b.w, b.d) * 0.85 * smooth(b.delay, b.delay + 0.12, t))
      o.position.set(b.x, 0.02, b.z)
      o.rotation.set(0, (1 - k) * 8 + time * 0.3 * (i % 2 ? 1 : -1), 0)
      o.scale.set(gs, 1, gs)
      o.updateMatrix()
      gears.current.setMatrixAt(i, o.matrix)
      if (b.tower) {
        o.position.set(b.x, h + 0.9 * k, b.z)
        o.rotation.set(0, (1 - k) * Math.PI * 1.5, 0)
        o.scale.setScalar(Math.max(0.001, k))
        o.updateMatrix()
        roofs.current.setMatrixAt(ti++, o.matrix)
      }
    })
    blocks.current.instanceMatrix.needsUpdate = true
    gears.current.instanceMatrix.needsUpdate = true
    roofs.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={blocks} args={[undefined, brass.instanced, data.length]} frustumCulled={false}>
        <boxGeometry />
      </instancedMesh>
      <instancedMesh ref={gears} args={[gearGeo, brass.dark, data.length]} frustumCulled={false} />
      <instancedMesh ref={roofs} args={[undefined, brass.bronze, Math.max(1, towerCount)]} frustumCulled={false}>
        <coneGeometry args={[1.05, 1.8, 6]} />
      </instancedMesh>
    </group>
  )
}

/** The armillary sphere hanging over the map: rings turning, a little sun at its heart. */
function Astrolabe({ brass }: { brass: Brass }) {
  const rings = useRef<THREE.Group[]>([])
  const g = useRef<THREE.Group>(null!)
  const sun = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFB347').multiplyScalar(3), toneMapped: false }), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    g.current.scale.setScalar(Math.max(0.001, smooth(0, 0.4, mapT())) * 5)
    rings.current.forEach((r, i) => r?.rotation.set(t * (0.2 + i * 0.07), t * (0.3 - i * 0.05) + i, i * 0.6))
  })
  return (
    <group ref={g} position={[MAP.center[0] - 2, 15, MAP.center[2] - 22]}>
      {[1, 0.85, 0.7].map((r, i) => (
        <group key={i} ref={(el) => el && (rings.current[i] = el)}>
          <mesh material={i === 1 ? brass.bronze : brass.brass}>
            <torusGeometry args={[r, 0.035, 8, 64]} />
          </mesh>
          {Array.from({ length: 12 }, (_, j) => (
            <mesh key={j} position={[Math.cos((j / 12) * Math.PI * 2) * r, Math.sin((j / 12) * Math.PI * 2) * r, 0]} material={brass.dark}>
              <sphereGeometry args={[0.03, 6, 4]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh material={sun}>
        <sphereGeometry args={[0.22, 20, 16]} />
      </mesh>
      <mesh rotation={[0, 0, 0.4]} material={brass.dark}>
        <cylinderGeometry args={[0.02, 0.02, 2.4, 6]} />
      </mesh>
    </group>
  )
}

function VenueModel({ preset, brass }: { preset: VenuePreset; brass: Brass }) {
  const { brass: b, bronze, dark } = brass
  if (preset === 'mandap')
    return (
      <group scale={1.4}>
        <mesh position={[0, 0.15, 0]} material={dark}><boxGeometry args={[4, 0.3, 4]} /></mesh>
        {[-1.6, 1.6].flatMap((x) => [-1.6, 1.6].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.6, z]} material={b}><cylinderGeometry args={[0.15, 0.15, 2.6, 8]} /></mesh>
        )))}
        <mesh position={[0, 3.3, 0]} material={bronze}><coneGeometry args={[2.9, 1.3, 4]} /></mesh>
      </group>
    )
  // a grand hall: domed roof, corner turrets, a courtyard pool
  return (
    <group scale={1.4}>
      <mesh position={[0, 0.2, 0]} material={dark}><boxGeometry args={[6, 0.4, 4.6]} /></mesh>
      <mesh position={[0, 1.6, -0.4]} material={b}><boxGeometry args={[4.6, 2.4, 3]} /></mesh>
      <mesh position={[0, 2.8, -0.4]} material={bronze}><sphereGeometry args={[1.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh position={[0, 4.4, -0.4]} material={b}><coneGeometry args={[0.2, 1, 8]} /></mesh>
      {[-2.3, 2.3].flatMap((x) => [-1.9, 1.1].map((z) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 1.8, 0]} material={b}><cylinderGeometry args={[0.4, 0.45, 3.2, 10]} /></mesh>
          <mesh position={[0, 3.8, 0]} material={bronze}><coneGeometry args={[0.55, 1, 10]} /></mesh>
        </group>
      )))}
      <mesh position={[0, 0.42, 1.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#3E7FA8" metalness={0.3} roughness={0.15} />
      </mesh>
    </group>
  )
}

/** A banner on a tall pole marking the venue, with a coffee-and-heart sigil and a name ribbon. */
function Banner({ i, position, colour, label }: { i: number; position: THREE.Vector3; colour: string; label: string }) {
  const g = useRef<THREE.Group>(null!)
  const cloth = useRef<THREE.Mesh>(null!)
  const focus = useStore((s) => s.mapFocus)
  const setFocus = useStore((s) => s.setMapFocus)
  const sigil = useMemo(
    () =>
      memoTex(`sigil-${colour}`, () =>
        canvasTexture(256, 384, (ctx, w, h) => {
          ctx.fillStyle = colour
          ctx.beginPath()
          ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(w / 2, h * 0.84); ctx.lineTo(0, h)
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = '#C9A45C'
          ctx.lineWidth = 10
          ctx.stroke()
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#FFF3DC'
          ctx.font = `130px ${SERIF}`
          ctx.fillText('☕', w / 2, h * 0.34)
          ctx.fillStyle = '#7A1F2E'
          ctx.font = `100px ${SERIF}`
          ctx.fillText('♥', w / 2, h * 0.62)
        }),
      ),
    [colour],
  )
  const ribbon = useMemo(
    () =>
      memoTex(`ribbon-${label}`, () =>
        canvasTexture(1024, 200, (ctx, w, h) => {
          ctx.fillStyle = '#E8D5AC'
          ctx.beginPath()
          ctx.moveTo(40, 20); ctx.lineTo(w - 40, 20); ctx.lineTo(w - 4, h / 2); ctx.lineTo(w - 40, h - 20); ctx.lineTo(40, h - 20); ctx.lineTo(4, h / 2)
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = '#4A3420'
          ctx.lineWidth = 5
          ctx.stroke()
          ctx.fillStyle = '#3B2418'
          ctx.font = `700 84px ${SERIF}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(label, w / 2, h / 2 + 4)
        }),
      ),
    [label],
  )
  const pole = useMemo(() => new THREE.MeshStandardMaterial({ color: '#C9A45C', metalness: 0.85, roughness: 0.35 }), [])
  useFrame(({ clock }) => {
    const k = smooth(0.55 + i * 0.08, 0.8 + i * 0.08, mapT())
    // the pole rises, then the banner drops open
    g.current.position.set(position.x + 5, position.y, position.z - 1.5)
    g.current.visible = k > 0.001
    const s = focus === i ? 1.25 : 1
    const sx = THREE.MathUtils.lerp(g.current.scale.x, s, 0.15)
    g.current.scale.set(sx, Math.max(0.001, k) * sx, sx)
    cloth.current.rotation.y = Math.sin(clock.elapsedTime * 1.6 + i) * 0.18
  })
  return (
    <group
      ref={g}
      onClick={(e) => {
        e.stopPropagation()
        setFocus(focus === i ? null : i)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <mesh position={[0, 5, 0]} material={pole}>
        <cylinderGeometry args={[0.1, 0.12, 10, 8]} />
      </mesh>
      <mesh position={[0, 10.1, 0]} material={pole}>
        <sphereGeometry args={[0.25, 12, 8]} />
      </mesh>
      <mesh position={[1.4, 9.6, 0]} rotation={[0, 0, Math.PI / 2]} material={pole}>
        <cylinderGeometry args={[0.05, 0.05, 2.9, 6]} />
      </mesh>
      <mesh ref={cloth} position={[1.4, 7.8, 0]}>
        <planeGeometry args={[2.6, 3.6]} />
        <meshStandardMaterial map={sigil} side={THREE.DoubleSide} transparent roughness={0.9} />
      </mesh>
      <Billboard position={[0, 12, 0]}>
        <mesh>
          <planeGeometry args={[9, 1.75]} />
          <meshBasicMaterial map={ribbon} transparent toneMapped={false} />
        </mesh>
      </Billboard>
      {/* thumb-sized hit area */}
      <mesh position={[1, 7, 0]} visible={false}>
        <boxGeometry args={[5, 10, 3]} />
      </mesh>
    </group>
  )
}

/** The route from the café to the venue, inked onto the map behind a glowing ember. */
function Route({ to }: { to: THREE.Vector3 }) {
  const { geo, curve } = useMemo(() => {
    const from = new THREE.Vector3(CAFE[0] + 4, 0.22, CAFE[2] + 6)
    const mid1 = new THREE.Vector3(from.x + (to.x - from.x) * 0.35, 0.22, from.z + 2)
    const mid2 = new THREE.Vector3(from.x + (to.x - from.x) * 0.7, 0.22, to.z + 7)
    const curve = new THREE.CatmullRomCurve3([from, mid1, mid2, new THREE.Vector3(to.x, 0.22, to.z + 3.5)])
    return { geo: new THREE.TubeGeometry(curve, 200, 0.28, 6, false), curve }
  }, [to])
  const total = geo.index!.count
  const ember = useRef<THREE.Mesh>(null!)
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFB347').multiplyScalar(3), toneMapped: false }), [])
  useFrame(() => {
    const k = smooth(0.3, 0.75, mapT())
    geo.setDrawRange(0, Math.floor((total * k) / 6) * 6)
    ember.current.visible = k > 0.01 && k < 0.99
    curve.getPoint(Math.min(1, k), ember.current.position)
  })
  return (
    <group>
      <mesh geometry={geo} frustumCulled={false}>
        <meshStandardMaterial color="#7A1F1F" roughness={0.6} />
      </mesh>
      <mesh ref={ember} material={glowMat}>
        <sphereGeometry args={[0.5, 12, 8]} />
      </mesh>
    </group>
  )
}

export default function CityMap() {
  const group = useRef<THREE.Group>(null!)
  const brass = useBrass()
  const events = wedding.events
  const positions = useMemo(() => events.map((e) => new THREE.Vector3(...mapToWorld(e.mapPos[0], e.mapPos[1]))), [])
  const venueIdx = Math.max(0, events.findIndex((e) => e.venue === wedding.venue.name))
  useFrame(() => {
    group.current.visible = mapReveal() > 0.01
  })
  return (
    <group ref={group}>
      <Parchment venue={positions[venueIdx]} />
      <Clockwork avoid={positions} brass={brass} />
      <Astrolabe brass={brass} />
      {positions.map((p, i) => (
        <group key={events[i].id}>
          <group position={p}>
            <VenueModel preset={i === venueIdx ? wedding.theme.venuePreset : 'hall'} brass={brass} />
          </group>
          <Route to={p} />
          <Banner i={i} position={p} colour={events[i].colour} label={events[i].venue} />
        </group>
      ))}
    </group>
  )
}
