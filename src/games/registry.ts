import { lazy } from 'react'
import type { GameEntry } from './types'

/**
 * All Save the Date games. Each one is a self-contained, lazy-loaded component that takes the
 * shared couple config (see types.ts).
 *
 * ➜ To change the game shown at /save-the-date, change ACTIVE_GAME below (see ROUTES for other URLs).
 * ➜ To try another game without changing the default, open /save-the-date?game=<id>.
 * ➜ To add a game: create src/games/<id>/index.tsx exporting a default SaveTheDateGameProps component,
 *   then add it to GAMES.
 */
export const GAMES = {
  'operation-get-married': {
    title: 'Operation: Get Married',
    description: 'Tap to help the groom catch his bride, then reveal the date.',
    component: lazy(() => import('./operation-get-married')),
  },
  'wedding-snake': {
    title: 'Wedding Snake',
    description: 'Collect the right wedding things (not the office laptop), then reveal the date.',
    component: lazy(() => import('./wedding-snake')),
  },
} satisfies Record<string, GameEntry>

export type GameId = keyof typeof GAMES

export const ACTIVE_GAME: GameId = 'operation-get-married'

/**
 * Which game each URL plays. /save-the-date is the one guests get; extra URLs are for trying
 * candidates. To promote a game, point '/save-the-date' at it (and update ACTIVE_GAME).
 * Remember to add new paths to vercel.json / public/_redirects for hosting.
 */
export const ROUTES: Record<string, GameId> = {
  '/save-the-date': ACTIVE_GAME,
  '/save-the-date-2': 'wedding-snake',
}
