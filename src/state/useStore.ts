import { create } from 'zustand'

export type Tier = 'high' | 'medium' | 'low'
export type RsvpStatus = 'idle' | 'sending' | 'done' | 'error'

interface State {
  entered: boolean
  soundOn: boolean
  chapter: string
  dateRevealed: boolean
  tier: Tier
  reducedMotion: boolean
  introKey: number
  shakeAt: number
  mapFocus: number | null
  phoneOpen: boolean
  gyro: boolean
  guest: string
  rsvp: { status: RsvpStatus; name: string; count: number; error?: string }
  enter: () => void
  setSound: (on: boolean) => void
  setChapter: (id: string) => void
  revealDate: () => void
  setTier: (t: Tier) => void
  replay: () => void
  shake: () => void
  setMapFocus: (i: number | null) => void
  setPhoneOpen: (o: boolean) => void
  setGyro: (g: boolean) => void
  setRsvp: (r: Partial<State['rsvp']>) => void
}

const guestFromUrl = () => {
  try {
    return new URLSearchParams(window.location.search).get('guest')?.trim().slice(0, 80) ?? ''
  } catch {
    return ''
  }
}

export const useStore = create<State>((set) => ({
  entered: false,
  soundOn: false,
  chapter: 'light',
  dateRevealed: false,
  tier: 'medium',
  reducedMotion:
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  introKey: 0,
  shakeAt: -1,
  mapFocus: null,
  phoneOpen: false,
  gyro: false,
  guest: guestFromUrl(),
  rsvp: { status: 'idle', name: '', count: 1 },
  enter: () => set({ entered: true }),
  setSound: (soundOn) => set({ soundOn }),
  setChapter: (chapter) => set({ chapter }),
  revealDate: () => set({ dateRevealed: true }),
  setTier: (tier) => set({ tier }),
  replay: () => set((s) => ({ introKey: s.introKey + 1 })),
  shake: () => set({ shakeAt: performance.now() }),
  setMapFocus: (mapFocus) => set({ mapFocus }),
  setPhoneOpen: (phoneOpen) => set({ phoneOpen }),
  setGyro: (gyro) => set({ gyro }),
  setRsvp: (r) => set((s) => ({ rsvp: { ...s.rsvp, ...r } })),
}))

if (import.meta.env.DEV && typeof window !== 'undefined') (window as any).__store = useStore
