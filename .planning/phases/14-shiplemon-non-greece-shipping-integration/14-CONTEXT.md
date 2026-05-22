# Phase 14: Shiplemon Non-Greece Shipping Integration - Context

**Gathered:** 2026-05-21  
**Status:** Post-MVP / ready for replanning when explicitly reactivated  
**Source:** Interactive `$gsd-discuss-phase 14`, current shipping roadmap, and Shiplemon public API research

<domain>

## Phase Boundary

Phase 14 is a post-MVP phase that plans a Worker-owned Shiplemon shipping path for EU destinations outside Greece.
Greece remains on the existing Phase 9 manual BOX NOW path. Phase 14 does not reopen BOX NOW automation, does not block
checkout launch readiness, does not approve production go-live, and does not model non-EU customs.

The implementation shape is: shopper gets safe Shiplemon quote options before payment, Stripe Hosted Checkout collects
payment and final delivery details, the paid order enters operator ready-to-ship review, and the Worker creates the
Shiplemon shipment only after operator confirmation.

</domain>

<decisions>

## Implementation Decisions

### Destination Rollout

- **D-01:** Phase 14 public checkout is EU-only outside Greece.
- **D-01a:** Phase 14 is post-MVP. It must not block the active checkout launch readiness scope unless the user
  explicitly reactivates it.
- **D-02:** Production should allow all EU countries except `GR`; do not start with a smaller country allowlist.
- **D-03:** `GR` orders continue through the existing Phase 9 manual BOX NOW path.
- **D-04:** If Shiplemon returns no usable rate, or validation data says the address/postal code is unsupported, checkout
  fails closed before creating a Stripe Checkout Session.
- **D-05:** Non-EU destinations are explicitly disabled in Phase 14.

### Quote Choice

- **D-06:** When Shiplemon returns multiple valid EU rates, the shopper sees multiple safe quote options.
- **D-07:** Quote options are ordered with the recommended option first, then the remaining safe options by price.
- **D-08:** The recommended quote is the cheapest tracked service with a reasonable delivery estimate when Shiplemon
  provides enough data.
- **D-09:** The shopper may choose only from safe quote options. Rates missing required tracking, label, service, or
  acceptable delivery-estimate data are filtered out before display.
- **D-10:** Public quote display includes carrier/service display name, price, and delivery estimate when available.
  Public APIs still expose only app-owned display fields plus opaque quote IDs, never raw provider IDs.

### Package Profiles

- **D-11:** Package dimensions and weights use format defaults plus variant-level overrides.
- **D-12:** Invalid states must be unrepresentable: a variant is eligible for non-Greece checkout only when it resolves to
  a valid package profile before quoting.
- **D-13:** No generic fallback package is allowed. No package profile means no non-Greece quote.
- **D-14:** Format defaults come from committed seed/config data and are migrated into D1 runtime records.
- **D-15:** For the first slice, multi-item carts sum item weights and use one conservative package dimension.
- **D-16:** Initial profiles are code-owned, but future operator tooling may edit package profiles.
- **D-17:** Package profiles are operational shipping data, not Astro editorial content and not shopper-authored state.

### Customs And Non-EU

- **D-18:** Do not model customs fields in Phase 14.
- **D-19:** The UI should hide non-EU countries where it controls the country list.
- **D-20:** The Worker still rejects non-EU requests if they reach backend APIs.
- **D-21:** Do not advertise non-EU shipping as "coming later" in shopper-facing checkout copy.
- **D-22:** Keep Shiplemon customs/non-EU support only in research and deferred notes for future phases.

### Operator Workflow

- **D-23:** After Stripe confirms payment for an EU non-Greece order, the order enters ready-to-ship operator review
  before Shiplemon shipment creation.
- **D-24:** The operator review shows a full fulfillment summary: address, selected quote, package profile, items,
  stock/order state, and warnings.
- **D-25:** After operator confirmation, the Worker calls Shiplemon to create the shipment and stores internal label and
  tracking state.
- **D-26:** Shiplemon shipment creation failure records fulfillment review with retry. It must not mutate paid-order or
  stock semantics.
- **D-27:** Shipment creation is idempotent: the normal path allows one Shiplemon shipment per `CheckoutOrder`, and repeat
  confirmation/retry must not create duplicates.

### Tracking

- **D-28:** Tracking is internal/operator-only in the first slice.
- **D-29:** Operators can manually refresh tracking; the Worker polls Shiplemon and updates stored tracking state.
- **D-30:** Store tracking reference/URL, latest status, and last refreshed time. Do not store full tracking event history
  in the first slice.
- **D-31:** Shipment labels and tracking URLs are never exposed through public APIs in Phase 14.
- **D-32:** If Shiplemon webhooks are confirmed later, document them as a future upgrade. Do not add an inactive webhook
  endpoint now.

### Secrets And Environments

- **D-33:** Shiplemon credentials belong only in Worker runtime secrets or ignored local development files.
- **D-34:** Planned Worker bindings are `SHIPLEMON_API_KEY` and optional `SHIPLEMON_API_BASE_URL`.
- **D-35:** Local and sandbox work should use `https://api-sandbox.shiplemon.com`; production uses
  `https://api.shiplemon.com`.
- **D-36:** No Shiplemon account-specific IDs, credentials, labels, invoices, or raw API payload dumps should be
  committed.

</decisions>

<canonical_refs>

## Canonical References

Downstream planners and implementers must read these before changing runtime behavior:

### Planning Source Of Truth

- `.planning/UBIQUITOUS_LANGUAGE.md` - canonical shipping terms.
- `.planning/REQUIREMENTS.md` - `V2SH-02` and shipping/fulfillment boundaries.
- `.planning/ROADMAP.md` - Phase 14 scope and review gate.
- `.planning/STATE.md` - current planning position and session resume pointer.
- `.planning/phases/14-shiplemon-non-greece-shipping-integration/14-RESEARCH.md` - Shiplemon API findings and external gates.
- `.planning/phases/14-shiplemon-non-greece-shipping-integration/14-01-PLAN.md` - current plan; must be replanned or revised against this updated context before execution.

### Prior Decisions

- `.planning/phases/09-greece-only-box-now-shipping/09-CONTEXT.md` - BOX NOW remains Greece-only manual v1 and reopen-only for automation.
- `.planning/phases/12-modulith-boundary-hardening-planning/12-CONTEXT.md` - module boundary rules, entrypoint policy, and no temporary compatibility facades.
- `.planning/phases/13-stripe-dynamic-payment-methods-policy/13-CONTEXT.md` - Stripe Checkout payment-method policy and Worker-only Stripe runtime config.

### Codebase Maps

- `.planning/codebase/INTEGRATIONS.md` - current external integration inventory.
- `.planning/codebase/MODULES.md` - module ownership, allowed dependencies, and entrypoint policy.
- `.planning/codebase/TESTING.md` - colocated Vitest and verification patterns.
- `.planning/codebase/ARCHITECTURE.md` - static Astro frontend, Worker backend, store, and checkout architecture.

### Runtime Integration Points

- `apps/backend/src/application/commerce/checkout/start-checkout.ts` - current Worker checkout authority.
- `apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.ts` - current Stripe Hosted Checkout creation.
- `apps/backend/src/interfaces/http/routes/register-public-commerce-routes.ts` - public shopper commerce API surface.
- `apps/backend/src/interfaces/http/routes/register-internal-commerce-routes.ts` - internal/operator route surface.
- `apps/backend/prisma/schema.prisma` - current D1 persistence model.
- `apps/backend/src/env.ts` - Worker runtime binding surface.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Worker checkout use cases already provide the authority boundary for validating cart lines, stock, Stripe price mappings,
  and checkout-start input.
- The Stripe gateway already centralizes Hosted Checkout Session creation and is the right place to map selected shipping
  quote amounts into Stripe Checkout.
- Prisma/D1 repository seams already own operational commerce state and should own shipping package profiles, quotes, and
  Shiplemon shipment state.

### Established Patterns

- Public shopper routes must expose browser-safe DTOs only.
- Provider credentials, provider IDs, label URLs, invoice URLs, and raw provider payloads stay server-side.
- Module-boundary work prefers root entrypoints or named interfaces; do not introduce temporary facades for shipping.
- Tests should be colocated with the modules they exercise and should assert exact behavior instead of snapshots.

### Integration Points

- Public quote creation/listing belongs under the Worker public commerce API.
- Operator ready-to-ship review, shipment creation, retry, label access, and tracking refresh belong under protected
  internal/operator routes.
- `StartCheckout` may accept `shippingQuoteId` only after quote validation exists and the quote has been selected from
  safe app-owned quote options.

</code_context>

<specifics>

## Specific Ideas

- Use `ShippingQuote` for the opaque pre-payment Shiplemon rate snapshot.
- Use `ShippingPackageProfile` for package dimensions and weight resolved from format defaults plus variant overrides.
- Use `ShiplemonShipment` for post-operator-confirmation shipment state, tracking ref/URL, label URL, latest status,
  failure reason, and retry state.
- Public quote responses should show carrier/service, price, and estimate only for safe quote options.
- Operator tooling should show the full fulfillment summary before the Shiplemon provider call.
- Manual tracking refresh should poll Shiplemon and store only latest status plus refresh time.

</specifics>

<deferred>

## Deferred Ideas

- Automated BOX NOW fulfillment stays behind the BOX NOW Reopen Gate and must use `boxnow-js`.
- Non-EU customs modeling and public non-EU shipping are out of scope for Phase 14.
- Public shipment tracking pages can be planned later after internal Shiplemon shipment state is reliable.
- Scheduled tracking polling can be planned later if manual refresh is not enough.
- Shiplemon webhooks can replace or supplement manual refresh only after account-specific docs or support confirm the
  webhook contract.
- Returns management and COD are out of scope for the first Shiplemon integration even though Shiplemon advertises those
  capabilities.

</deferred>

---

_Phase: 14-shiplemon-non-greece-shipping-integration_  
_Context gathered: 2026-05-21_
