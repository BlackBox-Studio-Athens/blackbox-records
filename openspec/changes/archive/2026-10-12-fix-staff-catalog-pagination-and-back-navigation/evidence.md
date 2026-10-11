# Local acceptance evidence

## Baseline, 2026-09-23

WebStorm `EmDash browser acceptance`, using its ignored local runner to execute
`pnpm build:staff && node scripts/test-content-workspace.mjs --catalog-navigation`:
staff build passed; the new Chromium regression failed at all four intended checks:

- Next was outside the first viewport.
- Next did not bring the results heading into view.
- Next did not focus the results heading.
- Browser Back did not restore the first filtered page.

Opening Browse 050 and returning with browser Back succeeded before those failures
were collected. The fixture uses 250 additional mixed entries and a server-filtered
Merch search; it is not evidence for native EmDash cursor ordering.

## Native cursor contract

WebStorm `EmDash CMS content smoke` passed against installed EmDash 0.38.0.
The disposable Local database contains 251 mixed private Distro/merch entries.
Titles repeat and fixture-only SQL gives all entries the same timestamp, ensuring
both sort tie cases are exercised rather than assuming HTTP creates share a time.
Both sorts, All/Distro/Merch, every physical format, opaque continuation cursors,
final pages and complete stable-ID traversal passed. Every editorial-only row
retained `selling: null`. All thirteen collection save/validation checks also passed.
The retained Local log is `.codex-artifacts/staff-catalog-navigation/native-content.log`.
No production backend change was needed.

## Navigation verification

The fixture covers failed Next/Previous and retries, stale success/error responses,
duplicate activation and background refresh, repeated cursors, denied access,
0/1/25/26/50/51-entry boundaries, three-page Back/Forward, reloads and copied cursors.
It also checks staff parent destinations, creation exits, Review changes, Images,
filtered later-page Stock and Orders returns, canceled stock leaves and row focus.

The native Codex browser reproduced and verified the lazy editor's history-state
replacement: page two → editor → reload → Back now restores page two; browser Back
then restores page one. The EmDash public admin import can resolve after leaving
the editor, so its local adapter restores the current navigation entry after import.
Only navigation metadata is retained; no draft or business state is cached there.

The full Chromium and Firefox editor suites passed, including autosave, conflicts,
publication/recovery, creation and stock-operation guards. Both exercised widths
390/768/1280/1600, keyboard paging, reduced motion, 200% layout zoom, announcements,
focus, scroll and no horizontal overflow. The 44 px target check allows 0.001 px
for Firefox's measured 43.999969 px representation. The creation form still starts
within its existing 250 px mobile limit. Fixture screenshots remain under
`.codex-artifacts/content-workspace/{chromium,firefox}/`.

Stock arrival focus also preserves an already-active quantity control. The browser
regression asserts entered input before testing canceled Back navigation, so a
late focus restoration cannot silently erase the condition the guard must protect.

## Repository and Local acceptance

`pnpm validate` passed all seven phases: environment model, formatting, lint,
unit tests, types, boundaries and production build. `pnpm validate:editor` passed
the staff build, preview policy and complete Chromium/Firefox suites. Its summary
is correctly labeled partial because editor acceptance supplements the full gate.
The final summaries, including the exact source fingerprints and phase logs, are
retained in `.codex-artifacts/staff-catalog-navigation/final-full-summary.json`
and `.codex-artifacts/staff-catalog-navigation/editor-summary.json`.

The canonical `BlackBox Local Stack` rebuilt the combined CMS and public service.
Its CMS build checks both source configuration and generated Wrangler output for
forbidden KV bindings. Existing commerce data was preserved without reseeding.
The complete `smoke-content-preview.mjs --browsers` run passed all collection
renders, five public/preview contexts at 390 and 1280 px in both browsers, shell
history/search, preview cart isolation, denied checkout and persistent-player checks.
Both browsers passed real newsletter typing and formatting-only autosave; the
original newsletter draft was restored afterward.

The existing preview harness now compares published records with the public site,
checks the actual Store card title/search label, and waits for font CSS before layout
comparison. It does not publish private drafts to satisfy preview comparisons.
Local publication passed with unrelated drafts remaining private, idempotent retry,
combined preview and bounded review reads (6 then 4). The retained complete log is
`.codex-artifacts/staff-catalog-navigation/real-local.log`.

## Release and rollback boundary

No dependency, Worker resource, binding or migration is introduced. Page reads are
bounded at 25 rows, one pending page intent is shared with background refresh, and
cursor history remains UI-only. Existing autosave and operation recovery own writes.

Release the staff assets through the existing combined CMS Worker workflow after
authorized UAT acceptance and the Cloudflare Free-tier preflight. Rollback uses the
previous compatible code artifact; navigation metadata is optional and older code
can ignore it. Drafts, pending operations and accepted content remain authoritative
in their existing stores. Do not roll back content by deploying an old static snapshot.

Hosted acceptance and deployment remain pending and unauthorized by this evidence.
Local evidence does not authorize PRD promotion or live catalog mutation.
