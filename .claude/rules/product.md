# Product rules — register, vocabulary, spec discipline

Applies to any product/strategy document: the PRD, phase objectives,
user-facing copy, landing page content.

## Register

- British/Indian English spellings (analyse, colour, optimise) — inherited
  from Nitish's global working agreement (`~/CLAUDE.md`), applies here too.
- Evidence over adjectives: name the specific number, standard, or
  competitor rather than a superlative. Where the PRD doesn't have the
  evidence, it's already marked `TBD` in that document — don't silently
  fill those gaps when extending it.
- Never invent facts, specs, benchmarks, or partner names when writing
  product content. If a claim needs a source and none exists, flag it
  rather than assert it.

## Fixed vocabulary

Use exactly as `CLAUDE.md` defines: **TAG** (never "BMSx"), **Festival
Goers** (B2C), **Festival Clients & Suppliers** (B2B — producers/promoters,
vendors, artists, local government/tourism), **Platform Admin** (internal
role, P6 — approves/rejects/suspends Clients & Suppliers, never Festival
Goers). Domain nouns (Festival, Ticket, Booking, Vendor, Merchandise,
Rewards Points) come from the PRD verbatim.

## Spec handling

`TAG_PRD_v3.md` is pinned — the working contract for scope. A session
extending or building against it:
- Reads v3 directly, not the original Corporate Presentation (not in this
  repo) or `archive/BMSx_PRD_v1_business_source.md` (superseded — historical
  business context only).
- If a build phase needs to tighten or extend PRD scope, that's a
  deliberate, stated edit (new `_vN`), not a silent drift discovered later.
- Sub-documents (phase specs, later product docs) reference the PRD by
  section rather than restating it.

## Draft-first discipline

New product documents draft in `.md` first for review, in the appropriate
`build/` or working-drafts location; convert to `.docx`/`.pdf` only once
Nitish confirms a version is final — converting early wastes rework when
the draft still changes.
