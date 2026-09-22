import { useStore } from '../state/useStore'

/** Fake tilt-shift for the low tier (no post-processing): blur the top and bottom of the frame. */
export function FakeDof() {
  const tier = useStore((s) => s.tier)
  if (tier !== 'low') return null
  return <div className="fake-dof pointer-events-none fixed inset-0 z-[1]" aria-hidden />
}

/** Reduced-motion cross-fade veil (CameraRig drives its opacity). */
export function MotionFade() {
  return <div id="motion-fade" className="pointer-events-none fixed inset-0 z-[2] bg-espresso opacity-0" aria-hidden />
}
