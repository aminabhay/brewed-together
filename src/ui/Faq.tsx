import { useState } from 'react'
import { wedding } from '../content/wedding'
import { Section } from './Section'

export function Faq() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Section id="faq" auto label="Questions">
      <div className="flex min-h-[130svh] items-center justify-center px-4 py-[15vh]">
        <div className="chalkboard pointer-events-auto w-full max-w-xl rounded-xl p-6 md:p-10">
          <h2 className="text-center font-hand text-6xl text-[#F3EEE3]">Menu</h2>
          <p className="text-center font-hand text-2xl text-[#F3EEE3]/70">questions, served warm</p>
          <ul className="mt-6 space-y-1">
            {wedding.faq.map((item, i) => {
              const isOpen = open === i
              return (
                <li key={item.q}>
                  <button
                    className="flex min-h-[48px] w-full items-baseline gap-2 text-left font-hand text-3xl text-[#F3EEE3]"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span className="flex-1 translate-y-[-6px] border-b-2 border-dotted border-[#F3EEE3]/40" aria-hidden />
                    <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 self-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div id={`faq-${i}`} className={`grid transition-all duration-500 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <p className={`overflow-hidden font-hand text-2xl leading-snug text-[#F3EEE3]/85 ${isOpen ? 'chalk-write' : ''}`}>{item.a}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-6 flex justify-center gap-6 font-hand text-3xl text-[#F3EEE3]/50" aria-hidden>
            <span>☕</span>
            <span>♥</span>
            <span>✿</span>
          </div>
        </div>
      </div>
    </Section>
  )
}
