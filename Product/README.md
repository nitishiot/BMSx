# Product/ — presentation-ready artefacts

Finished, audience-facing documents kept as self-contained HTML: demo run
sheets, one-pagers, decks-as-pages, anything shown to someone outside the
build. Established 2026-08-24 with `TAG_DemoRunbook_v1.html`.

## What belongs here

- Documents whose audience is a **person, not the build** — a founder, an
  investor, a partner, a new joiner.
- Rendered HTML, self-contained (inline CSS, no build step, no local asset
  dependencies) so the file opens correctly on any machine, offline, without
  running the app.

## What does not

- Phase specs and implementation plans → `build/`
- Scope documents (the PRD, the architecture doc) → repo root
- Session continuity → `PROGRESS.md`
- Superseded versions of anything here → `archive/`

## Conventions

- **Naming:** `TAG_<Topic>_vN.html`, the same rule as every other document in
  this repo. Never overwrite a version in place — a materially changed
  document is a new `_vN`, and the previous file stays untouched until it is
  deliberately promoted to `archive/`.
- **Self-contained:** one file. Fonts may come from Google Fonts; everything
  else is inline, so the page survives being emailed or opened from disk.
- **Theme-aware:** light and dark, using the same token set as
  `client/src/theme.css` — these pages sit beside the product and should read
  as the same system (`.claude/rules/design.md`).
- **Honest by default:** the same evidence rule as everything else in this
  repo. A stand-in is labelled a stand-in on the page itself, not just in the
  commit message.
- **Published copies:** several of these are also published as Artifacts for
  sharing. The file here is the source; a published copy is updated by
  republishing this same file, never by editing the hosted version.

## Contents

| File | What it is | Published |
|---|---|---|
| `TAG_DemoRunbook_v1.html` | Founder demo run sheet — six end-to-end journeys, permissions matrix, architecture diagram, open gaps | Artifact, private |
