import type { ComponentType, LazyExoticComponent } from 'react'

/** Everything a Save the Date game needs to know about the couple. Shared by every game. */
export interface CoupleConfig {
  groomName: string
  brideName: string
  /** e.g. "Wednesday, 9 December 2026" */
  weddingDate: string
  /** ISO start/end for calendar links */
  weddingStartISO: string
  weddingEndISO: string
  weddingLocation: string
  weddingAddress: string
  groomModel: string
  brideModel: string
  /** link back to the full invitation */
  invitationUrl: string
}

/** The contract every game component implements. Swap games freely in registry.ts. */
export interface SaveTheDateGameProps {
  couple: CoupleConfig
  /** called once the date has been revealed */
  onComplete?: () => void
}

export interface GameEntry {
  title: string
  description: string
  component: LazyExoticComponent<ComponentType<SaveTheDateGameProps>>
}
