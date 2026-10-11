import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gameConfig } from './config'
import { sim, useGame } from './GameState'
import { canvasTexture, memoTex } from '../../three/components/textures'

/**
 * A wedding-dressed evening bazaar street. Every repeated thing is instanced, and the street is
 * built from identical 40 m segments that leap-frog the groom, so it's endless and cheap.
 */
const L = 40 // segment length
const COPIES = [-2, -1, 0, 1, 2] // segments drawn around the groom
const ROAD_HALF = 3.2
const FACADE_X = 4.6
const env = gameConfig.environment
const rand = (() => {
  let s = 7
  return () => (s = (s * 16807) % 2147483647) / 2147483647
})()

/** "Lights on" amount for the reveal: 0 during the game, 1 once the date is revealed. */
export const nightRef = { v: 0 }

type Inst = { pos: [number, number, number]; scale: [number, number, number]; rot?: [number, number, number]; color?: string }

function useInstances(ref: React.RefObject<THREE.InstancedMesh>, items: Inst[]) {
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      o.position.set(...it.pos)
      o.scale.set(...it.scale)
      o.rotation.set(...(it.rot ?? [0, 0, 0]))
      o.updateMatrix()
      ref.current!.setMatrixAt(i, o.matrix)
      if (it.color) ref.current!.setColorAt(i, c.set(it.color))
    })
    ref.current!.instanceMatrix.needsUpdate = true
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true
  }, [items])
}

/** Build one segment's worth of instances, repeated for every copy. */
function buildStreet(lowEnd: boolean) {
  const buildings: Inst[] = []
  const shutters: Inst[] = []
  const windows: Inst[] = []
  const awnings: Inst[] = []
  const trims: Inst[] = []
  const marigolds: Inst[] = []
  const flags: Inst[] = []
  const posts: Inst[] = []
  const lanterns: Inst[] = []
  const plants: Inst[] = []
  const bulbs: Inst[] = []
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)]
  for (const k of COPIES) {
    const z0 = -k * L
    for (const side of [-1, 1]) {
      let z = z0
      while (z > z0 - L) {
        const w = 4.2 + rand() * 1.4
        const h = 4.5 + rand() * 4
        const cz = z - w / 2
        const depth = 6
        const x = side * (FACADE_X + depth / 2)
        const fx = side * (FACADE_X - 0.02) // facade plane
        const ry = side > 0 ? -Math.PI / 2 : Math.PI / 2 // face the road
        buildings.push({ pos: [x, h / 2, cz], scale: [depth, h, w - 0.15], color: pick(env.buildingColours) })
        trims.push({ pos: [side * (FACADE_X - 0.05), h + 0.12, cz], scale: [0.5, 0.24, w - 0.05], color: '#FFF6EA' })
        // ground floor: shop shutter + striped awning
        shutters.push({ pos: [fx, 1.2, cz], scale: [Math.min(2.6, w - 1.2), 2.2, 1], rot: [0, ry, 0], color: pick(env.shutterColours) })
        awnings.push({ pos: [side * (FACADE_X - 0.55), 2.65, cz], scale: [1.2, 0.12, Math.min(3, w - 0.8)], rot: [0, 0, side * 0.35], color: pick(['#B5403A', '#2F6F5E', '#E8A33D', '#D98A94']) })
        // upper floors: lit windows
        for (let fy = 3.8; fy < h - 0.8; fy += 1.9)
          for (const dz of [-1.1, 1.1]) windows.push({ pos: [fx - side * 0.01, fy, cz + dz], scale: [0.85, 1.05, 1], rot: [0, ry, 0] })
        z -= w
      }
      // lamp posts + lanterns every 10 m
      for (let lz = z0 - 5; lz > z0 - L; lz -= 10) {
        posts.push({ pos: [side * (ROAD_HALF + 0.6), 1.6, lz], scale: [1, 1, 1] })
        lanterns.push({ pos: [side * (ROAD_HALF + 0.6), 3.3, lz], scale: [1, 1, 1] })
      }
      // potted palms
      if (!lowEnd) plants.push({ pos: [side * (ROAD_HALF + 1.2), 0.5, z0 - 17 - rand() * 6], scale: [1, 1, 1], color: '#2F6F5E' })
    }
    // garlands of marigolds (and bunting) across the street
    for (let gz = z0 - 8; gz > z0 - L; gz -= 10) {
      const n = lowEnd ? 10 : 16
      for (let i = 0; i <= n; i++) {
        const t = i / n
        const x = -FACADE_X + t * FACADE_X * 2
        const y = 6.6 - Math.sin(t * Math.PI) * 1.0
        marigolds.push({ pos: [x, y, gz], scale: [1, 1, 1], color: i % 2 ? '#F2A03D' : '#F4C542' })
        if (i % 2 === 0) bulbs.push({ pos: [x, y - 0.18, gz + 0.02], scale: [1, 1, 1] })
      }
      // bunting halfway between garlands
      const bz = gz - 5
      for (let i = 0; i < 12; i++) {
        const t = (i + 0.5) / 12
        const x = -FACADE_X + t * FACADE_X * 2
        const y = 7.2 - Math.sin(t * Math.PI) * 0.9
        flags.push({ pos: [x, y, bz], scale: [1, 1, 1], color: pick(['#7A1F2E', '#E8A33D', '#D98A94', '#2F6F5E', '#FFF6EA']) })
      }
    }
  }
  return { buildings, shutters, windows, awnings, trims, marigolds, flags, posts, lanterns, plants, bulbs }
}

function roadTexture() {
  const t = canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = env.road
    ctx.fillRect(0, 0, w, h)
    // worn stone setts
    for (let y = 0; y < h; y += 32)
      for (let x = (y / 32) % 2 ? -16 : 0; x < w; x += 32) {
        const v = Math.random() * 0.12
        ctx.fillStyle = `rgba(90,60,35,${0.08 + v})`
        ctx.fillRect(x + 2, y + 2, 28, 28)
      }
  })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 6)
  return t
}

function rangoliTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2)
    const ring = (r: number, petals: number, col: string, size: number) => {
      ctx.fillStyle = col
      for (let i = 0; i < petals; i++) {
        ctx.save()
        ctx.rotate((i / petals) * Math.PI * 2)
        ctx.beginPath()
        ctx.ellipse(0, -r, size * 0.45, size, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
    ring(200, 24, '#7A1F2E', 34)
    ring(160, 16, '#E8A33D', 40)
    ring(110, 12, '#D98A94', 38)
    ring(64, 8, '#2F6F5E', 30)
    ctx.fillStyle = '#FFF6EA'
    ctx.beginPath()
    ctx.arc(0, 0, 30, 0, Math.PI * 2)
    ctx.fill()
  })
}

/** Big sky dome that follows the camera: warm evening, turning to deep night for the reveal. */
function Sky() {
  const { camera } = useThree()
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color(env.skyTop) },
          bottom: { value: new THREE.Color(env.skyBottom) },
          night: { value: new THREE.Color(env.revealSky) },
          k: { value: 0 },
        },
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 bottom; uniform vec3 night; uniform float k; varying vec3 vP;
          void main(){ float h = clamp(vP.y * 1.6 + 0.15, 0.0, 1.0); vec3 c = mix(bottom, top, h); c = mix(c, night * (0.7 + 0.6 * (1.0 - h)), k); gl_FragColor = vec4(c, 1.0); }`,
      }),
    [],
  )
  useFrame(() => {
    mesh.current.position.copy(camera.position)
    mat.uniforms.k.value = nightRef.v
  })
  return (
    <mesh ref={mesh} material={mat} renderOrder={-1}>
      <sphereGeometry args={[300, 24, 12]} />
    </mesh>
  )
}

export function World({ lowEnd }: { lowEnd: boolean }) {
  const street = useMemo(() => buildStreet(lowEnd), [lowEnd])
  const segment = useRef<THREE.Group>(null!)
  const scene = useThree((s) => s.scene)
  const phase = useGame((s) => s.phase)

  const refs = {
    buildings: useRef<THREE.InstancedMesh>(null!),
    shutters: useRef<THREE.InstancedMesh>(null!),
    windows: useRef<THREE.InstancedMesh>(null!),
    awnings: useRef<THREE.InstancedMesh>(null!),
    trims: useRef<THREE.InstancedMesh>(null!),
    marigolds: useRef<THREE.InstancedMesh>(null!),
    flags: useRef<THREE.InstancedMesh>(null!),
    posts: useRef<THREE.InstancedMesh>(null!),
    lanterns: useRef<THREE.InstancedMesh>(null!),
    plants: useRef<THREE.InstancedMesh>(null!),
    bulbs: useRef<THREE.InstancedMesh>(null!),
  }
  for (const k of Object.keys(refs) as (keyof typeof refs)[]) useInstances(refs[k], street[k])

  const road = useMemo(() => memoTex('ogm-road', roadTexture), [])
  const rangoli = useMemo(() => memoTex('ogm-rangoli', rangoliTexture), [])
  const flagGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.22, 0, 0, 0.22, 0, 0, 0, -0.5, 0], 3))
    g.computeVertexNormals()
    return g
  }, [])
  const windowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFD9A0'), toneMapped: false }), [])
  const lanternMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFC46B'), toneMapped: false }), [])
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFE2A8'), toneMapped: false }), [])

  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(env.fog, 22, 75)
  }, [])

  useFrame((_, dt) => {
    // street segments leap-frog the groom
    segment.current.position.z = Math.floor(sim.zG / L) * L + L
    // lights come on for the reveal
    const want = phase === 'DATE_REVEAL' || phase === 'COMPLETE' ? 1 : 0
    nightRef.v += (want - nightRef.v) * Math.min(1, dt * 0.8)
    const n = nightRef.v
    windowMat.color.setRGB(1.0 * (0.55 + n * 1.1), 0.85 * (0.55 + n * 1.1), 0.62 * (0.55 + n * 1.0))
    lanternMat.color.setRGB(1.6 + n * 1.6, 1.0 + n * 1.0, 0.4 + n * 0.4)
    bulbMat.color.setRGB(1.2 + n * 2.4, 1.0 + n * 1.8, 0.6 + n * 0.9)
    const fog = scene.fog as THREE.Fog
    fog.color.set(env.fog).lerp(new THREE.Color(env.revealSky), n)
  })

  const n = (k: keyof typeof street) => Math.max(1, street[k].length)
  return (
    <>
      <Sky />
      <group ref={segment}>
        {COPIES.map((k) => (
          <group key={k} position={[0, 0, -k * L - L / 2]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[ROAD_HALF * 2, L]} />
              <meshStandardMaterial map={road} roughness={0.95} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (ROAD_HALF + 0.7), 0.08, 0]}>
                <boxGeometry args={[1.4, 0.16, L]} />
                <meshStandardMaterial color="#E9DCC6" roughness={0.9} />
              </mesh>
            ))}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]}>
              <circleGeometry args={[1.5, 40]} />
              <meshStandardMaterial map={rangoli} transparent roughness={1} />
            </mesh>
          </group>
        ))}
        <group>
          <instancedMesh ref={refs.buildings} args={[undefined, undefined, n('buildings')]}>
            <boxGeometry />
            <meshStandardMaterial roughness={0.85} />
          </instancedMesh>
          <instancedMesh ref={refs.trims} args={[undefined, undefined, n('trims')]}>
            <boxGeometry />
            <meshStandardMaterial roughness={0.8} />
          </instancedMesh>
          <instancedMesh ref={refs.shutters} args={[undefined, undefined, n('shutters')]}>
            <planeGeometry />
            <meshStandardMaterial roughness={0.7} />
          </instancedMesh>
          <instancedMesh ref={refs.awnings} args={[undefined, undefined, n('awnings')]}>
            <boxGeometry />
            <meshStandardMaterial roughness={0.8} />
          </instancedMesh>
          <instancedMesh ref={refs.windows} args={[undefined, windowMat, n('windows')]}>
            <planeGeometry />
          </instancedMesh>
          <instancedMesh ref={refs.marigolds} args={[undefined, undefined, n('marigolds')]}>
            <icosahedronGeometry args={[0.13, 1]} />
            <meshStandardMaterial roughness={0.9} />
          </instancedMesh>
          <instancedMesh ref={refs.bulbs} args={[undefined, bulbMat, n('bulbs')]}>
            <sphereGeometry args={[0.05, 6, 4]} />
          </instancedMesh>
          <instancedMesh ref={refs.flags} args={[flagGeo, undefined, n('flags')]}>
            <meshStandardMaterial side={THREE.DoubleSide} roughness={0.9} />
          </instancedMesh>
          <instancedMesh ref={refs.posts} args={[undefined, undefined, n('posts')]}>
            <cylinderGeometry args={[0.07, 0.09, 3.2, 6]} />
            <meshStandardMaterial color="#3B2418" roughness={0.6} />
          </instancedMesh>
          <instancedMesh ref={refs.lanterns} args={[undefined, lanternMat, n('lanterns')]}>
            <octahedronGeometry args={[0.22, 0]} />
          </instancedMesh>
          <instancedMesh ref={refs.plants} args={[undefined, undefined, n('plants')]}>
            <icosahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial roughness={0.9} />
          </instancedMesh>
        </group>
      </group>
    </>
  )
}
