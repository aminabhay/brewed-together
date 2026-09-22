import { useState } from 'react'
import { wedding } from '../content/wedding'
import { useStore } from '../state/useStore'
import { scrollToTop } from '../scroll/useSmoothScroll'
import { Section } from './Section'

export function Footer() {
  const [copied, setCopied] = useState(false)
  const f = wedding.footer
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(f.hashtag)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked; the hashtag is still selectable */
    }
  }
  const replay = () => {
    scrollToTop(useStore.getState().reducedMotion ? 0 : 3.2)
    setTimeout(() => useStore.getState().replay(), useStore.getState().reducedMotion ? 50 : 3300)
  }
  return (
    <Section id="closing" auto label="Closing time">
      <footer className="flex min-h-[120svh] flex-col items-center justify-end px-4 pb-[8vh] text-center">
        <div className="pointer-events-auto flex flex-col items-center gap-5">
          <p className="font-hand text-5xl text-foam drop-shadow md:text-6xl">Closing time… see you there ♥</p>
          <button onClick={copy} className="chip text-lg" aria-label={`Copy hashtag ${f.hashtag}`}>
            {f.hashtag} <span className="text-sm opacity-80">{copied ? '✓ copied' : '⧉ copy'}</span>
          </button>
          <ul className="flex flex-col gap-1 font-sans text-latte md:flex-row md:gap-6">
            {f.contacts.map((c) => (
              <li key={c.phone}>
                {c.name}:{' '}
                <a className="underline underline-offset-4" href={`tel:${c.phone.replace(/\s/g, '')}`}>
                  {c.phone}
                </a>
              </li>
            ))}
          </ul>
          <button onClick={replay} className="btn">
            {f.replay}
          </button>
          <p className="font-sans text-xs text-latte/60">{f.madeBy}</p>
        </div>
      </footer>
    </Section>
  )
}
