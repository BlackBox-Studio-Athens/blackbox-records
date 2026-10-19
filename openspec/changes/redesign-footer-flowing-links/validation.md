# Local acceptance — 19 October 2026

## Source and scope

Implemented on primary `main`, based on `6118548a136eaaa08083819cff722d8d597b481a`, with the footer changes uncommitted. Unrelated working changes are retained. The approved canvas reference and exact disclosure are recorded in design.md. This is Local implementation acceptance; no content publication, push or deployment was performed.

Selected acceptance rows: public shell/player/routing and documentation/spec consistency. Staff, commerce/provider and release acceptance are excluded because their behavior and contracts did not change. The ordinary Local site at `http://127.0.0.1:4321/blackbox-records/` was started with the committed E2E preorder projection; remote embeds in player tests use the existing fixture.

## Checks

- `pnpm openspec:guard`: passed on primary main before edits.
- `pnpm test storefront-catalog`: 195 tests passed in 33 files, including destination ordering, deduplication, labels and absent purchase information.
- `pnpm test:app-shell`: 298 tests passed in 45 files.
- `pnpm test:e2e e2e/catalog-video-contact.spec.ts --project=chromium-desktop --project=chromium-mobile --project=firefox-desktop --project=firefox-compact`: 32 passed. Includes native shell destinations, complete labels, wrapping, reference height ceilings, keyboard focus, long description/missing socials/hidden-link stress at actual 200% root text, and JavaScript-disabled destinations/current state.
- `pnpm test:e2e e2e/shell-navigation.spec.ts --project=chromium-desktop --project=chromium-mobile --project=webkit-mobile`: 51 passed, 17 intentionally skipped by desktop/phone applicability. Includes 320/390px footer checks at normal, 125% and 200% text, navigation, focus, Back/Forward and overlay/player interactions.
- `pnpm test:e2e e2e/player-continuity.spec.ts --project=chromium-desktop --project=chromium-mobile --project=webkit-mobile`: 12 passed. Footer Home then Store navigation retains the same iframe; history/minimize/reopen/Stop, purchase-information routes, phone page-end clearance and landscape controls pass.
- Strict validation of both `redesign-footer-flowing-links` and the reconciled `mobile-layout-rhythm` passed.
- `graphify update .`: completed once after the production edit batch. Existing extractor limitations were reported (missing SQL parser and partial extraction of an unrelated workflow-contract test); graph output rebuilt successfully.
- Final `pnpm validate`: passed in `mode: local`, 62 tasks across 48 projects (45 cached), 163.2 seconds. Summary: `.codex-artifacts/validation/2026-10-19T07-19-34-417Z-38316-d51763/summary.json`. Source SHA is `6118548a136eaaa08083819cff722d8d597b481a`; before/after fingerprints both equal `daf1d2370033b1045d15c6e2f795c9d4f942b8fc54075831d38ac6f16e975367`, with `sourceChanges: []`. The completion receipt records the final post-documentation run pointer and individual file hashes.

Initial browser runs are not acceptance evidence: the first run lacked the E2E preorder projection; concurrent subsequent suites collided in the shared Playwright output folder. The accepted runs above were sequential, with the correct projection, without retries. Logs and separate JSON summaries preserve those results.

## Responsive and visual evidence

Actual Local footer, with self-hosted Inter loaded and the unchanged reference content:

| Viewport width | Footer height | Minimum link height |
| -------------- | ------------- | ------------------- |
| 320            | 352px         | 44px                |
| 360            | 352px         | 44px                |
| 390            | 334px         | 44px                |
| 430            | 334px         | 44px                |
| 459            | 290px         | 44px                |
| 460            | 344px         | 44px                |
| 640            | 248px         | 44px                |
| 719            | 248px         | 44px                |
| 720            | 264px         | 44px                |
| 768            | 264px         | 44px                |
| 1024           | 220px         | 44px                |
| 1440           | 220px         | 44px                |

All twelve widths have zero document horizontal overflow. The four approved normal-text ceilings pass. Screenshots at 320, 390, 768 and 1440px were visually inspected for hierarchy, label completeness, dividers and spacing.

Actual 200% root text yields a 24px disclosure and natural growth (1288px at 390px width), without horizontal overflow. Keyboard Tab/Shift+Tab produces a visible 2px outline. Separate Chromium browser zoom uses the browser's `tabs.setZoom(2)` in a temporary isolated verification profile: a 1280px window reflows to 640 CSS pixels, devicePixelRatio becomes 2, visual viewport scale remains 1, targets remain 44 CSS pixels, and document overflow is zero. This is browser zoom, separate from the additional visual-viewport/pinch check and from the canvas simulation.

Computed foregrounds on the opaque `rgb(13,13,13)` footer background have contrast ratios of 17.83:1 (regular links), 9.29:1 (muted text) and 10.27:1 (amber). The existing Flint current-page underline remains; footer hover/focus uses amber.

## Evidence locations and limits

Ignored evidence root: `.codex-artifacts/footer-flowing-links/`.

- `catalog-summary.json`, `shell-summary.json`, `player-summary.json` and corresponding sequential logs.
- `browser-review.json`, `browser-zoom.json`, `graphify-update.log`.
- `footer-320.png`, `footer-390.png`, `footer-768.png`, `footer-1440.png`.
- `completion.json`: final validation summary path, source fingerprints and file hashes.

The existing Home media and Services form produce horizontal overflow with 200% root text; the footer's enlarged-text assertions use the Privacy prose route to isolate this change. No unrelated page layout was changed. Longer-content stress uses DOM substitutions, while optional purchase-information ordering is covered by the pure data test; no CMS draft or accepted snapshot was changed.

Provider playback and physical-device behavior are not newly certified by the fixture tests. Hosted acceptance and production deployment remain separate actions.
