# Phase 14 Research: Shiplemon Non-Greece Shipping Integration

## Summary

Shiplemon has enough public API surface to plan a non-Greece shipping integration: authentication, sandbox/live base
URLs, rates, shipment creation, labels, incoming orders, cancellation, and tracking polling. The public Shiplemon site
also positions the service for international shipping from Greece with multiple couriers.

The safest BlackBox integration shape is a Worker-owned quote and fulfillment boundary. The browser requests sanitized
quotes, selects an opaque quote ID, pays through Stripe Hosted Checkout, and the Worker creates the Shiplemon shipment
only after a verified paid webhook.

## Shiplemon Findings

- Shiplemon exposes a REST API for rates, shipment creation, labels, tracking, COD, returns, and international shipping
  with customs documents: <https://www.shiplemon.com/en/faq/api-integration/>.
- API authentication uses an `x-api-key` header, and keys must not be shared in public code: <https://docs.shiplemon.com/untitled>.
- New integrations should start against `https://api-sandbox.shiplemon.com`, validate shipments in the sandbox dashboard,
  then switch to `https://api.shiplemon.com`: <https://docs.shiplemon.com/testing-important>.
- `POST /v1/rates` returns available rates for a route and requires item dimensions in centimeters and weight in grams:
  <https://docs.shiplemon.com/endpoints/rates/get-rates>.
- `POST /v1/shipments` creates a shipment from sender address, recipient address, items, and the selected `rate_id`:
  <https://docs.shiplemon.com/endpoints/shipments/create-shipment>.
- Shipment responses can include tracking data, label URLs, child voucher label URLs, provider/service details, and
  totals.
- `POST /v1/incoming-orders/generic` can create an incoming order with store, billing, shipping, item, payment, total, and
  shipping total data: <https://docs.shiplemon.com/endpoints/incoming-orders/create-incoming-order>.
- Tracking can be retrieved from `GET /public/v1/shipments/:id/tracking`; public docs recommend polling every hour at
  `:05` and `:35`: <https://docs.shiplemon.com/endpoints/shipments/tracking>.
- `DELETE /v1/shipments/:id` cancels a shipment: <https://docs.shiplemon.com/endpoints/shipments/cancel-shipment>.
- Label print formats vary by courier and are passed through `label_print_format` on shipment creation:
  <https://docs.shiplemon.com/endpoints/shipments/label-print-format>.
- Shiplemon publishes validation/config data lists for country, postal-code, city, state, disabled pickup dates, and
  customs/no-customs rules: <https://docs.shiplemon.com/validation-and-data>.
- Public international-shipping copy says Shiplemon compares 20+ couriers, ships to 200+ countries, supports courier
  pickup from the sender address, and notes that non-EU shipments may involve duties and VAT charged to the recipient:
  <https://www.shiplemon.com/en/eksoteriko/>.

## Repo Findings

- Current Stripe Checkout creation still restricts shipping address collection to `GR` in
  `apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.ts`.
- `StartCheckout` currently accepts StoreCart/CartDraft line data and validates StoreItemOption, ItemAvailability,
  OnlineStock, and Stripe Price Mapping before creating the Checkout Session.
- Current `CheckoutOrder` persistence contains BOX NOW locker snapshot columns but no general shipping quote, package
  profile, fulfillment shipment, label, or tracking model.
- The backend has a good seam pattern for external gateways through application-layer SPI and infrastructure adapters.
- The current content/backend model has formats and store item identity, but no committed weight/dimension source.
- Native commerce is now multi-item, so a Shiplemon quote must be calculated against every CartLine and CartQuantity.

## Recommended Implementation Shape

1. Add canonical shipping terminology and D1 persistence for:
   - `ShippingPackageProfile` keyed by `variantId`
   - `ShippingQuote` keyed by opaque `shippingQuoteId`
   - `ShiplemonShipment` linked to `CheckoutOrder`
2. Add a Shiplemon gateway SPI plus infrastructure adapter that supports:
   - get rates
   - create shipment
   - read tracking
   - cancel shipment for internal/operator use
3. Add public quote creation/listing under Worker-owned APIs that return sanitized quote data only.
4. Extend `StartCheckout` with `shippingQuoteId` for non-Greece checkout.
5. Extend Stripe Checkout creation with:
   - quoted destination country as the only allowed shipping country
   - phone collection still enabled
   - selected shipping quote amount passed as a shipping option or equivalent Worker-owned charge
6. On verified paid webhook, read Stripe final shipping details, validate them against the quote route, then create the
   Shiplemon shipment.
7. Add internal/operator readback for Shiplemon shipment state, tracking refs, label URL, invoice URL, and failure reason.

## Risks And Open External Gates

- Shiplemon account/API key access is required for live sandbox API evidence.
- Account-specific carrier availability and rate output can differ from public examples.
- Public docs mention webhooks in FAQ, but the browsed API pages only confirmed tracking polling/update endpoints.
- Customs requirements for non-EU shipments may require invoice line data that BlackBox does not currently model.
- Package-profile data is absent today; non-Greece checkout should stay unavailable until explicit profiles exist.

## Research Conclusion

Plan the first implementation as a fail-closed Worker shipping subsystem:

- no package profile means no non-Greece quote
- no Shiplemon credentials means no non-Greece quote
- no quote means no non-Greece checkout
- no verified paid webhook means no Shiplemon shipment
- mismatched final shipping address means fulfillment review
- failed Shiplemon shipment creation means fulfillment review

This preserves the existing Stripe/webhook/order authority while adding Shiplemon only where it belongs: rates, labels,
tracking, and shipment fulfillment for non-Greece orders.
