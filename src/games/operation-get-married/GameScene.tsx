import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from './GameState'
import { updateGame } from './CharacterController'
import { World, nightRef } from './World'
import { Groom } from './Groom'
import { Bride } from './Bride'
import { ObstacleManager } from './ObstacleManager'
import { ChaseCamera } from './ChaseCamera'
import { Arch, Dust, Petals } from './Effects'

/** Drives the simulation once per frame, before anything renders. */
function Tick() {
  useFrame((_, dt) => updateGame(Math.min(dt, 0.05), useGame.getState().phase), -1)
  return null
}

function Lights() {
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const sun = useRef<THREE.DirectionalLight>(null!)
  useFrame(() => {
    const n = nightRef.v
    hemi.current.intensity = 1.25 - n * 0.75
    sun.current.intensity = 1.6 - n * 1.3
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#FFE6C8', '#8A5A3C', 1.25]} />
      {/* low evening sun from behind the camera, a little to the left */}
      <directionalLight ref={sun} position={[-6, 9, 8]} color="#FFD2A0" intensity={1.6} />
      <ambientLight color="#FFE9D6" intensity={0.25} />
    </>
  )
}

export function GameScene({ groomUrl, brideUrl }: { groomUrl: string; brideUrl: string }) {
  // quality: start sensibly for the device, step down if frames drop
  const lowEnd = useMemo(() => (navigator.hardwareConcurrency ?? 8) <= 4 || Math.min(screen.width, screen.height) < 360, [])
  const [dpr, setDpr] = useState(lowEnd ? 1.25 : Math.min(2, window.devicePixelRatio || 1))
  const [lite, setLite] = useState(lowEnd)

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={dpr}
      gl={{ antialias: !lite, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 58, near: 0.1, far: 400, position: [0.9, 1.7, 3.4] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr((d) => Math.max(1, d - 0.5))
          setLite(true)
        }}
      />
      <Tick />
      <Lights />
      <ChaseCamera />
      <World lowEnd={lite} />
      <Suspense fallback={null}>
        <Groom url={groomUrl} />
        <Bride url={brideUrl} />
      </Suspense>
      <ObstacleManager />
      <Dust count={lite ? 14 : 28} />
      <Arch />
      <Petals count={lite ? 50 : 130} />
    </Canvas>
  )
}
