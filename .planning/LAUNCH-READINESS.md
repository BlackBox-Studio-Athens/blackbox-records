# Launch Readiness Checklist

**Project:** BlackBox Records Native Commerce Migration  
**Status:** Planning draft  
**Purpose:** Future go-live milestone input. This checklist is not part of the active sandbox implementation roadmap; it exists so the later Go-Live / Launch Hardening milestone starts with explicit stop/go criteria.

Primary handoff input: `.planning/phases/10-sandbox-verification-and-release-gate/10-MILESTONE-REVIEW.md`.

## Runtime And Deployment

- [ ] Target runtime/adapter is approved
- [ ] Production host/vendor is approved
- [ ] Deployment topology is documented
- [ ] Emergency disable or rollback strategy for native commerce is documented
- [ ] Native Checkout Gate production rollout and rollback behavior is approved

## Secrets And Security

- [ ] Stripe secret keys are server-only
- [ ] Stripe webhook secret handling is documented
- [ ] D1 access remains server-only
- [ ] Browser cannot write authoritative order or stock state

## Stripe

- [ ] Stripe API/version choice is pinned
- [ ] Embedded Checkout request shape is documented
- [ ] Required webhook events and idempotency rules are documented
- [ ] Success/cancel/return-page behavior is documented as non-authoritative
- [ ] Physical-goods tax category maps to `General - Tangible Goods (txcd_99999999)` for vinyl, cassettes, CDs, shirts, and merch
- [ ] `txcd_10000000` is rejected for shipped physical goods unless tax/accounting review explicitly approves it
- [x] Existing sandbox Stripe Products are set to `txcd_99999999` in Stripe before sandbox checkout evidence is claimed
- [x] Stripe sandbox/test-mode evidence is captured with real test keys, Price mappings, webhook secret, and Browser Use validation
- [ ] Stripe Payment Method Configuration evidence confirms only cards, Apple Pay, Google Pay, and Link are allowed, while PayPal, Klarna, BNPL, and bank-debit style methods are off or unavailable. Phase 13 adds the verifier and sandbox CI gate; account-specific dry-run evidence is recorded in `.planning/phases/13-stripe-dynamic-payment-methods-policy/13-VALIDATION.md` when the Stripe test secret and `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` are configured.
- [ ] Production/live Stripe evidence is captured after live Stripe credentials, live Products/Prices, final domain, production webhook endpoint, and production Worker/D1 configuration are connected

## D1

- [ ] Stock semantics are approved
- [ ] Order lifecycle states are approved
- [ ] Paid-order reconciliation path is documented
- [ ] Failure cases do not decrement stock

## BOX NOW

- [x] Current v1 fulfillment depth is approved as manual address-based BOX NOW fulfillment
- [x] Stripe-collected Greek address/contact handoff is the current shipping surface
- [x] Legacy locker metadata remains prototype/future automation evidence only
- [x] Manual partner-portal fulfillment path exists for projected low volume
- [ ] Optional BOX NOW Reopen Gate evidence is captured only if the user explicitly reopens full integration after access exists

## Post-MVP Shiplemon

Phase 14 Shiplemon non-Greece shipping is post-MVP. These checks are future reactivation gates, not blockers for the
current checkout launch readiness scope.

- [ ] Shiplemon sandbox API key is available as a Worker-only secret
- [ ] Every public non-Greece StoreItemOption has an explicit Shipping Package Profile
- [ ] Shiplemon sandbox rate evidence exists for EU destinations outside Greece
- [ ] Shiplemon sandbox shipment evidence exists after a verified paid test-mode CheckoutOrder or approved fixture path
- [ ] Public APIs expose only sanitized Shipping Quote data and never raw Shiplemon provider data
- [ ] Production Shiplemon enablement waits for explicit post-MVP reactivation, live credentials, final domain/payment
      readiness, and final go-live approval

## Cutover

- [ ] Cutover sequence from the current external storefront handoff to native commerce is documented
- [x] Cart scope is explicitly approved as multi-item CartDraft and CartQuantity; native commerce must not return to the earlier single-item launch scope
- [ ] Emergency disable conditions are documented
- [ ] Operator comms/support plan is documented
- [ ] Human approval checkpoints are named

## Go/No-Go Gate

- [ ] Sandbox implementation milestone approved
- [x] Stripe sandbox evidence reviewed
- [x] BOX NOW manual v1 scope reviewed as closed for now
- [ ] Final stop/go reviewers identified
