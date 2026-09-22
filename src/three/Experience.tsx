import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom, Vignette, Noise, ChromaticAberration, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type DepthOfFieldEffect, type ChromaticAberrationEffect } from 'postprocessing'
import * as THREE from 'three'
import { useStore, type Tier } from '../state/useStore'
import { scrollState, smooth } from '../scroll/scrollState'
import { beatIndex } from '../scroll/beats'
import { CameraRig, focus } from './CameraRig'
import Cafe from './world/Cafe'
import Table from './world/Table'
import { CAFE_LOCAL, CHAPTERS, cafeWorld } from './world/layout'

// Heavy dioramas are code-split and mounted shortly after the first frame.
const Classroom = lazy(() => import('./world/dioramas/Classroom'))
const Canteen = lazy(() => import('./world/dioramas/Canteen'))
const TeacherDoor = lazy(() => import('./world/dioramas/TeacherDoor'))
const Recommendation = lazy(() => import('./world/dioramas/Recommendation'))
const PixoloDayOne = lazy(() => import('./world/dioramas/PixoloDayOne'))
const SheStayed = lazy(() => import('./world/dioramas/SheStayed'))
const CityMap = lazy(() => import('./world/CityMap'))

const forcedTier = new URLSearchParams(location.search).get('tier')

const DPR: Record<Tier, [number, number]> = { high: [1, 2], medium: [1, 1.5], low: [1, 1] }

function Lights() {
  const amb = useRef<THREE.AmbientLight>(null!)
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const key = useRef<THREE.DirectionalLight>(null!)
  const spot = useRef<THREE.SpotLight>(null!)
  const spotTarget = useMemo(() => new THREE.Object3D(), [])
  const scene = useThree((s) => s.scene)
  const ch6 = CHAPTERS.ch6
  const win = cafeWorld([-6.2, 3.2, -1.2])

  useEffect(() => {
    spotTarget.position.set(ch6[0], 0.9, ch6[2] + 0.6)
    scene.add(spotTarget)
    spot.current.target = spotTarget
    return () => void scene.remove(spotTarget)
  }, [])

  useFrame(() => {
    const p = scrollState.beatPos
    // chapter 6: the room flickers, her spotlight never does
    const near6 = 1 - smooth(0.5, 1.2, Math.abs(p - beatIndex('ch6')))
    const lt = (scrollState.local.ch6 ?? 0) / 0.6
    const flick = near6 > 0 && lt < 1 ? 0.75 + 0.25 * Math.sin(lt * 90) * Math.sin(lt * 37) : 1
    const closing = 1 - smooth(0.2, 0.95, scrollState.local.closing ?? 0) * 0.55
    const dim = (1 - near6 * 0.5 * (lt < 1 ? 1 : 0.8)) * closing
    amb.current.intensity = 0.35 * dim * (near6 > 0 ? flick : 1)
    hemi.current.intensity = 0.7 * dim * (near6 > 0 ? flick : 1)
    key.current.intensity = 1.5 * dim
    spot.current.intensity = 70 * near6
  })
  return (
    <>
      <ambientLight ref={amb} color="#ffe6cc" />
      <hemisphereLight ref={hemi} args={['#ffd9b0', '#3b2418']} />
      <directionalLight ref={key} color="#ffd2a0" position={[25, 40, 30]} />
      {/* cool blue rim from the rainy window */}
      <pointLight color="#7fa7ff" position={win} intensity={9} distance={11} decay={1.5} />
      <spotLight ref={spot} color="#FFC27A" position={[ch6[0] + 0.5, 7.6, ch6[2] + 3.6]} angle={0.3} penumbra={0.65} distance={18} decay={1.2} />
    </>
  )
}

/** Fog tracks the framing so every beat gets the same soft falloff into the dark room. */
function Atmosphere() {
  const { scene, camera } = useThree()
  useEffect(() => {
    scene.background = new THREE.Color('#150d09')
    scene.fog = new THREE.Fog('#150d09', 40, 160)
  }, [])
  useFrame(() => {
    const d = camera.position.distanceTo(focus.target)
    const fog = scene.fog as THREE.Fog
    fog.near = Math.max(8, d * 1.6)
    fog.far = Math.max(40, d * 4.5)
  })
  return null
}

function Effects({ tier }: { tier: Tier }) {
  const dof = useRef<DepthOfFieldEffect>(null)
  const ca = useRef<ChromaticAberrationEffect>(null)
  const caOffset = useMemo(() => new THREE.Vector2(0, 0), [])
  useFrame(() => {
    if (import.meta.env.DEV) (window as any).__dof = dof.current
    if (dof.current) {
      dof.current.target = focus.target
      dof.current.cocMaterial.focusRange = focus.range
      dof.current.bokehScale = focus.bokeh
    }
    if (ca.current) {
      // only during fast camera moves
      const v = Math.min(1, Math.abs(scrollState.velocity) / 4000)
      caOffset.set(v * 0.0025, v * 0.0012)
      ca.current.offset = caOffset
    }
  })
  if (tier === 'low') return null
  return (
    <EffectComposer ref={(c: any) => import.meta.env.DEV && ((window as any).__composer = c)} multisampling={tier === 'high' ? 4 : 0} enableNormalPass={false}>
      <DepthOfField ref={dof} focusDistance={1} focusRange={1} bokehScale={3} resolutionScale={tier === 'high' ? 0.75 : 0.5} />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.9} />
      {tier === 'high' ? <ChromaticAberration ref={ca as any} offset={caOffset} radialModulation={false} modulationOffset={0} /> : <></>}
      <Vignette offset={0.25} darkness={0.7} />
      {tier === 'high' ? <Noise opacity={0.04} premultiply={false} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

/** Renderer tone mapping only when there is no composer doing it (low tier). */
function RendererToneMapping({ tier }: { tier: Tier }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.toneMapping = tier === 'low' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping
  }, [tier])
  return null
}

function Dioramas() {
  const [mount, setMount] = useState(false)
  useEffect(() => {
    // mount after first paint; the timeout guarantees it even when the render loop keeps the main thread busy
    const ric = (window as any).requestIdleCallback
    if (ric) ric(() => setMount(true), { timeout: 1200 })
    else setTimeout(() => setMount(true), 400)
  }, [])
  if (!mount) return null
  return (
    <>
      {[Classroom, Canteen, TeacherDoor, Recommendation, PixoloDayOne, SheStayed, CityMap].map((C, i) => (
        <Suspense key={i} fallback={null}>
          <C />
        </Suspense>
      ))}
    </>
  )
}

export default function Experience() {
  const tier = useStore((s) => s.tier)
  const setTier = useStore((s) => s.setTier)
  const bulb = cafeWorld(CAFE_LOCAL.bulb)
  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: 'fixed', inset: 0, touchAction: 'pan-y' }}
      dpr={DPR[tier]}
      gl={{ antialias: tier !== 'high', powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 40, near: 0.02, far: 400, position: [bulb[0], bulb[1], bulb[2] + 0.85] }}
    >
      {!forcedTier && (
        <PerformanceMonitor
          ms={400}
          iterations={8}
          flipflops={3}
          onDecline={({ fps }) => {
            // step down gently: only really struggling devices lose post-processing entirely
            if (tier === 'high') setTier('medium')
            else if (tier === 'medium' && fps < 24) setTier('low')
          }}
        />
      )}
      <RendererToneMapping tier={tier} />
      <Atmosphere />
      <Lights />
      <CameraRig />
      <Table />
      <Cafe />
      <Dioramas />
      <Effects tier={tier} />
    </Canvas>
  )
}
