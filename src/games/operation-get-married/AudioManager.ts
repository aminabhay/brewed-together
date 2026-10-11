import { gameConfig } from './config'

/**
 * Audio for the game, synthesised with Web Audio so it works with no files at all.
 * (Point gameConfig.audio at real recordings to replace the music.)
 * Nothing plays until unlock() is called from a user gesture (mobile autoplay rules).
 */
class AudioManager {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private music!: GainNode
  private sfx!: GainNode
  private noiseBuf!: AudioBuffer
  private timer: ReturnType<typeof setInterval> | null = null
  private nextNote = 0
  private step = 0
  private intensity = 0
  private revealEl: HTMLAudioElement | null = null
  private pad: { osc: OscillatorNode[]; gain: GainNode } | null = null
  private voices: Partial<Record<'bride' | 'groom', AudioBuffer>> = {}
  muted = false

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.9
    this.master.connect(ctx.destination)
    this.music = ctx.createGain()
    this.music.gain.value = 0.55
    this.music.connect(this.master)
    this.sfx = ctx.createGain()
    this.sfx.gain.value = 0.8
    this.sfx.connect(this.master)
    this.loadVoices()
    const len = ctx.sampleRate
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = this.noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }

  private async loadVoices() {
    const ctx = this.ctx
    if (!ctx) return
    for (const who of ['bride', 'groom'] as const) {
      try {
        const res = await fetch(gameConfig.audio.voices[who].src)
        this.voices[who] = await ctx.decodeAudioData(await res.arrayBuffer())
      } catch {
        /* missing / unsupported: the line still shows as text */
      }
    }
  }

  /** Play the bride's or groom's recorded line. */
  voice(who: 'bride' | 'groom') {
    const ctx = this.ctx
    const buf = this.voices[who]
    if (!ctx || !buf) return
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.value = 1.4
    src.connect(g).connect(this.master)
    src.start(ctx.currentTime + 0.02)
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05)
    if (this.revealEl) this.revealEl.muted = m
  }

  // ── building blocks ─────────────────────────────────────
  private tone(freq: number, at: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode, glideTo?: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, at)
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + dur)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(vol, at + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    o.connect(g).connect(dest)
    o.start(at)
    o.stop(at + dur + 0.02)
  }
  private noise(at: number, dur: number, vol: number, dest: AudioNode, filter: BiquadFilterType = 'highpass', freq = 4000, sweepTo?: number) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const f = ctx.createBiquadFilter()
    f.type = filter
    f.frequency.setValueAtTime(freq, at)
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, at + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    src.connect(f).connect(g).connect(dest)
    src.start(at, Math.random() * 0.5)
    src.stop(at + dur + 0.02)
  }

  // ── chase music: a dhol-driven bhangra-ish loop ───────────
  startChase() {
    if (!gameConfig.audio.music) return
    if (!this.ctx || this.timer) return
    this.nextNote = this.ctx.currentTime + 0.05
    this.step = 0
    this.music.gain.setTargetAtTime(0.55, this.ctx.currentTime, 0.1)
    this.timer = setInterval(() => this.schedule(), 25)
  }
  setIntensity(v: number) {
    this.intensity = Math.max(0, Math.min(1, v))
  }
  stopChase(fade = 1.2) {
    if (!this.ctx || !this.timer) return
    this.music.gain.setTargetAtTime(0.0001, this.ctx.currentTime, fade / 3)
    const t = this.timer
    setTimeout(() => {
      clearInterval(t)
      if (this.timer === t) this.timer = null
    }, fade * 1000)
  }
  private schedule() {
    const ctx = this.ctx!
    const bpm = 148 + this.intensity * 14
    const sixteenth = 60 / bpm / 4
    const scale = [293.66, 329.63, 369.99, 440, 493.88, 587.33] // D major pentatonic-ish
    const melody = [0, 2, 3, 2, 4, 3, 2, 0, 1, 2, 3, 5, 4, 3, 2, 1]
    while (this.nextNote < ctx.currentTime + 0.12) {
      const s = this.step % 16
      const at = this.nextNote
      // dhol bass ("dha") and slap ("tin")
      if ([0, 3, 8, 11].includes(s) || (this.intensity > 0.6 && [6, 14].includes(s))) this.tone(110, at, 0.22, 'sine', 0.55, this.music, 48)
      if ([4, 12].includes(s)) {
        this.tone(420, at, 0.07, 'triangle', 0.18, this.music, 260)
        this.noise(at, 0.06, 0.12, this.music, 'bandpass', 2500)
      }
      // shaker
      if (s % 2 === 1) this.noise(at, 0.04, 0.05 + this.intensity * 0.04, this.music, 'highpass', 7000)
      // plucky melody every 4th 16th (every 2nd when intense)
      if (s % (this.intensity > 0.6 ? 2 : 4) === 0) {
        const n = melody[(this.step / (this.intensity > 0.6 ? 2 : 4)) % melody.length | 0]
        this.tone(scale[n] * (this.intensity > 0.6 ? 2 : 1), at, 0.18, 'triangle', 0.09, this.music)
      }
      this.nextNote += sixteenth
      this.step++
    }
  }

  // ── sound effects ─────────────────────────────────────────
  private now() {
    return this.ctx ? this.ctx.currentTime + 0.005 : 0
  }
  tap() {
    if (!this.ctx) return
    this.tone(900 + Math.random() * 200, this.now(), 0.05, 'sine', 0.05, this.sfx, 600)
  }
  footstep(heavy = false) {
    if (!this.ctx) return
    const t = this.now()
    const v = heavy ? 1 : 0.7
    this.tone(95 + Math.random() * 20, t, 0.09, 'sine', 0.32 * v, this.sfx, 45) // heel thud
    this.noise(t, 0.08, 0.2 * v, this.sfx, 'lowpass', 900) // sole on stone
    this.noise(t + 0.03, 0.06, 0.08 * v, this.sfx, 'bandpass', 2400) // scuff
  }
  swoosh() {
    if (!this.ctx) return
    this.noise(this.now(), 0.35, 0.18, this.sfx, 'bandpass', 600, 3000)
  }
  boing() {
    if (!this.ctx) return
    this.tone(220, this.now(), 0.35, 'sine', 0.2, this.sfx, 520)
  }
  thud() {
    if (!this.ctx) return
    this.tone(70, this.now(), 0.25, 'sine', 0.35, this.sfx, 40)
  }
  crowd() {
    if (!this.ctx) return
    const t = this.now()
    for (let i = 0; i < 4; i++) this.noise(t + i * 0.08, 0.6, 0.06, this.sfx, 'bandpass', 500 + i * 220, 800 + i * 150)
    this.tone(330, t + 0.1, 0.4, 'triangle', 0.05, this.sfx, 280)
  }
  chai() {
    if (!this.ctx) return
    const t = this.now()
    this.noise(t, 0.5, 0.08, this.sfx, 'bandpass', 1200, 1800)
    this.tone(660, t + 0.45, 0.12, 'sine', 0.08, this.sfx)
  }
  dhol() {
    if (!this.ctx) return
    const t = this.now()
    ;[0, 0.12, 0.24, 0.36, 0.42].forEach((d, i) => this.tone(i % 2 ? 160 : 100, t + d, 0.25, 'sine', 0.5, this.sfx, 45))
  }
  click() {
    if (!this.ctx) return
    this.noise(this.now(), 0.05, 0.2, this.sfx, 'highpass', 5000)
  }
  cash() {
    if (!this.ctx) return
    const t = this.now()
    ;[1046, 1318, 1568].forEach((f, i) => this.tone(f, t + i * 0.06, 0.25, 'square', 0.04, this.sfx))
  }
  sparkle() {
    if (!this.ctx) return
    const t = this.now()
    ;[1568, 1976, 2349, 3136].forEach((f, i) => this.tone(f, t + i * 0.09, 0.6, 'sine', 0.05, this.sfx))
  }

  // ── reveal: comedy out, warm music in ───────────────────
  startReveal() {
    this.stopChase(1.5)
    if (!this.ctx || !gameConfig.audio.music) return
    const src = gameConfig.audio.revealMusic
    if (src) {
      try {
        const el = new Audio(src)
        el.loop = true
        el.volume = 0
        el.muted = this.muted
        el.play().catch(() => {})
        this.revealEl = el
        let v = 0
        const fade = setInterval(() => {
          v = Math.min(0.75, v + 0.03)
          el.volume = v
          if (v >= 0.75) clearInterval(fade)
        }, 80)
      } catch {
        /* fall through to the pad */
      }
    }
    // a soft warm pad underneath
    const ctx = this.ctx
    const gain = ctx.createGain()
    gain.gain.value = 0.0001
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 3)
    gain.connect(this.master)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1200
    lp.connect(gain)
    const osc = [146.83, 220, 293.66, 369.99].map((f, i) => {
      const o = ctx.createOscillator()
      o.type = i % 2 ? 'triangle' : 'sine'
      o.frequency.value = f
      o.detune.value = (i - 1.5) * 6
      o.connect(lp)
      o.start()
      return o
    })
    this.pad = { osc, gain }
  }
  stopAll() {
    this.stopChase(0.3)
    if (this.revealEl) {
      this.revealEl.pause()
      this.revealEl = null
    }
    if (this.pad && this.ctx) {
      const p = this.pad
      p.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2)
      setTimeout(() => p.osc.forEach((o) => o.stop()), 800)
      this.pad = null
    }
  }
}

export const audio = new AudioManager()

/** Gentle haptics where supported (Android); silently ignored elsewhere. */
let lastBuzz = 0
export function buzz(ms = 8) {
  const now = performance.now()
  if (now - lastBuzz < 70) return
  lastBuzz = now
  // browsers only allow vibration after a real touch
  if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive === false) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* not supported */
  }
}
