/**
 * ─────────────────────────────────────────────────────────────
 *  BREWED TOGETHER · content config
 *  This is the ONLY file you need to edit. Every value marked
 *  `PLACEHOLDER` below is a stand-in — replace it with the real one.
 * ─────────────────────────────────────────────────────────────
 */

export type VenuePreset = 'mandap' | 'hall' | 'garden' | 'resort'

export interface StoryChapter {
  id: 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6'
  title: string
  text: string
  plate: string
}

export interface WeddingEvent {
  id: string
  name: string
  date: string // human text
  startISO: string // for calendar links
  endISO: string
  time: string
  venue: string
  address: string
  mapsUrl: string
  dressCode: string
  colour: string // dress-code swatch + pin colour
  /** position on the miniature city map, in map units (-1..1) */
  mapPos: [number, number]
}

export interface Hotel {
  name: string
  note: string
  url: string
}

export const wedding = {
  couple: {
    groom: 'Abhay',
    bride: 'Jyoti',
    groomFull: 'Abhay Amin',
    brideFull: 'Jyoti Pandey',
  },

  date: {
    iso: '2026-12-09T18:30:00+05:30', // time is a PLACEHOLDER (6:30 PM); the date is final
    cupA: '9 Dec',
    cupB: '2026',
    display: 'Wednesday, 9 December 2026',
    city: 'Thane',
  },

  hero: {
    headline: "We're getting married.",
    scrollHint: 'Scroll',
  },

  cups: {
    hint: 'Tap on the cups to turn them',
    skip: 'Just show me the date',
    spin: '↻ spin me',
  },

  cafe: {
    plate: 'Where it all brews',
    chapterTitle: 'How it started…',
  },

  story: [
    {
      id: 'ch1',
      title: 'The Guest Lecture',
      plate: 'Ch. 1 · The Guest Lecture',
      text: 'Abhay gave a guest lecture at his old college, to a class full of eager students. But one student missed it.',
    },
    {
      id: 'ch2',
      title: 'The Whispers',
      plate: 'Ch. 2 · The Whispers',
      text: 'Jyoti missed that class, and heard all about it from her friends.', // PLACEHOLDER {{CH2_TEXT}}
    },
    {
      id: 'ch3',
      title: 'The Knock',
      plate: 'Ch. 3 · The Knock',
      text: 'So she walked up to the teacher and said she wanted to learn it too.', // PLACEHOLDER {{CH3_TEXT}}
    },
    {
      id: 'ch4',
      title: 'The Recommendation',
      plate: 'Ch. 4 · The Recommendation',
      text: "The teacher told Abhay about her: 'She's a brilliant student.'", // PLACEHOLDER {{CH4_TEXT}}
    },
    {
      id: 'ch5',
      title: 'Day One at Pixolo',
      plate: 'Ch. 5 · Day One',
      text: 'Jyoti joined Pixolo, and became its most loyal, most brilliant intern.', // PLACEHOLDER {{CH5_TEXT}}
    },
    {
      id: 'ch6',
      title: 'She Stayed',
      plate: 'Ch. 6 · She Stayed',
      text: 'Years went by. Everything changed, except one thing.',
    },
  ] satisfies StoryChapter[],

  chapterExtras: {
    emptyDeskTooltip: 'Someone missed this one.',
    /** Jyoti's class WhatsApp group. `from: 'jyoti'` renders as her own (green) message. */
    chatGroup: 'Class of 2014',
    chat: [
      { from: 'Priya', text: 'Guys, the guest lecture today was sooo good 🤯' }, // names are PLACEHOLDERS
      { from: 'Rohan', text: 'He built a whole app live in front of us!' },
      { from: 'Sneha', text: 'Best lecture of the year honestly. Where were you all? 😭' },
      { from: 'Karan', text: 'Notes won’t do it justice, you had to be there' },
      { from: 'jyoti', text: 'Wait… what guest lecture?? What did I miss?!' },
    ] as { from: string; text: string }[],
    teacherNamePlate: 'Staff Room', // PLACEHOLDER {{TEACHER_NAME_OR_'Staff Room'}}
    knockLine: 'I want to learn it too.',
    stampText: 'BRILLIANT STUDENT',
    pixoloLogoUrl: '', // PLACEHOLDER {{PIXOLO_LOGO_URL}} (optional, leave '' for neon text)
    jyotiJoiningYear: '2014',
    idBack: 'Status: Most loyal. Most brilliant.',
  },

  sheStayed: {
    years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
    /** In order. `style` picks the miniature: shop | cubicles | studio | cowork. */
    offices: [
      { name: 'The shop in Vidyavihar', style: 'shop' },
      { name: 'RIIDL, Somaiya College', style: 'cubicles' },
      { name: 'Swastik Disa Corporate Park', style: 'studio' },
      { name: 'WeWork Vikhroli', style: 'cowork' },
    ] as { name: string; style: 'shop' | 'cubicles' | 'studio' | 'cowork' }[],
    lines: ['People came and went.', 'Offices changed.', 'She stayed.'],
    finale: '…and so did he.',
  },

  fullCircle: {
    line1: 'And now, over one more coffee…',
    line2: "we'd love you to be there.",
  },

  /** Only the main wedding. Add more entries here if other functions ever get their own pages. */
  events: [
    {
      id: 'wedding',
      name: 'Wedding',
      date: 'Wednesday, 9 December 2026',
      startISO: '2026-12-09T18:30:00+05:30', // time is a PLACEHOLDER
      endISO: '2026-12-09T23:30:00+05:30', // time is a PLACEHOLDER
      time: '6:30 PM', // PLACEHOLDER
      venue: 'Murlidhar Banquet',
      address: 'Ghodbunder Rd, opposite Mahanagar Gas Pump, next to Trimurti TMC School, Owale, Thane West, Maharashtra 400615',
      mapsUrl: 'https://share.google/jd5BnSHSYTIIsVKjQ',
      dressCode: 'Look special, be comfortable',
      colour: '#9C2F3A', // banner colour on the map
      mapPos: [0.55, 0.15],
    },
  ] satisfies WeddingEvent[],

  venue: {
    name: 'Murlidhar Banquet',
    address: 'Ghodbunder Rd, opposite Mahanagar Gas Pump, next to Trimurti TMC School, Owale, Thane West, Maharashtra 400615',
    mapsUrl: 'https://share.google/jd5BnSHSYTIIsVKjQ',
    embedUrl: 'https://www.google.com/maps?q=Murlidhar+Banquet,+Ghodbunder+Road,+Owale,+Thane+West&output=embed',
    // Travel notes are approximate; adjust if you know better routes.
    byAir:
      'Nearest airport: Chhatrapati Shivaji Maharaj International (BOM), roughly 30 km away. Allow 1 to 1.5 hours by cab, depending on traffic.',
    byTrain:
      'Nearest railway station: Thane, about 10 km away. Take a cab or auto towards Ghodbunder Road and ask for Owale, opposite the Mahanagar Gas pump.',
    byRoad:
      'The banquet is on Ghodbunder Road in Owale, Thane West, opposite the Mahanagar Gas pump and next to Trimurti TMC School. Ghodbunder Road gets busy in the evenings, so leave a little early.',
    hotels: [] as Hotel[], // add { name, note, url } entries to show a "Where to stay" list
    parking: 'The banquet has ample, secured valet parking for guests.',
    /** Photos in /public/venue, shown as a gallery on the venue card. */
    photos: [
      { src: 'venue/banquet-hall.webp', alt: 'The banquet hall, with rows of gold chairs and a floral stage' },
      { src: 'venue/garden-pool.webp', alt: 'The pool courtyard lined with bougainvillea and white arches' },
      { src: 'venue/entrance-fountain.webp', alt: 'The Murlidhar Banquet entrance with brass bowl fountains' },
    ],
    /** Put .mp4 files in /public/venue and list them here, e.g. 'venue/tour.mp4'. */
    videos: [] as string[],
    preset: 'hall' as VenuePreset,
  },

  rsvp: {
    maxGuests: 6, // PLACEHOLDER {{MAX_GUESTS}}
    deadline: '27 November 2026',
  },

  faq: [
    { q: 'Dress code', a: 'No dress code! We just want you to look special and be comfortable.' },
    { q: 'Parking', a: 'Murlidhar Banquet has ample, secured valet parking right at the venue.' },
    { q: 'Are kids welcome?', a: 'Yes! And we have something special planned just for them.' },
    { q: 'Gifts', a: 'Your presence is the gift. If you insist, blessings in an envelope are lovely.' }, // PLACEHOLDER
    { q: 'Weather', a: 'The banquet hall is fully air-conditioned, so dress for the occasion, not the weather.' },
    { q: 'Whom do I call?', a: 'Akshay (Abhay’s side) at 98694 83112, or Dinesh (Jyoti’s side) at 976941186.' },
  ],

  footer: {
    contacts: [
      { name: 'Akshay · Abhay’s side', phone: '+91 98694 83112' },
      { name: 'Dinesh · Jyoti’s side', phone: '976941186' }, // CHECK: only 9 digits as given
    ],
    madeBy: 'Made with love (and a lot of coffee) by Weddingo',
    madeByBrand: 'Weddingo',
    madeByUrl: 'https://myweddingo.com',
    replay: 'Replay from the first sip',
  },

  theme: {
    // Abhay: long curly hair, beard, headband, maroon tee, cream trousers
    abhayColour: '#7A1F2E',
    abhayPants: '#E6DAC4',
    abhayHeadband: '#6E6A4F',
    abhaySkin: '#B97A4F',
    // Jyoti: glasses, hair in a top bun, dark floral top
    jyotiColour: '#231a1c',
    jyotiPants: '#2B2A33',
    jyotiSkin: '#D9A383',
    venuePreset: 'hall' as VenuePreset,
  },

  meta: {
    title: "Jyoti & Abhay · We're getting married ☕",
    description: 'Brewed Together: the story of Jyoti & Abhay, and an invitation to one more coffee.',
  },
}

export type Wedding = typeof wedding
