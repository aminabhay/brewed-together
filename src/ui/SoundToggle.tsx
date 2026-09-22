import { useStore } from '../state/useStore'
import { setMuted } from '../audio/sounds'
import { enableGyro } from '../three/CameraRig'

const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches

export function SoundToggle() {
  const on = useStore((s) => s.soundOn)
  const entered = useStore((s) => s.entered)
  const gyro = useStore((s) => s.gyro)
  const toggle = () => {
    useStore.getState().setSound(!on)
    setMuted(on)
  }
  const tilt = async () => {
    const D = (window as any).DeviceOrientationEvent
    try {
      if (D?.requestPermission) {
        const r = await D.requestPermission()
        if (r !== 'granted') return
      }
      enableGyro()
      useStore.getState().setGyro(!gyro)
    } catch {
      /* permission refused: nothing to do */
    }
  }
  if (!entered) return null
  return (
    <div className="fixed right-4 top-4 z-40 flex gap-2">
      {isTouch && (
        <button onClick={tilt} className="chip" aria-pressed={gyro} aria-label="Tilt to look around">
          {gyro ? '✦ Tilt on' : '✦ Tilt'}
        </button>
      )}
      <button onClick={toggle} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-espresso/70 text-foam backdrop-blur" aria-pressed={on} aria-label={on ? 'Mute sound' : 'Turn sound on'}>
        {on && (
          <span className="absolute -top-2 left-1/2 flex -translate-x-1/2 gap-0.5" aria-hidden>
            <span className="steam-wisp" />
            <span className="steam-wisp [animation-delay:.4s]" />
          </span>
        )}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
          <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
          {!on && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  )
}
