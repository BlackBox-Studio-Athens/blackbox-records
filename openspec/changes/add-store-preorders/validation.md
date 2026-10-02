# Validation notes

## Planning evidence, 2 October 2026

- Branch `claude/preorder-flow-design-65884f` now sits on `4a4595af`: `main` at `df2ceae0` plus the two commits of the low-stock branch (`show-low-stock-notice`). No implementation has started; this change holds planning artifacts only.
- Visual reference: canvas Version 13 at https://claude.ai/artifact/MbxNJAgbRi6mdcN6ifSUTN, aligned with the final decisions (no refund promise, no Stripe consent, filter instead of tab, one new email).
- Code facts in design.md were read from source with CodeGraph and exact reads. The Graphify graph was built in this worktree on 2 October after the rebase onto `4a4595af`; the facts were re-read against that tree with CodeGraph and exact reads.

### Order pagination index migration

- Wrangler 4.141.0 `getD1MigrationFiles` uses the pattern `<migrations_dir>/*.sql` unless `migrations_pattern` is configured; `apps/backend/wrangler.jsonc` configures none.
- `@cloudflare/vitest-pool-workers` 0.22.0 `readD1Migrations` keeps `readdirSync` names ending in `.sql`; `apps/backend/vitest.config.ts` passes `prisma/migrations` to it.
- At the time of the check the primary checkout's Local D1 had 25 applied migrations; `0026` now belongs to the low-stock change (`0026_stock_show_low_stock.sql`), so this change's migrations are `0027` to `0030`. The database was copied to a scratch directory and read there: 25 applied migrations (`0001` to `0025_stock_restock_planned.sql`), no row for `20260917120000_staff_order_pagination`, and `PRAGMA index_list("CheckoutOrder")` has no `CheckoutOrder_createdAt_id_idx`.
- Conclusion: the folder-style migration is never applied in Local or in tests, and by the same discovery rule not in UAT or PRD. UAT and PRD were not queried. Fix: task group 2.

## Open changes on the same capabilities

`clarify-store-sold-out-presentation` (base for availability states and the purchase control; archive first), `alphabetize-distro-by-band`, `fix-mobile-cart-scrolling`, `show-release-editorial-details`, `smooth-homepage-hero`, `show-low-stock-notice` (adds `Stock.showLowStock`, the opt-in `lowStockQuantity` and its Store and staff surfaces; implemented, not archived). This change adds requirements beside theirs and modifies only `store-listing-price-presentation` "Listing-price projection is browser-safe and bounded" (built on the sold-out change's text; the low-stock change only adds a requirement to that capability, and this change's exposure scenario names its `lowStockQuantity`) and `paid-order-delivery` "Delivery retries are leased, bounded, and idempotent".

## Run 1, 2 October 2026

- Slices B0, B1, W1, W2 and S1 implemented by Sonnet 5.5 agents; commits `cf033f7d` (B0), `cfcf6a17` (B1), `ffaf0de6` (W1), `dc41526a` (W2), `3aa31be5` (S1); planning artifacts in `ebe05002`.
- Gate: two failed `pnpm validate` runs (a web type error under `exactOptionalPropertyTypes` in the W2 test; a duplicated `preorder` property in two backend test fakes), both fixed. Final `pnpm validate` passed, mode `local`, source fingerprints match: `.codex-artifacts/validation/2026-10-02T14-21-55-306Z-17944-d6d3a9/summary.json`.
- B1 ran `prisma:generate` against a scratch stand-in for the empty `@prisma/engines` package; only the four Stock-related generated files changed. Task 32.2 tracks a clean regeneration.
- B1 also fixed `readStock` in the operator stock repository, which did not select `restockPlanned` or `showLowStock`, so stock returned after a change or count reported both false.
- W1 impeccable gates as reported: context, product and shape passed (the canvas is the shape approval); image and browser checks not run in the slice. The new CSS is not visually verified; group 31 covers it.
- Decision: the Store card pre-order badge has its own element (`store-item-card__preorder`), because the availability slot also carries the low-stock notice.
- Not verified yet: anything visual, browser, Local stack, email or hosted behaviour.

## Codex continuation, 2 October 2026

- The user selected visible GPT-6.1-Sol chats with high reasoning for implementation, gates, fixes and acceptance, increasing the concurrency limit to eight. Code review uses GPT-6.1-Sol ultra. Fast processing is excluded; the inspected Codex config has `service_tier = "default"`, and implementation chat creation explicitly specifies `thinking: "high"`. These instructions supersede Appendix C's previous Sonnet model and concurrency limit; slice ownership, run order, validation gates and local commits remain required.
- Graphify and CodeGraph were verified in this worktree before implementation. Graphify's broad result was truncated; focused `explain` calls established the Store Offer and checkout-start relationships. CodeGraph returned current Stock and Store Offer source and caller impact using this worktree's absolute project path.
- The installed `@prisma/engines` 7.10.0 package now includes the Windows schema engine. `pnpm --filter @blackbox/backend exec prisma version` and `pnpm --filter @blackbox/backend prisma:generate` passed using that engine; regeneration left the generated client unchanged. The pre-generation schema fingerprint was `F4EE28AEE3A081A0E41F3D52639059FCEBF748D190FD9D5A64E3CA5C00FD55E5`. B5 and B9 still need normal generation on their changed schemas to finish task 32.2.
- `pnpm openspec -- validate add-store-preorders --type change --strict --allow-worktree` passed before resuming run 2.
- A previous process was still writing B4 and B5. Codex stopped its first three implementation agents before they edited source. After the user said they could not stop the previous run, Codex identified its separate CLI session (`01a0fd04-537b-7e81-84ee-ff3fb6422633`, rooted in this worktree), traced its active test to PID 41540, verified its identity and stopped that process and its descendants. Existing partial slice changes are retained for review and completion. The user authorized visible Codex chats for the Sol agents; CLI agents started by this orchestrator were stopped before the switch.

## Run 2 slice evidence, 2 October 2026

- W3: task 8.1 implemented; `pnpm test web-layouts` passed, 5 files and 19 tests. Both owned-file hashes matched before/after. Report `.codex-artifacts/preorders/W3.thread-report.md`; log `W3.web-layouts.log`; fingerprints `W3.source-evidence.json` in the same directory.
- S2: tasks 11.1–11.2 implemented; `pnpm test staff-content` passed 16 tests, `pnpm test staff-publication` passed 26 tests, and `node --check scripts/test-content-workspace.mjs` passed. The initial editor test selected Singles instead of the partner list; the test was corrected and rerun. Report `.codex-artifacts/preorders/S2.thread-report.md`, final log `S2.staff-content.retry.log`, publication log `S2.staff-publication.log`, syntax log `S2.scenario-syntax.log`, and six-file fingerprints `S2.source-hashes.json`.
- W3 and S2 reported Impeccable context, product, command-reference and shape gates passed; the approved canvas supplied shape approval. Image gates were skipped for hidden metadata and existing structured form controls. Browser acceptance remains unrun. Each used the installed absolute context loader because the worktree-relative loader was missing.
- B5: tasks 15.1–15.2 implemented with normal Prisma generation; checkout-core (107 tests), commerce-persistence (32), public-commerce-http (180), checkout-integration (45) and orders (43) passed on the final source. Report `.codex-artifacts/preorders/B5.thread-report.md`; per-suite final logs and `B5-source-fingerprint.json` are in that directory. The new persistence regression exposed Prisma returning the TEXT cycle key as a Date; the shared line mapper now handles it, and the snapshot/unchanged-provider-request checks passed.
- B4: all seven required focused checks passed; report `.codex-artifacts/preorders/B4.thread-report.md`, final fingerprints `B4.source-hashes.json`. Its HTTP/D1 test initially used an invalid underscore slug; the fixture was corrected and its check passed. The ultra review found one declaration blocker: `operator-stock` imports the approved domain root but omits `commerce-domain` from its dependencies. B4's ownership now explicitly includes that module's `project.json`; the delta records the already-approved edge. The B4 owner is correcting the declaration before the combined gate.
- B4's declaration correction passed `pnpm test operator-stock`, `pnpm audit:module-boundaries` and strict OpenSpec validation. Report `.codex-artifacts/preorders/B4.boundary-fix.thread-report.md`; the module declaration's SHA-256 is `74055403CC9D1383E78F48522C60F9C6DAE1FDF4662F47D9EA67AB9253721BE9`.
- The completed ultra review has no open findings, including the corrected declaration, and confirms B5's mapper preserves command-generated cycle keys. Source-bound report `.codex-artifacts/preorders/run2-review.md`. The combined run gate remains pending. These slice checks do not establish full-tree or browser acceptance.

### Combined gate, first attempt

- API generation ran once for run 2 and changed only `apps/backend/openapi/internal-openapi.json` and `packages/api-client/src/generated/internal/schema.ts`. All 46 approved slice/planning files retained their bytes; ownership verification passed.
- `pnpm validate` failed on W3's two `@typescript-eslint/prefer-regexp-exec` errors in `StoreCollectionPage.test.ts` (lines 76 and 92). The W3 owner is making the equivalent regex-call correction; generated outputs are retained and API generation will not repeat for this test-only fix.
- Summary `.codex-artifacts/validation/2026-10-02T15-45-37-694Z-58180-f166f2/summary.json`, mode `local`, status `failed`, source SHA `52d8124aff19a9e9f00b0118d7275ab44b2d22dd`; matching before/after fingerprint `72637562c9a7d6cfb62f2fc8ec452eda38ecd95ef98b8bb889b38f02d4b5199f`, no source changes. Report `.codex-artifacts/preorders/run2-gate.thread-report.md` records passed, stopped and unrun tasks; no whole-run acceptance is claimed.
- The single local AST-only `graphify update .` passed (21,914 nodes, 35,714 edges). Extraction of the unrelated `scripts/pages-workflow-contract.test.ts` was partial, and community labels changed. No semantic relabeling, paid API use or new watcher was enabled.

- Owner repair round 1 replaced the two test-only `String.match()` calls with equivalent `RegExp.exec()` calls. `pnpm test web-layouts` passed all 19 tests and scoped ESLint passed; before/after source hashes match. Report `.codex-artifacts/preorders/W3.lint-fix.thread-report.md`. The gate retry reuses generated API outputs and the completed graph refresh.

- The retry reached staff lint and found two inline `import()` type annotations in S2's `ContentFields.test.tsx`. Summary `.codex-artifacts/validation/2026-10-02T16-31-40-320Z-75540-238d1d/summary.json`, mode `local`, status `failed`, unchanged SHA `52d8124aff19a9e9f00b0118d7275ab44b2d22dd`, matching fingerprint `c231fedbd2d614cf4751abfdc0c98fc7ac4f6a488ffe95db6e57e2019a03a805`, no source changes. S2 owns the minimal type-import repair as round 2; previously passing source remains unchanged.

- Owner repair round 2 uses equivalent top-level type namespace imports in that single test file. All 16 staff-content tests and scoped ESLint passed, with the repaired source hash unchanged through checks. Report `.codex-artifacts/preorders/S2.lint-fix.thread-report.md`. No product behavior changed and no generated output needs refreshing.

### Combined gate, accepted

- `pnpm validate` passed in Local mode, exit 0, with no skipped phases, formatting edits or source changes. Summary `.codex-artifacts/validation/2026-10-02T16-40-07-206Z-54280-9cedfa/summary.json` covers source SHA `52d8124aff19a9e9f00b0118d7275ab44b2d22dd` plus the 48-file working-tree snapshot, with matching before/after fingerprint `ccaec95a446d2fe46ebbbb7771cf8dc9a5a2391a16eca79bf9e56612661eb702`. All selected checks passed; 49 of 62 tasks reused matching cache entries.
- Gate report `.codex-artifacts/preorders/run2-gate-final.thread-report.md` and inventory `run2-gate-final.inventory.json` establish exact ownership; the orchestrator independently confirmed all 48 current hashes before committing. The ultra follow-up accepted the generated contract and equivalent W3 repair; the S2 repair changes only type-import syntax.
- Local slice commits: `a89939ac` (B4), `0d3462b6` (B5), `20ce1047` (W3), `8629747d` (S2). Tasks 8.1, 11.1–11.2, 12.1–12.3 and 15.1–15.2 are complete. These commits retain the validated product bytes; this acceptance note is written afterwards. Browser, Local-stack and provider acceptance remain in group 31.

## User follow-up after implementation

- Run `pnpm --filter @blackbox/backend cms:catalog-schema` for `partner_links` in each intended environment using its normal environment selection and release gates.
- Archive completed changes in this order: `clarify-store-sold-out-presentation`, `show-low-stock-notice`, then `add-store-preorders`.
- Merge the low-stock branch before this branch so migration `0026_stock_show_low_stock.sql` precedes this change's migrations 0027–0030.
- Enter the pre-order content, ship estimate and expected copies for each intended Store Item variant; expected copies use the ordinary stock quantity, followed by a recount when copies arrive.
- A push, software release, Content Publication and shopper launch remain separate user operations. No push, deployment or workflow dispatch is part of this continuation.
