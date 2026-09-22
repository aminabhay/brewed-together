import * as THREE from 'three'

export const PALETTE = {
  espresso: '#3B2418',
  mocha: '#6F4E37',
  latte: '#F3E5D0',
  foam: '#FFF8EE',
  amber: '#FFB347',
  sage: '#8A9A7B',
  rose: '#D98A8A',
  skin: '#D9A07A',
  hair: '#241712',
  wood: '#8B5E3C',
  woodDark: '#5C3A22',
  brass: '#C9A45C',
  ink: '#2A1E17',
}

const cache = new Map<string, THREE.Material>()

/** Shared, cached materials: one material per colour keeps draw state cheap. */
export function mat(color: string, opts: { rough?: number; metal?: number; emissive?: string; ei?: number } = {}) {
  const key = `${color}|${opts.rough ?? 0.8}|${opts.metal ?? 0}|${opts.emissive ?? ''}|${opts.ei ?? 0}`
  let m = cache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.8,
      metalness: opts.metal ?? 0,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.ei ?? 0,
    })
    cache.set(key, m)
  }
  return m
}

/** Unlit glow material (for bulbs, screens, neon); bloom picks these up. */
export function glow(color: string, intensity = 3) {
  const key = `glow|${color}|${intensity}`
  let m = cache.get(key)
  if (!m) {
    const c = new THREE.Color(color).multiplyScalar(intensity)
    m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false })
    cache.set(key, m)
  }
  return m
}
