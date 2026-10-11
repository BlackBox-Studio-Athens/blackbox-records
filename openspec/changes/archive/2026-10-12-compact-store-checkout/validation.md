# Validation: compact-store-checkout

- Commit: `f8202bae9de39fd6a7b7f94da679457d3c86e0c6` plus uncommitted diff
- Date: 2026-09-30

## pnpm validate

- Status: PASSED (214.8s, exit 0)
- Summary: `.codex-artifacts/validation/2026-09-29T22-56-36-699Z-21660/summary.json`
- Scope: repository gates only (test, lint, typecheck). This does not cover the browser.

## Local runtime

`pnpm dev` (the `stripe-mock` stack) started, but every public route, including `/`, returned HTTP 500.

- The failing piece is the built static-site Worker (`site:dev` → `dev:static`). The error was `Uncaught Error: internal error; reference = …` from miniflare, with no stack trace.
- The backend Worker came up normally.
- Copying the git-ignored `.env.local` and `apps/backend/.dev.vars` from the main checkout did not fix it.
- This is unrelated to this change, and it is not investigated here.

Browser acceptance therefore used `astro dev` on 127.0.0.1:4321 with `PUBLIC_BACKEND_BASE_URL` set to the UAT Worker, which is the same wiring as `dev:stack:uat-connected`. That gave real delivery quotes.

- **Viewport measurements:** built-in browser pane with viewport emulation. Claude in Chrome was connected, but its window resize could not produce exact viewports: it reported a 2134×1039 viewport after a request for 1440×900.
- **Cart:** one Disintegration Black Vinyl LP line.
- **Stripe CTA:** never clicked.

## Measurements

| Viewport | ctaTop | ctaBottom | panelBottom | vh  | docW / vw   | Result                  |
| -------- | ------ | --------- | ----------- | --- | ----------- | ----------------------- |
| 1440×900 | 704    | 748       | 805         | 900 | 1426 / 1441 | PASS                    |
| 1280×720 | 704    | 748       | 805         | 721 | 1265 / 1280 | FAIL by 27px (see note) |
| 375×812  | n/a    | n/a       | n/a         | 812 | 376 / 376   | PASS                    |

The same page measured 1448px tall on UAT before the change, with the CTA at y≈1440.

**1280×720 note.** In DEV, `PurchaseInformation` adds the line "Draft purchase information. Details awaiting confirmation." (about 32px, dev-only). Without it the CTA bottom is about 716px, which passes, but only by a narrow margin. On UAT the testing banner adds about 40px, so the CTA stays below the fold at 1280×720. The spec requirement targets 1440×900 only.

## Criteria

| Criterion                                                                           | Result                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1440×900: CTA and panel above the fold                                              | PASS (748 / 805 ≤ 900)                                                                                                                                                                                  |
| 1280×720: CTA above the fold                                                        | FAIL locally by 27px (bonus target, not in spec)                                                                                                                                                        |
| 375×812: no horizontal overflow; Order Summary `<details>` toggles                  | PASS                                                                                                                                                                                                    |
| Loading geometry: ctaTop while quote loading vs loaded                              | PASS (702 → 704, Δ2px)                                                                                                                                                                                  |
| Qty + / − updates Total                                                             | PASS (€30.50 → €58.50 → €30.50)                                                                                                                                                                         |
| Tab order                                                                           | PASS: Continue Shopping → Delivery/Returns/Help/Privacy links → newsletter checkbox → Privacy information → Continue to Stripe Checkout → summary steppers (DOM order unchanged), focus outline visible |
| Console errors                                                                      | PASS (none)                                                                                                                                                                                             |
| Empty cart shows "Add a priced item to the cart before checkout." and hides the CTA | PASS                                                                                                                                                                                                    |

## Notes

- **Privacy information appears twice:** once in the shared purchase-information links and once beside the newsletter consent. Both placements come from `complete-shopper-purchase-information`, which requires the link adjacent to the consent, so they were kept.
- **Mobile shows "Order Summary" twice:** once as the `<details>` summary label and once as the card header inside it. This predates this change and is left as is.
