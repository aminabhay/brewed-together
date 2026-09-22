import { defineConfig, type Plugin } from 'vite'
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

export default defineConfig({
  plugins: [react(), ogSaver()],
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
})
