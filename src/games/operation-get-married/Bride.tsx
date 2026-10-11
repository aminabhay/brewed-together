import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { gameConfig } from './config'
import { bride } from './CharacterController'
import { useGame } from './GameState'
import { Rig } from '../shared/Rig'
import { SpeechBubble } from './SpeechBubble'
import { Blob } from '../../three/components/Props'

export function Bride({ url }: { url: string }) {
  const line = useGame((s) => (s.line?.who === 'bride' ? s.line.text : null))
  // "Hello? …" floats right above her when the guest stops tapping
  const idle = useGame((s) => s.idle && (s.phase === 'CHASE' || s.phase === 'FINAL_CHASE'))
  const shadow = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  useFrame(() => {
    shadow.current.visible = bride.visible
    shadow.current.position.set(bride.x, 0.02, bride.z)
    head.current.position.set(bride.x, gameConfig.characters.bride.height + 0.45, bride.z)
  })
  const c = gameConfig.characters.bride
  return (
    <>
      <Rig url={url} height={c.height} pose={bride} fairSkin={c.fairSkin} outfit={c.outfit} placeholder={{ shirt: '#D98A94', pants: '#2B2A33', hair: 'bun', dress: true, glasses: true }} />
      <group ref={shadow}>
        <Blob size={0.95} opacity={0.4} />
      </group>
      <group ref={head}>
        {line && <SpeechBubble text={line} position={[0, 0, 0]} />}
        {!line && idle && <SpeechBubble text={gameConfig.dialogue.idle} position={[0, 0.2, 0]} wide />}
      </group>
    </>
  )
}
