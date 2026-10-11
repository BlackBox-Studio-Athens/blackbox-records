## Why

Catalog publication repeatedly fails because ordinary releases audit unrelated Stripe objects, generate bot commits, and chain deployments. Recovery has also removed UAT listing state. Preserve price correctness with one explicit selling-price selection and one release gate.

## What Changes

- Bind each variant to a Stripe Product; its default Price selects the selling price.
- Synchronize only release items, preserving stock, pauses, orders, and existing prices.
- Generate one canonical catalog build input from the source commit without bot commits.
- Consolidate checks, preparation, deployment, and smoke tests in one serialized release workflow.
- Export and recover affected UAT catalog state without deleting foreign objects.
- Retain explicit live catalog authorization and separate PRD checkout launch controls.

## Capabilities

### New Capabilities

### Modified Capabilities

- `stripe-catalog-sync`: Product bindings and default-price resolution replace active-price discovery.
- `static-site-and-deployment`: All normal deployments share the release gate.
- `catalog-promotion-automation`: One gated release replaces artifact commits and chained promotion.

## Impact

Worker catalog gateway, reconciler, mapping persistence, signed catalog webhooks, generated build inputs, release scripts and workflows, tests, and operational documentation. Public shopper contracts and stock/order authority remain unchanged. Migration is additive and retryable; deployment is not atomic across providers.
