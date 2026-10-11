import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import OgRender from './og/OgRender'

// Separate, code-split page for the Save the Date mini-games.
const SaveTheDatePage = lazy(() => import('./pages/SaveTheDatePage'))

const path = location.pathname.replace(/\/+$/, '')
const isOg = new URLSearchParams(location.search).has('og')

function Root() {
  if (/^\/save-the-date(-\d+)?$/.test(path))
    return (
      <Suspense fallback={null}>
        <SaveTheDatePage />
      </Suspense>
    )
  return isOg ? <OgRender /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
