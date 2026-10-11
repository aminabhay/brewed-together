/**
 * WEDDING SNAKE · collect the right stuff
 * Everything tweakable lives here. Couple details (names, date, models) come from src/games/coupleConfig.ts.
 */

export type RequiredId = 'rings' | 'outfit' | 'shoes' | 'flowers' | 'invitation' | 'mithai' | 'garland' | 'carkey'
export type WrongId =
  | 'laptop' | 'controller' | 'football' | 'dumbbell' | 'remote' | 'cone' | 'clock' | 'bill' | 'ticket' | 'shaker' | 'boss' | 'otherinvite' | 'receipt'
export type BonusId = 'chai' | 'momcall' | 'maps'
export type WrongEffect = 'none' | 'slow' | 'veryslow' | 'focus' | 'cry'

export const weddingConfig = {
  /** you play a wedding guest (whoever opened the link); the couple wait at the mandap */
  guest: {
    kurta: '#E8A33D',
    pants: '#F3E6D2',
    hair: 'short' as const,
    headband: undefined as string | undefined,
    tag: 'YOU',
  },

  required: {
    /** how many items per game, including the rings (which always come last) */
    count: 7,
    pool: [
      { id: 'outfit', label: 'Outfit', emoji: '👗' },
      { id: 'shoes', label: 'Mojaris', emoji: '🥿' },
      { id: 'flowers', label: 'Flowers', emoji: '🌸' },
      { id: 'invitation', label: 'Invitation', emoji: '💌' },
      { id: 'mithai', label: 'Mithai', emoji: '🍬' },
      { id: 'garland', label: 'Garland', emoji: '🌼' },
      { id: 'carkey', label: 'Car key', emoji: '🔑' },
    ] as { id: RequiredId; label: string; emoji: string }[],
    final: { id: 'rings' as RequiredId, label: 'Rings', emoji: '💍' },
  },

  wrong: {
    /** how many wrong items are scattered each game */
    count: 5,
    pool: [
      { id: 'laptop', label: 'Office laptop', emoji: '💻', title: 'ABSOLUTELY NOT.', line: 'You’re on leave.', effect: 'slow' },
      { id: 'controller', label: 'PlayStation', emoji: '🎮', title: 'FOCUS.', line: 'The baraat won’t wait for one more level.', effect: 'focus' },
      { id: 'football', label: 'Football', emoji: '⚽', title: 'NOT NOW.', line: 'Five-a-side after the pheras.', effect: 'none' },
      { id: 'dumbbell', label: 'Dumbbell', emoji: '🏋️', title: 'WEDDING SHRED?', line: 'Too late for that. Waddle on.', effect: 'veryslow' },
      { id: 'remote', label: 'TV remote', emoji: '📺', title: 'NO.', line: 'The match will survive without you.', effect: 'none' },
      { id: 'cone', label: 'Traffic cone', emoji: '🚧', title: 'WHY?', line: 'Honestly, why did you pick that up?', effect: 'none' },
      { id: 'clock', label: 'Alarm clock', emoji: '⏰', title: 'YOU’RE LATE.', line: 'Everyone’s already at the venue.', effect: 'none' },
      { id: 'bill', label: 'Credit card bill', emoji: '💳', title: 'OUCH.', line: 'Your wallet is crying.', effect: 'cry' },
      { id: 'ticket', label: '“One last boys trip”', emoji: '🎟️', title: 'NICE TRY.', line: 'The boys trip is cancelled.', effect: 'none' },
      { id: 'shaker', label: 'Protein shaker', emoji: '🥤', title: 'BRO.', line: 'Leg day is not a wedding ritual.', effect: 'slow' },
      { id: 'boss', label: 'Boss calling', emoji: '📞', title: 'DECLINE.', line: 'Out of office until further notice.', effect: 'none' },
      { id: 'otherinvite', label: 'Another wedding invite', emoji: '✉️', title: 'WRONG WEDDING.', line: 'That’s Sharma ji’s son’s.', effect: 'none' },
      { id: 'receipt', label: 'Shopping receipt', emoji: '🧾', title: 'HOW MUCH?!', line: 'Your wallet is crying.', effect: 'cry' },
    ] as { id: WrongId; label: string; emoji: string; title: string; line: string; effect: WrongEffect }[],
  },

  bonuses: [
    { id: 'chai', label: 'Cutting chai', emoji: '☕', title: 'ENERGY RESTORED.', line: '' },
    { id: 'momcall', label: 'Mummy calling', emoji: '📱', title: 'Mummy says:', line: 'DON’T FORGET THE RINGS.' },
    { id: 'maps', label: 'Google Maps', emoji: '🗺️', title: 'NAVIGATING…', line: 'Arrow points to the next thing.' },
  ] as { id: BonusId; label: string; emoji: string; title: string; line: string }[],

  difficulty: {
    speed: 4.0, // world units per second
    turnRate: 9, // how fast the heading swings to a new direction
    hearts: 3,
    mistakeFreeze: 1.0, // seconds frozen after a wrong item
    revealDistance: 3.4, // wrong items only show what they are once you're this close
    labelDistance: 3.6,
    pickupRadius: 0.9,
    slowFactor: 0.55,
    verySlowFactor: 0.3,
    effectSeconds: 2,
    chaiBoost: 1.5,
    chaiSeconds: 3,
    hintSeconds: 3, // mummy's ring highlight
    mapsSeconds: 6,
  },

  /** the courtyard you play in (world units); shops sit around the edge */
  arena: { halfX: 7.2, halfZ: 11.5 },

  colours: {
    ground: '#E9D3B4',
    tile: '#DDBF98',
    grass: '#9FB07F',
    path: '#CDB08C',
    maroon: '#7A1F2E',
    saffron: '#E8A33D',
    ivory: '#FFF6EA',
    pink: '#D98A94',
    emerald: '#2F6F5E',
    gold: '#C9A45C',
    sky: '#F3C9A0',
    night: '#2A0F18',
  },

  dialogue: {
    intro1: 'THE WEDDING IS IN TROUBLE.',
    intro2: '{bride} & {groom} have misplaced… everything. Can you help?',
    checklistTitle: 'Find these',
    start: 'LET’S FIX THIS',
    howTo: 'Swipe to steer. Grab the wedding things. Avoid everything else.',
    ringsAppear: 'LAST THING… THE RINGS!',
    gameOverTitle: 'THE AUNTIES HAVE TAKEN OVER.',
    gameOverLine: 'Let’s try that again.',
    final: ['WAIT…', 'YOU ACTUALLY FOUND EVERYTHING.', 'THIS WEDDING WILL HAPPEN.'],
  },

  reveal: {
    kicker: 'SAVE THE DATE',
    line: 'Everything’s ready.\nExcept you.',
    playAgain: 'PLAY AGAIN',
  },

  /** optional background music (off by default; sound effects are always synthesised) */
  audio: { music: null as string | null },
}

export type WeddingConfig = typeof weddingConfig

/** A humorous title from how they played. */
export function weddingTitle(s: { wrong: number; seconds: number; longest: number }) {
  if (s.wrong === 0) return 'Certified Wedding Planner'
  if (s.wrong <= 2) return 'Trusted Family Member'
  if (s.wrong <= 4) return 'Definitely From The Groom’s Side'
  return 'Please Just Arrive On Time'
}
