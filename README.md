# Brewed Together ☕ · Jyoti & Abhay

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
- `rsvp`: maximum guests, deadline
- `faq`, `footer`, `theme` (outfit colours, glasses, venue model preset: `mandap | hall | garden | resort`)

Pacing (how long the camera spends on each beat, camera positions, depth of field) lives in **`src/scroll/beats.ts`**: one array, top to bottom.

## RSVP → Supabase

RSVPs are saved to the `public.rsvps` table in Supabase ([`src/ui/rsvpApi.ts`](src/ui/rsvpApi.ts)). Each one stores the name, phone, optional email, party size, events and note, tagged with this wedding's `customer_id`.

1. In Supabase → **SQL Editor**, run [`docs/supabase-rsvp.sql`](docs/supabase-rsvp.sql) once. It adds this wedding to `customers`, adds the unique indexes that stop the same phone number or email from RSVPing twice, and lets the public anon key insert RSVPs (but not read them).
2. Put your project's values in `.env` (from **Project Settings → API**):
   ```bash
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_SUPABASE_CUSTOMER_ID=jyotiwedsabhay
   ```
3. Restart `npm run dev` (Vite only reads `.env` when it starts), or redeploy.

Phone numbers are compared without spaces, dashes, `+91` or a leading `0`, and emails without case, so `98694 83112` and `+91-9869483112` count as the same number. A duplicate shows *"This phone number has already been used to RSVP."* under the field.

Until Supabase is configured, the form **simulates** a successful submit and logs the payload to the console. (The older Google Sheet option, `VITE_RSVP_ENDPOINT` with [`docs/rsvp-apps-script.js`](docs/rsvp-apps-script.js), still works as a fallback when Supabase isn't set.)

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

Sound stays off until the guest clicks **Come in**, to respect browser autoplay rules. The café ambience cross-fades into the piano from "She Stayed" onward.

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
2. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_CUSTOMER_ID` in the Vercel project settings (Settings → Environment Variables), then redeploy.
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

## Save the Date games (`/save-the-date`)

A separate, code-split page that plays a short Save the Date mini-game. Each game is a self-contained component, so you can build several and switch between them.

- **Switch the live game:** change `ACTIVE_GAME` in [`src/games/registry.ts`](src/games/registry.ts).
- **Preview any game without switching:** open `/save-the-date?game=<id>`.
- **Add a game:** create `src/games/<id>/index.tsx` whose default export is a component taking `SaveTheDateGameProps` (`couple` + optional `onComplete`; see [`src/games/types.ts`](src/games/types.ts)), then add it to `GAMES` in the registry.
- **Couple details** (names, date, venue, character models) come from [`src/games/coupleConfig.ts`](src/games/coupleConfig.ts), which reads `wedding.ts`, so every game stays in sync with the invitation.
- On phones the game fills the screen; on wider screens it sits in a centred 9:16 phone-shaped stage.
- **Trial slots:** `ROUTES` in the registry maps extra paths to games, e.g. `/save-the-date-2` plays Wedding Snake while `/save-the-date` keeps the live game.
- Hosting: `vercel.json` and `public/_redirects` make `/save-the-date` and `/save-the-date-2` work on Vercel and Netlify.

### Game 1: Operation: Get Married

Tap to help the groom catch the bride through an Indian-wedding obstacle course (aunties, a chai stall, a baraat, a runaway mojari, a selfie relative, shopping bags and the caterer's bill), then reveal the date under a marigold arch.

- Everything you'd tweak (dialogue, colours, obstacles, pacing, outfits, audio) is in [`src/games/operation-get-married/config.ts`](src/games/operation-get-married/config.ts).
- The chase is endless until the bride is caught: only fast tapping (about 3+ taps a second) closes the gap, and nobody catches her before `minDuration` (15 s). A typical 4–5 taps a second lands around 20–25 s. Comedy beats only appear while the groom is running fast (`obstacles.minSpeed`).
- Characters are the same `abhay.glb` / `jyoti.glb` as the invitation. The models have no run clip, so running, looking back, ducking and stumbling are procedural (`Rig.tsx`). Any GLB with the same bone names works.
- Sound: a footstep on every tap and stride, plus comedy effects, all synthesised in the browser. Background music is off (`audio.music: false`); set it to `true` to bring back the dhol loop and the reveal music.

### Game 2: Wedding Snake (`/save-the-date-2`)

You play a wedding guest (whoever opened the link) helping Jyoti & Abhay, who wait at the mandap. Steer through a wedding village (mandap, bazaar, fairy lights) collecting what the wedding needs while a procession of found things (and a couple of relatives) trails behind you. Wrapped parcels hide distractions: the office laptop, a PlayStation controller, a credit card bill and so on. You only see what's inside when you get close. The rings always come last. Then the finale: the lights come on, everything forms an arch over the mandap, and the date is revealed.

- **Controls:** swipe to turn (keep dragging to chain turns), tap on a side of the player to head that way, or use the arrow keys / WASD.
- **Rules:** 3 hearts; a wrong item freezes you for a second with a joke (some also slow you down or flash FOCUS.). Losing all 3 hearts starts a fresh, reshuffled run. Bonuses: cutting chai (speed boost), Mummy calling (lights up the rings), Google Maps (arrow to the next item).
- Everything is in [`src/games/wedding-snake/config.ts`](src/games/wedding-snake/config.ts): which items appear and how many, the wrong-item jokes and effects, bonuses, speeds, arena size, colours, all text, and the end-screen titles (`weddingTitle`). `guest` sets how your guest looks (kurta colour, hair) and the YOU tag shown at the start.
- Each game uses 6 random items plus the rings, and 5 distractions, placed at random. A perfect run takes about 12 s, and most people will take 20–35 s.
- The end screen has a single Play again button.
