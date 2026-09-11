# Store-wide search validation

Validated locally on 2026-09-11 against the production static build with `SHOW_REVIEW_SITE_MARKER=true`, served at `/blackbox-records/` on port 4330. This is local acceptance, not a deployed UAT or PRD smoke.

## Implementation

- All and Distro share `StoreDistroSearch.tsx`, its exact-first matcher, and the existing lazy module. No dependency, remote index, duplicate matching implementation, or module-boundary change was added.
- Search owns All coverflow activation. The separate flat initializer now handles other categories only. All clear explicitly returns to catalog; Distro retains its existing preview restoration behavior.
- The 104 All cards retain their server-authored identities, ordering, pricing targets, and image loading attributes. Search metadata uses existing title, subtitle, option/format, and Distro group text.
- All uses compact introductory copy, native format disclosure, and one visible mode-appropriate count. Category navigation and policy links remain available.

## Automated checks

- `pnpm test:unit`: passed (618 web, 31 staff, 6 API client, 450 backend Worker, 265 backend Node, 16 contract tests).
- `pnpm check`: passed, including formatting, lint, Astro/TypeScript and module/commerce boundaries. The existing deprecated `ZodIssueCode` hint remains unrelated.
- `pnpm build`: passed (349 web pages and 3 staff pages).
- `pnpm performance:bundles`: passed; eager graph 83,973 Brotli bytes against 97,280 bytes, no diagnostics.
- `pnpm openspec -- validate add-store-wide-search --type change --strict` and `git diff --check`: passed.
- Focused regressions cover both flat and grouped matching, exact precedence, real typo fallback, whitespace/clear, zero/one-card catalogs, canonical order, controller ownership/state, route loading, and snapshot sanitation. Existing superseded-navigation tests pass.

Command logs and measurement JSON are retained locally under `.codex-artifacts/store-search/`.

## Native browser checks

Native Codex Chrome control was used after the in-app browser failed to attach.

- All starts with one Search Store control and its untouched coverflow preview. Previous/Next and ArrowRight advance one card at a time.
- `Afterwise` finds Disintegration; `Allochiria` and fuzzy `Allochira` find three cards, including off-preview matches. `zzzzzzzz` shows zero results and a clear action. Clear returns focus to Search Store and exposes all 104 cards in catalog mode.
- All → Distro → All, back/forward, and repeated entries restore an empty query with no stale search-hidden attributes. Distro retains its grouped search behavior. BlackBox Releases has no search control.
- The All CDs link navigates to `/store/distro/#distro-group-cds`, selects that format, and starts with an empty query. Searching resets format selection and finds matches across groups.
- Disabling JavaScript exposes all 104 static cards and working native format disclosure. Blocking the search module exposes the complete grid and the error fallback without dead coverflow controls.
- A View all click retained while the search script was intercepted opens catalog exactly once after the script is released. Search also works with 3D support forced unavailable, returning three ordinary-grid matches.
- Reduced motion, keyboard interaction, clear focus, 320px reflow, 200% text, and 400% zoom-equivalent reflow were checked. Narrow layouts scroll naturally without horizontal overflow. Format links retain approximately 44px minimum targets (browser fractional-pixel rounding).
- Search performs no remote request. Resource inspection before/after exact, fuzzy, zero and clear queries showed one listing-price request per activation and zero per-card Store Offer reads. The static-only preview returns 404 for listing prices; this verifies request ownership, not successful backend price delivery.
- Repeated exact/fuzzy/zero/clear probes at 4× CPU slowdown produced no long tasks; a separately settled Distro query also returned three visible matches with no long task. An earlier unscoped observer saw a 62ms task and was replaced with bounded interaction probes rather than treated as search attribution.

## Fixed performance profiles

Final source/build hashes stayed unchanged during these runs.

| Profile      | Samples per route | All LCP     | Distro LCP  | Maximum load CLS |
| ------------ | ----------------- | ----------- | ----------- | ---------------- |
| Desktop load | 5                 | 116–128ms   | 120–132ms   | 0.000166         |
| Mobile load  | 3                 | 1068–1088ms | 1112–1172ms | 0.000642         |

Both routes pass the 2500ms LCP and 0.1 CLS budgets. Reports: `desktop-load-final.json`, `mobile-load-final.json`.

Desktop Distro disclosure passed five direct and five shell entries: maximum reveal 199.7ms, no long tasks or rejected samples. Report: `desktop-disclosure-final.json`.

The first mobile disclosure batch had one 53ms layout task in a shell-entry sample while separate native browser checks were active. All six reveals completed in 189.4–196.8ms. The report is retained as `mobile-disclosure-final.json`; an isolated repeat is used to check reproducibility, not to erase this observation.

The isolated mobile repeat passed all three direct and three shell entries, with no rejected samples or long tasks and a maximum reveal of 192.9ms (350ms budget). Report: `mobile-disclosure-isolated.json`. Its source/build hashes also remained unchanged.

## First viewport evidence

Native screenshots were captured inline at requested 390×844 and 1280×800 viewport settings, default text size, scrollY=0, with the test-site review marker visible. Windows/browser scaling reported actual inner sizes of 391×844 and 1280×801 respectively. First-item artwork began at approximately y=722 mobile and y=571 desktop, leaving identifiable artwork visible with ample margin beyond the one-pixel rounding difference. An additional 1280×799 capture also showed the artwork. The viewport override was reset after verification.
