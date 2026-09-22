import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import OgRender from './og/OgRender'

const isOg = new URLSearchParams(location.search).has('og')

createRoot(document.getElementById('root')!).render(<StrictMode>{isOg ? <OgRender /> : <App />}</StrictMode>)
