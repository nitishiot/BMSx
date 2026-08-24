# Build rules — phase-gated delivery

Applies once implementation work starts (any session touching `build/`,
`client/`, `server/`, or writing a phase spec). Adapted from
`References/PLAYBOOK.md` §4 and the SENTINEX Part B execution flow, scaled
for TAG's current size (no CI yet, no live production system yet — targets
below are placeholders until a first phase defines real ones).

## Spec before code

Every phase/increment gets its own spec, written **before** implementation,
under `build/MVP<N>_<name>/PHASE_<n>_<CODE>_SPEC.md` (see naming rule below):

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
└── MVP<N>_<name>/                ← one folder per MVP/track
    ├── PHASE_<n>_<CODE>_SPEC.md   ← written before implementation
    └── ...                        ← phase-scoped working files
```

## Spec filename convention (decided 2026-08-24)

`PHASE_<n>_<CODE>_SPEC.md`, where:

- **`<CODE>`** is a short (2–4 letter) uppercase code for the *track/system*
  the spec belongs to — e.g. `CT` = Core Ticketing (`MVP1_CoreTicketing`),
  `IO` = Internal Ops (`MVP2_InternalOps`). Pick a new code, once, when a
  new `MVP<N>_<name>` track is created — record it in that track's spec
  header and in `build/README.md`'s track list.
- **`<n>`** numbers phases **within that track only**, starting at 1 — it
  does *not* share a counter with other tracks. Internal Ops's first spec
  is `PHASE_1_IO_SPEC.md`, not `PHASE_2_...`, even though it's the second
  track in this repo overall — a global counter wrongly implied Internal
  Ops was "phase 2 of the ticketing product," which it isn't (it's a
  separate system — see that spec's own scope-decision note).
- A **scope addition to an already-specced phase** (new requirements
  layered onto work already underway or signed off, not a fresh phase) is
  its own file with an `_INCREMENT` suffix before `_SPEC`:
  `PHASE_<n>_<CODE>_INCREMENT_SPEC.md`. It still goes through spec-before
  -code and sign-off like any other spec; it's additive to, not a
  replacement of, the phase spec it increments — don't fold its scope back
  into the original (frozen, if already signed off) file.
- This convention applies to every future `MVP<N>_<name>/` folder — pick
  the track's `<CODE>` when the folder is created, keep `<n>` local to
  that track, use `_INCREMENT` for later scope additions rather than
  editing a signed-off spec or silently expanding one still in flight.

No `MVP1_...` folder existed until the first phase was actually scoped
against the PRD — new MVP folders are still created only when a track is
actually being specced, not preemptively.
