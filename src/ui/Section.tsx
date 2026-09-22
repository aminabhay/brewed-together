import type { ReactNode } from 'react'
import { BEATS, type BeatId } from '../scroll/beats'

/** A scroll beat. Its height (from beats.ts) is how long the camera lingers here. */
export function Section({ id, children, className = '', auto = false, label }: { id: BeatId; children?: ReactNode; className?: string; auto?: boolean; label?: string }) {
  const h = BEATS.find((b) => b.id === id)!.height
  return (
    <section data-beat={id} aria-label={label} className={`beat relative ${className}`} style={{ minHeight: auto ? `${h}vh` : undefined, height: auto ? undefined : `${h}vh` }}>
      {children}
    </section>
  )
}

/** Keeps its children on screen while the section scrolls by. */
export function Sticky({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`sticky top-0 h-[100svh] w-full overflow-hidden ${className}`}>{children}</div>
}
