import { useCallback } from 'react'
import { goto, sim, useGame } from './GameState'
import { registerTap } from './CharacterController'
import { audio } from './AudioManager'

export const TAP_EVENT = 'ogm-tap'

/**
 * One handler for the whole stage: taps anywhere skip the intro, start the chase, or add speed.
 * Buttons and links inside the overlays keep working normally.
 */
export function useTapController() {
  return useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [data-no-tap]')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const phase = useGame.getState().phase
    if (phase === 'INTRO') {
      goto('READY') // impatient guests can skip
      return
    }
    if (phase === 'READY') {
      if (sim.phaseTime < 2.6) return // let the bride make her entrance
      audio.unlock() // first real gesture: mobile browsers allow audio from here
      audio.setMuted(!useGame.getState().soundOn)
      audio.startChase()
      sim.lastTapAt = performance.now() / 1000
      goto('CHASE')
      registerTap()
    } else if (phase === 'CHASE' || phase === 'FINAL_CHASE') {
      registerTap()
    } else return
    window.dispatchEvent(new CustomEvent(TAP_EVENT, { detail: { x: e.clientX, y: e.clientY } }))
  }, [])
}
