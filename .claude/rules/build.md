# Build rules — phase-gated delivery

Applies once implementation work starts (any session touching `build/`,
`client/`, `server/`, or writing a phase spec). Adapted from
`References/PLAYBOOK.md` §4 and the SENTINEX Part B execution flow, scaled
for TAG's current size (no CI yet, no live production system yet — targets
below are placeholders until a first phase defines real ones).

## Spec before code

Every phase/increment gets its own spec, written **before** implementation,
under `build/MVP<N>_<name>/PHASE_<id>_SPEC.md`:

1. Objective (one paragraph, plain language)
2. In scope / explicitly out of scope
3. Components to be built
4. Exit checks — concrete, checkable by someone who wasn't in the room
5. Non-functional targets (see below)
6. Sign-off: date + approver, filled in only after approval

## Non-functional targets

State explicit targets per phase, at minimum:
- **Throughput** — at a stated scale.
- **Latency** — P50/P95/max once there's a live system to measure; until
  then this stays `[TBD: no live system yet]` rather than an invented number.
- **Scale ceiling verified** — distinct from what's eventually claimed.
- **Resilience** — restart/failure behaviour, checked live once applicable.
- **Backpressure** — bounded/drop/degrade behaviour for any pipeline stage.
- **Index/query coverage** — every new hot query path has a matching index.

Measure live; a target that hasn't been measured is a hypothesis, not a
sign-off criterion. Never quote a projected/production-scale number as
measured — label MEASURED vs PROJECTED explicitly wherever both appear.

## Sign-off protocol

Not "done" until, in order: (1) an end-to-end test against a real system,
not a mock; (2) the live outcome shown to Nitish with real output he can
see; (3) his explicit approval. Until all three: the honest status is
**"built, awaiting sign-off,"** never "complete."

## Git & tag policy

- Trunk-based development on `main`; no PR/CD ceremony until there's a
  second contributor or a real deploy target.
- Tag at sign-off, not at arbitrary points — annotated tag on the commit
  where a phase was approved (e.g. `phase-1`).
- Commit messages say what changed and why, never a placeholder like
  "update."
- Never force-push, never skip hooks (`--no-verify`), never commit secrets.
- Documents (specs, PRD revisions) are versioned through git too, same
  commit discipline as code.

## Frozen vs. living documents

Decide which kind a document is when it's created, and say so:
- **Frozen at approval, never edited again**: a signed-off phase spec, a
  submitted/shared version of the PRD.
- **Living, updated in place**: `PROGRESS.md`, as-built diagrams (once they
  exist), this rules file.
Don't edit a frozen spec after sign-off; don't version-suffix a living doc
on every change.

## MVP / phase folder structure

```
build/
├── README.md                    ← this convention, restated briefly
└── MVP<N>_<name>/                ← one folder per MVP
    ├── PHASE_<id>_SPEC.md         ← written before implementation
    └── ...                        ← phase-scoped working files
```

No `MVP1_...` folder exists yet — created when the first phase is actually
scoped against the PRD, not preemptively.
