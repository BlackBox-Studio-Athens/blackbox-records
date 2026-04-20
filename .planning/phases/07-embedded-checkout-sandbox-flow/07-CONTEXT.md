# Phase 7: Worker Checkout And Stripe Sandbox Flow - Context

**Gathered:** 2026-04-20
**Status:** Planning complete

<domain>
## Phase Boundary

Phase 7 implements Worker-owned checkout APIs and connects the static frontend checkout route to Stripe sandbox. It does not move payment authority into the browser.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Checkout HTTP endpoints remain TypeScript-only and use Hono only at the HTTP interface layer.
- **D-02:** Checkout handlers delegate to business-named application/use-case modules rather than embedding Stripe flow logic directly in route files.
- **D-03:** Checkout endpoint changes require backend-local tests plus HTTP smoke coverage.

</decisions>

<decisions>
## Implementation Decisions

- **D-01:** The Worker backend creates Checkout Sessions.
- **D-02:** The frontend checkout route consumes Worker APIs, not direct Stripe secret APIs.
- **D-03:** Embedded Checkout remains the approved shopper-facing form factor.
- **D-04:** Return and retry pages remain non-authoritative for payment truth.
- **D-05:** Webhook authority remains deferred to Phase 8, but Phase 7 must already be shaped for that backend contract.

</decisions>

<specifics>
## Specific Ideas

- Separate item lookup, variant lookup, and checkout-session creation concerns in the backend API.
- Keep the frontend coupled to catalog slugs and `VariantSnapshot`, not to Stripe IDs.
- Treat sandbox validation as an API-plus-frontend integration problem, not a frontend-only task.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/05.1-commerce-domain-architecture-and-source-of-truth-research/05.1-RESEARCH.md`
- `.planning/phases/06-native-storefront-slice/06-CONTEXT.md`
- `.planning/phases/06.1-local-commerce-state-foundation/06.1-CONTEXT.md`

</canonical_refs>

---

*Phase: 07-embedded-checkout-sandbox-flow*
*Context gathered: 2026-04-20*

