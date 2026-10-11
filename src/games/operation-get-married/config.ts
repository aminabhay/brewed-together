/**
 * OPERATION: GET MARRIED · game config
 * Everything you might want to tweak lives here. Couple details (names, date, models) come from
 * src/games/coupleConfig.ts, so they stay in sync with the main invitation.
 */

export type ObstacleKind = 'aunties' | 'chai' | 'baraat' | 'shoe' | 'selfie' | 'bags' | 'bill'

export const gameConfig = {
  colours: {
    primary: '#7A1F2E', // deep maroon
    accent: '#E8A33D', // saffron / warm gold
    ivory: '#FFF6EA',
    pink: '#D98A94', // dusty pink
    emerald: '#2F6F5E',
    red: '#B5403A', // muted red
  },

  /** character models + per-model tweaks. Heights in metres; the groom is meant to look taller. */
  characters: {
    groom: { height: 1.8, outfit: null as string | null },
    bride: { height: 1.6, fairSkin: true, outfit: null as string | null /* e.g. '#B5303F' for a red lehenga */ },
  },

  environment: {
    // evening bazaar street dressed for a wedding
    skyTop: '#F4A86A',
    skyBottom: '#F7D2A8',
    revealSky: '#2A0F18',
    fog: '#F2C9A0',
    road: '#C9A47E',
    buildingColours: ['#F3E6D2', '#E8B36A', '#D98A94', '#F6D7B0', '#C96F4A', '#EADBC4', '#9FC1B4'],
    shutterColours: ['#2F6F5E', '#7A1F2E', '#3E5C8A', '#B5403A'],
  },

  /** feel of the chase. Speeds are m/s. */
  tuning: {
    startGap: 26, // metres between groom and bride at the start
    catchDistance: 1.3,
    tapPower: 0.8, // speed added per tap (≈ 4–5 taps/s catches her in ~25 s)
    drag: 1.6, // how quickly extra speed fades
    minSpeed: 3.2, // jogging when you don't tap
    maxSpeed: 11,
    brideSpeed: 4.3,
    rapidTapRate: 6.5, // taps/second that count as a frantic sprint
    // nobody catches her before minDuration; without fast tapping she simply stays ahead (endless chase)
    minDuration: 15,
    leash: 6, // she never gets more than startGap + leash metres ahead, so she stays in view
    idleSeconds: 3.2, // no taps for this long → the bride stops and looks back
  },

  /** comedy beats, in order. `at` is chase progress (0–1). `frequency` keeps every Nth (1 = all). */
  obstacles: {
    frequency: 1,
    /** beats only appear while the groom is running at least this fast (m/s ≈ 3–4 taps a second) */
    minSpeed: 5,
    list: [
      { kind: 'aunties', at: 0.12 },
      { kind: 'chai', at: 0.25 },
      { kind: 'baraat', at: 0.38 },
      { kind: 'shoe', at: 0.5 },
      { kind: 'selfie', at: 0.61 },
      { kind: 'bags', at: 0.71 },
      { kind: 'bill', at: 0.8 },
    ] as { kind: ObstacleKind; at: number }[],
  },

  dialogue: {
    introChecklist: [
      { q: 'Venue?', a: '✓' },
      { q: 'Food?', a: '✓' },
      { q: 'Relatives?', a: 'Way too many. ✓' },
    ],
    introOpening: 'Every wedding needs a few things…',
    introProblem: 'One small problem…',
    missingBride: 'WE’RE MISSING THE BRIDE.',
    catchHer: 'CATCH HER.',
    tapToStart: 'TAP TO START',
    tapHint: 'Tap anywhere as fast as you can to run faster',
    statusLabel: 'Distance to bride',
    status: [
      { until: 0.35, text: 'Still pretending she doesn’t want to be caught' },
      { until: 0.65, text: 'Is she… slowing down for you?' },
      { until: 0.9, text: 'Getting suspiciously close…' },
      { until: 1.01, text: 'RUN.' },
    ],
    idle: 'Hello?\nAre you planning to get them married?\nTap Faster....!!!',
    finalChase: 'THIS IS IT.',
    rapid: 'DULHA TURBO MODE',
    brideCaught: 'It took you long enough.',
    groomCaught: 'So… wanna get married?',
    obstacles: {
      aunties: { bubble: 'Beta, salary kitni hai?', toast: 'AUNTIES AHEAD!' },
      chai: { bubble: 'Cutting chai, saab?', toast: 'NOT NOW.' },
      baraat: { bubble: 'Dhol baje!', toast: 'BARAAT CROSSING!' },
      shoe: { bubble: '', toast: 'MOJARI DOWN!' },
      selfie: { bubble: 'Ek selfie, beta!', toast: 'DUCK!' },
      bags: { bubble: '', toast: 'HOP!' },
      bill: { bubble: 'Caterer’s bill!', toast: 'RUN FASTER!' },
    } as Record<ObstacleKind, { bubble: string; toast: string }>,
    billText: 'BILL\n₹ 25,00,000',
  },

  ending: {
    kicker: 'SAVE THE DATE',
    line: 'Okay, You caught us.\nNow you have to come.',
    playAgain: 'PLAY AGAIN',
  },

  /** sound: footsteps + comedy effects are always on; background music is off */
  audio: {
    /** their real voices for the catch. `speechEnd` = when the words finish in the clip (s), so the bubble stays up just as long */
    voices: {
      bride: { src: '/audio/game/jyoti.m4a', speechEnd: 1.85 },
      groom: { src: '/audio/game/abhay.m4a', speechEnd: 4.1 },
    },
    music: false,
    revealMusic: '/audio/piano.wav' as string | null, // only used when music is true
  },
}

export type GameConfig = typeof gameConfig

/** A funny subtitle for the end card, chosen from how they played (shown under "Caught in X seconds."). */
export function funnyStat(s: { taps: number; maxRate: number; seconds: number }) {
  if (s.maxRate >= 9) return 'Faster than relatives asking wedding questions.'
  if (s.taps >= 180) return `${s.taps} taps. Commitment confirmed.`
  if (s.seconds >= 38) return 'Fashionably late, like every baraat.'
  if (s.seconds <= 18) return 'Someone’s keen.'
  return 'Your thumb is officially invited.'
}
