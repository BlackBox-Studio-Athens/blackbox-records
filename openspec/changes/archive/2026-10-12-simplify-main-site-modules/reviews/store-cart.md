# Store-cart received review

Complete received review from reviewer `01a12562-e610-7ad1-b5f8-838af0dfbce5`, retained by implementer `01a12644-b1b6-7843-ac1a-8b5854f749cb`.

Review source: `.codex-artifacts/simplification/07-store-cart-review.result.json` (`report` field), also supplied in the assignment. Reviewer HEAD: `3355c335226838f996efb5536f55271f819a3e14`; owned fingerprint: `a4340472ee5f0a6b4a3974f6e059a708f9dc4dbdd2cfa796037738d388fdf10c`. Current implementation baseline independently matches all 17 owned files; see [implementation record](../implementations/store-cart.md).

**What this change does:** This is a completed read-only review of module 7/29, `store-cart`. The module owns browser cart state, persistence, quantity changes, cart controls, and preorder/international-order notices. Three concrete simplifications are supported by source and comparison evidence, with approximately **26 lines removable**. No files or task records were changed.

**Source identity and scope**

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- HEAD at opening and closing: `3355c335226838f996efb5536f55271f819a3e14`.
- Review thread: `01a12562-e610-7ad1-b5f8-838af0dfbce5`.
- Closing identity captured at `2026-10-10T11:04:58.704Z`.
- All 17 owned files had identical opening and closing SHA-256 hashes. The owned Git status was clean at both checks.
- Combined owned-file fingerprint: `a4340472ee5f0a6b4a3974f6e059a708f9dc4dbdd2cfa796037738d388fdf10c`. This is SHA-256 of ordinally sorted `repository-relative path<TAB>file SHA-256<LF>` records.
- The module is closed. Its six provided entrypoints and dependencies on `ui-foundation` and `web-platform` remain the governing contract. No nested module roots were found within the assigned directory.

The review read the required personal/repository instructions, both saved Ponytail skills, the existing OpenSpec proposal/design and module task, the relevant checkout, preorder, shipping, shell, language and boundary requirements, and the module’s `project.json`.

**Should fix**

1. **Merge the snapshot transform’s duplicate return paths and remove its second money validation.**

   **Location:** [store-cart.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/cart/store-cart.ts:63), particularly lines 79–103; adjust the unused accessor imports at line 3.

   **Current proof:** The snapshot schema already validates `priceAmountMinor` with the same integer/nonnegative constraints as `moneySchema`, and validates trimmed currency length with the same constraints. The fixed-price branch then calls `createMoney` to repeat those checks and retrieve the same amount plus uppercased currency. Both price branches spread the same snapshot and set its currency and kind.

   **Smaller implementation:** Retain the current fixed-price/null issue and return `z.NEVER` exactly as today. Follow it with one return object:

   ```ts
   return {
     ...snapshot,
     priceAmountMinor: priceKind === 'pay_what_you_want' ? null : snapshot.priceAmountMinor,
     priceCurrencyCode: snapshot.priceCurrencyCode.toUpperCase(),
     priceKind,
   };
   ```

   Keep `createMoney` and `formatMoney` imported for `formatCartMoney`. Remove only the now-unused `moneyToMinorAmount` and `moneyToCurrencyCode` imports from `store-cart.ts`; retain those exported functions in `money.ts` because operational tooling consumes them.

   **Behavior and coverage to retain:** Keep the complete snapshot schema, unknown-field stripping, fixed-price/null rejection, default fixed kind, custom-price amount clearing, currency transformation, optional preorder presence, and all existing error handling. Preserve `money.ts`’s branding, formatting and CSP configuration, and its tests.

   **Evidence:** A read-only comparison executed the current source and this merged transform in memory. Across **4,224 comparisons**, snapshot parsing and serialized restoration produced identical JSON output, including property ordering. Inputs covered amount boundaries, invalid kinds/currencies, optional and invalid preorders, and Unicode currencies whose uppercase form grows.

   **Focused checks:** Run the owned cart tests, including money/CSP, invalid price, approved-field persistence and preorder cases, plus `StorePurchaseFlow.test.ts`. Preserve the Unicode counterexample described below when independently verifying the implementation.

   **Expected reduction:** Approximately **10 source lines**, one redundant money-schema parse per accepted fixed-price snapshot, and one duplicate return object. If skipped, these checks and branches continue to repeat work without adding validation coverage.

2. **Remove the private quantity setter’s middle normalization pass and unused default state.**

   **Location:** [store-cart.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/cart/store-cart.ts:232), lines 232–245; callers at lines 247–269.

   **Current proof:** `setCartLineQuantityByVariant` is private and has exactly two call sites. Both public quantity functions first call `normalizeStoreCartState`, locate the target line, and pass that resulting `currentState` as the setter’s third argument. The setter normalizes that state again before mapping it, then normalizes its output.

   **Smaller implementation:** Make the private `state` parameter required, remove its `currentState` local, and map `state.lines` directly. Keep quantity sanitization and the final `normalizeStoreCartState` call. Leave both public functions’ defaults, initial normalization, missing-variant handling, custom-price guard, and decrement-to-removal path intact.

   **Caller proof:** The shell invokes these public functions before persisting the result at `AppShellRoot.tsx:954–960`. `CheckoutOrderSummary.tsx:67–81` also invokes the public functions, including its fallback-line path. No consumer calls the private setter.

   **Behavior and coverage to retain:** Preserve the 1–9 quantity rules, missing-variant no-op, custom-price increase prohibition, stale custom-price correction, duplicate-variant mapping behavior, line ordering, fresh output objects, and primary-item projection. Do not remove either remaining normalization pass.

   **Evidence:** The exact private-setter change passed **720 read-only comparisons** of increment/decrement results. These covered both price kinds, existing/second/missing variants, ten quantity inputs, valid and invalid currencies, and the length-expanding Unicode case. There were zero mismatches.

   **Focused checks:** Run `pnpm test store-cart`. Retain the connected browser cases for mounted checkout quantity changes and mixed carts; their source checks persisted quantities, quote updates, announcements, removal/Undo and checkout gates.

   **Expected reduction:** **1 source line** plus the unused private default expression. Each applicable quantity change avoids one full-cart normalization pass. No elapsed-time improvement is claimed without a benchmark.

3. **Delete two test cases whose assertions are fully covered by retained tests using the same input.**

   **Locations:** [store-cart.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/cart/store-cart.test.ts:341), lines 341–347; [StoreCartDrawer.test.tsx](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/cart/StoreCartDrawer.test.tsx:211), lines 211–218.

   **Current proof and smaller deletion:**

   - `never promotes the legacy release id to the cart item slug` calls `addStoreCartItem(canonicalItem)` and checks the canonical slug plus inequality with `barren-point`. The retained test at `store-cart.test.ts:133–143` uses that same call and asserts the same canonical slug, variant and option. The fixture contains no legacy release identifier. Its positive slug assertion also implies the deleted inequality.
   - `creates a filled drawer view with canonical checkout route and subtotal` uses `createStoreCartDrawerView(addStoreCartItem(cartItem), resolveHref)`. The retained test at `StoreCartDrawer.test.tsx:226–240` uses exactly that input and checks the same count, subtotal and checkout URL, plus primary-item metadata and Remove copy.

   **Coverage to retain:** Keep both broader tests named above. Keep the empty-view case, quantity-two subtotal case, rendered controls, quoted-total accessibility, forbidden-field checks, malformed storage, migration, money, preorder and country/lifecycle tests. Those protect distinct behaviors.

   **Focused checks:** Run `pnpm test store-cart` after deleting only these two complete cases. No replacement test or fixture abstraction is needed.

   **Expected reduction:** Approximately **15 test lines**. If skipped, the suite repeats the same inputs and assertions without protecting an additional regression.

**Rejected simplifications**

- **Reducing serialized restoration to one normalization pass is behavior-changing.** For a stored fixed-price line with `priceCurrencyCode: 'ßßß'`, the current first parse produces `SSSSSS`; the second parse rejects its length and drops the line. A proposed single pass retains it. This was reproduced by executing both implementations in memory. Keep `parseSerializedStoreCartState`’s current passes.
- **Replacing the writer’s count check with `normalizedState.lines.length`, together with serializing that state directly, is also behavior-changing.** On the same input, current code removes both storage keys. The proposed version writes the length-expanded currency to v2 storage. These operations were compared directly. Do not generalize finding 2 into other normalization removals.
- **Deleting the Money accessors would break an out-of-scope consumer.** [scenario-policy.ts](C:/Users/SVall/WebstormProjects/blackbox-records/scripts/stripe-sandbox-smoke/scenario-policy.ts:3) imports them at lines 3–8 and uses them at lines 284–285. Keep their exports and owned tests; operational tooling is outside this implementation scope.
- **Removing drawer view fields or replacing its non-enumerable `lines` property with a normal object property changes an exported result.** The helper is consumed by the drawer and purchase-flow integration test, including serialization. Preserve its values and property descriptor.
- **Removing country-request racing, unmount protection, destination persistence or subscriptions loses distinct behavior.** Owned tests cover stalled request/body reads that ignore abort, SSR without poisoning later lookup, late results after unmount, blocked storage, and explicit destination choices shared across placements.
- **Removing Undo timing/focus state, `CSS.escape`, tooltip Escape handling or modal-lock lifecycle checks lacks equivalence proof.** These support observable focus, dismissal, async state and accessibility behavior. They remain intact.

No CSS, markup, visible copy, routing, player, shipping-policy or product-design changes are proposed.

**Inspected scope**

Every owned source/style file was inspected in full: `store-cart.ts`, `store-cart-events.ts`, `money.ts`, `shopper-country.ts`, `StoreCartButton.tsx`, `StoreCartDrawer.tsx`, `PreorderCartNotice.tsx`, `InternationalOrderNotice.tsx`, and `international-order-notice.css`.

All seven owned test files were inspected in full: `store-cart.test.ts`, `money.test.ts`, `shopper-country.test.ts`, `StoreCartButton.test.tsx`, `StoreCartDrawer.test.tsx`, `PreorderCartNotice.test.tsx`, and `InternationalOrderNotice.test.tsx`. The module configuration was also inspected.

Connected source reads covered the shell cart bridge, shell drawer handlers and header outlet, item purchase actions and snapshot production, checkout summary/status/return consumers, Store collection/item notice placements, preorder wording/estimate selection, the purchase-flow integration test, and the operational Money consumer. Relevant browser-test bodies were inspected in `e2e/store-cart.spec.ts:464–562` and `615–780`.

The closing fingerprint of the 13 connected files returned by CodeGraph was `66b26b65b3713eb437f174c3a494ee1ef5add7eb138e3537a35bf5f8e69a8921`, using the same path/hash algorithm. **2,703 cached caller-source lines matched the current files exactly at close.** No source drift was detected in the checked scope.

**Graph and evidence limitations**

Graphify was queried before substantive source investigation with the required 2500-token budget. Its broad drawer result exceeded that budget and was treated as incomplete. Narrow `path`/`explain` results then established the shell’s dynamic drawer import, the view helper’s eight direct relationships, and checkout’s import of the international notice. CodeGraph supplied current source and symbol relationships.

CodeGraph omitted anonymous test bodies and some imports despite reporting complete source. Exact bounded disk reads filled those gaps, including every missing owned-test body. Neither graph was initialized, refreshed, enriched or saved by this review. No paid or provider API was called.

The comparison scripts used the installed TypeScript/Zod packages to execute source variants in memory and emitted results only. They produced no files and are not Vitest, type-check, browser or release acceptance evidence.

**Implementation handoff checks**

The separate implementer should independently verify findings 1–3 against the current source, then run:

- `pnpm test store-cart`
- `pnpm test apps/web/test/commerce/StorePurchaseFlow.test.ts`
- `pnpm test:e2e e2e/store-cart.spec.ts -g "mounted checkout follows drawer quantity changes before payment|mixed cart refinement"`

The persistent verification thread retains ownership of shared validation, graph refreshes, task updates and final acceptance records. This reviewer saved no report or evidence file.

**Verdict:** Review completed. Findings 1–3 are ready for independent implementation verification. **Lean: approximately 26 lines possible — 11 source lines and 15 test lines.**

**Not checked:** Official unit tests, type checks, repository validation, browser execution and provider acceptance were not run in this read-only role. The report applies to the recorded source identities.
