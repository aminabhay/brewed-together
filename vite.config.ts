import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'

/** Dev-only hook used by /?og to save the rendered share image to public/og.png. */
const ogSaver = (): Plugin => ({
  name: 'og-saver',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__og', (req, res) => {
      if (req.method !== 'POST') return res.end()
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        const b64 = body.replace(/^data:image\/png;base64,/, '')
        writeFileSync(new URL('./public/og.png', import.meta.url), Buffer.from(b64, 'base64'))
        res.statusCode = 200
        res.end('ok')
      })
    })
  },
})

/** Dev-only: lets an in-browser tool save a generated asset under public/ (e.g. transcoded audio). */
const assetSaver = (): Plugin => ({
  name: 'asset-saver',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__save', (req, res) => {
      const rel = new URL(req.url ?? '', 'http://x').searchParams.get('path') ?? ''
      if (req.method !== 'POST' || !/^[\w\-/]+\.(wav|m4a|png)$/.test(rel) || rel.includes('..')) {
        res.statusCode = 400
        return res.end('bad request')
      }
      const chunks: Buffer[] = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => {
        writeFileSync(new URL(`./public/${rel}`, import.meta.url), Buffer.concat(chunks))
        res.end('ok')
      })
    })
  },
})

/**
 * Share previews (WhatsApp, iMessage, Facebook…) need absolute URLs for og:image / og:url.
 * index.html uses %SITE_URL%; it becomes VITE_SITE_URL if set, else the Vercel production domain,
 * else nothing (relative URLs, fine for local dev).
 */
const siteUrl = (mode: string): Plugin => {
  const env = loadEnv(mode, process.cwd(), '')
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL
  const url = (env.VITE_SITE_URL || (vercel ? `https://${vercel}` : '')).replace(/\/+$/, '')
  return {
    name: 'site-url',
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%SITE_URL%', url) },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), ogSaver(), assetSaver(), siteUrl(mode)],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          post: ['@react-three/postprocessing', 'postprocessing'],
          anim: ['gsap', 'lenis'],
        },
      },
    },
  },
}))
