import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { wedding } from '../../../content/wedding'
import { Desk, Chair, Plant } from '../../components/Props'
import { canvasTexture, memoTex, textTexture, SERIF } from '../../components/textures'
import { mat, glow } from '../../components/materials'
import { smooth } from '../../../scroll/scrollState'
import { PixoloSign } from './PixoloDayOne'

/**
 * The offices Jyoti stayed through, as swap-in miniatures on the chapter-6 base (10 × 8).
 * Keep clear of: her desk around (0, 0.6), the calendar at (-2.4, 0.5) and Abhay's walk along z ≈ 1 on the right.
 */
type Style = (typeof wedding.sheStayed.offices)[number]['style']

const W = 9.7
const D = 7.7
const H = 3.6
const BACK = -D / 2 + 0.1
const LEFT = -W / 2 + 0.1

function Shell({ wall, floor, floorMap }: { wall: string; floor: string; floorMap?: THREE.Texture }) {
  return (
    <group>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[W, 0.08, D]} />
        <meshStandardMaterial color={floorMap ? '#ffffff' : floor} map={floorMap} roughness={0.85} />
      </mesh>
      <mesh position={[0, H / 2, BACK]} material={mat(wall, { rough: 0.95 })}>
        <boxGeometry args={[W, H, 0.2]} />
      </mesh>
      <mesh position={[LEFT, H / 2, 0]} material={mat(wall, { rough: 0.95 })}>
        <boxGeometry args={[0.2, H, D]} />
      </mesh>
    </group>
  )
}

function NameSign({ name, accent, position, side = false }: { name: string; accent: string; position: [number, number, number]; side?: boolean }) {
  const tex = useMemo(() => textTexture(name, { w: 1024, h: 150, size: 70, font: SERIF, color: '#FFF8EE', bg: accent, weight: '600' }), [name])
  return (
    <mesh position={position} rotation={[0, side ? Math.PI / 2 : 0, 0]}>
      <planeGeometry args={[3.4, 0.5]} />
      <meshStandardMaterial map={tex} />
    </mesh>
  )
}

/** 1 · The shop in Vidyavihar: yellow walls, aluminium-framed glass doors with green paper, white tiles. */
function Shop({ name }: { name: string }) {
  const tiles = useMemo(
    () =>
      memoTex('shop-tiles', () => {
        const t = canvasTexture(256, 256, (ctx, w, h) => {
          ctx.fillStyle = '#E9E5DB'
          ctx.fillRect(0, 0, w, h)
          ctx.strokeStyle = 'rgba(120,110,95,0.35)'
          ctx.lineWidth = 2
          for (let i = 0; i <= 4; i++) {
            ctx.beginPath(); ctx.moveTo((i * w) / 4, 0); ctx.lineTo((i * w) / 4, h); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(0, (i * h) / 4); ctx.lineTo(w, (i * h) / 4); ctx.stroke()
          }
        })
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(4, 3)
        return t
      }),
    [],
  )
  const frame = mat('#9A9A94', { metal: 0.6, rough: 0.4 })
  const glass = mat('#1E2224', { rough: 0.2, metal: 0.3 })
  const lower = mat('#D6B274', { rough: 0.8 })
  return (
    <group>
      <Shell wall="#E3D67F" floor="#E9E5DB" floorMap={tiles} />
      {/* three glass-door panels on the back wall */}
      <group position={[1.8, 0, BACK + 0.12]}>
        <mesh position={[0, 3.25, 0]} material={mat('#8C7A5A', { rough: 0.7 })}>
          <boxGeometry args={[4.4, 0.35, 0.12]} />
        </mesh>
        {[-1.4, 0, 1.4].map((x, i) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 2.1, 0]} material={glass}>
              <boxGeometry args={[1.3, 1.9, 0.04]} />
            </mesh>
            <mesh position={[0, 0.62, 0]} material={lower}>
              <boxGeometry args={[1.3, 1.05, 0.04]} />
            </mesh>
            {[[-0.66, 1.55, 0.05, 3.1], [0.66, 1.55, 0.05, 3.1]].map(([fx, fy, fw, fh], k) => (
              <mesh key={k} position={[fx, fy, 0.03]} material={frame}>
                <boxGeometry args={[fw, fh, 0.06]} />
              </mesh>
            ))}
            <mesh position={[0, 1.15, 0.03]} material={frame}>
              <boxGeometry args={[1.35, 0.06, 0.06]} />
            </mesh>
            {i === 0 && (
              <mesh position={[0, 2.2, 0.04]} material={mat('#E6E1D2')}>
                <planeGeometry args={[0.6, 0.85]} />
              </mesh>
            )}
            {i === 1 &&
              [[-0.25, 2.5, '#5FCB3A'], [0.25, 2.5, '#5FCB3A'], [-0.25, 1.75, '#3E9E2B'], [0.25, 1.75, '#46A930']].map(([px, py, c], k) => (
                <mesh key={k} position={[px as number, py as number, 0.04]} material={mat(c as string, { rough: 0.9 })}>
                  <planeGeometry args={[0.48, 0.7]} />
                </mesh>
              ))}
          </group>
        ))}
      </group>
      <Desk position={[-3.2, 0.08, -2.5]} w={1.4} d={0.8} color="#9B7A52" />
      <Chair position={[-3.2, 0.08, -1.8]} rotation={Math.PI} color="#555" />
      <NameSign name={name} accent="#8C6D2E" position={[LEFT + 0.12, 2.9, -1.2]} side />
    </group>
  )
}

/** 2 · RIIDL, Somaiya College: cream walls, frosted window grid, big pillar, orange-and-wood cubicles. */
/** The riidl logo on a white plaque (logo file: public/logos/riidl.png). */
function RiidlLogo({ position, rotationY = 0, scale = 1 }: { position: [number, number, number]; rotationY?: number; scale?: number }) {
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}logos/riidl.png`)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [])
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh material={mat('#FFFFFF', { rough: 0.6 })}>
        <boxGeometry args={[1.5, 1.12, 0.05]} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[1.4, 1.05]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  )
}

function Cubicles({ name }: { name: string }) {
  const wood = mat('#C99A5B', { rough: 0.7 })
  const orange = mat('#D9772B', { rough: 0.8 })
  const grey = mat('#8E9196', { rough: 0.5, metal: 0.3 })
  const partition = (x: number, z: number, w: number, rotY = 0) => (
    <group position={[x, 0.08, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.55, 0]} material={wood}>
        <boxGeometry args={[w, 1.1, 0.08]} />
      </mesh>
      <mesh position={[0, 1.25, 0]} material={orange}>
        <boxGeometry args={[w, 0.3, 0.08]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} material={grey}>
        <boxGeometry args={[w + 0.04, 0.05, 0.12]} />
      </mesh>
    </group>
  )
  return (
    <group>
      <Shell wall="#ECE4D2" floor="#D9D3C6" />
      {/* frosted window grid */}
      <group position={[1.2, 2.1, BACK + 0.11]}>
        <mesh material={glow('#DCE4EA', 1.15)}>
          <planeGeometry args={[6.4, 2.4]} />
        </mesh>
        {[-3.2, -1.6, 0, 1.6, 3.2].map((x) => (
          <mesh key={x} position={[x, 0, 0.02]} material={mat('#1d1d1d')}>
            <boxGeometry args={[0.07, 2.4, 0.03]} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.02]} material={mat('#1d1d1d')}>
          <boxGeometry args={[6.4, 0.07, 0.03]} />
        </mesh>
      </group>
      <mesh position={[-3.4, H / 2, -2.5]} material={mat('#E6DCC4', { rough: 0.9 })}>
        <cylinderGeometry args={[0.55, 0.55, H, 24]} />
      </mesh>
      {/* two banks of cubicles */}
      {partition(2.4, -2.1, 3.4)}
      {partition(0.7, -2.9, 1.6, Math.PI / 2)}
      {partition(4.1, -2.9, 1.6, Math.PI / 2)}
      {partition(-2.9, 2.2, 2.6)}
      {partition(-1.6, 2.9, 1.4, Math.PI / 2)}
      {[1.6, 3.2].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.83, -2.6]} material={mat('#D8B27E', { rough: 0.6 })}>
            <boxGeometry args={[1.5, 0.05, 0.9]} />
          </mesh>
          <Chair position={[x, 0.08, -1.7]} rotation={Math.PI} color="#2b2b2b" />
        </group>
      ))}
      <NameSign name={name} accent="#C0662A" position={[LEFT + 0.12, 3.0, 1.2]} side />
      {/* riidl logo on the front cubicle partition, facing the viewer */}
      <RiidlLogo position={[-2.9, 0.7, 2.25]} scale={0.72} />
    </group>
  )
}

/** 3 · Swastik Disa Corporate Park, the first full office: white walls, maroon pixolo letters, wood desks, balloons. */
function Studio({ name }: { name: string }) {
  const balloons: [number, number, number, string][] = [
    [3.6, 2.5, -2.8, '#3CB44B'],
    [4.1, 2.2, -2.2, '#F28C28'],
    [3.2, 2.1, -3.1, '#F4F4F4'],
    [-4.1, 2.4, 2.4, '#F28C28'],
    [-3.7, 2.1, 2.9, '#3CB44B'],
  ]
  return (
    <group>
      <Shell wall="#F4F2EE" floor="#E6E0D6" />
      <PixoloSign position={[0.6, 2.95, BACK + 0.12]} width={3.2} />
      {/* wall cabinets + a run of desks with white drawers */}
      <mesh position={[1.6, 2.05, BACK + 0.35]} material={mat('#5A3B2A', { rough: 0.6 })}>
        <boxGeometry args={[3.6, 0.6, 0.5]} />
      </mesh>
      {[0.4, 2.6].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.86, -2.9]} material={mat('#5A3B2A', { rough: 0.6 })}>
            <boxGeometry args={[2, 0.06, 0.9]} />
          </mesh>
          <mesh position={[x + 0.6, 0.45, -2.9]} material={mat('#F4F4F4', { rough: 0.6 })}>
            <boxGeometry args={[0.6, 0.78, 0.8]} />
          </mesh>
          <mesh position={[x - 0.3, 1.2, -3.15]} material={mat('#1a1a1a', { rough: 0.3 })}>
            <boxGeometry args={[0.8, 0.5, 0.05]} />
          </mesh>
          <Chair position={[x, 0.08, -2.1]} rotation={Math.PI} color="#2b2b2b" />
        </group>
      ))}
      {/* whiteboard on the left wall */}
      <mesh position={[LEFT + 0.12, 1.6, -1.6]} rotation={[0, Math.PI / 2, 0]} material={mat('#FAFAFA', { rough: 0.3 })}>
        <planeGeometry args={[1.6, 1.1]} />
      </mesh>
      {/* a little tricolour on the cabinet */}
      {['#FF9933', '#FFFFFF', '#138808'].map((c, i) => (
        <mesh key={c} position={[0.3, 2.16 - i * 0.07, BACK + 0.61]} material={mat(c)}>
          <planeGeometry args={[0.3, 0.07]} />
        </mesh>
      ))}
      {balloons.map(([x, y, z, c], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh material={mat(c, { rough: 0.25 })} scale={[1, 1.15, 1]}>
            <sphereGeometry args={[0.28, 16, 12]} />
          </mesh>
          <mesh position={[0, -0.75, 0]} material={mat('#bbbbbb')}>
            <cylinderGeometry args={[0.004, 0.004, 1.2, 3]} />
          </mesh>
        </group>
      ))}
      <Plant position={[4.2, 0.08, 1.9]} scale={0.8} />
      <NameSign name={name} accent="#8A3A4E" position={[LEFT + 0.12, 3.0, 1.2]} side />
    </group>
  )
}

/** 4 · WeWork Vikhroli: long wooden tables, the orange-and-blue wave wall, a glass meeting room, pendant lights. */
function Cowork({ name }: { name: string }) {
  const wave = useMemo(
    () =>
      memoTex('wework-wave', () =>
        canvasTexture(1024, 512, (ctx, w, h) => {
          ctx.fillStyle = '#F2F2F0'
          ctx.fillRect(0, 0, w, h)
          const band = (y0: number, amp: number, col: string) => {
            ctx.fillStyle = col
            ctx.beginPath()
            ctx.moveTo(0, h)
            for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y0 + Math.sin((x / w) * Math.PI * 2 + y0) * amp)
            ctx.lineTo(w, h)
            ctx.fill()
          }
          band(90, 30, '#E3953E')
          band(200, 40, '#2F7FD8')
          band(330, 35, '#23498F')
        }),
      ),
    [],
  )
  const tableWood = mat('#7A5A3C', { rough: 0.45 })
  const black = mat('#1b1b1b', { rough: 0.5 })
  const table = (x: number, z: number, w: number) => (
    <group key={`${x}${z}`} position={[x, 0.08, z]}>
      <mesh position={[0, 0.78, 0]} material={tableWood}>
        <boxGeometry args={[w, 0.06, 0.9]} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.15), 0.38, sz * 0.32]} rotation={[sz * 0.08, 0, sx * -0.08]} material={black}>
            <cylinderGeometry args={[0.025, 0.02, 0.78, 6]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.82, 0.05]} material={mat('#E24B3B', { rough: 0.5 })}>
        <boxGeometry args={[0.5, 0.03, 0.12]} />
      </mesh>
    </group>
  )
  return (
    <group>
      <Shell wall="#EDEBE7" floor="#8F8B86" />
      <mesh position={[2.2, H / 2, BACK + 0.11]}>
        <planeGeometry args={[5.2, H]} />
        <meshStandardMaterial map={wave} roughness={0.9} />
      </mesh>
      {/* glass meeting room in the back-left corner */}
      <group position={[-2.9, 0, -2.6]}>
        <mesh position={[0, 1.4, 1.05]}>
          <boxGeometry args={[3.4, 2.8, 0.04]} />
          <meshStandardMaterial color="#cfe0ea" transparent opacity={0.35} roughness={0.1} depthWrite={false} />
        </mesh>
        <mesh position={[0, 1.2, 1.08]} material={mat('#f1f1f1')}>
          <boxGeometry args={[3.4, 0.5, 0.01]} />
        </mesh>
        <mesh position={[0, 0.8, 0.1]} material={tableWood}>
          <boxGeometry args={[1.8, 0.06, 0.8]} />
        </mesh>
      </group>
      {table(2.4, -2.5, 3.6)}
      {table(-2.8, 1.6, 2.4)}
      {table(3.1, 2.5, 2.8)}
      {[1.4, 3.4].map((x) => (
        <Chair key={x} position={[x, 0.08, -1.8]} rotation={Math.PI} color="#8B6A48" />
      ))}
      {/* pendant lights */}
      {[1.2, 2.6, 4.0].map((x) => (
        <group key={x} position={[x, 3.0, -2.5]}>
          <mesh position={[0, 0.3, 0]} material={black}>
            <cylinderGeometry args={[0.006, 0.006, 0.6, 3]} />
          </mesh>
          <mesh material={mat('#EDEDED', { rough: 0.4 })}>
            <cylinderGeometry args={[0.08, 0.1, 0.22, 12]} />
          </mesh>
          <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glow('#FFE2B0', 2.2)}>
            <circleGeometry args={[0.08, 12]} />
          </mesh>
        </group>
      ))}
      {/* tall windows on the left wall */}
      {[-0.4, 1.6, 3.2].map((z) => (
        <mesh key={z} position={[LEFT + 0.11, 1.9, z]} rotation={[0, Math.PI / 2, 0]} material={glow('#CFE3F5', 1.3)}>
          <planeGeometry args={[1.3, 2.9]} />
        </mesh>
      ))}
      <NameSign name={name} accent="#23498F" position={[2.2, 3.35, BACK + 0.13]} />
    </group>
  )
}

const BY_STYLE: Record<Style, (p: { name: string }) => JSX.Element> = { shop: Shop, cubicles: Cubicles, studio: Studio, cowork: Cowork }

/** Scale for office i of n: pops out/in around the switch points. */
export function officeScale(i: number, n: number, t: number) {
  const start = i / n
  const end = (i + 1) / n
  const w = 0.035
  const inS = i === 0 ? 1 : smooth(start, start + w, t)
  const outS = i === n - 1 ? 1 : 1 - smooth(end - w, end, t)
  return Math.max(0.0001, Math.min(inS, outS))
}

function OfficeSlot({ i, n, tl }: { i: number; n: number; tl: () => number }) {
  const ref = useRef<THREE.Group>(null!)
  const o = wedding.sheStayed.offices[i]
  const C = BY_STYLE[o.style]
  useFrame(() => {
    const s = officeScale(i, n, tl())
    ref.current.scale.setScalar(s)
    ref.current.visible = s > 0.001
  })
  return (
    <group ref={ref}>
      <C name={o.name} />
    </group>
  )
}

export function Offices({ tl }: { tl: () => number }) {
  const n = wedding.sheStayed.offices.length
  return (
    <>
      {wedding.sheStayed.offices.map((_, i) => (
        <OfficeSlot key={i} i={i} n={n} tl={tl} />
      ))}
    </>
  )
}

