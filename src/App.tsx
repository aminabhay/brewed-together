import { lazy, Suspense, useEffect, useState } from 'react'
import { getGPUTier } from 'detect-gpu'
import { useStore, type Tier } from './state/useStore'
import { useSmoothScroll, lenis } from './scroll/useSmoothScroll'
import { beatIndex, type BeatId } from './scroll/beats'
import { setMood } from './audio/sounds'
import { Loader } from './ui/Loader'
import { SoundToggle } from './ui/SoundToggle'
import { Hero } from './ui/Hero'
import { CupsSection } from './ui/CupsSection'
import { Story, FullCircle, PhoneOverlay } from './ui/Story'
import { Venue } from './ui/Venue'
import { Rsvp } from './ui/Rsvp'
import { Faq } from './ui/Faq'
import { Footer } from './ui/Footer'
import { FallbackStory } from './ui/Fallback'
import { FakeDof, MotionFade } from './ui/Overlays'
import { ErrorBoundary } from './ui/ErrorBoundary'

const Experience = lazy(() => import('./three/Experience'))

const hasWebGL = (() => {
  if (new URLSearchParams(location.search).has('static')) return false // preview the fallback
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
})()

async function detectTier(): Promise<Tier> {
  const forced = new URLSearchParams(location.search).get('tier') as Tier | null
  if (forced && ['high', 'medium', 'low'].includes(forced)) return forced
  try {
    const r = await Promise.race([getGPUTier(), new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2000))])
    if (r.tier >= 3 && !r.isMobile) return 'high'
    if (r.tier >= 2) return 'medium'
    return 'low'
  } catch {
    return window.innerWidth < 768 ? 'medium' : 'high'
  }
}

function Story3D() {
  useSmoothScroll()
  const entered = useStore((s) => s.entered)

  // hold the page still until the guest steps in
  useEffect(() => {
    if (entered) {
      lenis?.start()
      document.documentElement.classList.remove('locked')
    } else {
      lenis?.stop()
      document.documentElement.classList.add('locked')
    }
  }, [entered])

  // café ambience → romantic piano from "She stayed" onward
  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.chapter !== prev.chapter) setMood(beatIndex(s.chapter as BeatId) >= beatIndex('ch6'))
      }),
    [],
  )

  return (
    <main className="relative z-10">
      <Hero />
      <CupsSection />
      <Story />
      <FullCircle />
      <Venue />
      <Rsvp />
      <Faq />
      <Footer />
    </main>
  )
}

export default function App() {
  const [tierReady, setTierReady] = useState(false)
  useEffect(() => {
    if (!hasWebGL) return
    detectTier().then((t) => {
      useStore.getState().setTier(t)
      setTierReady(true)
    })
  }, [])

  if (!hasWebGL) {
    return (
      <div className="min-h-screen bg-espresso">
        <FallbackStory />
        <div className="static-sections pt-16">
          <Venue staticMode />
          <Rsvp />
          <Faq />
          <Footer />
        </div>
      </div>
    )
  }

  return (
    <>
      {tierReady && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </ErrorBoundary>
      )}
      <FakeDof />
      <MotionFade />
      <Story3D />
      <ErrorBoundary>
        <PhoneOverlay />
      </ErrorBoundary>
      <SoundToggle />
      <Loader ready={tierReady} />
    </>
  )
}
