# Phase 4: BOX NOW Locker Shipping Slice - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Plan the Greek locker-selection and low-volume fulfillment path for the native store, keeping the flow operationally thin and aligned to the already-locked checkout and webhook model.

</domain>

<decisions>
## Implementation Decisions

### Shipping geography and gating
- **D-01:** MVP native commerce shipping is Greece only.
- **D-02:** BOX NOW should be used only for shoppers buying from Greece.
- **D-03:** Do not plan a second non-Greek shipping path in this phase; non-Greece shipping is explicitly deferred.
- **D-04:** The exact point where the flow checks or confirms `country = GR` is at the agent's discretion, but the gating must happen before payment proceeds.

### Locker selection timing and failure behavior
- **D-05:** Locker selection happens before payment, in the site-owned flow, not after a successful payment.
- **D-06:** The shopper must have a valid Greek BOX NOW locker selected before entering the authoritative payment path.
- **D-07:** The flow fails closed for BOX NOW shipments: if locker selection or locker lookup cannot complete, payment must not proceed.

### Stored locker data
- **D-08:** v1 should store the least amount of locker data needed for correct manual operations.
- **D-09:** The locked minimal storage posture is: `locker_id`, `country_code`, and one human-readable `locker_name_or_label` snapshot.
- **D-10:** Do not plan a fuller address snapshot unless Phase 4 research finds a concrete operational reason the thinnest set is unsafe.

### Fulfillment depth
- **D-11:** v1 fulfillment remains manual partner-portal fulfillment only.
- **D-12:** Do not plan thin server-assisted label creation or fuller BOX NOW automation in this phase.

### the agent's Discretion
- Exact route and state where Greek-country gating appears in the shopper flow
- Exact shape/name of the stored locker label field
- Whether the locker picker is embedded directly or opened through the official BOX NOW widget flow
- Exact shopper copy for blocked non-Greek and locker-selection-failure states

</decisions>

<specifics>
## Specific Ideas

- The user wants BOX NOW to apply only to Greece.
- The user wants the least amount of persisted BOX NOW data that still keeps operations correct.
- The user explicitly prefers the recommended low-maintenance path: pre-payment locker selection, manual fulfillment, and fail-closed behavior if locker selection fails.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and milestone constraints
- `.planning/ROADMAP.md` — Phase 4 scope, success criteria, and the requirement that this remains a low-maintenance shipping slice
- `.planning/STATE.md` — current milestone position and open planning concerns
- `.planning/REQUIREMENTS.md` — shipping requirements `SHIP-01`, `SHIP-02`, and `SHIP-03`
- `.planning/BACKLOG.md` — fulfillment-depth backlog items and future milestone seeds

### Prior-phase locked decisions
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-CONTEXT.md` — native `/shop/` route posture and dedicated checkout flow
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-UI-SPEC.md` — checkout-route presentation and shopper-facing status/copy expectations
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-02-PLAN.md` — Checkout Session contract and the requirement that browser pages remain non-authoritative
- `.planning/phases/03-webhook-authoritative-orders-and-inventory/03-CONTEXT.md` — minimal order-state model and manual exception posture
- `.planning/phases/03-webhook-authoritative-orders-and-inventory/03-03-PLAN.md` — inventory/reconciliation direction that Phase 4 must not complicate with heavyweight fulfillment assumptions

### External shipping references
- [BOX NOW partner API](https://boxnow.gr/en/hidden/Partner-API-EN) — current official partner API/manual entry point
- [BOX NOW widget and partner docs](https://l.boxnow.bg/diy/eshops/api) — current official documentation showing locker map/widget integration flow
- [BOX NOW partner API page](https://www.boxnow.bg/en/partner-api) — current official documentation hub for API, widget, and webhook docs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-UI-SPEC.md`: already defines the dedicated checkout route and calm shopper messaging that the locker-selection UX must fit into.
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-02-PLAN.md`: already assumes the checkout path is site-owned before Stripe takes payment authority, which is the natural insertion point for locker selection.

### Established Patterns
- The repo currently has no live shipping integration layer, so Phase 4 is defining the v1 shipping contract from scratch.
- Prior planning already commits to manual exception handling and very low monthly order volume, which strongly biases Phase 4 toward manual partner-portal fulfillment.
- Native commerce remains planning-only in this milestone, so Phase 4 should define contracts and stop points, not implementation details or rollout mechanics.

### Integration Points
- Locker selection must attach its result to the pre-payment order/checkout context before the authoritative Stripe payment flow proceeds.
- The minimal locker data stored here must be compatible with the paid-order and reconciliation model locked in Phase 3.
- Any shopper-facing locker-selection screen or failure state should be designed through the Phase 4 UI workflow before planning is finalized.

</code_context>

<deferred>
## Deferred Ideas

- Non-Greece shipping paths
- Thin server-assisted BOX NOW API fulfillment
- Fuller locker address snapshots beyond the thinnest operational set
- Multi-carrier or shipping-provider abstraction

</deferred>

---

*Phase: 04-box-now-locker-shipping-slice*
*Context gathered: 2026-04-19*
