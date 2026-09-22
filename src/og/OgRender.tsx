import { useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { wedding } from '../content/wedding'
import { cupTexture } from '../three/world/Cups'
import { makeCoffeeMaterial } from '../three/shaders/coffee'
import { canvasTexture, HAND, SERIF } from '../three/components/textures'

/**
 * Renders the 1200×630 share image from the real cup assets.
 * Open /?og while `npm run dev` runs: it saves public/og.png via the dev-server hook.
 */
function OgCup({ x, name, date }: { x: number; name: string; date: string }) {
  const tex = useMemo(() => cupTexture(name, date), [])
  const coffee = useMemo(() => makeCoffeeMaterial(), [])
  return (
    <group position={[x, -0.6, 0]} rotation={[0, Math.PI - (x > 0 ? 0.3 : -0.3), 0]} scale={5.4}>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.12, 0.095, 0.26, 64, 1, true]} />
        <meshStandardMaterial map={tex} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.235, 0]} rotation={[-Math.PI / 2, 0, 0]} material={coffee}>
        <circleGeometry args={[0.112, 48]} />
      </mesh>
      <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.116, 0.008, 8, 48]} />
        <meshStandardMaterial color="#FFF8EE" />
      </mesh>
    </group>
  )
}

function Title() {
  const tex = useMemo(
    () =>
      canvasTexture(2048, 400, (ctx, w, h) => {
        ctx.textAlign = 'center'
        ctx.fillStyle = '#FFF8EE'
        ctx.font = `700 150px ${HAND}`
        ctx.fillText(`${wedding.couple.groom} & ${wedding.couple.bride}`, w / 2, 160)
        ctx.fillStyle = '#FFB347'
        ctx.font = `500 76px ${SERIF}`
        ctx.fillText(`${wedding.date.display} · ${wedding.date.city}`, w / 2, 290)
      }),
    [],
  )
  return (
    <mesh position={[0, 2.25, 0.5]}>
      <planeGeometry args={[7.2, 1.4]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

function Capture({ onDone }: { onDone: (url: string) => void }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    document.fonts.ready.then(() =>
      setTimeout(() => {
        onDone(gl.domElement.toDataURL('image/png'))
      }, 800),
    )
  }, [])
  return null
}

export default function OgRender() {
  const [url, setUrl] = useState('')
  const [saved, setSaved] = useState('')
  const done = async (u: string) => {
    setUrl(u)
    try {
      const r = await fetch('/__og', { method: 'POST', body: u })
      setSaved(r.ok ? 'Saved to public/og.png' : 'Dev hook unavailable: right-click the image to save it.')
    } catch {
      setSaved('Dev hook unavailable: right-click the image to save it.')
    }
  }
  return (
    <div style={{ background: '#222', minHeight: '100vh', padding: 16, color: '#fff', fontFamily: 'Inter' }}>
      <div style={{ width: 1200, height: 630 }}>
        <Canvas gl={{ preserveDrawingBuffer: true, antialias: true }} dpr={1} camera={{ position: [0, 1.7, 6.6], fov: 40 }}
          onCreated={({ camera }) => camera.lookAt(0, 1.0, 0)} style={{ width: 1200, height: 630 }}>
          <color attach="background" args={['#3B2418']} />
          <ambientLight intensity={0.6} color="#ffe6cc" />
          <pointLight position={[0, 3, 3]} intensity={40} color="#FFB347" />
          <directionalLight position={[-3, 4, 5]} intensity={1.4} color="#fff0dd" />
          <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[5, 48]} />
            <meshStandardMaterial color="#6F4E37" />
          </mesh>
          <OgCup x={-1.2} name={wedding.couple.groom} date={wedding.date.cupA} />
          <OgCup x={1.2} name={wedding.couple.bride} date={wedding.date.cupB} />
          <Title />
          <Capture onDone={done} />
        </Canvas>
      </div>
      <p style={{ marginTop: 12 }}>{saved || 'Rendering…'}</p>
      {url && <img src={url} width={600} alt="Share image preview" />}
    </div>
  )
}
