import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Registered explicitly (rather than relying on vite-plugin-pwa's
// auto-injected script — see vite.config.js's injectRegister: false) because
// the default registration only ever registers the worker once; it never
// actively checks for a newer one on an already-open tab. Browsers only
// check for service worker updates on a fresh navigation, so a visitor who
// keeps a tab open across a deploy (very normal for an SPA) can keep running
// stale JS indefinitely — this was reported multiple times as real UI
// changes silently not showing up until someone thought to manually
// unregister the service worker in DevTools. Fixed by explicitly polling for
// an update whenever the tab regains focus (the moment a returning visitor
// is most likely to actually notice something's off) plus hourly as a
// baseline, and reloading once as soon as a new worker takes control.
if ('serviceWorker' in navigator) {
  let reloadedForUpdate = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedForUpdate) return
    reloadedForUpdate = true
    window.location.reload()
  })

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      const checkForUpdate = () => registration.update().catch(() => {})
      setInterval(checkForUpdate, 60 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
      })
    },
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
