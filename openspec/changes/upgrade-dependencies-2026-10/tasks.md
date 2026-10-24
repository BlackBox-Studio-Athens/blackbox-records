# Tasks

## 1. Patch and minor versions

- [x] 1.1 Apply the approved patch/minor versions and Node 24 types, preserve holds and pin style, run pnpm install and capture peer warnings verbatim.
- [x] 1.2 Run focused backend, api-client, web, staff and content-model checks; record exact selectors, failures and coverage limits. Stripe integration 45, API client 8, app shell 304, staff content 34 and CMS consumer 171 tests passed. Content-model has no test target; its requested direct check failed for that reason.

## 2. Nx migration

- [x] 2.1 Run pnpm nx migrate 24.0.0, install and run migrations, remove migrations.json, inspect removed dependsOn magic strings and run focused tests. All three migrations ran with --no-create-commits --no-agentic; API-client tests passed.

## 3. Vitest and Worker plugin

- [x] 3.1 Upgrade all Vitest instances to 5.0.5 and replace the Worker pool with plugin 1.4.7; migrate config/types/policy references and review the Miniflare override. Verify install and focused tests. Backend 45, API client 8, app shell 304 (serial retry) and staff content 34 passed; no install peer warnings.

  Vitest 5 exposed concurrent deletion of its shared module cache (ENOTEMPTY). The shared test-options helper now assigns a cache to each Nx project; child runtimes share that job's cache. An assert-based self-check passed; final concurrent validation must confirm the fix.

- [x] 3.2 Check mock resets, awaited assertions, top-level mocks, removed sequential config and explicit contract config resolution. Update the Renovate Vitest cap and run pnpm renovate:validate. Config validated; no nested hoisted calls or sequential options found. Full contracts passed under Vitest 5.

## 4. MSW and Motion

- [x] 4.1 Upgrade both MSW instances to 3.0.3, migrate strict unhandled-frame setup and inspect cookies/timers/ESM; verify API-client and web tests. API client 8 and commerce web integration 24 passed. Cache-policy assertions now inspect the original fetch options because MSW 3 reconstructs handler Requests.
- [x] 4.2 Bump both Motion instances to 14.6.0 without component edits; inspect internal imports, run existing checks and hand visual acceptance or component failures to Claude. Both manifests and installed versions match; tests and builds ran. Claude handoff records visual acceptance and the Staff bundle-budget failure.

## 5. Stripe

- [x] 5.1 Upgrade Stripe to 23.0.1 and the three API-version pins to endive, retain legacy coverage, inspect tolerance/error mapping/removed APIs/fixtures and pass focused backend tests. HTTP 356 and Stripe integration 45 tests passed; the initial gateway command failed in pnpm's concurrent package swap before testing and passed on serial retry.

## 6. Integration acceptance

- [x] 6.1 Run contracts and API generation; confirm generated client/schema stability with a diff and record failures. Both commands passed; git diff --exit-code confirms both OpenAPI documents and generated clients are unchanged.
- [x] 6.2 Run allowed Local EmDash, web/staff builds and bundle checks; record guard refusals and Claude-owned UI/browser acceptance separately. EmDash, web build and public bundle checks passed. Staff compilation and route checks passed, but its overview/orders bundle gate failed; see 6.4.
- [x] 6.3 Refresh Graphify, validate OpenSpec strictly, run pnpm validate on the final tree and record source-bound evidence, final versions, changed files and command outcomes. Post-fix validation passed 65/65 tasks; the final documentation-only receipt is in .codex-artifacts/dependency-upgrade-20261023/final-validation.json. Staff bundle acceptance remains open in 6.4.
- [x] 6.4 Restore Staff overview/orders bundle-budget acceptance. A HEAD baseline build shows radix-ui 1.6.7 to 1.8.1 adds about 790 Brotli bytes in shared Staff chunks; the owner approved a 5 KiB raise for both routes on 23 October 2026 (overview 126 KiB, orders 134 KiB). pnpm performance:bundles --scope=staff passes.
- [x] 6.5 Hold Playwright at 1.63.0. Playwright 1.64.1 hangs Firefox page.setViewportSize, even on a blank page (microsoft/playwright#43028); 1.63.0 resizes in 30-65 ms. Renovate caps playwright below 1.64.0. Firefox E2E failures fell from 16 to 0 after the hold.

## Workflow follow-up

- OPEN: hosted UAT and PRD Stripe webhook endpoint API version, using pnpm stripe:webhooks:verify under separate authorization.
- OPEN: UAT release and release acceptance under separate authorization.
- [x] 6.6 Fix the Firefox Home networkidle flake. Root cause: Playwright's Firefox `networkidle` lifecycle can miss an idle Home page and never fire. Diagnostics with request, frame and history logging found no open request, child frame or reload in timed-out runs. Playwright's own trace recorded all 150 resources finished; the second navigation was the shell's replaceState. Astro 7.4 dev timing made the miss more frequent (HEAD 0/20, HEAD+astro 7.4.2 1/20, upgraded 3/20). CI is unaffected because it runs `astro preview`. The test now waits through the existing client-side quiet-network tracking (`watchNetworkQuiet`, shared with `watchSurfaceWarmup`): 90/90 passed across firefox-desktop, webkit-mobile and chromium-desktop (30 each). Other `networkidle` waits (home-preorders, email-preferences, performance-acceptance) are unchanged.
- [x] 6.7 Fix the `store-cart.spec.ts:297` flake. The test exceeded the 90 s default on the local dev server; it now sets 180 s, following the suite precedent. The rare WebKit Listen tap that opened no player is fixed in `fix-modified-button-clicks`.
