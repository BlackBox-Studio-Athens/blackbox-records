# Validation notes

## Local repository and browser checks — 2026-10-02

- Base SHA `aa2bfae91890d074e4efa99e777c057d38500c2f` plus this change's working tree. `pnpm validate` (`mode: local`, scope all) passed with matching before/after fingerprint `4be85703663ab95a69f75fca4df7007c2085a1b733b020536457eda03c25aa5c`, covering affected module tests, lint, typecheck and architecture checks. The summary is in ignored artifacts under `.codex-artifacts/validation/`.
- Environment: Claude Code cloud container, Local only, Node 24.21.0. No stack, provider or hosted checks ran.
- Rows selected:
  - Commerce/checkout/stock: Worker unit and worker-pool tests passed, covering the classifier, listing reader, offer reader, D1 operator repository and the listing integration test (one query, effective stock after holds).
  - Staff/editor: the staff API client test passed. The staff switch was not exercised in a browser.
  - Shell/player/routing: only the Store card status changed. `pnpm test:e2e e2e/store-cart.spec.ts -g "copies left"` passed in chromium-desktop and chromium-mobile.
  - CMS/publication and release rows: not applicable, because content and release are unchanged.
- Browser observation: with stubbed Worker reads, the Store card showed `Only 3 left` beside the price with Buy visible, and the item page showed `Only 2 left` above Add To Cart at 1280 px and 390 px.
- `pnpm openspec -- validate show-low-stock-notice --type change --strict` passed.
- Unverified:
  - Migration `0026` on UAT/PRD D1.
  - The staff switch against a running Local stack.
  - Real fonts. The screenshots used the fallback typeface.

## Redesign without the dot — 2026-10-02

- At the label's request, the pulsing dot was removed. DESIGN.md forbids fake urgency, and Baymard-style guidance favours real counts of 1–5 shown next to the buy action without decoration.
- Cards: the notice keeps the status chip's exact box. It measured 20.375 px high at the same y as Sold Out, and differs only by its Store Blood fill.
- Item page: a 28 px tab is fused to Add To Cart. Measured at 1280 px and 390 px (2× DPR), the tab's x and width equal the button's (224 px and 358 px), and the tab's bottom edge equals the button's top.
- `e2e/store-cart.spec.ts` asserts this alignment. Both copies-left specs passed in chromium-desktop and chromium-mobile.
- `pnpm validate` (`mode: local`) passed with before/after fingerprint `90534c1ad253f57d6b227e55215aa190ef0045afc7f27e5e251a3b3064cb929c`. Strict OpenSpec validation passed.

## Pre-landing proof — 2026-10-02

- Rebased onto `origin/main` `df2ceae0b8ac6934d1f44662e6e79ad189580905` (unchanged at fetch). Commits were reworded to conventional subjects; the tree is identical to the pushed `4a4595a`.
- Re-running `prisma generate` and `pnpm generate:api` left the tree clean, so the committed generated files are current.
- `wrangler d1 migrations apply COMMERCE_DB --local` on an empty scratch D1 applied 0001–0026. `pragma_table_info('Stock')` reports `showLowStock` `NOT NULL DEFAULT 0`, matching `restockPlanned`.
- Old-Worker compatibility: `origin/main` was checked out in a scratch worktree with only `0026` added to its migrations folder. Its worker-pool setup applies every migration in that folder. Its commerce-persistence, checkout, stock, catalog-sync and orders suites passed (29 files, 130 tests) with its old Prisma client against the new column. This covers the UAT/PRD window where migrations run before the Worker deploys.
- `pnpm agent:check`, strict OpenSpec validation and the full `e2e/store-cart.spec.ts` (15 tests, desktop and mobile) passed.

## UAT release repair — 2026-10-02

- Source `78b0ef3870b038dcdfb5046745725e9a6499035b` failed Release BlackBox run `37014522234` in `check-candidate`, before hosted mutation. Both target builds passed, but `ui-foundation:test` still expected the typography selector without the new `.store-low-stock` exception.
- `pnpm test ui-foundation` initially replayed a passing local Nx cache entry. With `NX_SKIP_NX_CACHE=true`, the same command reproduced CI's failed assertion (one failure, ten passes). The test reads `global.css`, which was absent from its declared cache inputs.
- The repair updates the existing typography assertion to include copies-left notices and adds the stylesheet to `ui-foundation:test` inputs. Product CSS and purchase behavior are unchanged. The existing failing test is the regression check.
- After repair, `pnpm test ui-foundation` executed without a cache hit and passed both files and all 11 tests. Strict OpenSpec validation passed. Before retry, UAT public release identity and Worker headers both reported source `aa2bfae91890d074e4efa99e777c057d38500c2f`, candidate `37007627632`, release number `488`.
- `pnpm exec nx show projects --affected --files=apps/web/src/styles/global.css --json` includes `ui-foundation`, confirming stylesheet-only edits select the repaired test. Final local validation and hosted release evidence are retained in ignored `.codex-artifacts/uat-release-repair/`.
- Acceptance rows: boundaries/tooling/instructions and release/environment. Prior product browser evidence above remains applicable to unchanged product code; staff switch acceptance is still pending. PRD promotion remains a separate user-triggered task.
- `pnpm validate` passed for the repair on source `78b0ef3870b038dcdfb5046745725e9a6499035b` plus the patch, with matching before/after fingerprint `a74c132131819389c259493669f72e00d22c333d546781fe8419ff42966a9814`, `mode: local`, summary `.codex-artifacts/validation/2026-10-02T13-53-52-966Z-18688-381222/summary.json`. It covered 16 affected projects and 26 tasks. `pnpm agent:check` passed. The graph refresh used local AST extraction only.
- Repair commit `e818b709a2364aa29dfd54cadcd0433779a1f263` passed [Release BlackBox run 37017092169](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/37017092169): full CI validation, both target bundles, UAT catalog/CMS schema steps, Worker/renderer deployment, listing readiness and Pages deployment with hosted identity verification. PRD deployment was skipped.
- The UAT catalog migration log records `0026_stock_show_low_stock.sql` applied successfully. Its retained log is `.codex-artifacts/uat-release-repair/worker.log`.
- Independent bounded public checks at `2026-10-02T14:11:29Z` confirmed frontend `release.json`, Worker capabilities headers and the rendered home all serve the repair SHA. Frontend and Worker agree on candidate run `37017092169`, release number `491`; Worker and home returned HTTP 200. The accepted content snapshot is `544e13f57744d3ca3d076721cea167b3be7cc0f7b4deb7c0a758fd6267e9a809`. Safe identity evidence is `.codex-artifacts/uat-release-repair/evidence.json`, including the final local summary pointer after this note.
- UAT deployment is complete. Release task 5.1 remains open for the staff switch and scarce-item browser confirmation; PRD promotion and archive tasks remain open.
