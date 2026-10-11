# checkout-web — complete received review

Reviewer thread: `01a12563-6576-7850-b417-2d60274e4682`.
Reviewer turn: `01a12563-6bff-7cf3-8703-4bb0be50667c`.
Immutable source: [.codex-artifacts/simplification/08-checkout-web-review.result.json](../../../../.codex-artifacts/simplification/08-checkout-web-review.result.json).
Raw SHA-256: `7e5a232685d481b5e0b27b5c3afc6a3677d88c8760784ceeca451f15e5f52358`.

The complete received report follows. Its historical claims remain review-time evidence.

What this change does: This is the completed read-only Ponytail review of module 8/29, `checkout-web`. All 15 production files, all eight owned test files, and `project.json` were inspected, along with the connected purchase, cart, page, API-client, and verification paths. Three small behavior-preserving simplifications are supported by the current source; no test deletion is justified.

No files, task records, graphs, or generated outputs were saved or edited. No tests, builds, browser sessions, or hosted operations were run.

**Source identity and ownership**

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- HEAD at the beginning and final identity check: `3355c335226838f996efb5536f55271f819a3e14`.
- Owned root: `apps/web/src/components/store/checkout`. The inventory contains 24 files: 15 production files, eight tests, and one module manifest. No nested module root or generated source was found there.
- All 24 file hashes matched their review-start hashes at `2026-10-10T10:51:24.8545936Z`. The owned root had no Git changes.
- Aggregate SHA-256: `754cef8b172f7c089381cbcb768c280ccee2bebe59b9e6435bb004a2a2127a12`. This hashes UTF-8 manifest lines of `filename SHA256`, sorted with ordinal filename comparison, joined by LF, without a trailing LF.
- A separate late-review comparison of 28 connected source/test files found no changes between those snapshots. Other modules had working-tree changes; their implementations were not reviewed or altered by this thread.
- The module remains closed. Its nine declared exports, `browser-checkout-api` interface, allowed module dependencies, and `@blackbox/api-client/public` permission must remain unchanged.

Owned file references below are relative to `apps/web/src/components/store/checkout`; other paths are repository-relative. Line numbers refer to the reviewed source.

**Should fix**

1. **Reuse the existing checkout error-view builder** — [CheckoutOfferStatus.tsx:142](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/checkout/CheckoutOfferStatus.tsx:142), current block at lines 142–150.

   **What this is:** The cart checkout path loads capabilities and shows a generic unavailable state when that read fails. Both current checkout page callers omit `storeItemSlug`, so this is the normal cart-mode path, not an unused compatibility branch.

   **Problem and proof:** The catch block manually recreates all seven fields already returned by the error branch of `createCheckoutOfferView` in `checkout-offer-status-state.ts:104–115`. The values and field order match exactly when its message is `Could not load checkout status.` This leaves two copies of the same error-state definition to maintain.

   **Smaller implementation:** Within the existing `isActive` check, replace the literal with `setView(createCheckoutOfferView({ kind: 'error', message: 'Could not load checkout status.' }));`. Keep the generic message; passing through the caught exception would change current behavior.

   **Behavior and coverage to retain:** Preserve the mounted-component check, disabled checkout state, generic visible error, null variant, and all effect dependencies. Retain `CheckoutOfferStatus.test.ts:273–295`, which covers the existing builder’s visible error state, and its initial/loading and capability-disabled cases. The current static-render tests do not directly execute this cart-mode effect rejection.

   **Focused checks:** Run `pnpm test checkout-web`. Verify a Local cart checkout with a rejected capabilities read still shows the existing generic error and offers no payment action; compare this with the ordinary pending-to-ready path.

   **Expected reduction:** Approximately 6–8 production lines, depending on formatting. No new helper, interface, or test deletion.

   **If we skip it:** Checkout keeps two definitions of the same error view, which can diverge when one is changed later.

2. **Remove the shipping-error branch that cannot execute** — `CheckoutOfferStatus.tsx:203–207`; supplier proof at [checkout-shipping-step-state.ts:15](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/checkout/checkout-shipping-step-state.ts:15).

   **What this is:** `handleStartCheckout` checks `shippingGateView.canContinueToPayment` before reading the latest cart and starting checkout.

   **Problem and proof:** `createCheckoutShippingGateView` ignores its mode argument and always returns `canContinueToPayment: true`. Its returned object is local to this component and is never mutated or supplied by the shopper or API. Therefore the branch setting `Stripe will collect the shipping details.` and returning early is unreachable. The same constant check is redundant in the badge expression at line 120.

   **Smaller implementation:** Delete the four-line branch and its separating blank line. The badge condition can also become `view.canStartCheckout`. Keep the helper, the `checkoutClientMode` prop, and the exact payment-readiness expression at line 113 in this slice.

   **Behavior and coverage to retain:** Preserve the delivery-quote/loading guard, fresh cart read, empty-cart checks, variant checks, idempotency identity, terminal-attempt handling, and redirect/error ordering. Greece-only shipping remains Worker-owned; none of its validation is removed. Retain the missing-variant and start-error cases in `CheckoutOfferStatus.test.ts`, the meaningful quote lifecycle tests, and checkout-attempt tests.

   **Connected constraint:** `scripts/verify-environment-model.ts:115–118` refers to the exact `view.canStartCheckout && shippingGateView.canContinueToPayment && hasCheckoutLine` source expression. Its fixture also contains that expression in `apps/backend/test/scripts/environment-model.test.ts:10–11`. Those owners are outside this editing assignment. Deleting the entire helper or rewriting that checked expression is therefore not recommended here.

   **Focused checks:** Run `pnpm test checkout-web`. Retain browser checks for quote-pending payment, missing-quote payment rejection, empty checkout, and the Back/forward-cache restore scenario in `e2e/international-order-checkout.spec.ts:225–233`, `259–265`, and `270–292`. The verification thread should check the environment-marker contract through the normal repository path.

   **Expected reduction:** Five production lines and one redundant boolean term. No public interface or policy-tool change.

   **If we skip it:** The component continues to present a shipping failure path that its own supplier cannot produce.

**Nice to have**

3. **Select the displayed review lines once** — `CheckoutOfferStatus.tsx:92`, `265–267`, and `273–275`.

   **What this is:** The preorder notice and international-order notice both choose current cart lines first, then the Worker fallback snapshot, then an empty list.

   **Problem and proof:** Both JSX sites repeat the identical selection expression. The separate `hasCheckoutLine` calculation expresses the same nonempty decision. In the fallback case, the component also constructs the same one-element display array twice.

   **Smaller implementation:** Add one local `reviewLines` value using the existing expression, derive `hasCheckoutLine` from its length, pass it to `PreorderCartNotice`, and map its titles for `InternationalOrderNotice`. Leave the delivery-quote input construction unchanged: that path intentionally supplies the fallback quantity of one.

   **Behavior and caller proof:** `PreorderCartNotice.tsx:10–20` reads the supplied lines’ preorder data, optional titles, and count without mutation. `InternationalOrderNotice.tsx:33–36` consumes the mapped titles in their existing order; its country effect does not depend on the display-line array. Nonempty cart lines still override any fallback; an empty cart with a fallback still displays that snapshot; an empty cart without a fallback still mounts no international notice.

   **Meaningful coverage to retain:** Keep the ordinary-cart, fallback-preorder, empty-review, current-title, fallback-title, notice-ordering, and empty-country-gate cases in `CheckoutOfferStatus.test.ts:451–593`. They distinguish real behavior and should not be consolidated away merely because the selectors become shared.

   **Focused checks:** Run `pnpm test checkout-web`, then the selected checkout cases in `e2e/store-cart.spec.ts` and `e2e/international-order-checkout.spec.ts`. Confirm display ordering, current cart titles, fallback precedence, and absence of the notice for an empty checkout.

   **Expected reduction:** Approximately 1–3 production lines after formatting, plus one fewer fallback-array allocation per render. No measured page-performance claim is made.

   **If we skip it:** The two notices retain duplicate decisions about which items the shopper is reviewing.

**Rejected simplifications and coverage retained**

- **Delete the shipping helper wholesale:** Its constant result makes this tempting, but the operational verifier refers to its readiness expression. Keep that broader change outside this module slice; finding 2 removes only the proven unreachable behavior.
- **Delete the variants request because the view does not consume its array:** `loadCheckoutOfferState` awaits capabilities, offer, and variants together at `checkout-offer-status-state.ts:44–48`. A variants failure currently changes checkout to an error, and the request participates in readiness timing. Removing it changes network and error behavior. `CheckoutOfferStatus.test.ts:181–205` also requires the request.
- **Remove item-mode or static-summary fallback paths because current pages primarily use cart checkout:** These remain supported component inputs and tested behavior. Removing `storeItemSlug`, fallback snapshots, or priced summary inputs would change interfaces and compatibility behavior.
- **Remove `isReady`, `statusLabel`, CTA badge fields, or other apparently unused returned fields:** Existing helper consumers and tests observe these result shapes. This assignment requires interface preservation; deleting them is not justified by their absence from one JSX rendering path.
- **Remove API-response, identifier, storage, or URL checks:** The API wrapper accepts external responses, storage can contain malformed or older data, and checkout redirects and media links cross trust boundaries. Keep problem-type filtering, bounded safe messages, network-error normalization, variant and URL checks, storage parsing, and HTTPS media filtering. The request tests distinguish legacy bodies, foreign problem types, HTML responses, and network failures.
- **Remove quote cleanup as duplicate cancellation:** `DeliverySummary.tsx:19–41` uses both abort and an active flag. `DeliveryQuote.test.ts:29–64` deliberately resolves stale work after cancellation and verifies that only the latest result survives. Its debounce, empty-cart, and stale-result cases have distinct value.
- **Simplify payment-return polling or paid-only cleanup:** Return tests cover delayed order confirmation, non-overlapping reads, early connection retries, finite polling, preservation of verified payment facts after failure, and support-only recovery. The payment and order statuses must both confirm payment before the cart or attempt identity is cleared.
- **Remove the cart acknowledgement queue:** `requestStoreCartAddItem` can run before the lazy cart bridge connects. The bridge cancels acknowledged events, validates their payloads, drains pending adds, and emits the item-added confirmation. The acknowledgement and queued-add tests protect different outcomes.
- **Merge availability-alert, newsletter, services, and withdrawal submission handling:** Their consent, validation, focus, retry, and receipt behavior differ. No shared abstraction would preserve these contracts with less demonstrated complexity.
- **Delete form state-injection or markup tests as implementation-only coverage:** Availability-alert tests protect error descriptions, unticked consent, sending controls, and accessible completion. Withdrawal browser tests protect review-before-send, explicit confirmation, receipt download, focus, and retry identity. No distinct regression check is proposed for deletion.
- **Change visuals to reconcile older specification wording:** Current purchase-status source and tests include approved presentation details that differ from some older spec wording. This review preserves the current source/test behavior and proposes no product or visual correction.

**Inspected scope**

All production files were inspected in full: `AvailabilityAlertForm.tsx`, `checkout-attempt.ts`, `checkout-offer-status-state.ts`, `checkout-return-status-state.ts`, `checkout-shipping-step-state.ts`, `CheckoutOfferStatus.tsx`, `CheckoutOrderSummary.tsx`, `CheckoutReturnStatus.tsx`, `DeliveryRates.tsx`, `DeliverySummary.tsx`, `public-checkout-api.ts`, `public-checkout-presentation.ts`, `StoreItemPurchaseActions.tsx`, `StoreItemPurchaseStatus.tsx`, and `WithdrawalForm.tsx`.

All owned tests were inspected in full: `checkout-attempt.test.ts`, `CheckoutOfferStatus.test.ts`, `CheckoutOrderSummary.test.tsx`, `CheckoutReturnStatus.test.tsx`, `DeliveryQuote.test.ts`, `DeliveryRates.test.tsx`, `DeliverySummary.test.tsx`, and `StoreItemPurchaseActions.test.tsx`.

Connected evidence included the canonical and compatibility checkout/return pages; Store Item, Terms, and Withdrawal page callers; Store offer price and listing-purchase consumers; newsletter and services callers; cart normalization, persistence, events, bridge acknowledgement, drawer delivery composition, preorder notice, and international notice; the browser-safe API-client factory; commerce request and purchase-flow tests; the environment-marker verifier and its fixture; and relevant checkout, return, international-order, cart, and withdrawal browser scenarios. Inspection of outside files was limited to these connected responsibilities.

The required personal/repository instructions, archived Ponytail skills, workflow/reference documents, module metadata, and relevant commerce, shipping, shell, boundaries, preorder, error-response, environment-marker, and simplification contracts were read. Expected load was ordinary shopper tabs with concurrent asynchronous reads, rapid quantity changes, and lazy shell hydration. No hosted-load or performance measurement was attempted.

**Graph and evidence limitations**

Both existing graph tools were used before substantive source investigation. Graphify queries used budget 2500. The first broad query was truncated; focused summary, return, and shipping-helper queries supplied the relevant relationships. The API-file explanation collapsed additional connections, so exact source and caller reads established those facts. A later shipping query exceeded its requested output budget; the three-connection helper explanation resolved that specific relationship without relying on the omitted output.

The existing Graphify graph changed from 25,446 to 25,468 nodes during the review. This reviewer issued no initialization, update, enrichment, or save command. Owned source hashes remained unchanged. CodeGraph returned current source and call-flow evidence, but some responses omitted imports and test callback bodies even when their footer described the file as complete. Bounded exact reads filled those omissions. Graph relationships were used for navigation, not as proof of behavior.

**Verification handoff**

The implementation thread should independently recheck these candidates against its current source. The persistent verification thread owns shared checks, acceptance evidence, graph refreshes, and OpenSpec task updates.

Recommended checks for a selected slice are `pnpm test checkout-web`, the connected `StorePurchaseFlow` test where selected by the repository workflow, and focused Local checkout browser cases in `e2e/store-cart.spec.ts` and `e2e/international-order-checkout.spec.ts`. Final repository validation remains `pnpm validate` under `feedback-policy.json`. The cart-mode capabilities-rejection path deserves an explicit Local check if finding 1 is implemented; the current static-render tests do not exercise that effect directly.

Parent report destination: `openspec/changes/simplify-main-site-modules/reviews/checkout-web.md`. This thread did not write that report file or update task 8.1.

Verdict: Ship. No must-fix simplification was identified within the assigned scope; findings 1–3 are optional internal cleanup candidates.

Lean: approximately 12–16 production lines possible, with all meaningful tests retained.

Not checked: Executed unit tests, compilation, browser behavior, measured performance, provider behavior, and release acceptance. This is completed source review evidence, not implementation or runtime acceptance.
