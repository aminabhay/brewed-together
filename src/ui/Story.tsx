import { useEffect, useRef, useState } from 'react'
import { wedding } from '../content/wedding'
import { useStore } from '../state/useStore'
import { interactBus } from '../state/interactBus'
import { scrollState, smooth } from '../scroll/scrollState'
import { Section, Sticky } from './Section'

const ACTIONS: Record<string, { hint: string; label: string; run: () => void } | undefined> = {
  ch1: { hint: 'Tap the glowing desk', label: 'Show the empty desk', run: () => interactBus.deskTip() },
  ch2: { hint: 'Tap Jyoti’s phone', label: 'Read her messages', run: () => useStore.getState().setPhoneOpen(true) },
  ch3: { hint: 'Tap the door', label: 'Knock on the door', run: () => interactBus.knock() },
  ch4: { hint: 'Drag the red stamp onto the note', label: 'Stamp it', run: () => interactBus.stamp() },
  ch5: { hint: 'Tap the ID card', label: 'Flip the ID card', run: () => interactBus.flipCard() },
}

function StoryCard({ id, title, text }: { id: string; title: string; text: string }) {
  const a = ACTIONS[id]
  return (
    <div className="story-card pointer-events-auto absolute inset-x-4 bottom-[4vh] mx-auto max-w-md md:inset-x-auto md:bottom-auto md:right-[6vw] md:top-1/2 md:w-[26rem] md:-translate-y-1/2">
      <div className="paper rounded-2xl p-5 md:p-7">
        <h3 className="font-hand text-4xl text-espresso md:text-5xl">{title}</h3>
        <p className="mt-2 font-serif text-lg leading-snug text-espresso/90 md:text-xl">{text}</p>
        {a && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-sans text-xs uppercase tracking-widest text-mocha">{a.hint}</span>
            <button onClick={a.run} className="btn-small">
              {a.label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SheStayedText() {
  const refs = useRef<(HTMLElement | null)[]>([])
  const { lines, finale } = wedding.sheStayed
  useEffect(() => {
    let raf = 0
    const marks = [0.6, 0.66, 0.72, 0.8]
    const loop = () => {
      const t = scrollState.local.ch6 ?? 0
      refs.current.forEach((el, i) => {
        if (!el) return
        const k = smooth(marks[i], marks[i] + 0.035, t)
        el.style.opacity = String(k)
        el.style.transform = `translateY(${(1 - k) * 16}px)`
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="absolute inset-x-4 top-[10vh] mx-auto max-w-3xl text-center md:top-[12vh]" aria-live="polite">
      {lines.map((l, i) => (
        <p key={i} ref={(el) => (refs.current[i] = el)} className={`font-serif text-3xl text-foam drop-shadow-lg md:text-5xl ${i === lines.length - 1 ? 'mt-2 font-bold' : ''}`} style={{ opacity: 0 }}>
          {l}
        </p>
      ))}
      <p ref={(el) => (refs.current[lines.length] = el)} className="mt-6 font-hand text-5xl text-rose drop-shadow-lg md:text-7xl" style={{ opacity: 0 }}>
        {finale}
      </p>
    </div>
  )
}

const SENDER_COLOURS = ['#1F7AEC', '#D9534F', '#8E44AD', '#E67E22', '#16A085', '#C2185B']

/** Jyoti's class WhatsApp group: friends' messages type themselves out, then hers. */
export function PhoneOverlay() {
  const open = useStore((s) => s.phoneOpen)
  const close = () => useStore.getState().setPhoneOpen(false)
  const [shown, setShown] = useState(0)
  const [typing, setTyping] = useState<string | null>(null)
  const { chat, chatGroup } = wedding.chapterExtras
  const senders = [...new Set(chat.filter((m) => m.from !== 'jyoti').map((m) => m.from))]
  const colourOf = (name: string) => SENDER_COLOURS[senders.indexOf(name) % SENDER_COLOURS.length]
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setShown(0)
      setTyping(null)
      return
    }
    let i = 0
    let t: ReturnType<typeof setTimeout>
    const next = () => {
      if (i >= chat.length) return setTyping(null)
      setTyping(chat[i].from)
      t = setTimeout(() => {
        i++
        setShown(i)
        setTyping(null)
        t = setTimeout(next, 450)
      }, 900 + chat[i].text.length * 12)
    }
    t = setTimeout(next, 400)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // keep the newest message in view (scroll the chat only, never the page behind it)
  useEffect(() => {
    const list = endRef.current?.parentElement
    if (list) list.scrollTop = list.scrollHeight
  }, [shown, typing])

  if (!open) return null
  const typingLabel = typing === 'jyoti' ? '' : typing ? `${typing} is typing…` : `${senders.join(', ')}, You`
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-espresso/60 p-4 backdrop-blur-sm" onClick={close} role="dialog" aria-modal="true" aria-label={`${chatGroup} group chat`}>
      <div className="phone-pop relative flex h-[600px] max-h-[88svh] w-[310px] flex-col overflow-hidden rounded-[2.6rem] border-[10px] border-[#1d1d1f] bg-[#EFE7DE] text-[#111b21] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 bg-[#075E54] px-4 pb-3 pt-6 text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DFE5E7] text-lg" aria-hidden>
            🎓
          </div>
          <div className="min-w-0">
            <div className="truncate font-sans text-[15px] font-semibold">{chatGroup}</div>
            <div className="truncate font-sans text-[12px] text-white/80">{typingLabel}</div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3" aria-live="polite">
          <div className="mx-auto mb-1 rounded-md bg-[#FFF3C4] px-2 py-1 font-sans text-[11px] text-[#54656f]">Today</div>
          {chat.slice(0, shown).map((m, i) =>
            m.from === 'jyoti' ? (
              <div key={i} className="msg-pop max-w-[82%] self-end rounded-xl rounded-tr-sm bg-[#16804A] px-3 py-2 font-sans text-[14px] leading-snug text-white shadow">
                {m.text}
                <span className="ml-2 align-bottom text-[10px] text-white/75">✓✓</span>
              </div>
            ) : (
              <div key={i} className="msg-pop max-w-[82%] self-start rounded-xl rounded-tl-sm bg-white px-3 py-1.5 font-sans text-[14px] leading-snug text-[#111b21] shadow">
                <div className="text-[12px] font-semibold" style={{ color: colourOf(m.from) }}>
                  {m.from}
                </div>
                {m.text}
              </div>
            ),
          )}
          {typing && (
            <div className={`rounded-xl px-3 py-2 font-sans text-sm shadow ${typing === 'jyoti' ? 'self-end bg-[#16804A] text-white' : 'self-start bg-white text-[#667781]'}`} aria-hidden>
              •••
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="flex justify-center bg-[#EFE7DE] pb-4 pt-1">
          <button onClick={close} className="min-h-[44px] rounded-full bg-espresso px-6 font-sans text-sm text-foam" autoFocus>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function Story() {
  return (
    <>
      <Section id="cafeDiorama" label="How it started">
        <Sticky>
          <h2 className="sr-only">{wedding.cafe.chapterTitle}</h2>
          <p className="reveal-on-active absolute inset-x-0 bottom-[8vh] text-center font-sans text-xs uppercase tracking-[0.35em] text-latte/80">{wedding.cafe.plate}</p>
        </Sticky>
      </Section>
      {wedding.story.slice(0, 5).map((ch) => (
        <Section key={ch.id} id={ch.id} label={ch.title}>
          <Sticky>
            <StoryCard id={ch.id} title={ch.title} text={ch.text} />
          </Sticky>
        </Section>
      ))}
      <Section id="ch6" label={wedding.story[5].title}>
        <Sticky>
          <div className="story-card absolute inset-x-4 bottom-[4vh] mx-auto max-w-sm text-center md:left-[6vw] md:right-auto md:mx-0 md:text-left">
            <h3 className="font-hand text-4xl text-foam drop-shadow md:text-5xl">{wedding.story[5].title}</h3>
            <p className="font-serif text-lg text-latte drop-shadow">{wedding.story[5].text}</p>
          </div>
          <SheStayedText />
        </Sticky>
      </Section>
    </>
  )
}

export function FullCircle() {
  return (
    <Section id="backToCups" label="Full circle">
      <Sticky className="flex flex-col items-center justify-start px-4 pt-[10vh] text-center">
        <div className="reveal-on-active">
          <p className="font-serif text-3xl text-foam drop-shadow-lg md:text-5xl">{wedding.fullCircle.line1}</p>
          <p className="mt-3 font-hand text-4xl text-amber drop-shadow md:text-6xl" style={{ transitionDelay: '0.6s' }}>
            {wedding.fullCircle.line2}
          </p>
        </div>
      </Sticky>
    </Section>
  )
}
