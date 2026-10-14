# Local implementation evidence

## Scope and source

Product Environment: Local. Authorized worktree `C:/Users/SVall/.codex/worktrees/1100/blackbox-records`, branch `codex/privacy-retention-holding`, base `dfea9e105f51e7e472dc08e535a479e7dbb2186b`.

Only Holding artifact preparation/checking, a disposable-fixture regression and its root cache inputs change executable behavior. The OpenSpec artifacts and [Claude handover](handover.md) contain researched draft editorial content; no rendered source or CMS entry was edited. No push, deployment, publication, provider mutation, real email, destructive data cleanup, VAT, checkout or launch change was performed.

## Checks

- Guard: `pnpm openspec:guard --allow-worktree`; guarded new/status/apply commands passed.
- `pnpm openspec -- validate clarify-privacy-and-holding-access --type change --strict --allow-worktree` passed.
- Initial focused regression completed its assertions in 7.1 seconds but failed the default five-second Vitest timeout. Only this subprocess-based fixture test was given a 30-second allowance. Corrected focused run and final repository evidence are recorded in the completion receipt below.
- The initial affected `backend-tooling` run also returned a null exit status from the unchanged Stripe migration CLI fixture after its 15-second child timeout. An additional focused run lost its Nx daemon connection, and a daemon-disabled retry encountered a default plugin-worker load failure. Later retries use process-local `NX_DAEMON=false` and `NX_ISOLATE_PLUGINS=false`, verified against the installed Nx implementation; no repository settings or test selection were changed to work around these infrastructure failures.
- Parent review identified missing cache dependencies: `workspace:test-release` hashes `releaseTests`, and its `scriptRuntime` does not hash app tooling. Both `apps/web/scripts/prepare-prd-holding.ts` and `apps/web/scripts/check-prd-holding.ts` are now exact entries in that existing input list. Final selected architecture/configuration checks and the rerun release-test target cover the corrected configuration.
- `pnpm test workspace` passed all six selected owner-module tasks (five cache hits), including the corrected release-test target and the existing cache/architecture configuration regressions. The file-affected retry also encountered a five-second timeout in the unchanged Stripe catalog fixture; neither unrelated backend test was altered. Both later passed in full validation.
- The completed-code `pnpm validate` passed all 23 selected tasks in `mode: local`, on its second source-stable pass: `.codex-artifacts/validation/2026-10-14T09-02-30-033Z-37528-c0ba82/summary.json`. Before/after fingerprints both equal `7562a200725bf09db6ba0af3e8b7352b458ec4a6de505e8c9ac2bd575aeefa36`. The first pass was superseded after the parent-requested cache correction and evidence edits; no superseded fingerprint is reused. The final documentation-only rerun is recorded by the completion receipt below.
- The initial `pnpm validate --plan` was invalidated when the timeout correction changed its source fingerprint. It is not passing completion evidence and ran no repository tests. Its summary is `.codex-artifacts/validation/2026-10-14T09-01-37-279Z-63332-21fdf5/summary.json`.
- Final `pnpm validate` summary, mode/status, matching source fingerprints and commit identity: `.codex-artifacts/privacy-retention-holding-20261014/completion.json`. Read that final receipt before reusing evidence.
- `git diff --check` passed before final validation; the final tree is checked again before commit.

## Investigation evidence

The bounded unauthenticated PRD `/privacy/` read on 14 October returned the real notice marked Updated 2026-10-13, including controller/contact information and existing Resend US/SCC wording. This observation is independent of the source fixture and of the local application SHA; no private CMS API was accessed. Official legal/provider sources and factual gaps are linked in `handover.md`.

The initial worktree Graphify query could not run while the checkout hook built its missing graph. A primary-checkout query located artifact preparation/validation but was truncated; focused `explain` calls narrowed this to `addAstroAsset` and `check-prd-holding.ts`, supplemented by exact reads of both worktree scripts. CodeGraph was attempted twice and returned Transport closed, so no CodeGraph source evidence is claimed. The worktree's AST-only bootstrap and post-edit `graphify update .` completed (28,003 nodes, 44,811 edges). Known extractor warnings include missing SQL grammar and a partial extraction in the unrelated `pages-workflow-contract.test.ts`; source reads/tests remain authoritative.

## Acceptance limits

- Artifact/tooling: the regression executes the real scripts in an isolated temporary tree, checks unchanged Holding HTML and four exact 302 destinations, and rejects catchall/shop redirects and extra shop HTML. No Cloudflare emulator or hosted status is inferred from file inspection.
- Shell/player: no full-site shell/router/player source changed. Holding has no player or page-owned runtime. Existing unchanged shell checks are included where the repository's affected plan selects them; a legal redirect is ordinary external navigation, with no cross-document playback guarantee.
- CMS/UI: Claude owns the Holding-link preview, all rendered copy, narrow action-link validator changes if approved, mobile/keyboard/no-JS checks and the selected CMS revision. Draft/publication/snapshot acceptance remains open.
- Hosted/release: actual 302 responses, query handling, destination health, no platform-injected analytics, apex guessed-route 404s and switch-day/rollback behavior remain unverified. A separately authorized Holding release is required; this local commit does not deploy it.
- Privacy completion: owner/accountant retention criteria, operating review practice, provider account agreements/settings, transfer assessment and analytics legal basis remain factual acceptance gaps. They create no new tax, checkout or launch gate. Consent sibling behavior must be reconciled before publishing dependent wording.

## Additional local access check, 14 October 2026

On clean source `de14a9f9f99e0fdbc444bc1ecd98fce20fd8fd48`, the existing local privacy fixture rendered its main notice without JavaScript at 320/390/1280px in Chromium and Windows WebKit. Evidence: `.codex-artifacts/compliance-review-20261014/local-acceptance/check-public.js`, `public-result.txt` and `webkit-public-result.txt`. This is source-fixture document access only: it does not establish actual accepted CMS content, controller facts, current hosted routing or publication. The exact owner inputs are consolidated in `docs/compliance-ui-handoff.md`; tasks 3.2-3.4 remain open. No UI text, provider settings or content was changed. Final documentation validation/commit: `local-acceptance/completion.json` in the same evidence directory.

## Autonomous follow-through, 14 October 2026

Base `188e3d29e583b45f373e3c98b48ba449e04c148f`. Owner delegated routine decisions and requested local commit. Three existing chats supplied read-only privacy, GPSR and bundle findings; the coordinator reviewed source and official sources, selected `operations.md`, and made the gateway response change. No UI/runtime component, provider account, tax/checkout/launch setting or actual CMS record was modified. Temporary API-parser/path-reuse trials were fully reverted; they are not part of the delivery.

Focused `pnpm test scripts/pages-public-gateway.test.mjs` passed 8 selected Nx tasks. `pnpm test apps/backend/src/cms/public-runtime.test.ts` passed the 3 affected modules, including the real-workerd gateway/ETag/restart/publication-retirement fixture. The new response tests preserve HTML bytes, status, cache/private/no-store/referrer/indexing headers, conditional replies and image behavior while adding `no-transform`. No manual Cloudflare beacon was found in current public source. The official Cloudflare FAQ establishes the intended automatic-injection mechanism; hosted behavior still requires release acceptance.

`pnpm test apps/backend/src/cms/published-reader.test.ts` reused passing evidence for unchanged projection code. A scoped invocation targeting `content-smoke.mjs` selected no tasks and is not a smoke pass. Fresh canonical `build:cms --env mock` stopped at the existing Stock bundle budget: 156699 Brotli bytes versus 156672. The final original-source build failure is retained as `.codex-artifacts/compliance-review-20261014/autonomous-closure/cms-build-final.log`. No limit was raised and no native CMS persistence/publication success is claimed. The proposed GPSR smoke extension was removed from source and retained only as `unrun-native-gpsr-smoke.patch` in that directory.

An intermediate validation was invalidated by the temporary API trials; a concurrent focused trial hit an Nx worker-start failure. Neither is final acceptance evidence. The final stable-source `pnpm validate` summary, before/after fingerprint, strict OpenSpec results, exact commit and clean-tree check are recorded in `.codex-artifacts/compliance-review-20261014/autonomous-closure/completion.json`. Strict validation passed for both changed OpenSpec changes. Graphify refreshed after the meaningful gateway/test edit batch; existing SQL-grammar and unrelated parser warnings do not replace source/test evidence.

Remaining: R5 Stock bundle reduction, actual statutory/account/supplier evidence, execution of the manual procedure, exact CMS revision/adoption, physical-device/assistive-technology checks and hosted delivery/header/analytics readback. The analytics change is not deployed; current hosted collection is not asserted stopped. The selected procedure is prospective, not proof of historic practice or an active automation.
