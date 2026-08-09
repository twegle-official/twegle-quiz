import { useEffect, useState } from 'react'

// Chrome/Edge/Android fire `beforeinstallprompt` once, early, then never again
// unless the tab reloads — so it has to be captured on mount and held onto
// rather than triggered fresh per click. `preventDefault()` stops the
// browser's own mini-infobar so nothing appears until the visitor actually
// clicks our button; nothing here shows automatically or repeats itself.
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  )

  useEffect(() => {
    function onBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    function onAppInstalled() {
      setDeferredPrompt(null)
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    // A prompt event can only ever be used once, whichever way it's answered.
    setDeferredPrompt(null)
  }

  return { canInstall: !installed && !!deferredPrompt, promptInstall }
}
