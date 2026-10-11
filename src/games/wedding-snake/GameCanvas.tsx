import { Suspense, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { update } from './GameManager'
import { World, Lights } from './World'
import { Collectibles } from './Items'
import { Player, Couple, Trail, Burst, MapsArrow, Camera } from './Actors'

/** Runs the game once per frame, before anything renders. */
function Tick() {
  useFrame((_, dt) => update(Math.min(dt, 0.05)), -1)
  return null
}

export function GameCanvas({ urls }: { urls: { groom: string; bride: string } }) {
  const lowEnd = useMemo(() => (navigator.hardwareConcurrency ?? 8) <= 4 || Math.min(screen.width, screen.height) < 360, [])
  const [dpr, setDpr] = useState(lowEnd ? 1.25 : Math.min(2, window.devicePixelRatio || 1))
  const [lite, setLite] = useState(lowEnd)
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={dpr}
      gl={{ antialias: !lite, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 50, near: 0.5, far: 200, position: [0, 14, 16] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        scene.fog = new THREE.Fog('#F3C9A0', 28, 60)
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
      <Camera />
      <World lowEnd={lite} />
      <Collectibles />
      <Player />
      <Suspense fallback={null}>
        <Couple urls={urls} />
      </Suspense>
      <Trail />
      <Burst />
      <MapsArrow />
    </Canvas>
  )
}
