# Design rules — UI consistency across TAG's surfaces

Applies to any visual/UI work: `landing/index.html` and every page under
`client/src/`. Written 2026-08-24 after an inconsistency audit found three
different content-column widths (560/640/720px) in use across `client/`
pages with no functional reason for the difference — this file exists so
that doesn't happen silently again. Extend it when a new UI pattern is
decided; don't leave a new page's spacing/width/colour choice undocumented
and un-followed by the next page.

## Theme tokens (never hardcode a colour)

Every colour comes from a CSS custom property defined once — `client/src/
theme.css` for `client/`, an equivalent `:root` block in `landing/
index.html` (kept in sync in spirit, not literally shared, since landing
is a separate static file/origin from the Vite app):

```
--bg, --bg-card, --bg-raised   surface tiers (page / card / raised-card)
--text, --muted, --faint       text hierarchy
--accent                       brand pink/red — primary actions, active states
--warm, --cool, --good, --bad  secondary accents — status/tier colour-coding
--border, --border-md          hairline / stronger borders
```

- Both `client/` and `landing/` support light and dark via
  `prefers-color-scheme` and (in `client/`) a `[data-theme]` override,
  same pattern as Artifacts' theming contract — see `theme.css`'s three
  -block structure (base `:root`, `@media dark`, `[data-theme="dark"]`)
  before adding a new token.
- `color-scheme` **must** be set alongside the token blocks (`light` in
  base, `dark` in both dark blocks) — its absence was a real bug this
  project shipped once already (native `<select>`/`<input>` controls
  rendering light-mode chrome on a dark page, LP-14 UI-fix pass,
  2026-08-24) — see `PROGRESS.md`'s decisions log for that incident.
- A new accent need beyond the four above (`--warm`/`--cool`/`--good`/
  `--bad`) is a deliberate token addition to `theme.css`, not a one-off
  hex value in a component's CSS file. The Internal Ops org-chart's
  tier-colour-coding (`OrgTree.tsx`) cycles the existing four rather than
  inventing new ones — follow that precedent.

## Content-column max-width (the rule this file exists to state)

Three named widths, by surface type — pick the one that matches what the
page *is*, don't invent a fourth without a real reason:

- **`720px` — app content column.** Every single-column form/detail/
  dashboard page in `client/`: Producer portal (`Apply`/`EventSetup`),
  Admin console, Internal Ops console, Fan Web (`Survey`/`Account`/
  `Festival`), and `AuditLog`. All of these were unified to 720px
  2026-08-24 (previously a mix of 560/640/720 with no functional reason
  for the split). Structure: `max-width: 720px; margin: 0 auto; padding:
  <top> 1.5rem <bottom>;` on the page's root class — copy this shape for
  a new page rather than picking a new number.
- **`860px` — hero-interactive.** Landing's search bar (`.search-form`)
  and Events Near You (`.nearby-inner`) — content with real visual weight
  that needs to read as "the highlight of the page" (Nitish's words,
  2026-08-23) but isn't a plain form column. Centred, `text-align:center`
  on the outer wrapper with `text-align:left` restored on any card grid
  inside it (card body text shouldn't be centred just because its section
  is).
- **`1800px` — marketing canvas.** Landing's structural sections
  (`.banners`, `.platform-inner`, `.plans-inner`, `.roadmap-inner`) and
  the Producer portal's `RoadmapTeaser` (same "wide teaser grid" surface
  type, deliberately matching landing's width even though it lives inside
  the app shell). Typographic max-widths *inside* these sections (hero
  text line-length, paragraph readability) are a separate, narrower
  concern — don't confuse the two the way the 2026-08-23 width pass
  briefly did before Nitish's correction.

A page's **nav bar** (`.shell-nav` in `client/`, `nav` in `landing/`) is
always full-bleed (no max-width of its own) even when the content below it
is column-capped — top bar spans the viewport, content column centres
under it. **The nav must be a sibling of the capped content div, never
nested inside it** — nesting silently caps the nav to the content width
too (a real bug this project shipped: `FanNav`/Internal Ops/Admin console
were all nested inside their page's `max-width` div until 2026-08-24,
so their nav bars were narrower than the Producer portal's and landing's
— caught when Nitish compared screenshots side by side). Structure every
page as:

```tsx
return (
  <>
    <nav className="shell-nav">…</nav>
    <div className="my-page">…page content, max-width capped…</div>
  </>
);
```

not `<div className="my-page"><nav>…</nav>…</div>`.

## Navigation placement and content (RBAC-driven, not a guess)

- The account/session indicator always lives in the **same slot**: top
  -right of the nav bar. Landing's "Sign in / Portals" dropdown and
  `client/`'s "Signed in as {name}" chip occupy the identical position —
  a page never moves this element elsewhere.
- That slot **always renders something** — never blank because no one's
  signed in. Before 2026-08-24 `FanNav` rendered nothing when logged out,
  which read as inconsistent against landing's always-present dropdown
  (Nitish flagged this live — see `PROGRESS.md`). Fixed: `FanNav` now
  shows a "Sign in / Portals" dropdown (same portal links as landing's)
  when signed out, "Signed in as {name}" when signed in.
- What that slot (and any page-level nav/tabs) *shows* is driven by the
  caller's actual, server-resolved permissions — never a client-side
  guess of what a role "should" see. Internal Ops's `navLinks` (resolved
  server-side in `internalOps/auth.ts`'s `resolveNavLinks`, from the
  caller's real capabilities) is the reference pattern: the client renders
  tabs from that array, it doesn't maintain its own capability→link map
  that could drift from what the server actually grants.
- Corollary: a role that shouldn't see a page shouldn't see a **link** to
  it either, not just get a 403 if it types the URL. Link-level gating is
  defence in depth on top of the API-level gate, not a replacement for it
  — the API must still enforce the real check.
- **One nav component, every page.** `client/src/components/AppNav.tsx`
  is *the* nav for every surface in `client/`; landing's own `<nav>`
  mirrors it structurally. Three fixed zones, in the same place on every
  page:
  - **left** — TAG logo, always linking to the landing page at `/`
  - **centre** — the marketing menu (Browse Festivals / Features /
    Platform / Pricing), present on *every* page, not just landing
  - **right** — signed out: a **"Sign in" link and a separate "Register"
    pill** (two distinct controls, never one combined "Sign in / Portals"
    control); signed in: the person's name, an RBAC-filtered **Portals**
    menu, and Sign out.
- **Portal entitlements are resolved server-side.** `GET /api/auth/me`
  returns a `portals` array computed from the caller's real roles and
  staff capabilities (`server/src/routes/auth.ts`); the nav renders that
  array verbatim. A Platform Admin sees the admin console listed, staff
  see Internal Ops, a fan sees neither — and the client has no list of
  its own that could drift from what the API permits. Never hardcode a
  portal list in a component.
- Pages a session may not reach say so plainly and offer the shared
  sign-in (`/login?next=…`), rather than each portal presenting its own
  bespoke login form. There is **one** sign-in page and **one** register
  page for every persona.

## One origin, one session

Landing (`landing/index.html`) and the app (`client/`) are served from
**one origin** — Vite serves the landing file at `/` via the
`landingAtRoot` plugin in `client/vite.config.ts`, and the app owns the
named routes beside it (`/producer`, `/admin`, `/ops`, `/survey`,
`/account`, `/festival/*`, `/login`, `/register`). The landing file is
read from its real location per request, never copied, so it stays the
single source of truth.

This is not a cosmetic arrangement — it's what makes a consistent signed
-in state *possible*. Two origins meant two `localStorage` stores, which
is exactly how an anonymous-looking landing page could sit beside a
signed-in `/account` page (hit twice before it was fixed). Likewise there
is now **one** session token (`tag_session`), not one per persona: four
parallel tokens let a single browser hold four unrelated identities at
once. If you find yourself adding a second origin or a second token key,
that's the bug, not the fix.

[TBD: the production equivalent — one domain serving landing and the app
together — is still an open hosting decision (`PHASE_1_IO_INCREMENT_SPEC.md`
§10 item 5). The dev setup implements the intended topology; it does not
commit to a vendor.]

## Wide content inside a capped column

A diagram, table, or chart wider than its page's column (e.g. the
Internal Ops org chart inside the 720px `.ops-console`) scrolls
horizontally **inside its own container** (`overflow-x: auto` on a
dedicated wrapper) — the page itself never scrolls horizontally, and the
page's own max-width doesn't change just to fit one wide widget. See
`OrgTree.tsx`'s `.org-chart-scroll` wrapper.

## Component shape conventions

- **Primary action buttons**: pill-shaped (`border-radius: 100px`),
  `--accent` background, white text — `.btn-primary` (landing),
  `.submit-btn` (`client/`). A secondary/less-prominent action reuses the
  same pill shape with a transparent/outlined treatment
  (`.btn-outline`, `.submit-btn.secondary`) rather than a different shape
  entirely.
- **Cards**: `--bg-card` or `--bg-raised` background, `1px solid
  var(--border-md)` border, `8–14px` border-radius depending on density
  (smaller radius for compact list rows like the org-chart node, larger
  for standalone content cards like a festival result card).
- **Status/error banners**: `--bad`-tinted background + border + text,
  never a hardcoded red.

## Before adding a new page or section

1. Is this a content column, hero-interactive element, or marketing
   canvas? Use the matching width from above — don't pick a new number.
2. Does it need a nav bar? Reuse `.shell-nav` (`client/`) or the existing
   `nav` pattern (`landing/`); keep the account/session slot top-right.
3. Any colour comes from an existing token. A genuinely new semantic
   colour is a token added to `theme.css` (and landing's `:root`), not a
   hex value in the new file.
4. If the page/section is capability- or role-gated, resolve visibility
   server-side (extend the relevant `/me`-equivalent endpoint) rather than
   hardcoding a capability→UI map in the client.
