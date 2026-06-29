## Why

UAT evidence exists, but PRD native-commerce launch still depends on live Stripe access, final domain wiring, production webhook configuration, production Worker/D1 configuration, emergency-disable behavior, named human approval, and a release-data promotion decision that reuses repo/Decap content without copying UAT runtime provider data.

## What Changes

Define the final PRD-open gates as an OpenSpec change instead of leaving them in historical launch-readiness/backlog docs. Make the launch data path explicit: Decap-authored repo content may become PRD release content through generated artifacts, but UAT D1, Stripe test-mode objects, synthetic stock, and UAT evidence are not promoted into PRD.

## Capabilities

### New Capabilities

- `launch-readiness`: Production go-live gates and evidence boundaries for native commerce.

### Modified Capabilities

- `static-site-and-deployment`: Production topology, rollback, and deployment approval gates.
- `commerce-checkout`: Live Stripe and Payment Method Configuration evidence before production checkout.
- `orders-stock-operator`: Production webhook, D1, and stock/order reconciliation evidence before launch.
- `shipping-fulfillment`: Shipping gates remain separate from Stripe and cutover approval.

## Impact

- Docs/specs only.
- No product behavior change.
- External follow-ups remain in Cloudflare, Stripe, DNS/domain, and human approval surfaces.
