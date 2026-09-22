/**
 * World-space layout. Everything sits on one big wooden table whose top is y = 0.
 * Every diorama stands on a base whose top is BASE_H above the table.
 * To swap a procedural diorama for a .glb, keep its group at the same position.
 */
export type V3 = [number, number, number]

export const BASE_H = 0.6

export const CAFE: V3 = [0, 0, 0]

/** Café-local points (add CAFE + BASE_H to get world space). */
export const CAFE_LOCAL = {
  bulb: [1.2, 3.35, -3.55] as V3,
  table: [0.6, 0, -1.2] as V3,
  tableTop: 1.1,
  cupA: [0.36, 0, -0.9] as V3,
  cupB: [0.84, 0, -0.9] as V3,
  chalkboard: [-2.6, 2.35, -4.12] as V3,
  door: [3.4, 0, -4.12] as V3,
}

export const cafeWorld = (p: V3): V3 => [CAFE[0] + p[0], CAFE[1] + BASE_H + p[1], CAFE[2] + p[2]]

/** Story dioramas along a gentle arc, further and further down the table. */
export const CHAPTERS: Record<'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6', V3> = {
  ch1: [19, 0, -3],
  ch2: [35, 0, -7],
  ch3: [51, 0, -9],
  ch4: [67, 0, -9],
  ch5: [83, 0, -7],
  ch6: [100, 0, -3],
}

/** The miniature city map lies under the table and is revealed when the table fades. */
export const MAP = {
  center: [30, -0.05, -8] as V3,
  half: 48,
}
export const mapToWorld = (u: number, v: number): V3 => [
  MAP.center[0] + u * MAP.half,
  0,
  MAP.center[2] + v * MAP.half * 0.7,
]
