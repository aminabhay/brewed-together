import { useEffect, useRef } from 'react'
import { useStore } from '../state/useStore'

/**
 * A small, always-there "keep scrolling" cue at the bottom of the screen.
 * On phones people don't think to scroll a page that looks like an app, so this stays on
 * through the whole story, and only steps aside on the first screen (which has its own cue),
 * at the very end, while a form field is focused (phone keyboard) or the chat overlay is open.
 */
export function ScrollCue() {
  const entered = useStore((s) => s.entered)
  const chapter = useStore((s) => s.chapter)
  const phoneOpen = useStore((s) => s.phoneOpen)
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    let typing = false
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement
      typing = t.matches?.('input, textarea, select') ?? false
    }
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', () => (typing = false))
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const atEnd = max > 0 && window.scrollY > max - window.innerHeight * 0.6
      el.current?.classList.toggle('is-hidden', atEnd || typing)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('focusin', onFocus)
    }
  }, [])

  const show = entered && chapter !== 'light' && !phoneOpen
  return (
    <div ref={el} className={`scroll-cue ${show ? '' : 'is-off'}`} aria-hidden>
      <span className="scroll-cue-label">scroll</span>
      <span className="scroll-cue-chevrons">
        <i />
        <i />
      </span>
    </div>
  )
}
