# Phase 14: Shiplemon Non-Greece Shipping Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `14-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-05-21  
**Phase:** 14-shiplemon-non-greece-shipping-integration  
**Areas discussed:** Destination Rollout, Quote Choice, Package Profiles, Customs And Non-EU, Operator Workflow, Tracking

---

## Destination Rollout

| Question                                                                                                                                             | Options Presented                                                                            | User's Choice               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------- |
| Which country scope should Phase 14 plan for first?                                                                                                  | EU-first outside Greece; Explicit allowlist; All Shiplemon-supported non-Greece countries    | EU-first outside Greece     |
| For that EU-first rollout, how strict should the first production country set be?                                                                    | All EU except Greece; Small EU allowlist first; Sandbox broad, production allowlist          | All EU except Greece        |
| For EU destinations where Shiplemon returns no usable rate, or validation data says the address/postal code is unsupported, what should checkout do? | Fail closed before checkout; Let buyer ask manually; Let payment proceed for manual shipping | Fail closed before checkout |
| How should the system treat non-EU destinations in Phase 14?                                                                                         | Explicitly disabled; Hidden behind operator approval; Planned but not launched               | Explicitly disabled         |

**Notes:** Phase 14 public checkout is EU-only outside Greece. Production supports all EU countries except `GR`; non-EU is
not a Phase 14 public checkout path.

---

## Quote Choice

| Question                                                                                                                          | Options Presented                                                                                                         | User's Choice                                                            |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| What should the shopper see when Shiplemon returns multiple valid EU rates?                                                       | Multiple quote options; One recommended quote; Operator chooses later                                                     | Multiple quote options                                                   |
| How should those options be ordered?                                                                                              | Cheapest first; Recommended first, then price; Fastest first                                                              | Recommended first, then price                                            |
| What makes a quote recommended?                                                                                                   | Cheapest acceptable service; Best balance; Manually preferred carrier/service                                             | Best balance: cheapest tracked service with reasonable delivery estimate |
| When Shiplemon gives several shipping options, should the buyer be able to pick any of them, or should we filter out weaker ones? | Buyer can pick any valid Shiplemon quote; Buyer can pick only from safe quotes; Buyer cannot pick; only recommended quote | Buyer can pick only from safe quote options                              |
| What should be shown for each safe quote?                                                                                         | Carrier/service, price, estimate; Price and estimate only; Carrier/service, price, estimate, extra caveats                | Carrier/service, price, estimate                                         |

**Notes:** The user asked for one question to be rephrased, then chose filtered safe quote options. Public quote display is
multiple-choice but still app-filtered and provider-safe.

---

## Package Profiles

| Question                                                                          | Options Presented                                                                                                  | User's Choice                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| How should package dimensions and weight be stored for shipping quotes?           | Per variant only; Format defaults plus overrides; Operator-maintained profiles per item                            | Format defaults plus overrides                              |
| What should happen when a variant has no override and no matching format default? | Fail closed; Use a conservative fallback box; Operator review path                                                 | Make invalid states unrepresentable                         |
| Where should format defaults come from?                                           | Code/config seed data; Operator-managed D1 records; Content/catalog metadata                                       | Code/config seed data migrated into D1 runtime records      |
| How should bundles or multi-item carts be packaged?                               | Sum item weights, use one conservative package dimension; Each line gets its own package item; Disable mixed carts | Sum item weights and use one conservative package dimension |
| Who is allowed to change package profiles after launch?                           | Code/deploy only; Operator tooling later; Direct D1/admin only                                                     | Operator tooling later                                      |

**Notes:** The explicit user phrase was "Make invalid states unrepresentable." This means no generic fallback package and
no checkout path for variants that cannot resolve a valid package profile.

---

## Customs And Non-EU

| Question                                                                                   | Options Presented                                                                                  | User's Choice                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------- |
| What should the implementation do with customs-related Shiplemon fields?                   | Do not model customs yet; Reserve internal extension points only; Model customs now, keep disabled | Do not model customs yet        |
| What should shoppers see if they enter a non-EU country?                                   | Shipping unavailable; Contact us; Hide non-EU countries entirely                                   | Hide non-EU countries in the UI |
| Should we mention non-EU shipping anywhere as coming later?                                | No; Yes, short unavailable copy; Yes, visible store/shipping note                                  | No                              |
| Should internal docs preserve the research finding that Shiplemon supports customs/non-EU? | Yes, research/deferred only; No, remove it; ADR later                                              | Yes, research/deferred only     |

**Notes:** Non-EU remains useful research context but is not implemented, modeled, advertised, or exposed in Phase 14.

---

## Operator Workflow

| Question                                                                                                               | Options Presented                                                                                                     | User's Choice                                 |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| After Stripe confirms payment for an EU non-Greece order, should the Worker create the Shiplemon shipment immediately? | Auto-create immediately; Ready-to-ship review first; Auto-create only for recommended quote                           | Ready-to-ship review first                    |
| What should the operator need to review before creating the shipment?                                                  | Address and selected quote only; Address, selected quote, package profile; Full order fulfillment summary             | Full order fulfillment summary                |
| What should happen after operator confirmation?                                                                        | Create shipment and store label/tracking; Create incoming order only; Operator manually creates shipment in Shiplemon | Create shipment and store label/tracking      |
| What should happen if Shiplemon shipment creation fails after operator confirmation?                                   | Fulfillment review with retry; Mark order needs review only; Manual external shipment                                 | Fulfillment review with retry                 |
| Should shipment creation be idempotent?                                                                                | Yes, one Shiplemon shipment per CheckoutOrder; Yes, but allow manual duplicate override; Not in first slice           | Yes, one Shiplemon shipment per CheckoutOrder |

**Notes:** Phase 14 is not automatic shipment-on-webhook. Payment success creates an operator-ready shipment task; operator
confirmation performs the Shiplemon provider call.

---

## Tracking

| Question                                                                                  | Options Presented                                                                           | User's Choice                                                  |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Who should see tracking in the first Shiplemon slice?                                     | Internal/operator only; Shopper-visible status; Shiplemon handles shopper notifications     | Internal/operator only                                         |
| How should tracking state be updated?                                                     | Manual refresh button; Scheduled polling; No refresh in first slice                         | Manual refresh button                                          |
| What should the system store from Shiplemon tracking?                                     | Tracking reference and URL only; Current status plus timestamp; Full tracking event history | Tracking reference/URL, latest status, and last refreshed time |
| Should shipment labels and tracking URLs ever be exposed through public APIs in Phase 14? | No; Tracking URL yes, label no; Both behind order lookup                                    | No                                                             |
| How should Shiplemon webhooks be treated if docs/account support expose them later?       | Defer entirely; Document as future upgrade; Add inactive webhook endpoint now               | Document as future upgrade                                     |

**Notes:** Tracking stays internal, manually refreshed, and intentionally minimal. Webhooks are future work until the
contract is verified.

---

## The Agent's Discretion

No area was delegated wholesale to the agent. The recommended options were used only as prompts; the user explicitly
selected the final decisions.

## Deferred Ideas

- BOX NOW automation.
- Non-EU customs modeling and public non-EU checkout.
- Public shipment tracking pages.
- Scheduled tracking polling.
- Shiplemon webhook integration after account-specific confirmation.
- Returns management and COD.
