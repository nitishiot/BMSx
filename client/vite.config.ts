import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Serves the static marketing page (landing/index.html) at "/" from this
// same dev server, so landing and the app share ONE origin.
//
// Why: landing used to be served separately on :4173. Separate origin ⇒
// separate localStorage ⇒ landing genuinely could not see a session the
// app had stored, which is why an anonymous-looking landing page could
// lead straight to a signed-in /account page (Nitish flagged this twice).
// Same origin fixes that at the root rather than papering over it.
//
// landing/index.html is NOT copied or duplicated — it's read from its
// real location on each request, so it stays the single source of truth
// and editing it still works with no build step.
//
// [TBD: the production equivalent — one domain serving landing at / and
// this app's routes beside it — is a hosting decision that hasn't been
// made yet (PHASE_1_IO_INCREMENT_SPEC.md §10 item 5). This plugin is the
// dev-mode implementation of that topology, not a commitment to a vendor.]
const LANDING_HTML = resolve(__dirname, '../landing/index.html')

// Pathnames owned by the React app; everything else at the root falls
// through to the landing page.
const APP_ROUTES = ['/producer', '/admin', '/ops', '/survey', '/account', '/festival', '/login', '/register']

function landingAtRoot(): Plugin {
  return {
    name: 'tag-landing-at-root',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0]
        const isAppRoute = APP_ROUTES.some((r) => url === r || url.startsWith(r + '/'))
        if (url !== '/' || isAppRoute) return next()
        try {
          const html = readFileSync(LANDING_HTML, 'utf-8')
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(html)
        } catch {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), landingAtRoot()],
})
