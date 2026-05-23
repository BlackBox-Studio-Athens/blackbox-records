## Context

Current checkout authority is split:

- Astro content projects editorial `StoreItem` pages and currently carries temporary price fixtures.
- D1 stores `StoreItemOption`, `ItemAvailability`, `Stock`, and `VariantStripeMapping`.
- Stripe owns the actual Product/Price charged by hosted Checkout.
- The Worker creates Checkout Sessions with Stripe Price IDs from D1.

The new `checkout_surface` smoke scenario reached hosted Stripe Checkout on 2026-05-23 and observed `CHF 9.47, €10.00` plus only `Card` for Disintegration while the storefront expected `€28.00`. Stripe CLI also confirmed the local ignored Disintegration test Price mapping points to an active `1000 eur` Price. The bug is therefore real catalog/configuration drift, not only a storefront rendering bug.

## Goals / Non-Goals

**Goals:**

- Make hosted Checkout amount match the Worker-authoritative Store Offer before any paid smoke scenario runs.
- Verify that Stripe-backed checkout uses the intended Payment Method Configuration and does not regress to a card-only hosted surface when dynamic methods are expected.
- Make Stripe Prices, not Astro content, the authority for buyable price display and checkout readiness.
- Keep storefront price display reliable after Stripe Dashboard price changes without requiring an Astro deploy.
- Add a repeatable catalog sync/verify command that detects drift across repo Store Items, D1 variant mappings, and Stripe Products/Prices.
- Add Stripe catalog event or scheduled reconciliation coverage so D1 Store Offer snapshots stay current after Dashboard changes.
- Prevent fallback seeding from silently creating placeholder `€10.00` test Prices for real storefront items.
- Keep the paid checkout return page from flashing a full non-final status surface before the final success screen.
- Keep browser payloads and committed docs free of Stripe IDs, secrets, and account-specific private evidence.

**Non-Goals:**

- Shopper accounts, saved payment methods, or multi-currency pricing UX.
- Production live catalog migration before the existing production go-live gate is satisfied.
- Replacing Stripe-hosted Checkout with embedded Checkout or Payment Element.
- Making the static Astro build call Stripe directly.
- Guaranteeing browser-wallet visibility in contexts where Stripe filters the wallet as ineligible.

## Decisions

### Stripe Product catalog becomes the payment catalog source, not browser state

Use app-owned identifiers to connect systems:

- `storeItemSlug`
- `variantId`
- `sourceKind`
- `sourceId`

Stripe Products/Prices SHOULD carry those identifiers in metadata, and Prices SHOULD also use deterministic `lookup_key` values per environment and variant. Stripe Price amount, currency, active status, and Product/Price identity are the buyable catalog source of truth. Astro content may own editorial presentation, routing, copy, artwork, and local app identifiers, but it must not own or accept edits to the buyable price. D1 continues to store the backend-only `VariantStripeMapping` and browser-safe Store Offer snapshot needed to render and create Checkout Sessions. Browser-visible store pages and cart state must never receive Stripe Price IDs.

Operational price changes happen in Stripe: create or activate a replacement Price, move the deterministic lookup key or metadata to that Price, archive the old Price, then let catalog reconciliation update D1. Stripe Prices are immutable for amount changes, so changing an amount is a new Price plus mapping/snapshot update, not an Astro content edit.

Alternative considered: commit Stripe Price IDs or price amounts into Astro content. Rejected because it preserves drift risk and leaks provider identifiers into repo-owned presentation content.

### Add verify-first catalog sync

Introduce a repo command such as `pnpm stripe:catalog:verify` with an explicit `--apply` mode only after the dry-run is trustworthy. The dry-run reads the store projection and Stripe catalog, checks D1 mappings, and reports:

- missing Product/Price for a buyable variant
- mismatched amount/currency
- inactive Product/Price attached to a buyable variant
- D1 mapping pointing at a Price whose metadata/lookup key belongs to another variant
- storefront items that would require fallback placeholder Prices

Apply mode may update sandbox D1 mappings or create/update sandbox Stripe Products/Prices, but it must remain environment-explicit and must not print secrets.

Alternative considered: keep ad hoc Stripe CLI seeding. Rejected because it already allowed a `€10.00` fallback Price to become checkout authority.

### Storefront display should consume a Worker-owned Store Offer

The durable end state is a public Worker Store Offer read that returns browser-safe price, availability, and option data derived from synced Stripe/D1 authority. Static Astro pages can keep editorial content and render a loading/fallback state, but the buyable price used for checkout readiness should come from the Worker-owned offer path. If the Worker cannot confirm a current Stripe-backed Store Offer, the storefront should disable checkout instead of rendering an authoritative stale Astro price.

The Worker Store Offer read can serve a D1 snapshot for speed, but the snapshot must have a freshness policy. If the snapshot is stale or missing, the Worker should reconcile the active Stripe Price by lookup key/metadata before returning an offer. If reconciliation fails, it returns a browser-safe catalog-drift state and checkout remains disabled.

Checkout start is stricter than display: before creating the Checkout Session, the Worker must resolve or verify the active Stripe Price for the selected variant, update D1 if the active Price changed, and fail closed if no unambiguous active Price matches the app identifiers. This prevents a stale Store Offer snapshot from becoming a paid order.

Alternative considered: generate a static JSON price snapshot at build time. Rejected as the authority because it cannot reflect Stripe Dashboard changes without deployment. It remains acceptable only as a non-authoritative skeleton/fallback while the Worker Store Offer loads.

### Stripe catalog reconciliation has three entry points

Use one reconciliation service behind three triggers:

- Manual dry-run/apply command: `pnpm stripe:catalog:verify` reports drift by default and mutates only with explicit environment-scoped apply flags.
- Stripe catalog events: listen for `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, and `price.deleted`, then reconcile the affected Product/Price against app-owned metadata or lookup keys.
- Scheduled backstop: periodically verify all buyable variants so missed events, manual Dashboard edits, or deploy timing issues do not leave the shop stale.

The reconciliation output updates only backend/private or browser-safe state: D1 mappings, Store Offer snapshots, and redacted diagnostics. It must not write Stripe IDs into Astro content or committed docs.

### Surface smoke remains pre-payment

Keep `checkout_surface` separate from paid/decline scenarios. It should:

- open the deployed storefront checkout route
- redirect to hosted Stripe Checkout
- assert the hosted amount matches the expected Store Offer amount
- assert at least one dynamic payment option is visible when the selected browser/account/context should expose one
- write redacted evidence without submitting payment

Paid scenarios still require `stripe listen` and webhook reconciliation. The surface scenario should not.

### Dynamic payment verification has two layers

Use the existing Payment Method Configuration verifier as the API/config layer and the hosted Checkout smoke as the browser layer. Stripe may filter methods by browser, country, currency, amount, account support, and rules, so a card-only browser result must be investigated against both the Payment Method Configuration and the Checkout Session context before applying a code fix.

The browser layer must run against the UAT sandbox deployment, not `stripe-mock`, because local API mocking cannot prove Stripe-hosted dynamic payment method presentation. The accepted UAT payment surface should be documented as environment evidence: configured Payment Method Configuration ID, enabled candidate payment methods, browser context, checkout country, amount, currency, and the visible labels that the smoke asserts.

The smoke should make the expected labels environment-configurable so UAT can assert methods that are actually eligible for the account and browser. Browser wallets should be recorded as evidence when they appear, but they should not be the only required dynamic method unless the smoke browser and Stripe account are proven wallet-eligible.

### Checkout return only shows meaningful status surfaces

The paid return page should not present a full "confirming payment" recovery card while the browser is waiting for Worker state. Keep the initial state as a quiet accessible pending marker, then render either the final success surface or a real non-final recovery surface once the Worker response is known.

## Risks / Trade-offs

- [Risk] Wallet visibility depends on browser and Stripe eligibility. -> Mitigation: keep the smoke browser/context explicit and pair browser evidence with Payment Method Configuration verification.
- [Risk] Stripe IDs are needed operationally but must not leak into repo docs. -> Mitigation: keep IDs in D1/secrets/ignored local seed files and redact evidence summaries.
- [Risk] A sync command can mutate the wrong Stripe environment. -> Mitigation: require explicit environment selection, dry-run by default, and refuse live mode unless production go-live evidence is active.
- [Risk] Static pages can show stale price during network failure. -> Mitigation: checkout start remains Worker-owned and fails closed if Store Offer, stock, mapping, or Stripe Price authority is missing or mismatched.
- [Risk] Stripe catalog webhooks can be missed during setup. -> Mitigation: pair event-driven reconciliation with manual verify and scheduled full verification.
- [Risk] Dashboard Price edits can create multiple active Prices for one variant. -> Mitigation: require deterministic lookup keys/app metadata and fail verification when active matches are ambiguous.

## Implementation Order

1. Keep the new failing `checkout_surface` smoke as the reproduction gate.
2. Finalize the source-of-truth boundary: Astro editorial data only, Worker Store Offer for browser-safe buyable price/readiness, Stripe Price as payment authority.
3. Inspect sandbox D1 mapping for Disintegration and the linked Stripe Price/Product metadata.
4. Correct sandbox Stripe Price/Product and D1 mapping so Disintegration hosted Checkout shows the Worker Store Offer amount.
5. Implement catalog reconciliation as a shared service, then expose it through dry-run CLI, explicit sandbox apply, Stripe catalog events, and scheduled verification.
6. Replace fallback `€10.00` test Price creation with a fail-closed report.
7. Verify or repair the sandbox Payment Method Configuration and deployed Worker binding.
8. Document the UAT dynamic payment contract and make `checkout_surface` assert that contract against hosted Stripe Checkout before payment submission.
9. Keep the checkout return loading state visually quiet before the paid success surface or recovery state renders.
10. Re-run `checkout_surface`, then paid smoke with webhook listener, then the standard repo gates.

## Acceptance Evidence

- `pnpm stripe:catalog:verify --env sandbox` reports no catalog drift for all current buyable Store Item variants.
- A sandbox Dashboard Price replacement for Disintegration updates the Worker Store Offer without an Astro content change.
- Hosted Checkout for Disintegration shows the same amount/currency as the Worker Store Offer.
- `pnpm stripe:payment-methods:verify` verifies the configured sandbox Payment Method Configuration.
- `pnpm smoke:stripe-sandbox -- --scenario checkout_surface --screenshots always --timeout-ms 60000` reaches UAT Stripe-hosted Checkout, asserts the expected amount/currency and dynamic payment labels, and submits no payment.
- Paid return renders a single success surface after Worker state resolves.
- `pnpm smoke:stripe-sandbox -- --scenario happy_path_paid` passes with a matching `stripe listen` webhook listener.
- `pnpm test:unit`, `pnpm check`, `pnpm build`, `openspec validate fix-stripe-checkout-catalog-sync --type change --strict`, and `openspec validate --all --strict` pass.
