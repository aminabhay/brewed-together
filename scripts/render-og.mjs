// Re-renders public/og.png from the real 3D cups.
// Usage: `npm run dev` in one terminal, then `npm run og` (uses Playwright if installed),
// or simply open http://localhost:5173/?og in a browser: the page saves the PNG itself.
const url = process.env.OG_URL ?? 'http://localhost:5173/?og'
try {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1300, height: 800 } })
  await page.goto(url)
  await page.getByText('Saved to public/og.png').waitFor({ timeout: 20000 })
  await browser.close()
  console.log('public/og.png updated')
} catch (e) {
  console.log(`Open ${url} in a browser while the dev server runs; it writes public/og.png.\n(${e.message})`)
}
