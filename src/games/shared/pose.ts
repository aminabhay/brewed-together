/** Where a rigged character is and what it's doing this frame (written by a game's controller, rendered by Rig). */
export interface Pose {
  x: number
  y: number
  z: number
  yaw: number // world yaw; Math.PI = facing down the street (away from the camera)
  clip: string // animation clip when not running
  run: number // 0–1 blend into the procedural run cycle
  speed: number // m/s, sets the run cadence
  rapid: number // 0–1 cartoon sprint
  lookBack: number // 0–1 glance over the shoulder
  crouch: number
  reach: number
  stumble: number
  visible: boolean
}
