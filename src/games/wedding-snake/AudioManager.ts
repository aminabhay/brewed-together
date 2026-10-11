/** Small synthesised sound kit for Wedding Snake (no files needed). Starts on the first tap. */
class AudioManager {
  private ctx: AudioContext | null = null
  private out!: GainNode

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.out = this.ctx.createGain()
    this.out.gain.value = 0.8
    this.out.connect(this.ctx.destination)
  }

  private tone(f: number, at: number, dur: number, type: OscillatorType, vol: number, glide?: number) {
    const c = this.ctx!
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(f, at)
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, at + dur)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    o.connect(g).connect(this.out)
    o.start(at)
    o.stop(at + dur + 0.02)
  }
  private get t() {
    return this.ctx!.currentTime + 0.01
  }

  /** bright rising chime: got it! */
  collect(step = 0) {
    if (!this.ctx) return
    const base = 660 * Math.pow(2, (step % 6) / 12)
    ;[1, 1.25, 1.5, 2].forEach((m, i) => this.tone(base * m, this.t + i * 0.055, 0.3, 'triangle', 0.12))
  }
  /** comic "nope" buzzer + boing */
  wrong() {
    if (!this.ctx) return
    this.tone(180, this.t, 0.28, 'square', 0.08, 120)
    this.tone(150, this.t + 0.12, 0.3, 'square', 0.07, 90)
    this.tone(300, this.t + 0.3, 0.35, 'sine', 0.12, 140)
  }
  bonus() {
    if (!this.ctx) return
    ;[880, 1175, 1568].forEach((f, i) => this.tone(f, this.t + i * 0.07, 0.35, 'sine', 0.1))
  }
  heart() {
    if (!this.ctx) return
    this.tone(440, this.t, 0.4, 'triangle', 0.1, 220)
  }
  gameOver() {
    if (!this.ctx) return
    ;[392, 330, 262].forEach((f, i) => this.tone(f, this.t + i * 0.18, 0.4, 'triangle', 0.12))
  }
  turn() {
    if (!this.ctx) return
    this.tone(520, this.t, 0.05, 'sine', 0.03, 640)
  }
  /** the finale: a warm rising fanfare */
  fanfare() {
    if (!this.ctx) return
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((f, i) => this.tone(f, this.t + i * 0.12, 0.9, 'triangle', 0.1))
    ;[262, 330, 392].forEach((f) => this.tone(f, this.t + 0.6, 2.2, 'sine', 0.08))
  }
}

export const audio = new AudioManager()

export function buzz(ms = 10) {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
  if (ua && !ua.hasBeenActive) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* unsupported */
  }
}
