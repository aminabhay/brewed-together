import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BEATS } from './beats'
import { scrollState, clamp01 } from './scrollState'
import { useStore } from '../state/useStore'

gsap.registerPlugin(ScrollTrigger)

export let lenis: Lenis | null = null

export function scrollToTop(duration = 3) {
  if (lenis) lenis.scrollTo(0, { duration, easing: (t) => 1 - Math.pow(1 - t, 3) })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}
export function scrollToBeat(id: string) {
  const el = document.querySelector<HTMLElement>(`[data-beat="${id}"]`)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.6 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

/** Measure every [data-beat] section and derive the camera hold range for each. */
function measure() {
  const vh = window.innerHeight
  const max = Math.max(1, document.documentElement.scrollHeight - vh)
  scrollState.max = max
  const els = BEATS.map((b) => document.querySelector<HTMLElement>(`[data-beat="${b.id}"]`))
  scrollState.holds = els.map((el, i) => {
    if (!el) return [0, 0]
    const top = el.offsetTop
    const h = el.offsetHeight
    let a = top + 0.15 * vh
    let b = top + h - vh - 0.15 * vh
    if (b < a) a = b = top + (h - vh) / 2
    if (i === 0) a = 0
    if (i === els.length - 1) b = max + 1
    return [Math.max(0, a), b]
  })
}

function update(y: number) {
  scrollState.y = y
  scrollState.progress = clamp01(y / scrollState.max)
  const holds = scrollState.holds
  let pos = 0
  for (let i = 0; i < holds.length; i++) {
    const [a, b] = holds[i]
    if (y < a) {
      const prevEnd = holds[i - 1]?.[1] ?? 0
      const t = clamp01((y - prevEnd) / Math.max(1, a - prevEnd))
      pos = i - 1 + t * t * (3 - 2 * t)
      break
    }
    if (y <= b) {
      pos = i
      break
    }
    pos = i
  }
  scrollState.beatPos = Math.max(0, pos)
  const id = BEATS[Math.round(scrollState.beatPos)]?.id
  if (id && useStore.getState().chapter !== id) useStore.getState().setChapter(id)
}

export function useSmoothScroll() {
  useEffect(() => {
    const reduced = useStore.getState().reducedMotion
    lenis = new Lenis({ lerp: reduced ? 1 : 0.085, smoothWheel: !reduced })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis?.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // Whole page → global progress & velocity
    const master = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        scrollState.velocity = self.getVelocity()
        update(self.scroll())
      },
    })

    // Each section → local progress (0 when its top meets the viewport top, 1 when its bottom meets the bottom)
    // plus an `is-active` class the HTML cards animate from.
    const triggers = BEATS.map((b) => {
      const el = document.querySelector<HTMLElement>(`[data-beat="${b.id}"]`)
      if (!el) return null
      return ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => (scrollState.local[b.id] = self.progress),
        onToggle: (self) => el.classList.toggle('is-pinned', self.isActive),
      })
    })
    const activeTriggers = BEATS.map((b) => {
      const el = document.querySelector<HTMLElement>(`[data-beat="${b.id}"]`)
      if (!el) return null
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 45%',
        toggleClass: 'is-active',
      })
    })

    const onRefresh = () => {
      measure()
      update(window.scrollY)
    }
    ScrollTrigger.addEventListener('refresh', onRefresh)
    measure()
    ScrollTrigger.refresh()
    const ro = new ResizeObserver(() => ScrollTrigger.refresh())
    ro.observe(document.body)

    return () => {
      ro.disconnect()
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      master.kill()
      triggers.forEach((t) => t?.kill())
      activeTriggers.forEach((t) => t?.kill())
      gsap.ticker.remove(tick)
      lenis?.destroy()
      lenis = null
    }
  }, [])
}
