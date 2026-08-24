# build/ — phase specs, one folder per MVP

Full convention lives in `.claude/rules/build.md`; this is the short
pointer for anyone browsing the repo.

```
build/
└── MVP<N>_<name>/
    └── PHASE_<id>_SPEC.md   ← written before implementation, never after
```

- Every phase/increment is specced here **before** a line of `client/` or
  `server/` code is written for it.
- A spec is frozen once signed off (see `.claude/rules/build.md` — sign-off
  protocol); it isn't edited after approval.
- `MVP1_CoreTicketing/` — Phase 1, scoped against `TAG_PRD_v3.md` §13
  (landing-page optimisation + core ticketing P0, Europe).
- `MVP2_InternalOps/` — the Internal Ops Console (staff RBAC/dashboards).
  A **separate system** from the ticketing product, not a PRD phase —
  specced here anyway for the same spec-before-code/sign-off discipline;
  see its spec's header for the scope-boundary note. Later MVP folders
  are created only when their phase is actually scoped, not preemptively.
