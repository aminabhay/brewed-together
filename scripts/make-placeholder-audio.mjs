// Synthesises small placeholder sounds into /public/audio so the site works out of the box.
// Replace them with real royalty-free recordings (see README → Audio).
import { writeFileSync, mkdirSync } from 'node:fs'

const SR = 22050
const out = new URL('../public/audio/', import.meta.url)
mkdirSync(out, { recursive: true })

function wav(name, samples) {
  const n = samples.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-1, Math.min(1, samples[i])) * 32767 | 0, 44 + i * 2)
  writeFileSync(new URL(name, out), buf)
}
const make = (sec, fn) => Float32Array.from({ length: Math.floor(sec * SR) }, (_, i) => fn(i / SR, i))
let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1

// brown noise helper
function brown(sec, gain) {
  let last = 0
  return make(sec, () => ((last = (last + 0.02 * rnd()) / 1.02), last * gain))
}
// loop crossfade so seams are silent-ish
function loopify(s, fade = 0.5) {
  const f = Math.floor(fade * SR)
  for (let i = 0; i < f; i++) {
    const k = i / f
    s[i] = s[i] * k + s[s.length - f + i] * (1 - k)
  }
  return s.slice(0, s.length - f)
}

// Rain: filtered noise with random drips
{
  const s = brown(10, 3.2)
  for (let i = 0; i < s.length; i++) if (Math.random() < 0.0009) for (let j = 0; j < 300 && i + j < s.length; j++) s[i + j] += rnd() * 0.25 * Math.exp(-j / 60)
  wav('rain.wav', loopify(s))
}
// Café ambience: low murmur + soft jazz-ish walking bass
{
  const notes = [55, 61.7, 65.4, 73.4, 82.4, 73.4, 65.4, 61.7]
  const b = brown(12, 2.2)
  const s = make(12, (t, i) => {
    const n = notes[Math.floor(t * 2) % notes.length]
    const env = Math.exp(-((t * 2) % 1) * 4)
    const murmur = b[i] * (0.6 + 0.4 * Math.sin(t * 1.3) * Math.sin(t * 0.7))
    return murmur + 0.12 * env * Math.sin(2 * Math.PI * n * t)
  })
  wav('cafe-ambience.wav', loopify(s))
}
// Romantic piano loop: slow arpeggios in C–Am–F–G
{
  const chords = [[261.6, 329.6, 392, 523.3], [220, 261.6, 329.6, 440], [174.6, 220, 261.6, 349.2], [196, 246.9, 293.7, 392]]
  const s = make(16, (t) => {
    let v = 0
    const beat = t * 2
    for (let k = 0; k < 8; k++) {
      const start = Math.floor(beat) - k
      if (start < 0) continue
      const age = (beat - start) / 2
      const chord = chords[Math.floor(start / 8) % 4]
      const f = chord[start % 4] * (start % 8 >= 4 ? 2 : 1)
      const env = Math.exp(-age * 2.2)
      v += env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * 0.12
    }
    return v
  })
  wav('piano.wav', loopify(s, 1))
}
// Cup clink: two bright inharmonic partials
wav('clink.wav', make(1.2, (t) => Math.exp(-t * 6) * (0.5 * Math.sin(2 * Math.PI * 2630 * t) + 0.3 * Math.sin(2 * Math.PI * 3960 * t) + 0.2 * Math.sin(2 * Math.PI * 5870 * t))))
// Door knock: three low thumps
wav('knock.wav', make(1.1, (t) => {
  let v = 0
  for (const k of [0, 0.28, 0.56]) if (t > k) { const a = t - k; v += Math.exp(-a * 38) * (Math.sin(2 * Math.PI * 140 * a) + 0.4 * rnd()) }
  return v * 0.8
}))
// Stamp thud
wav('stamp.wav', make(0.5, (t) => Math.exp(-t * 25) * (Math.sin(2 * Math.PI * 90 * t) * 0.9 + 0.3 * rnd())))
// Receipt printer: buzzing ticks
wav('printer.wav', make(2.2, (t) => (Math.sin(2 * Math.PI * 38 * t) > 0.6 ? 0.35 : 0) * rnd() * (t < 2 ? 1 : (2.2 - t) * 5)))
// Page flip
wav('page.wav', make(0.35, (t) => rnd() * 0.5 * Math.sin(Math.PI * t / 0.35) ** 2))
console.log('Placeholder audio written to public/audio')
