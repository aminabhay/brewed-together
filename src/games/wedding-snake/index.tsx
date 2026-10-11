import { useEffect, useRef, useState } from 'react'
import { useGLTF, useProgress } from '@react-three/drei'
import type { SaveTheDateGameProps } from '../types'
import { GameCanvas } from './GameCanvas'
import { useSnake, sim } from './GameState'
import * as manager from './GameManager'
import { newRun } from './GameManager'
import { useSteering } from './Input'
import { Intro, HUD, Finale, Reveal } from './UI'
import { StageLoader } from '../StageLoader'
import './game.css'

// dev-only handle for poking at the game from the console
if (import.meta.env.DEV) Object.assign(window, { __ws: { manager, useSnake, sim } })

/**
 * WEDDING SNAKE
 * Steer through the wedding village collecting what the wedding needs (not the office laptop),
 * gather a growing procession, find the rings, then reveal the date.
 * Self-contained: drop it into any SaveTheDate slot (see src/games/registry.ts).
 */
export default function WeddingSnake({ couple, onComplete }: SaveTheDateGameProps) {
  const root = useRef<HTMLDivElement>(null)
  const steering = useSteering(root)
  const phase = useSnake((s) => s.phase)
  const { active, progress } = useProgress()
  const [loaded, setLoaded] = useState(false)
  const completed = useRef(false)
  const urls = { groom: couple.groomModel, bride: couple.brideModel }

  useEffect(() => {
    newRun()
    useSnake.getState().setPhase('INTRO')
    useGLTF.preload(couple.groomModel)
    useGLTF.preload(couple.brideModel)
  }, [])

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
    if (phase === 'REVEAL' && !completed.current) {
      completed.current = true
      onComplete?.()
    }
  }, [phase])

  return (
    <div ref={root} className="ws-root" {...steering}>
      <GameCanvas urls={urls} />
      <HUD />
      <Finale />
      <Intro ready={loaded} couple={couple} />
      <Reveal couple={couple} />
      {!loaded && <StageLoader label="Looking for the rings…" />}
    </div>
  )
}
