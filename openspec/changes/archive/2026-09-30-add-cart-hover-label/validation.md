# Validation

## Source and environment

- Branch: `codex/cart-hover-label`, based on local `main` at `e84f5f78345b02f4d493245f1281e2093ac048af`.
- Product Environment: Local. An isolated static worktree preview used `http://127.0.0.1:4322/blackbox-records/`; the existing canonical server was preserved.
- Acceptance row: Shell/player/routing. Commerce authority, CMS/publication and hosted release acceptance are outside this presentation change.
- Final source-bound evidence, including the last validation summary and matching before/after fingerprint, is recorded in `.codex-artifacts/cart-hover-label/final-verification.json` after this note and checklist are finalized.

## Checks

- `pnpm test apps/web/src/components/store/cart/StoreCartButton.test.tsx`: passed, selecting 10 affected module test targets. The revised regression covers empty, singular and plural accessible counts, badge presence and the supplementary aria-hidden Cart label.
- `pnpm test:app-shell`: passed; 39 test files and 179 assertions, reusing matching Nx outputs.
- `pnpm openspec -- validate add-cart-hover-label --type change --strict --allow-worktree`: passed.
- Initial `pnpm validate`: passed in 86.8 seconds, mode `local`, status `passed`, with matching source fingerprints `3f047d4c2fa0d1b7556b678c3249462f8936eeb6e240cd3bfde2f4d5e3492e7f`. Summary: `.codex-artifacts/validation/2026-09-30T09-28-01-227Z-57424/summary.json`. Final validation runs again after tracked closeout notes are finished; the final-verification pointer is authoritative for that tree.
- Test and validation commands used `NX_DAEMON=false` after the first successful affected-test run kept its project-graph client open.
- Graphify architecture and CodeGraph source/callers from planning were reused against unchanged worktree source before edits. The existing Graphify graph was copied locally and refreshed once with AST-only `graphify update .`; it reported existing Astro parser limitations. No semantic enrichment was run.

## Browser observations

The approved typography refinement uses sentence-case Cart, 12px, weight 400 and normal letter spacing. The final preview check verifies these computed styles and retains an updated screenshot in `.codex-artifacts/cart-hover-label/`.

Chrome's blackbox profile verified hover delay (still hidden at 183ms, computed delay 200ms), 120ms fade, persistent hover across the padded 6px gap and label, Escape with focus elsewhere, immediate keyboard focus, Escape retaining button focus, Space activation, reduced motion, one real emulated touch tap, narrow viewport clipping, blur dismissal and stable desktop geometry. The button remained approximately 44px square.

The real Bandcamp embed received track interaction, minimized, survived Store and Releases shell navigation and cart opening, reopened with the same backend DOM identity `1551`, and was destroyed by Stop. Browser checks and the header screenshot are retained under `.codex-artifacts/cart-hover-label/`.

## Preview limitations

The isolated preview logged a failed lazy import for `StoreDistroSearch.tsx`, displaying its existing search fallback on Store. Browsing, the cart, navigation and player continuity remained usable. This error belongs to the separate search presentation; no search code was changed. The standalone preview also has no commerce API at `/api/store/listing-prices`, so live price/checkout acceptance was not established or required here.
