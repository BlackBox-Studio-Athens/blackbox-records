# Local validation

Product Environment: Local, primary `main` checkout. Acceptance rows: public presentation/shell and CMS publication/private previews. Commerce, provider and hosted release acceptance are excluded because no authority, schema, API or hosted state changed.

## Implementation and regression

The shared Release component now renders `EditorialContent` and `tracklistGroups` before media and credits. Authored tracklist format controls grouping independently of sale formats and release dates. Empty description, tracklist and credit sections are omitted. Full routes, overlay fragments and staff previews reuse this component.

- Before implementation, the extended `node --import tsx scripts/test-local-content-publication.mjs` failed with `Release details show the authored tracklist`. Evidence: `.codex-artifacts/show-release-editorial-details/before.log`.
- After rebuilding Local, the same smoke passed: future/past detail previews, explicit empty fields, authored vinyl format with only Digital sale availability, public publication, track ordering/positions/duration, formatted prose and links, overlay parity, combined private previews and unrelated draft privacy. Both existing publication batches passed and cleanup restored saved and accepted fixture content. Evidence: `publication-after.log` in the same artifact directory.
- `pnpm test apps/web/src/lib/tracklist.test.ts` passed all eight selected affected modules, including web-editorial, web-pages, web-layouts and app-shell.
- `pnpm test:e2e e2e/routes.spec.ts`: 26 passed. `pnpm test:e2e e2e/shell-navigation.spec.ts`: 9 passed, 5 platform-specific skips. Retained reports: `routes-summary.json`, `shell-navigation-summary.json` and corresponding logs in the same artifact directory.
- An HTTP-rendered temporary legacy Markdown fixture passed strong formatting, preserved link, authored CD Disc 1/Disc 2 headings, positions 1-1/2-1 and optional duration despite Digital-only sale formats. Evidence: `legacy.html`. The temporary source fixture was deleted and its owned standalone server stopped afterward.
- Strict OpenSpec validation passed. Graphify was refreshed after the implementation batch; its warning concerned an unrelated script's partial AST extraction.

Implementation file SHA-256 hashes, unchanged through these behavior checks:

- `apps/web/src/components/editorial/ReleaseDetailContent.astro`: `F225E40D92AE39F4C7D7FE3BBAE2150FCD7AFECA3A05C90533B1B3D14E71D03B`.
- `scripts/test-local-content-publication.mjs`: `C203CE9BA9879BCB5B75BE9815D8064B6DD0BD9099060796903D93AC42FA39E1`.

## Browser observations

DevTools fallback was used after the native Chrome extension probe failed (`nodeRepl.fetch request failed`). Populated private detail previews were inspected at desktop and 390px. Formatting, links, side headings, positions and durations appeared correctly; long titles wrapped without horizontal overflow. Retained geometry: `desktop-metrics.json` and `mobile-metrics.json` in the artifact directory. Screenshots were inspected inline because DevTools rejected file exports outside its allowed workspace root.

The populated upcoming-release private overlay was opened from the Releases listing at 390px and desktop and retained the listing behind its modal. Its accessible content confirmed description formatting/link, authored Side A/Side B, A1/B1, duration and the long title. The ordinary public overlay was also opened with a retained document sentinel, confirming shell continuity and omission of empty editorial sections after fixture restoration. A coordinated normal Local rebuild replaced a standalone server with stale browser dependencies; no content was saved for these visual previews. Embedded-overlay screenshot capture timed out, so overlay screenshots are unavailable; populated full-page screenshots and measurements passed.

## Repository validation identity

`pnpm validate` passed at `.codex-artifacts/validation/2026-10-02T11-32-58-709Z-53508-946446/summary.json`, `mode: local`, with 26 successful affected tests/lint/typecheck tasks. Source SHA: `8d08c00d3dd594951a1ecc463d6c7df512d5742e`. Matching before/after fingerprint: `4732ff95e9dd41e5c29a0395a200e29e36ca6f85c965fe023a60b69c4637b176`; no source changes during the run.

The initial validation run failed on two obsolete Store source assertions subsequently updated by the Distro chat; no release failure was reported. Its summary is `.codex-artifacts/validation/2026-10-02T11-05-28-817Z-34476-df898d/summary.json` (`mode: local`, failed). A documentation-only final validation rerun is retained through the ignored `final-validation.json` pointer in the release-detail artifact directory.

## Hosted release gates

No UAT/PRD code promotion or hosted Content Publication was performed. LOTUS's existing accepted content requires no migration or re-entry; its hosted Release presentation changes only after normal code promotion. Local validation does not establish hosted release acceptance.
