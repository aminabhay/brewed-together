import { useEffect, useRef } from 'react'
import { DIR, steer } from './GameManager'
import { sim } from './GameState'

const SWIPE = 22 // px before a drag counts as a swipe

/**
 * Swipe to change direction (chained: keep dragging to turn again), or tap on a side of
 * the player to head that way. Arrow keys / WASD on desktop.
 */
export function useSteering(root: React.RefObject<HTMLElement>) {
  const start = useRef<{ x: number; y: number; swiped: boolean } | null>(null)

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const d = k === 'arrowup' || k === 'w' ? DIR.up : k === 'arrowdown' || k === 's' ? DIR.down : k === 'arrowleft' || k === 'a' ? DIR.left : k === 'arrowright' || k === 'd' ? DIR.right : null
      if (d === null) return
      e.preventDefault()
      steer(d)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  const fromVector = (dx: number, dy: number) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIR.right : DIR.left) : dy > 0 ? DIR.down : DIR.up)

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-no-steer]')) return
      start.current = { x: e.clientX, y: e.clientY, swiped: false }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const s = start.current
      if (!s) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.hypot(dx, dy) < SWIPE) return
      steer(fromVector(dx, dy))
      start.current = { x: e.clientX, y: e.clientY, swiped: true }
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current
      start.current = null
      if (!s || s.swiped || !root.current) return
      // a plain tap: go towards where you tapped, relative to the player
      const r = root.current.getBoundingClientRect()
      const dx = e.clientX - (r.left + sim.playerScreen.x * r.width)
      const dy = e.clientY - (r.top + sim.playerScreen.y * r.height)
      if (Math.hypot(dx, dy) < 18) return
      steer(fromVector(dx, dy))
    },
    onPointerCancel: () => {
      start.current = null
    },
  }
}
