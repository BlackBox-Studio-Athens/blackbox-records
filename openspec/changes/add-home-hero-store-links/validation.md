# Validation

## Source and environment

Prepared on `main` in the primary checkout, starting from `e38be19c8ae71610fe8814d770fa809551cea18c`. Product Environment: Local. The full Local stack on 4321 served an older build with Local CMS content, so browser checks used this checkout's Astro dev server on 4322, which served the edited tree with retained repository content, through an ignored override config (`.codex-artifacts/hero-side.playwright.config.ts`). Worker reads were stubbed by the spec.

## Behavior evidence

- `pnpm test apps/web/src/styles/homepage-hero-css.test.ts` passed (8 affected projects), including the new visibility assertions.
- `pnpm test packages/content-model/src/schemas.ts` passed (30 affected projects, staff included).
- `playwright test e2e/home-preorders.spec.ts e2e/home-motto.spec.ts --project chromium-desktop`: 25 passed. The new test checks the links, no Scroll text, gutter alignment with the logo and 44 px links at 390, 320 and 280 px, and the See pre-orders jump landing `#preorders` at 112 px. The empty-listing test checks that See pre-orders is hidden while Browse the Store stays visible.
- Playwright CLI screenshots at 1440, 390, 320 and 280 px, with and without a stand-in `#preorders`, match canvas frames C and C · Mobile without clipping or horizontal overflow.

## Repository checks and limits

- `pnpm openspec -- validate add-home-hero-store-links --type change --strict` passed.
- `pnpm validate` failed (`.codex-artifacts/validation/2026-10-08T16-17-44-286Z-64716-308f23/summary.json`), but only on files other sessions are editing: a `ts(2532)` error in `apps/web/src/components/app-shell/store-cart/store-cart-bridge.test.ts` and an `eqeqeq` lint error in `scripts/verify-runtime-config.ts`. Neither file is part of this change. Rerun `pnpm validate` once that work lands.
- Not verified: keyboard focus rings on the two links (they use the shared button focus style), Firefox, the full stack and hosted environments. Stored UAT/PRD Home records keep the retired `scroll_indicator_text` value, which the schema accepts.
- 2026-10-09: removed the store line at the user's request; the CSS test and the same 25 browser specs passed again.
