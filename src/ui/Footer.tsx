import { wedding } from '../content/wedding'
import { useStore } from '../state/useStore'
import { scrollToTop } from '../scroll/useSmoothScroll'
import { Section } from './Section'

export function Footer() {
  const f = wedding.footer
  const replay = () => {
    scrollToTop(useStore.getState().reducedMotion ? 0 : 3.2)
    setTimeout(() => useStore.getState().replay(), useStore.getState().reducedMotion ? 50 : 3300)
  }
  return (
    <Section id="closing" auto label="Closing time">
      <footer className="flex min-h-[120svh] flex-col items-center justify-end text-center">
        <div className="pointer-events-auto flex flex-col items-center gap-5 px-4 pb-[6vh]">
          <p className="font-hand text-5xl text-foam drop-shadow md:text-6xl">Closing time… see you there ♥</p>
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
          <p className="font-sans text-xs text-latte/60">
            {f.madeBy.split(f.madeByBrand)[0]}
            <a className="underline underline-offset-2 hover:text-latte" href={f.madeByUrl} target="_blank" rel="noreferrer">
              {f.madeByBrand}
            </a>
            {f.madeBy.split(f.madeByBrand).slice(1).join(f.madeByBrand)}
          </p>
        </div>
        {/* the Weddingo strap along the very bottom */}
        <div className="pointer-events-auto flex w-full justify-center bg-black px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <a href={f.madeByUrl} target="_blank" rel="noreferrer" aria-label={`${f.madeByBrand} (opens ${f.madeByUrl})`}>
            <img src={`${import.meta.env.BASE_URL}logos/weddingo-light.png`} alt={f.madeByBrand} className="h-7 w-auto md:h-8" loading="lazy" />
          </a>
        </div>
      </footer>
    </Section>
  )
}
