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
