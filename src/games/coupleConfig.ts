import { wedding } from '../content/wedding'
import type { CoupleConfig } from './types'

/** Couple details for every Save the Date game, pulled from the main invitation config. */
const main = wedding.events.find((e) => e.id === 'wedding') ?? wedding.events[0]

export const coupleConfig: CoupleConfig = {
  groomName: wedding.couple.groom,
  brideName: wedding.couple.bride,
  weddingDate: wedding.date.display,
  weddingStartISO: main?.startISO ?? wedding.date.iso,
  weddingEndISO: main?.endISO ?? wedding.date.iso,
  weddingLocation: `${wedding.venue.name}, ${wedding.date.city}`,
  weddingAddress: wedding.venue.address,
  groomModel: '/models/abhay.glb',
  brideModel: '/models/jyoti.glb',
  invitationUrl: '/',
}
