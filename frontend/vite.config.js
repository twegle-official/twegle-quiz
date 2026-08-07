import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registration is done explicitly in main.jsx (via `virtual:pwa-register`)
      // instead of the plugin's auto-injected script, so the app can force an
      // update check on every tab focus and reload once a new service worker
      // takes control — see main.jsx for why. injectRegister: false stops the
      // plugin from also injecting its own bare registration script, which
      // would double-register the worker.
      injectRegister: false,
      // Lets the service worker actually run under `npm run dev` too, not
      // just a production build — otherwise "is it working" can only ever
      // be answered after a full build+preview, which is a slow feedback
      // loop while building this out.
      devOptions: { enabled: true },
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Twegle — Quizzes, Quotes & Chaos for Everyone',
        short_name: 'Twegle',
        description: 'Fun quizzes, jokes, quotes, games, and more — no sign up, just pick something and go.',
        theme_color: '#8b5cf6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precaches the built app shell (JS/CSS/HTML/icons) so the SPA
        // itself opens offline; the runtime rules below are what make an
        // already-viewed quiz/post/etc. actually show real data offline,
        // not just an empty shell.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Deletes precaches left over from a previous deploy once the new
        // service worker activates, instead of letting them accumulate.
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Public read endpoints only — deliberately excludes
            // /api/admin/* and /api/auth/* so nothing authenticated ever
            // lands in a cache a service worker could serve back later.
            // Workbox only registers GET requests here by default anyway,
            // so play/engagement/feedback POSTs are unaffected either way.
            urlPattern: ({ url }) =>
              url.href.includes('/api/') &&
              !url.pathname.startsWith('/api/admin') &&
              !url.pathname.startsWith('/api/auth'),
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'twegle-api-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Puzzle/quiz images and any other image-typed request — these
            // rarely change once posted, so cache-first is the right trade-off.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'twegle-image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
