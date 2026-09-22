# Brewed Together ☕ · Abhay & Jyoti

A single-page, scroll-driven 3D wedding invitation. The whole site is one continuous camera move that only ever **zooms out**: from a café wall light, to the couple, to two cups that reveal the date, to the café as a miniature diorama on a big wooden table, past six story dioramas, and out to a miniature city map of the venue.

Built with Vite, React 18, TypeScript, three.js, @react-three/fiber and drei, @react-three/postprocessing, GSAP + ScrollTrigger, Lenis, Zustand, Howler, detect-gpu and Tailwind. All 3D geometry is procedural, so there are no model files to load.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve the production build locally
```

Handy URL switches:

| URL | What it does |
|---|---|
| `/?guest=Rahul%20%26%20Family` | Personalised invite: "Dear Rahul & Family," in the hero, and the name is prefilled in the RSVP form |
| `/?tier=high` / `medium` / `low` | Force a quality tier (also turns off automatic downgrading) |
| `/?static` | Preview the no-WebGL fallback |
| `/?og` | Re-render the share image (see below) |

## Editing the content

**`src/content/wedding.ts` is the only file you need to edit.** Every value marked `// PLACEHOLDER` is a stand-in, so search for `PLACEHOLDER` and replace them all:

- `couple`: full names
- `date`: ISO date for the countdown, the two halves printed on the cups (`cupA`, `cupB`), the display text and the city
- `story`: chapter titles, texts and brass-plate labels
- `chapterExtras`: tooltip, chat messages, teacher's door plate, Pixolo logo URL (optional), joining year
- `sheStayed`: the years that tick by and the three office names
- `events`: one entry per function (Haldi, Sangeet, Wedding…). `colour` is both the dress-code swatch and the map pin colour, and `mapPos` places the pin on the miniature map (`-1..1` on each axis).
- `venue`: address, Google Maps link and embed URL, travel tabs, hotels, parking
- `rsvp`: maximum guests, deadline, food options
- `faq`, `footer`, `theme` (outfit colours, glasses, venue model preset: `mandap | hall | garden | resort`)

Pacing (how long the camera spends on each beat, camera positions, depth of field) lives in **`src/scroll/beats.ts`**: one array, top to bottom.

## RSVP → Google Sheet

1. Create a Google Sheet, then open **Extensions → Apps Script**.
2. Paste in [`docs/rsvp-apps-script.js`](docs/rsvp-apps-script.js) and save.
3. **Deploy → New deployment → Web app**, with *Execute as: Me* and *Who has access: Anyone*. Authorise it and copy the `/exec` URL.
4. Put the URL in `.env` (copy it from `.env.example`):
   ```bash
   VITE_RSVP_ENDPOINT=https://script.google.com/macros/s/XXXX/exec
   ```
5. Rebuild or redeploy. Each RSVP becomes a new row in the `RSVPs` tab.

Until `VITE_RSVP_ENDPOINT` is set, the form **simulates** a successful submit and logs the payload to the console, so you can design against it without a backend. The form validates its inputs, blocks double submits and shows a retry message if the request fails.

## Audio

`public/audio/*.wav` are small synthesised placeholders (regenerate them with `node scripts/make-placeholder-audio.mjs`). Swap them for real royalty-free recordings with the same names, ideally compressed `.mp3`/`.ogg` (update the paths in `src/audio/sounds.ts` if you change the extensions):

| File | Suggested search |
|---|---|
| `cafe-ambience` | "coffee shop ambience jazz" on [Pixabay Sound Effects](https://pixabay.com/sound-effects/) |
| `rain` | "rain on window" on [Freesound](https://freesound.org) (CC0 filter) |
| `piano` | "soft romantic piano" on [Pixabay Music](https://pixabay.com/music/) |
| `clink` | "cup clink" / "ceramic clink" |
| `knock` | "door knock wood" |
| `stamp` | "rubber stamp" |
| `printer` | "receipt printer" |
| `page` | "page flip" |

Sound stays off until the guest clicks **Come in ☕**, to respect browser autoplay rules. The café ambience cross-fades into the piano from "She Stayed" onward.

## Share image (WhatsApp / Open Graph)

`public/og.png` (1200×630) is rendered from the real 3D cups. After changing names or the date:

```bash
npm run dev
# then open http://localhost:5173/?og: the page renders and saves public/og.png
npm run og   # same thing, headless, if Playwright is installed
```

Once the site is live, set absolute URLs for `og:image` / `twitter:image` in `index.html` (for example `https://your-domain/og.png`). Some WhatsApp clients ignore relative image URLs.

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel. It autodetects Vite: build `npm run build`, output `dist`.
2. Add the `VITE_RSVP_ENDPOINT` environment variable in the Vercel project settings.
3. Deploy. Netlify works the same way (build `npm run build`, publish `dist`).

## How it's put together

```
src/
  content/wedding.ts        all text & config (single source of truth)
  scroll/beats.ts           pacing + camera keyframes (one array)
  scroll/useSmoothScroll.ts Lenis + ScrollTrigger → scroll state (beat position, per-section progress)
  state/useStore.ts         zustand: sound, chapter, dateRevealed, tier, RSVP…
  three/Experience.tsx      <Canvas>, lights, post-processing, quality tiers, lazy dioramas
  three/CameraRig.tsx       Catmull-Rom position + look-at curves scrubbed by scroll
  three/world/              Cafe, Cups, Steam, Table, CityMap, dioramas/Ch1–Ch6
  three/shaders/            steam (with text/heart mask), rain-on-glass, coffee + latte art
  three/components/         Character (one rig for everyone), Crowd (instanced), props, textures
  ui/                       Loader, hero, cups UI, story cards, venue, RSVP, FAQ, footer, fallback
  audio/sounds.ts           Howler
```

- **Swapping in real models:** each diorama is a group placed by `Chapter` (or `Cafe`) at a fixed position in `three/world/layout.ts`. Replace its children with `<primitive object={useGLTF(url).scene} />` and the camera path stays the same.
- **Quality tiers:** `detect-gpu` picks high / medium / low. High uses DPR up to 2, depth of field, bloom, chromatic aberration on fast moves, film grain and refracting rain. Medium uses DPR 1.5 with depth of field and bloom. Low uses DPR 1, no post-processing, a CSS tilt-shift blur and static rain. A `PerformanceMonitor` steps the tier down if the frame rate drops.
- **Accessibility:** every 3D interaction also has an HTML button (cup turning also works with the arrow keys). `prefers-reduced-motion` swaps camera flights for gentle cross-fades between framed shots, and browsers without WebGL get a static illustrated version with the same content, RSVP and FAQ.
