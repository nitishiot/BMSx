# TAG — Producer Portal

Phase 1 slice (`build/MVP1_CoreTicketing/PHASE_1_CT_SPEC.md` §2/§4): the
minimal Producer portal (application submission, J7) and a minimal
Platform Admin console (approval queue + audit log, spec §4), plus
free-tier event setup (J5) and the LP-13 roadmap-teaser pattern.

React + Vite + TypeScript, calling the real `server/` backend at
`VITE_API_BASE` (`http://localhost:4000/api` by default) — no client-side
simulation left; the Platform Admin approval step now happens for real, in
a separate account/session at `/admin`.

```bash
npm install
npm run dev       # http://localhost:5173             — Producer portal
                   # http://localhost:5173/admin       — Platform Admin console
```

Requires `server/` running (see `server/README.md`) — the portal has
nothing to talk to otherwise. Admin sign-in needs the seeded
`admin@tag.local` account (`npm run seed` in `server/`).
