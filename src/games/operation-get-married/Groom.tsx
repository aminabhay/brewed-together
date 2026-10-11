import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { gameConfig } from './config'
import { groom } from './CharacterController'
import { useGame } from './GameState'
import { Rig } from './Rig'
import { SpeechBubble } from './SpeechBubble'
import { Blob } from '../../three/components/Props'

export function Groom({ url }: { url: string }) {
  const line = useGame((s) => (s.line?.who === 'groom' ? s.line.text : null))
  const shadow = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  useFrame(() => {
    shadow.current.position.set(groom.x, 0.02, groom.z)
    shadow.current.scale.setScalar(1 - Math.min(0.5, groom.y * 0.4))
    head.current.position.set(groom.x, gameConfig.characters.groom.height + 0.45, groom.z)
  })
  const c = gameConfig.characters.groom
  return (
    <>
      <Rig url={url} height={c.height} pose={groom} outfit={c.outfit} placeholder={{ shirt: '#7A1F2E', pants: '#E6DAC4', hair: 'curly', beard: true }} />
      <group ref={shadow}>
        <Blob size={1.1} opacity={0.45} />
      </group>
      <group ref={head}>{line && <SpeechBubble text={line} position={[0, 0, 0]} side="right" />}</group>
    </>
  )
}
