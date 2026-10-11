import { Suspense, useEffect } from 'react'
import { GAMES, ROUTES, ACTIVE_GAME, type GameId } from '../games/registry'
import { coupleConfig } from '../games/coupleConfig'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { StageLoader } from '../games/StageLoader'

/** /save-the-date: shows the active game in a phone-shaped stage (full screen on phones). */
export default function SaveTheDatePage() {
  const requested = new URLSearchParams(location.search).get('game') as GameId | null
  const routed = ROUTES[location.pathname.replace(/\/+$/, '')] ?? ACTIVE_GAME
  const id: GameId = requested && requested in GAMES ? requested : routed
  const game = GAMES[id]
  const Game = game.component

  useEffect(() => {
    document.title = `Save the Date · ${coupleConfig.brideName} & ${coupleConfig.groomName}`
    document.documentElement.classList.add('std-page')
    return () => document.documentElement.classList.remove('std-page')
  }, [])

  return (
    <div className="std-backdrop">
      <div className="std-stage">
        <ErrorBoundary fallback={<GameError />}>
          <Suspense fallback={<StageLoader />}>
            <Game couple={coupleConfig} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}

function GameError() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#1a0d10] p-8 text-center text-[#FFF3E6]">
      <p className="font-serif text-2xl">The baraat got lost on the way.</p>
      <p className="font-sans text-sm opacity-75">
        {coupleConfig.brideName} & {coupleConfig.groomName} · {coupleConfig.weddingDate}
      </p>
      <a className="btn" href={coupleConfig.invitationUrl}>
        See the invitation
      </a>
    </div>
  )
}
