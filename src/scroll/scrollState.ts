/** Mutable, per-frame scroll data. Read inside useFrame; never triggers React renders. */
export const scrollState = {
  y: 0,
  max: 1,
  progress: 0,
  velocity: 0,
  /** Continuous beat position: 3.0 = holding on beat 3, 3.4 = 40% of the way to beat 4. */
  beatPos: 0,
  /** Per-section local progress 0..1 while the section is pinned in view. */
  local: {} as Record<string, number>,
  holds: [] as [number, number][],
}

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
