## Context

The 2026-07-13 baseline has three Artists and three Releases. Each has a Bandcamp and Tidal slot, for twelve slots total. Artist slots are navigation links; Release slots are player sources. Provider identity, redirects, access, editorial intent, and Release playback cannot be established by HTTP status alone.

## Goals / Non-Goals

**Goals:**

- Define one small Markdown audit with stable scope and mutually exclusive result sections.
- Require manual evidence appropriate to Artist navigation and Release playback.
- Keep uncertain or inaccessible links out of `Verified`.
- Keep the audit read-only; corrections follow in a separate change.

**Non-Goals:**

- A scraper, API client, crawler, validator script, score, screenshot archive, or second output format.
- Treating every missing provider as a defect.
- Editing Artist or Release content during an audit run.

## Decisions

1. Each audit run produces one committed `music-link-audit.md` in the implementing change. It has an audit date, links to source content, and exactly three result sections: `Missing`, `Questionable`, and `Verified`. The first run enumerates all twelve slots in stable Artist-then-Release order, Bandcamp before Tidal.
2. Every slot appears exactly once:
   - `Missing`: no authored URL and no credible candidate found.
   - `Questionable`: a URL or candidate exists, but identity, role, redirect, load/access, playback, or editorial intent is unresolved.
   - `Verified`: provider, artist/release identity, field role, final redirect, and—only for Releases—working player behavior are manually confirmed.
3. Rows stay terse: record/provider role, authored or candidate URL, source-content path, and decisive evidence. Structural sections carry the state; no status column, confidence score, or machine-readable mirror is added.
4. Use Browser Use for manual provider checks. A successful request alone is insufficient. Login, consent, geography, transient failure, or track-versus-album uncertainty remains `Questionable`.
5. The audit never mutates content. The first report and any verified corrections belong to item 2.3 as a separate native change.

## Risks / Trade-offs

- [Provider pages vary by session or region] → Record the date and observed final destination; classify unresolved access as `Questionable`.
- [The Markdown file can be edited inconsistently] → Keep one file, fixed ordering, three sections, and a manual completeness review instead of building a validator.
- [A plausible candidate can be mistaken for editorial intent] → Require identity, role, and Release playback confirmation before `Verified`.

## Open Questions

None.
