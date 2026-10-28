# Proposal

## Why

Merchant Center has no product source for the shop. Google needs current public product, price and availability information without a separate manually maintained catalog.

## What Changes

- Synchronize eligible published Store Items to a Greece-only Merchant API data source using backend-owned commerce and publication information.
- Keep Google product state current and recover from provider errors without affecting checkout or exposing drafts, credentials or test-environment data.
- Include only verified in-stock offers; exclude pre-orders and backorders. Remove verified unavailable offers and reinsert the same identity when eligible again.
- Scan up to five offers every fifteen minutes using the existing schedule. Send changed inputs and weekly refreshes, with no event hooks, change detector or automatic status polling.
- Reuse existing staff catalog and stock workflows; no new interface is required for the initial integration.

## Capabilities

### New Capabilities

- `merchant-product-synchronization`: Synchronize eligible public store offers to Google Merchant Center with bounded, recoverable operation.

### Modified Capabilities

None.

## Impact

Backend commerce and publication integration, Google Merchant Center and API credentials, scheduled operations, tests and operational documentation. Existing Google account and source configuration, UAT acceptance and production activation require separate verification. Cloudflare remains on Free.
