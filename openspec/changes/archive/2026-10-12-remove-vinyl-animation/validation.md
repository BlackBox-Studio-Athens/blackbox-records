# Vinyl animation removal validation

## Outcome

Deleted the release record renderer, its generated label image, all record-specific CSS and the 25,872-byte record WebP. Deleted the separate vinyl Buy-icon spin SVG and moved its existing print path into the stationary base image. Vinyl icons retain their appearance with two static layers. CD and cassette animation layers remain present.

Vinyl edition wording, muted brackets, shared native artwork/action destinations, hover/focus feedback and independent shell listening remain intact. The shared components apply this removal across their public usages, including Store Grid and Crate cards. No source reference to either deleted asset or the release-record effect remains.

## Source and repository checks

Implementation validation used base SHA `a58f0d234ad4b59a601db817a1c0001e82d82a3c` with the uncommitted change. Its before and after fingerprint was `d2dd08ac5b5ce04d08fa482928cc0453cd51313742c6b9e49154674f2093f0f6`; `sourceChanges` and `formatted` were empty.

- `pnpm test web-editorial`: passed, 47 tests across four files, using matching Nx cache evidence.
- `pnpm test apps/web/src/layouts/StoreCollectionPage.test.ts`: passed, affected web-layouts and web-pages tests using matching cache evidence.
- `pnpm openspec -- validate remove-vinyl-animation --type change --strict`: passed.
- `graphify update .`: completed locally with AST extraction; 26,471 nodes. An existing parser warning for `scripts/pages-workflow-contract.test.ts` was reported without preventing the refresh.
- `pnpm validate`: passed 25/25 selected tasks in 23.8 seconds, all from source-keyed cache. This includes affected tests, lint, type checks and architecture checks.
- `git diff --check`: passed. Both deleted assets are absent on disk; scoped source search found no remaining animation or asset references.

Implementation summary: `.codex-artifacts/validation/2026-10-11T04-14-03-054Z-47244-8ab954/summary.json`.

The final run after this evidence note is recorded in `.codex-artifacts/vinyl-animation-removal/completion.json`; that receipt also records the final source identity and browser observations. Documentation changes do not invalidate the covered code-task inputs.

## Local browser acceptance

Selected acceptance: public presentation and shared shell/player interaction. The existing `Releases keeps native destinations distinct from inert copy and status` case passed Chromium desktop and Firefox desktop, 2/2 with no skips, retries or flaky results. It exercises 1440px and 390px, confirms absent decorative records, shared artwork/purchase feedback, inert metadata, keyboard focus and canonical destination/player behavior.

Command: `pnpm test:e2e e2e/release-merchandising.spec.ts -g 'Releases keeps native destinations' --project=chromium-desktop --project=firefox-desktop --workers=1`.

Archived summary: `.codex-artifacts/vinyl-animation-removal/release-e2e-summary.json`.

An isolated Chrome observation through Playwright CLI also passed at 1440px and 390px:

- All three release actions read Vinyl edition, retain the bracket and share the artwork's edition href.
- No decorative record or horizontal overflow appears; the desktop and phone screenshots were inspected.
- Vinyl Buy icons have two layers, zero spin layers and zero active animations while hovered/focused.
- The same catalog retains 39 CD spin layers and eight cassette reel layers.
- No page errors or requests for the deleted record/spin assets occurred in the successful observation.

Evidence: `.codex-artifacts/vinyl-animation-removal/browser-observation.txt`, `verify-browser.js`, `releases-1440.png` and `releases-390.png`.

The first supplemental Store observation timed out because its availability fixture derived slugs before the card DOM was ready. The fixed fixture captures the rendered catalog before navigation and returned the expected result without any product correction. The initial failure remains in `browser-observation-initial.txt`.

## Scope

These are Local static-fixture presentation checks. Commerce authority, catalog contents, CMS/publication, hosted providers and releases were unchanged and require no new acceptance for this removal. Existing unrelated release repairs were committed separately as `a58f0d23`; this change is committed locally with its own paths and is not pushed by this work.
