import { wedding } from '../content/wedding'
import { useStore } from '../state/useStore'
import { Handwritten } from './Handwritten'
import { Section, Sticky } from './Section'

export function Hero() {
  const guest = useStore((s) => s.guest)
  const entered = useStore((s) => s.entered)
  const introKey = useStore((s) => s.introKey)
  return (
    <>
      <Section id="light" label="Welcome">
        <Sticky className="flex flex-col items-center justify-end pb-[12vh]">
          {guest && entered && (
            <p key={introKey} className="fade-up mb-4 font-hand text-3xl text-latte drop-shadow md:text-4xl">
              Dear {guest},
            </p>
          )}
          <div className={`flex flex-col items-center transition-opacity duration-700 ${entered ? 'opacity-100' : 'opacity-0'}`}>
            <span className="font-sans text-xs uppercase tracking-[0.35em] text-latte/80">{wedding.hero.scrollHint}</span>
            <span className="scroll-cup mt-8" aria-hidden>
              <i />
            </span>
          </div>
        </Sticky>
      </Section>
      <Section id="couple" label="We're getting married">
        <Sticky className="flex flex-col items-center justify-start px-4 pt-[12vh] text-center">
          <div className="reveal-on-active w-full max-w-3xl">
            <Handwritten key={introKey} text={wedding.hero.headline} size={96} className="mx-auto w-full" />
            <p className="mt-2 font-serif text-xl text-latte drop-shadow md:text-3xl">
              {wedding.couple.brideFull} <span className="mx-1 font-hand text-amber">&amp;</span> {wedding.couple.groomFull}
            </p>
          </div>
        </Sticky>
      </Section>
    </>
  )
}
