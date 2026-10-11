import { useEffect, useRef, useState } from 'react'
import { useGLTF, useProgress } from '@react-three/drei'
import type { SaveTheDateGameProps } from '../types'
import { GameScene } from './GameScene'
import { useGame, resetSim } from './GameState'
import { resetCharacters } from './CharacterController'
import { useTapController } from './TapController'
import { IntroScreen } from './IntroScreen'
import { HUD, EndingSequence } from './HUD'
import { DateReveal } from './DateReveal'
import { audio } from './AudioManager'
import { StageLoader } from '../StageLoader'
import './game.css'

/**
 * OPERATION: GET MARRIED
 * Tap to help the groom catch his bride through an Indian-wedding obstacle course, then reveal the date.
 * Self-contained: drop it into any SaveTheDate slot (see src/games/registry.ts).
 */
export default function OperationGetMarried({ couple, onComplete }: SaveTheDateGameProps) {
  const onTap = useTapController()
  const phase = useGame((s) => s.phase)
  const { active, progress } = useProgress()
  const [loaded, setLoaded] = useState(false)
  const completed = useRef(false)

  // fresh game on mount; stop the music on unmount
  useEffect(() => {
    resetSim()
    resetCharacters()
    useGame.setState({ phase: 'INTRO', progress: 0, toast: null, line: null, stats: null, obstacles: [], idle: false, rapid: false })
    useGLTF.preload(couple.groomModel)
    useGLTF.preload(couple.brideModel)
    return () => audio.stopAll()
  }, [])

  // stylish loader until the characters are in (never more than ~10 s)
  useEffect(() => {
    if (loaded) return
    if (!active && progress >= 100) {
      const t = setTimeout(() => setLoaded(true), 250)
      return () => clearTimeout(t)
    }
  }, [active, progress, loaded])
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 10000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase === 'COMPLETE' && !completed.current) {
      completed.current = true
      onComplete?.()
    }
  }, [phase])

  return (
    <div className="ogm-root" onPointerDown={onTap}>
      <GameScene groomUrl={couple.groomModel} brideUrl={couple.brideModel} />
      <EndingSequence />
      <HUD />
      <IntroScreen ready={loaded} />
      <DateReveal couple={couple} />
      {!loaded && <StageLoader label="Stretching the groom’s hamstrings…" />}
    </div>
  )
}
