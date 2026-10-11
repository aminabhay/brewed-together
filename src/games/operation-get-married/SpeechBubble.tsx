import { Html } from '@react-three/drei'

/** A crisp HTML speech bubble pinned in the 3D scene (real text, readable at phone sizes). */
export function SpeechBubble({ text, position, side = 'left', wide = false }: { text: string; position: [number, number, number]; side?: 'left' | 'right'; wide?: boolean }) {
  return (
    <Html position={position} center zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`ogm-bubble ${side === 'right' ? 'ogm-bubble--right' : ''} ${wide ? 'ogm-bubble--wide' : ''}`}>{text}</div>
    </Html>
  )
}
