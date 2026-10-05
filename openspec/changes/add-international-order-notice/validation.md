# International order notice validation

Product Environment: Local. Work stays on the existing `main` checkout; no commit, push or deployment is part of this implementation.

## Source and completion record

Base HEAD: `14c4040a764e53cc2bef79dd17708e6c3efae3f1`, plus the uncommitted implementation. The final run's before/after fingerprint, summary path, mode and status are recorded in `.codex-artifacts/international-order/final-evidence.json`. Completion requires a passed Local run with matching fingerprints. Per-board handoffs retain the covered file hashes and individual test summaries.

## Acceptance scope

- Public presentation and shell/player: country visibility, normal-font comparisons at the supplied board dimensions and 390px, keyboard focus, 200% zoom, cart Checkout reachability, navigation continuity and console errors.
- Commerce presentation: current item titles in encoded email templates, removal/Undo and checkout title updates, empty-order behavior, preserved quote/payment controls and the Greece-only checkout scope. Focused Local browser fixtures retain Worker authority without changing stock, prices or catalog records.
- Boundaries: `store-cart` provides the shared notice entrypoint; pages, layouts and checkout consume it without a reverse dependency on `web-store`.
- Hosted provider, publication and release acceptance are excluded: this is a Local implementation. Task 3.4 remains for the separately authorized UAT release.

## Coordinated mockup passes

Each board has a dedicated GPT-6.1 Sol chat at max reasoning. Shared source ownership and browser comparisons are sequenced; the Store phone pass follows the desktop layout integration.

| Board            | Chat                                   | Ignored evidence directory                               |
| ---------------- | -------------------------------------- | -------------------------------------------------------- |
| Notice variants  | `01a108fe-2bcb-7822-86de-9fd57f27ae94` | `.codex-artifacts/international-order/notice-variants/`  |
| Store desktop    | `01a108ff-3e17-7482-b4e7-643930695e2c` | `.codex-artifacts/international-order/store-desktop/`    |
| Store 390px      | `01a10905-910d-7ea3-9cfe-ccf1428fcc54` | `.codex-artifacts/international-order/store-390/`        |
| Item desktop     | `01a108ff-4cac-74e1-9f31-fe10bc6ed8f8` | `.codex-artifacts/international-order/item-desktop/`     |
| Cart 390px       | `01a108ff-7730-7550-bb3e-72cd192e28d7` | `.codex-artifacts/international-order/cart-390/`         |
| Checkout desktop | `01a108ff-9028-73c2-8d43-b7128eeed924` | `.codex-artifacts/international-order/checkout-desktop/` |

The PNGs and their HTML exports govern the notice regions. Existing production headers, catalog controls, artwork, prices and accepted purchase layouts remain; the mocks identify these as placeholders. Final captures wait for fonts and a paint and prove actual Inter glyph use with `CSS.getPlatformFontsForNode`. Fonts are self-hosted in `fonts.css`; the shared Google stylesheet stub only prevents duplicate external requests. Captures and measurements are in `.codex-artifacts/international-order/final-visuals/`, with the passing capture report in `final-visual-capture-summary.json`.

The actual React variants mounted in the reference board's wrapper produce a 1280 × 1040 PNG with **zero differing pixels** against `design/notice-variants.png` (RGBA raster comparison using the installed Sharp library). Production captures use exact CSS viewport dimensions at DPR 1: Store 1440 × 1080 and 390 × 844; Item 1440 × 960 and 390 × 844; cart 390 × 844; checkout 1280 × 860. Notice copy, type, border tones, padding and gaps match the reference rules within the existing production containers. The cart retains its existing 24px inset, and checkout retains its accepted Review and Pay layout; placeholder mock layouts are not substituted.

Keyboard Tab/Shift+Tab checks prove a 2px solid `:focus-visible` outline and a 44px email target on every captured placement. Native browser handoffs also cover desktop zoom and phone layouts; final supplemental captures check the equivalent CSS reflow widths (640px checkout, 195px cart). The 195px cart has an existing item quantity-row overflow: US and GR both measure scrollWidth 294px against clientWidth 194px. The notice itself fits its 144px inner width and its email action and Checkout remain reachable; this supplemental baseline issue is outside the notice change. No literal native browser-menu zoom is inferred from equivalent-width captures.

The one-off capture spec is preserved at `.codex-artifacts/international-order/capture-visuals.spec.ts`, outside the permanent E2E suite. To replay it, copy it into `e2e/international-order-visual-capture.spec.ts`, run that single scoped file and move it back. It uses the previously accepted screenshot workflow and mounts the actual shared component. The synthetic board runs in a separate page and records only known Vite HMR transport diagnostics; the production page retains the unchanged strict shared console/page-error assertions.

## Local checks

- Country gate source and unit coverage reviewed: strict single `loc` parsing, Greece/unknown hidden, three-second request/body timeout, non-OK/failure handling, successful-only session cache, blocked storage, one concurrent promise and hidden static rendering.
- `pnpm test store-cart`: 131 tests passed at the shared component's first test checkpoint. Final source-bound results belong to the final completion record.
- `pnpm test checkout-web`: 110 tests passed. The checkout chat also reports all 10 focused tests in `e2e/international-order-checkout.spec.ts` passed with matching before/after file hashes; its handoff and copied summary retain the evidence.
- `pnpm test app-shell`: 269 tests passed after the cached-snapshot correction. A resolved notice can precede the shell's first markup capture; cached snapshots now remove its client-rendered content so a fresh island cannot append a second notice. The mobile category/reload test asserts exactly one notice and passed after failing with two notices before the correction.
- The final combined run of the five `e2e/international-order-*.spec.ts` files passed all 33 cases, with zero skipped, flaky or unexpected results. The isolated report is `.codex-artifacts/international-order/final-e2e-summary.json`; `final-e2e-source.json` records the 21 covered source hashes captured during that unchanged-source run.
- An existing Store Item test reproduced a Local trace-endpoint 404 in the shared E2E fixture's strict console check. The fixture now provides `loc=GR` by default; country-specific tests override it. The same existing test passed after this correction. Production lookup and console assertions remain intact.
- Initial scoped runs found existing ignored trial fonts under `apps/web/public/local-fonts/type-studies`, failing `_demo-routes.test.ts`. All eight files were preserved outside `public/` at `.codex-artifacts/international-order/preserved-local-fonts/type-studies`; before/after SHA256 hashes match and `preserved-local-fonts/sha256.json` records them. No test assertion was weakened.
- The first Local `pnpm validate` run completed 51 tasks but timed out the architecture test at 15 seconds under load, without reporting a boundary violation. Its source fingerprint matched before/after. An isolated `pnpm test architecture-tests` rerun passed all 17 tests in 13.32 seconds. The final completion record retains both this diagnostic history and the final-tree Local validation result.
- Local `pnpm validate` passed all 54 affected tasks after the lifecycle documentation was added; strict OpenSpec validation also passed. A final run after checking task state binds completion to the final tree in `final-evidence.json`. UAT task 3.4 remains open.

All six normal-font mockup comparisons are complete. The phone strip uses a normal label line height and starts the muted sentence on a separate line below 48rem; desktop retains inline text. The first native Chrome probe timed out; DevTools provided the variants and desktop evidence. Later native captures used the documented developer capability where the shared DevTools profile was locked. Native captures disclose viewport rounding and preserve images without resizing; final scoped captures establish exact CSS dimensions. No hosted acceptance is claimed.

## Lifecycle decision

Research compared an independent flag, deletion with shipping expansion, a Worker capability extension and a shared country constant. The chosen design keeps the existing isolated component active throughout Greece-only shipping, with no independent flag or new country authority. `design.md` records the rationale and exact deletion points. The added shipping requirement makes accurate partial-expansion replacement or full-scope removal part of that future release's acceptance, after expanded checkout and fulfillment are available and verified. This change neither expands shipping nor implements speculative destination policy infrastructure.
