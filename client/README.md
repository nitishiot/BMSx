# TAG — Producer Portal

Phase 1 slice (`build/MVP1_CoreTicketing/PHASE_1_SPEC.md` §2/§4): the
minimal Producer portal — application submission (J7), free-tier event
setup (J5), and the LP-13 roadmap-teaser pattern for producer-facing P1
features.

React + Vite + TypeScript, per the phase spec's confirmed stack. No
backend exists yet — the Platform Admin approval step is a clearly
labelled client-side simulation (`src/producerState.ts`) standing in for
the real Identity & Access / RBAC service until that backend slice is
built; nothing here is real access control.

```bash
npm install
npm run dev       # http://localhost:5173
```
