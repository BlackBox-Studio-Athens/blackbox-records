# Phase 14 Validation Strategy

## Planning Validation

- Phase 14 has discussion, context, research, and implementation plan artifacts.
- The roadmap links Phase 14 to `V2SH-02`.
- Ubiquitous language contains Shiplemon-specific shipping terms.
- BOX NOW remains closed for current manual Greece-only v1 scope.
- Runtime code, Shiplemon account state, Stripe account state, and Cloudflare secrets are unchanged by this planning
  slice.

## Implementation Validation

When Phase 14 is implemented, acceptance requires:

- Shiplemon credentials are Worker-only.
- Public APIs return sanitized quote data only.
- `StartCheckout` accepts an opaque `shippingQuoteId` for non-Greece checkout.
- Greece checkout still uses the existing Phase 9 path.
- Missing package profiles fail before checkout.
- Missing Shiplemon credentials fail before checkout.
- Shiplemon shipment creation happens only after verified paid webhook.
- Address mismatch after payment records fulfillment review instead of creating a shipment.
- Shiplemon shipment failure records fulfillment review without changing paid order or stock semantics.
- `pnpm generate:api`, `pnpm test:unit`, `pnpm check`, and `pnpm build` pass.

## External Evidence Gates

- Shiplemon sandbox API key is available.
- Sandbox `/v1/rates` evidence exists for at least one EU destination and one non-EU destination.
- Sandbox `/v1/shipments` evidence exists for a paid test order or fixture-approved dry path.
- Sandbox dashboard shows created shipments before any live enablement.
- Production/live Shiplemon API use waits for go-live approval and real account credentials.

## Browser Acceptance

Rendered checkout validation should confirm:

- Greece checkout still reaches Hosted Checkout with Greece-only address collection.
- Non-Greece checkout asks for enough destination information to quote shipping.
- Unsupported destinations and unavailable quotes fail before payment.
- Public UI never displays Shiplemon API keys, raw rate IDs, shipment IDs, label URLs, or invoice URLs.

## Plan Checker Result

Manual plan check: no HIGH concerns found. Main residual external gates are Shiplemon account/API access and real
package-profile data.
