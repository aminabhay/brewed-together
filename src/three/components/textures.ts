import * as THREE from 'three'

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

/**
 * Canvas → texture. Redraws once web fonts have loaded, so handwritten text never
 * gets stuck in a fallback font.
 */
export function canvasTexture(w: number, h: number, draw: Draw, opts: { repeat?: [number, number]; srgb?: boolean } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const tex = new THREE.CanvasTexture(canvas)
  if (opts.srgb !== false) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  if (opts.repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(...opts.repeat)
  }
  const render = () => {
    ctx.clearRect(0, 0, w, h)
    draw(ctx, w, h)
    tex.needsUpdate = true
  }
  render()
  document.fonts?.ready.then(render)
  return tex
}

const memo = new Map<string, THREE.Texture>()
export function memoTex(key: string, make: () => THREE.Texture) {
  let t = memo.get(key)
  if (!t) memo.set(key, (t = make()))
  return t
}

export const HAND = '"Caveat", "Homemade Apple", cursive'
export const SERIF = '"Fraunces", Georgia, serif'
export const SANS = '"Inter", system-ui, sans-serif'

/** Text on a transparent background, used for plates, labels, steam masks. */
export function textTexture(
  text: string,
  o: { w?: number; h?: number; font?: string; size?: number; color?: string; bg?: string; weight?: string; lines?: string[] } = {},
) {
  const w = o.w ?? 512
  const h = o.h ?? 128
  return canvasTexture(w, h, (ctx) => {
    if (o.bg) {
      ctx.fillStyle = o.bg
      ctx.fillRect(0, 0, w, h)
    }
    ctx.fillStyle = o.color ?? '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const lines = o.lines ?? [text]
    const size = o.size ?? h * 0.6
    ctx.font = `${o.weight ?? '600'} ${size}px ${o.font ?? HAND}`
    lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05))
  })
}

export function woodTexture(light = '#9A6A43', dark = '#6E4527', planks = 6) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = light
    ctx.fillRect(0, 0, w, h)
    const ph = h / planks
    for (let p = 0; p < planks; p++) {
      const y0 = p * ph
      ctx.fillStyle = p % 2 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)'
      ctx.fillRect(0, y0, w, ph)
      for (let i = 0; i < 14; i++) {
        ctx.strokeStyle = `rgba(60,30,15,${0.08 + Math.random() * 0.1})`
        ctx.lineWidth = 1 + Math.random() * 2
        ctx.beginPath()
        const yy = y0 + Math.random() * ph
        ctx.moveTo(0, yy)
        for (let x = 0; x <= w; x += 32) ctx.lineTo(x, yy + Math.sin(x * 0.02 + i) * 3)
        ctx.stroke()
      }
      ctx.fillStyle = dark
      ctx.fillRect(0, y0, w, 2)
    }
  }, { repeat: [1, 1] })
}

export function brickTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3e241a'
    ctx.fillRect(0, 0, w, h)
    const bh = 32
    const bw = 96
    for (let r = 0; r < h / bh; r++) {
      for (let c = -1; c < w / bw + 1; c++) {
        const x = c * bw + (r % 2 ? bw / 2 : 0)
        const t = Math.random()
        ctx.fillStyle = `rgb(${108 + t * 34},${52 + t * 20},${38 + t * 12})`
        ctx.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6)
      }
    }
  })
}

export function radialTexture(inner = 'rgba(0,0,0,0.55)', outer = 'rgba(0,0,0,0)') {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, inner)
    g.addColorStop(1, outer)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

/** Heart shape (white on transparent) — used as a steam mask. */
export function heartTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#fff'
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 18
    ctx.beginPath()
    const s = w / 2.6
    ctx.translate(w / 2, h / 2 + s * 0.35)
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(-s * 1.2, -s * 0.8, -s * 0.6, -s * 1.7, 0, -s * 1.1)
    ctx.bezierCurveTo(s * 0.6, -s * 1.7, s * 1.2, -s * 0.8, 0, 0)
    ctx.fill()
  })
}
