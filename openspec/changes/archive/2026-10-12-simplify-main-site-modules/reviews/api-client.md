# @blackbox/api-client: received review

Reviewer/thread ID: `01a1253b-8cee-7121-811a-41e57c1d0f03`.
Implementation/thread ID: `01a12553-729e-7ed0-9a04-e5a28e2620fa`.
Module: 3/29, `packages/api-client`. Recorded: 2026-10-10.

The complete received review follows unchanged. The current implementation assignment delegates `pnpm validate`, combined graph refresh and shared acceptance to the persistent verifier; see [implementation handoff](../implementations/api-client.md).

<!-- prettier-ignore-start -->

What this change does: This is a read-only Ponytail review of module 3/29, `@blackbox/api-client`, under `packages/api-client`. One actionable simplification removes duplicated test setup and unused mocks. No production-code deletion or refactor met the required proof of equivalent behavior.

The review used the existing `main` checkout at `C:/Users/SVall/WebstormProjects/blackbox-records`. No project or task files were edited, and no commits, graph rebuilds, generated-contract writes, or hosted/provider operations were performed.

**Should fix**

1. **Consolidate the two no-store tests and remove their unused request-builder mocks.**

   **Location:** [client-factories.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/packages/api-client/src/client-factories.test.ts:77), lines 77–129. The unused mock chains are at lines 79–87 and 106–114.

   **What this is:** Two tests verify that the public and internal factories configure their fetchers with the supplied base URL and `cache: 'no-store'`.

   **Problem:** Both tests repeat the same setup, assertions and cleanup. Each also constructs a `path → method → create` mock chain that is never called or asserted. Neither production factory invokes those methods during construction: [public-client.ts](C:/Users/SVall/WebstormProjects/blackbox-records/packages/api-client/src/public-client.ts:23), lines 23–34, and [internal-client.ts](C:/Users/SVall/WebstormProjects/blackbox-records/packages/api-client/src/internal-client.ts:9), lines 9–20, call only `Fetcher.for()` and `configure()`, then return the fetcher.

   **Smaller change:** Replace the two tests with an `it.each` containing the factory, label and existing base URL for each case. Mock only `configure`. Keep the spy inside each case and restore it in `finally`. A suitable replacement is:

   ```ts
   it.each([
     ['public', createPublicApiFetcher, 'http://127.0.0.1:8787'],
     ['internal', createInternalApiFetcher, 'https://sandbox.example.workers.dev'],
   ] as const)('configures %s API fetchers for no-store requests', (_name, createFetcher, baseUrl) => {
     const configure = vi.fn();
     const fetcherForSpy = vi.spyOn(Fetcher, 'for').mockReturnValue({ configure } as never);

     try {
       createFetcher(baseUrl);

       expect(fetcherForSpy).toHaveBeenCalledOnce();
       expect(configure).toHaveBeenCalledWith({
         baseUrl,
         init: {
           cache: 'no-store',
         },
       });
     } finally {
       fetcherForSpy.mockRestore();
     }
   });
   ```

   **Behavior and coverage to preserve:** Both factories remain independently exercised, with their original HTTP and HTTPS base URLs, one factory call, the exact configuration assertion, and failure-safe spy restoration. Keep the existing factory-surface tests, real public POST/internal GET tests, and both error-media-type cases. The suite still has eight test cases; no distinct regression coverage is removed.

   **Connected caller evidence:** The public factory serves `apps/web/src/platform/lib/backend/api-client.ts:12` and `apps/web/src/components/store/checkout/public-checkout-api.ts:29,77,157,164`. The internal factory serves `apps/staff/src/components/orders/internal-order-api.ts:20`; that caller installs middleware at lines 21–33. Existing consumer tests check actual no-store requests, cancellation and fresh reads in `apps/web/test/commerce/public-checkout-api.request.test.ts:34–66,113–140`, and protected request options in `apps/staff/src/components/orders/internal-order-api.test.ts:8–33`. Those consumers and tests require no edits for this finding.

   **Focused validation:** Run `pnpm test '@blackbox/api-client'` after the test edit. Confirm all eight cases remain and both no-store cases are reported. The implementation thread must also run the repository’s required completion checks through `pnpm validate`; do not bypass feedback-policy or remove `finally` cleanup.

   **Expected net reduction:** Approximately 30–32 lines, entirely in `src/client-factories.test.ts`; zero production lines. Removing the unused mock chains alone saves 12 lines if consolidation is rejected.

   **If skipped:** Product behavior remains unchanged. The suite retains two copies of the same assertion and unused setup that must be read and maintained.

**Rejected ideas**

- **Merge the public and internal factories behind a new helper.** They are already small, direct wrappers with separate generated path types. A generic helper would add an abstraction for little benefit. A shared fetcher instance would change configuration and middleware isolation. Keep both factories, their return types and package exports.
- **Remove the apparently unused `internalStockFixtures.missingOperatorIdentity` field or unused-looking exports.** The fixture object is exported through `./test/msw-handlers`, and the client interfaces are declared package exports. Lack of a current repository caller does not establish permission to remove an exported contract.
- **Remove the discarded `await request.json()` calls.** `src/test/msw-handlers.ts:148–167` still parses checkout and newsletter bodies. Deleting those awaits changes malformed-JSON rejection and response timing. That is a behavior change, not a proven redundant check.
- **Derive the stock-change response by spreading `internalStockFixtures.stockDetail.stock`.** The exported fixture is mutable. This would introduce a dependency on its current contents and change responses when a consumer alters it. Keep the explicit response at `msw-handlers.ts:192–214`, including parameter-derived variant IDs and `notes ?? null`.
- **Delete the whole factory-surface or configuration tests.** The surface checks and cache-policy checks protect different properties. Finding 1 retains all their assertions and cases; it removes only duplicated setup and an unused mock chain.
- **Remove typed fixture checks, alter disclosures, or change freezing.** The `satisfies` clauses connect fixtures to generated contracts. Delivery constants and disclosure text have real backend and presentation consumers. Changing the mutable `deliveryCharges` object or shallow-frozen quantity-band array would change existing semantics.
- **Simplify the differing legacy/problem error messages in fixtures.** `publicCheckoutFixtures.checkoutUnavailable` deliberately has different `detail` and legacy `error` text. The consumer test at `public-checkout-api.request.test.ts:277–295` verifies preferred detail text while retaining the legacy body. Preserve both.

No concrete performance or single-responsibility finding was established in the production implementation. No speed improvement is claimed.

**Inspected scope and flows**

Every handwritten owned source/test file was read in full:

- `src/index.ts`, `src/public-client.ts`, `src/internal-client.ts`: exports, generated type aliases, per-instance fetcher construction, cache configuration, delivery constants and disclosure text.
- `src/client-factories.test.ts`: all eight cases, including successful requests, problem/legacy JSON errors, configuration assertions and cleanup.
- `src/test/msw-handlers.ts`, `src/test/msw-server.ts`, `src/test/setup-msw.ts`: every fixture and handler; preorder-scope branching, public-before-internal handler ordering, JSON-body parsing, dynamic stock response fields, strict unhandled-request behavior, handler reset and server closure.

Also inspected `package.json`, `tsconfig.json`, `vitest.config.ts`, and the complete `scripts/generate-api-client.ts`. The generator is operational tooling and is not an edit candidate in this assignment. Generated public/internal schemas were excluded from the handwritten review and included only in the fingerprint. No nested module roots were found in the package inventory.

Connected consumers inspected for compatibility included:

- Public checkout/platform wrappers and the complete public checkout request suite; public request payloads, error propagation, cancellation, no-store options and settled-read reuse.
- Staff order and stock API consumers; generated internal component/operation types, middleware, protected request options, safe error handling, and the order API tests.
- Backend `checkout/packing.ts` and `packing-policy.ts`; both delivery constants are used. This was a compatibility read, not a backend implementation review.
- `DeliveryRates.tsx`, its test, `DeliverySummary.tsx`, `StoreOfferPriceDisplay.tsx` and `StoreCollectionPage.astro`; shared rate values and disclosure text remain observable presentation contracts.
- Both MSW server/setup consumers and all repository uses of the exported fixture/handler helpers.
- Preorder showcase and e2e type-use sections consuming `PublicStoreListingPrice` and `CheckoutState`. Unrelated UI bodies and entire e2e suites were not reviewed.

Read the assigned personal/repository instructions, both archived Ponytail skills, agent workflow/reference, task proposal/design/module task entries, boundary policy, simplification baseline, and relevant checkout, shipping, error-response and validation requirements. There is no `packages/api-client/project.json`: the package declares its Nx targets in `package.json`, and the boundary manifest identifies it as a workspace package.

Graphify’s initial 2500-budget query was truncated. Focused `explain` queries resolved the public factory, internal factory and combined mock-handler factory with their extracted callers. CodeGraph supplied current source and caller context. It omitted the symbol-free barrel, lifecycle setup and test body; bounded exact reads filled those gaps. No graph initialization, enrichment or refresh was performed. Context7 did not identify the exact fetch package, so library details were checked against the installed `openapi-typescript-fetch` 2.2.1 source and its [official documentation](https://github.com/ajaishankar/openapi-typescript-fetch#usage).

**Validation evidence**

`pnpm test '@blackbox/api-client'` completed successfully with one test file and eight passing cases. Nx reported a **1/1 cache hit**; these are reused passing results for the selected inputs, not a fresh execution during this review. The cached output references `.codex-artifacts/validation/2026-10-09T10-00-33-998Z-63624-cf27de/api-client.json`.

An earlier file-targeted invocation produced no completion evidence and was canceled. The named-package retry completed. No source edit was made, so there is no implemented candidate to validate. `pnpm validate` was not run because this assignment is read-only and that command formats the shared working tree. Browser, provider, generation, typecheck and release acceptance were not run or claimed.

**Source fingerprint**

- Checkout: existing `main`.
- HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
- Finding file SHA-256: `e8e43006c160079f9b5123afc97aabcf3b27a9042efe3f657e352cb3d082e11f`.
- Package aggregate SHA-256: `273ca727b2a04897c33b879756928da69dbecf937a1abe41087d2df931f781bd`.

The aggregate covers these 13 files: the seven handwritten `src` files listed above, `package.json`, `tsconfig.json`, `vitest.config.ts`, `scripts/generate-api-client.ts`, and both `src/generated/{public,internal}/schema.ts` files. It is SHA-256 of records sorted by relative path, each encoded as `path + NUL + lowercase file SHA-256 + LF`. Repeated fingerprint checks matched all 13 files, and the final package diff was empty. Concurrent changes in `web-content-files` were observed and left untouched.

For subsequent implementation launches, use explicit shell `C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` with `login:false`, as clarified by the human. Do not change global profiles.

Verdict: Ship. Finding 1 is a proven test-only simplification ready for independent verification in the fresh implementation thread.

Lean: approximately 30–32 lines possible, with no production change or lost test cases.

Not checked: fresh test execution, implementation/typecheck/completion gates, browser/provider/release behavior, and unrelated consumer internals. Generated code and operational tooling remain outside simplification edits.

<!-- prettier-ignore-end -->
