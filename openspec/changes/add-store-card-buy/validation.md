# Validation

Product Environment: Local, on branch `claude/store-buy-button-854383`, last rebased onto local `main` at `a29999dd` before merging. These notes are written before the final `pnpm validate`. Its summary path, source fingerprints, mode, status and exit code are retained in `.codex-artifacts/store-card-buy/final-validation.json`, so recording the result does not change the tested tree.

Acceptance rows: Commerce/checkout/stock (Local mock scenario against the real Worker), Shell/player/routing (the shell snapshot resets Buy; full Playwright run) and Boundaries/tooling/instructions (strict OpenSpec validation). Staff/editor, CMS/publication and Release/environment do not apply: no staff, content or hosted change.

## Checks

- Store, layout and gallery Vitest projects (`vitest run --config vitest.modules.config.ts src/layouts src/components/store src/pages/_store-item-detail-gallery.test.ts`): 22 files and 175 tests passed on the rebased tree. The source test pinning the Coverflow stage height now expects the taller stage.
- Playwright, all specs: 38 passed and 5 skipped (project-conditional desktop or phone tests). Port 4321 belonged to another worktree's Astro, so this tree's Astro served 4331 under the ignored override `.codex-artifacts/playwright-4331.config.ts`. Summary: `.codex-artifacts/e2e-4331/summary.json`.
- `pnpm openspec -- validate add-store-card-buy --type change --strict --allow-worktree`: valid.

## After rebasing onto main

The checks above ran on the `ca47c42b` base. `main` then gained image delivery, edge caching and inert shell snapshots (`a29999dd`), none of which edits a file this change touches. The snapshot capture now clones into an inert document and still calls `sanitizeStoreListingPricePlaceholders`, which hides Buy in the clone.

- Store, layout, shell navigation and gallery Vitest projects: 36 files and 248 tests passed.
- `pnpm test:e2e` against this tree's Astro on 4321: 40 passed and 5 skipped, including main's check that capturing a Store snapshot fetches no lazy images. Log: `.codex-artifacts/store-card-buy/e2e-rebased.log`.
- The Local mock scenario and browser observations below were made on the earlier base and were not repeated.

## Local mock scenario

The mock CMS and commerce Worker ran on 8787 from this worktree with the Stripe mock, and Astro on 4331 used `PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787`. Only the ignored generated `apps/backend/dist/server/wrangler.json` added `http://127.0.0.1:4331` to `CHECKOUT_RETURN_ORIGINS`.

- The listing projection returned three ready, stocked records (Anarchotribal, Caregivers, Disintegration); exactly those three cards showed Buy. The other cards showed Price unavailable and Availability unknown without Buy.
- Buy on Disintegration read Adding while busy at an unchanged 72px width, then Added. The cart opened with Disintegration at €28.00, a BOX NOW Small charge of €2.50 and a €30.50 total. Checkout offered Continue to Stripe Checkout €30.50; `POST /api/checkout/sessions` returned 200 (request `e95aa42c-e323-4774-b2d4-e4f7cf9ebd36`) and the browser left for the Stripe mock's `checkout.stripe.test` host, which does not resolve locally.
- A press during the fresh store's initial content publication received `catalog_drift`. The card added nothing, removed Buy, showed Checkout Paused and focused the card link.

## Browser

Built-in browser pane with viewport emulation. In Claude in Chrome the tab group window was occluded (`visibilityState` hidden), so the shell never hydrated there.

- Grid at 1440 (four columns), 390 and 360 (two columns; 156px cards at 360), and 320 (one 288px column): Buy measured 72 × 44 on the price line, price rows measured 52px and no page overflowed horizontally.
- Card link cue: at rest the title underline is 1px, 30% ink, 4px below. Hovering the card link turned it full ink and lifted the border to #4a4a4a and the surface to #161616. Hovering Buy or Listen left the card at rest. The pane paints only on demand, so these values were read with transitions disabled in the test tab.
- Coverflow: at 1440 the active card's Buy ends inside the taller stage. At 390 Buy is hidden, the purchase row measures 34px and the active cover frame 124px, as before Buy existed.
- Buy style: the filled primary face (#e8e8e8, #090909), chosen from four treatments rendered on the real cards (`.codex-artifacts/store-card-buy/buy-options-compare.png`).

## Not verified here

- Focus returning to Buy when the cart closes is proven by Playwright. The pane never has window focus, so there focus fell to the document body.
- Sold Out, Out of Stock and unavailable cards without Buy are covered by unit tests; the Local seed had no such item.
- Hosted UAT and PRD were not exercised and nothing was released.

## Buy in the Listen chrome, 7 October 2026

Product Environment: Local, branch `claude/listen-button-design-parity-b06415` (worktree `restore-artist-photos-aeca04`), base `a20debe3`. Acceptance rows: Shell/player/routing (Store card markup, presenter labels and Playwright specs) and Boundaries/tooling/instructions (strict OpenSpec validation). Commerce authority, Worker, cart storage and checkout are unchanged; staff, CMS and release rows do not apply.

- Vitest (`vitest run --config vitest.config.ts` from `apps/web`): `StoreCollectionPage.test.ts`, `StoreListingPricePresentation.test.ts`, `button.test.tsx` and `catalog-containment.test.ts`, 4 files and 50 tests passed. The presenter's test fakes have no `querySelector`, so the label helper's fallback to the button kept them passing unchanged.
- `pnpm test:e2e e2e/store-formats.spec.ts`: 11 passed, including the renamed Store card Buy and Releases Buy vinyl test (resting edge `rgba(245, 245, 245, 0.48)`, hovering edge `rgb(180, 70, 90)`, stationary footprint, busy and disabled equal rest, reduced motion).
- `pnpm test:e2e e2e/store-preorders.spec.ts`: 12 passed.
- `pnpm test:e2e e2e/store-cart.spec.ts`: 48 passed, 7 skipped and 1 failed. The failure, Firefox compact "the header cart control appears only with items or in the store", was a React portal error-boundary console error on a fresh dev server; that test alone then passed in all four projects. An earlier run reused a background Astro started without `BLACKBOX_E2E=1`, whose development toolbar intercepted clicks; it was discarded.
- `pnpm openspec -- validate add-store-card-buy --type change --strict --allow-worktree`: valid.
- `pnpm validate`: passed, `mode: local`, source `a20debe3` with matching before/after fingerprint `3ee4dd7b…`, summary `.codex-artifacts/validation/2026-10-07T20-01-13-475Z-51360-772dea/summary.json`.
- Browser (`playwright-cli`, Chromium 1440 × 1000, this checkout's Astro on 4361, listing projection stubbed): Buy measured 72px wide with the record mark, a `rgba(245, 245, 245, 0.48)` edge and `rgba(9, 9, 9, 0.94)` face; hovered, the edge read `rgb(180, 70, 90)` with the Listen highlight. With a pre-order record the same card's Pre-order kept `rgb(232, 232, 232)` and its `rgb(45, 118, 106)` 3px inset line, and the mark was `display: none`. Screenshots: `.codex-artifacts/design/buy-icon/implemented-card.png`, `implemented-card-hover.png` and `implemented-card-preorder.png`.

Not verified here: phone widths and Coverflow in a browser (unchanged layout; the 72px footprint matches the earlier measurement), Safari, and hosted UAT or PRD. Nothing was released.

Rebased onto main, 7 October 2026: the branch now sits on local `main` at `02773e4e` (the home hero gap fix, which also edits `global.css`). The rebase applied without conflict and `git range-diff` showed the Buy commit unchanged as `18ad5a9b`. On that tree `pnpm validate` passed (`mode: local`, source `18ad5a9b` with matching before/after fingerprint `e3b0c442…`, summary `.codex-artifacts/validation/2026-10-07T20-53-36-931Z-49032-6af6c9/summary.json`), and `pnpm test:e2e e2e/store-formats.spec.ts` passed 11 of 11 against this checkout's own launcher on 4361.
