# Dependency upgrade validation

## Scope and identity

All approved dependency changes are implemented. Repository validation passed 65/65 tasks after one type-only Workers compatibility fix. Staff bundle-budget acceptance remains unresolved; see the OPEN gates below.

Local work on main in `C:/Users/SVall/WebstormProjects/blackbox-records`, based on `e29a60bada5dfb0e9fcf94babbf23c9d53cb9a14`. No commit, push, deployment or hosted Stripe/Cloudflare operation. Existing unrelated files were fingerprinted before editing; 12 baseline files remained unchanged before final validation and have local preservation copies.

Evidence directory: `.codex-artifacts/dependency-upgrade-20261023/`. Full install and test logs are retained there. The generated `final-versions.json` records all 119 direct dependency declarations and their installed versions. Every approved target and held version matches.

## Final direct versions

Existing exact/caret declaration style is preserved. EmDash remains current at 1.3.1. Compatibility holds and reasons are in proposal.md.

| Package                   | Installed version | Manifest                                                                                                                  |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| @astrojs/check            | 0.9.12            | package.json, apps/web/package.json, apps/staff/package.json                                                              |
| @astrojs/cloudflare       | 14.4.2            | apps/backend/package.json                                                                                                 |
| @astrojs/react            | 7.1.1             | apps/backend/package.json, apps/web/package.json, apps/staff/package.json                                                 |
| @cloudflare/flagship      | 0.6.0             | apps/backend/package.json                                                                                                 |
| @cloudflare/vitest-plugin | 1.4.7             | apps/backend/package.json                                                                                                 |
| @cloudflare/workers-types | 5.20261022.1      | apps/backend/package.json                                                                                                 |
| @emdash-cms/admin         | 1.3.1             | apps/staff/package.json                                                                                                   |
| @emdash-cms/cloudflare    | 1.3.1             | apps/backend/package.json                                                                                                 |
| @lingui/core              | 5.9.5             | apps/staff/package.json                                                                                                   |
| @lingui/react             | 5.9.5             | apps/staff/package.json                                                                                                   |
| @prisma/adapter-d1        | 7.10.1            | apps/backend/package.json                                                                                                 |
| @prisma/client            | 7.10.1            | apps/backend/package.json                                                                                                 |
| @radix-ui/react-dialog    | 1.3.1             | apps/web/package.json                                                                                                     |
| @radix-ui/react-slot      | 1.5.0             | apps/web/package.json, apps/staff/package.json                                                                            |
| @tanstack/react-query     | 5.90.21           | apps/staff/package.json                                                                                                   |
| @types/node               | 24.19.2           | apps/backend/package.json, apps/web/package.json, apps/staff/package.json, packages/api-client/package.json               |
| @vitejs/plugin-react      | 6.1.2             | apps/web/package.json, apps/staff/package.json                                                                            |
| astro                     | 7.4.2             | apps/backend/package.json, apps/web/package.json, apps/staff/package.json                                                 |
| dependency-cruiser        | 18.7.0            | package.json                                                                                                              |
| emdash                    | 1.3.1             | apps/backend/package.json                                                                                                 |
| eslint                    | 10.13.0           | package.json                                                                                                              |
| eslint-plugin-boundaries  | 7.2.1             | package.json                                                                                                              |
| execa                     | 10.2.0            | package.json                                                                                                              |
| hono                      | 4.13.13           | apps/backend/package.json                                                                                                 |
| jose                      | 6.2.13            | apps/backend/package.json                                                                                                 |
| knip                      | 6.42.1            | package.json                                                                                                              |
| lenis                     | 1.3.27            | apps/web/package.json, apps/staff/package.json                                                                            |
| lucide-react              | 1.61.0            | apps/web/package.json, apps/staff/package.json                                                                            |
| motion                    | 14.6.0            | apps/web/package.json, apps/staff/package.json                                                                            |
| msw                       | 3.0.3             | apps/web/package.json, packages/api-client/package.json                                                                   |
| nx                        | 24.0.0            | package.json                                                                                                              |
| playwright                | 1.64.1            | package.json                                                                                                              |
| prettier                  | 3.9.10            | package.json                                                                                                              |
| prettier-plugin-astro     | 1.1.1             | package.json                                                                                                              |
| prisma                    | 7.10.1            | apps/backend/package.json                                                                                                 |
| radix-ui                  | 1.8.1             | apps/staff/package.json                                                                                                   |
| react                     | 19.3.1            | apps/backend/package.json, apps/web/package.json, apps/staff/package.json                                                 |
| react-dom                 | 19.3.1            | apps/backend/package.json, apps/web/package.json, apps/staff/package.json                                                 |
| react-resizable-panels    | 4.14.8            | apps/staff/package.json                                                                                                   |
| resend                    | 6.34.1            | apps/backend/package.json                                                                                                 |
| robot3                    | 1.4.0             | apps/web/package.json                                                                                                     |
| shadcn                    | 4.22.1            | apps/web/package.json                                                                                                     |
| sharp                     | 0.35.5            | package.json, apps/web/package.json                                                                                       |
| stripe                    | 23.0.1            | apps/backend/package.json                                                                                                 |
| typescript                | 5.9.3             | package.json, apps/backend/package.json, apps/web/package.json, apps/staff/package.json, packages/api-client/package.json |
| typescript-eslint         | 8.72.0            | package.json                                                                                                              |
| vitest                    | 5.0.5             | package.json, apps/backend/package.json, apps/web/package.json, apps/staff/package.json, packages/api-client/package.json |
| wrangler                  | 4.151.3           | apps/backend/package.json                                                                                                 |
| zod                       | 4.6.7             | package.json, apps/backend/package.json, apps/web/package.json, packages/content-model/package.json                       |

## Compatibility work

- Nx applied three native migrations with `--no-create-commits --no-agentic`; zero commits were created. Only `affected.legacy: true` changed configuration. No removed dependsOn magic strings or custom hashers needed migration. Generated migration files were retained in ignored evidence and removed from the working diff.
- Vitest 5 and `@cloudflare/vitest-plugin` 1.4.7 pass focused Worker/API/shell/staff checks. The plugin's Miniflare is newer than the Worker's compatibility date, so the old pool-only override was removed.
- A concurrent Vitest startup failed deleting the shared module cache. The existing test-options helper now assigns a cache to each Nx project. An assert-based self-check verified separate jobs, shared child runtimes and unchanged JSON reporter options. Parallel final validation remains the integration check.
- MSW 3 setup uses strict `onUnhandledFrame: 'error'`. Existing consumers are ESM and have no affected cookie-header or fake-timer handling. Three request tests inspected MSW's reconstructed Request cache; they now assert the original fetch options while retaining cancellation, deduplication and settlement checks. The corrected suite passed 24 tests.
- Motion changed only in the web/staff manifests. No framer-motion internal imports were found. UI components were not edited; Claude owns visual acceptance.
- Stripe uses endive in the SDK client and current webhook fixtures; the basil legacy-version test remains. The gateway already classifies connection errors as uncertain creation and has an existing regression case. Signature verification passes undefined tolerance, preserving the SDK default. No removed ErrorType or static constructEventWithoutVerification use was found; stripe-mock has no old API-version pin.
- Renovate validated successfully with the Vitest range `>=4.1.0 <6.0.0`; other compatibility caps are unchanged.

## Peer warnings

No peer warnings were emitted by the completed dependency installation batches. Full output, including non-peer warnings, is retained in the install logs.

The first install failed on stale metadata for `@typescript-eslint/visitor-keys@8.72.0`. A direct registry lookup confirmed the version; retry with `--no-prefer-offline` succeeded. The attempted `--prefer-online` flag is unsupported by pnpm 12.6.0 and was not used.

pnpm automatically added release-age exceptions for `@cloudflare/vitest-plugin@1.4.7`, `miniflare@5.20261019.2-beta`, `wrangler@4.152.0` (plugin dependency), and `stripe@23.0.1`. Direct Wrangler remains 4.151.3.

## Commands and acceptance

Post-fix validation passed in 213.2 seconds, with 51 of 65 tasks cached. Its before/after fingerprints both equal `1d6d07d8de6c461d433e1dab68fedde10539d15c675862da1a7a9f09c17d8582`; summary `.codex-artifacts/validation/2026-10-23T12-17-09-170Z-38176-f1f4e4/summary.json`. Final documentation edits are followed by another supported validation run; its exact summary and matching final fingerprint are saved in the ignored final-validation.json receipt to avoid changing the validated tree again.

The [command ledger](commands.md) records each implementation/check invocation and failure output. Local unit checks do not establish browser, provider or release acceptance.

The first full `pnpm validate` run failed on backend typechecking after 2,955 tests passed across 43 reports with zero test failures. Its summary is `.codex-artifacts/validation/2026-10-23T12-00-59-649Z-22036-315d51/summary.json`; mode is local, status failed, and both source fingerprints are `b6da3e505c62b4c42eeb29015b275add278c3aacc04db0acebb9400e8f8a70cb`. New Workers types require `CacheContext.invalidate`, but the publication helpers use only `purge`. Their type-only parameter contracts now require that capability; the unchanged CMS tests passed 171 cases after this fix. The final validation receipt is recorded in `.codex-artifacts/dependency-upgrade-20261023/final-validation.json` after the rerun.

Local EmDash compiled REST acceptance passed. The public web build, route/image checks and bundle budgets passed. Staff compilation and route isolation passed, but its bundle gate failed: overview 124,568/123,904 Brotli bytes and orders 132,671/132,096. This is an unresolved acceptance failure reserved for Claude. No bundle budgets or UI components were changed, and no per-library size-causality claim is made without a comparable baseline.

The required validator also normalized Markdown table spacing and one line ending in the pre-existing `openspec/changes/apply-ux-laws-review-fixes/release-20261022.md`. This incidental formatting is retained so validation can cover the exact delivered tree; its text is unchanged and its original bytes are preserved in ignored evidence. The other 11 protected baseline files remain byte-for-byte unchanged.

## Changed files

The upgrade changes these 29 files (22 existing files and seven new OpenSpec artifacts):

- `apps/backend/package.json`
- `apps/backend/scripts/simulate-stripe-webhook.ts`
- `apps/backend/src/cms/public-publication-cache.ts`
- `apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.ts`
- `apps/backend/src/interfaces/http/routes/stripe-webhook-routes.test.ts`
- `apps/backend/tsconfig.json`
- `apps/backend/vitest.config.ts`
- `apps/staff/package.json`
- `apps/web/package.json`
- `apps/web/src/test/setup-msw.ts`
- `apps/web/test/commerce/public-checkout-api.request.test.ts`
- `docs/dependency-upgrade.md`
- `docs/validation-feedback.md`
- `nx.json`
- `package.json`
- `packages/api-client/package.json`
- `packages/api-client/src/test/setup-msw.ts`
- `packages/content-model/package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `renovate.json`
- `scripts/validation-reporters.ts`
- `openspec/changes/upgrade-dependencies-2026-10/.openspec.yaml`
- `openspec/changes/upgrade-dependencies-2026-10/proposal.md`
- `openspec/changes/upgrade-dependencies-2026-10/design.md`
- `openspec/changes/upgrade-dependencies-2026-10/tasks.md`
- `openspec/changes/upgrade-dependencies-2026-10/validation.md`
- `openspec/changes/upgrade-dependencies-2026-10/commands.md`
- `openspec/changes/upgrade-dependencies-2026-10/claude-ui-handoff.md`

The validator also formatted `openspec/changes/apply-ux-laws-review-fixes/release-20261022.md` as described above. The pre-existing change to `openspec/changes/improve-search-presence/tasks.md` and other original untracked files are not part of this upgrade and were preserved.

## OPEN acceptance gates

- Staff overview/orders bundle budgets: see tasks.md 6.4 and the [Claude handoff](claude-ui-handoff.md).
- Hosted UAT and PRD Stripe webhook endpoint API version: `pnpm stripe:webhooks:verify`, under separate authorization.
- UAT release and release acceptance, under separate authorization.
- Claude UI visual acceptance: Motion, React, Radix, Lucide, Lenis and resized-panel behavior; player continuity, overlays and checkout browser scenarios.

## Sources

- [Stripe 23 changelog](https://raw.githubusercontent.com/stripe/stripe-node/v23.0.0/CHANGELOG.md): endive pin, connection-error classification and signature tolerance changes.
- [Vitest 5 migration guide](https://vitest.dev/guide/migration/): mocks, async assertions, inline projects, config discovery and artifact paths.
- [MSW 3 release notes](https://github.com/mswjs/msw/releases/tag/v3.0.0): ESM, unhandled-frame option, cookies and fake timers.
- Installed package source and registry metadata were used for exact dependencies and the shared-cache diagnosis. Context7 was unavailable because its monthly quota was exhausted.
