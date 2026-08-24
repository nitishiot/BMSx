# build/ — phase specs, one folder per MVP/track

Full convention lives in `.claude/rules/build.md`; this is the short
pointer for anyone browsing the repo.

```
build/
└── MVP<N>_<name>/
    └── PHASE_<n>_<CODE>_SPEC.md   ← written before implementation, never after
```

`<CODE>` is a short track code (see track list below); `<n>` numbers
phases within that track only, not globally. A scope addition to an
already-specced phase is a separate `PHASE_<n>_<CODE>_INCREMENT_SPEC.md`
file, not an edit to the original. Full rule: `.claude/rules/build.md`
§"Spec filename convention".

- Every phase/increment is specced here **before** a line of `client/` or
  `server/` code is written for it.
- A spec is frozen once signed off (see `.claude/rules/build.md` — sign-off
  protocol); it isn't edited after approval.
- `MVP1_CoreTicketing/` (code `CT`) — Phase 1, scoped against
  `TAG_PRD_v3.md` §13 (landing-page optimisation + core ticketing P0,
  Europe). Current spec: `PHASE_1_CT_SPEC.md`.
- `MVP2_InternalOps/` (code `IO`) — the Internal Ops Console (staff
  RBAC/dashboards). A **separate system** from the ticketing product, not
  a PRD phase — specced here anyway for the same spec-before-code/sign-off
  discipline; see its spec's header for the scope-boundary note. Current
  specs: `PHASE_1_IO_SPEC.md` (built, awaiting sign-off) and
  `PHASE_1_IO_INCREMENT_SPEC.md` (drafted, not built — RBAC nav, org-role
  management, org-chart UI, survey-response visibility, real login).
  Later MVP folders are created only when their track is actually scoped,
  not preemptively.
