# Optional shipping email when recording dispatch

## Why

Staff can record a shipment after the parcel has already arrived. The current Mark shipped action always queues an email that can mislead the customer about when the parcel left.

## What Changes

- Add a default-checked Send shipping email checkbox to the existing dispatch controls.
- Persist an explicit opt-out with the dispatch record, without creating a shipping-email delivery. Preserve it after undo/re-mark.
- Show Shipping email skipped separately from pending, delivered and needs-review notifications.
- Preserve existing email deliveries, dispatch concurrency checks, operator/time attribution and retry guarantees.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `paid-order-delivery`: durable opt-out from the shipping email without changing other delivery kinds or states.
- `staff-order-workspace`: optional shipping email and visible saved skip decision when recording dispatch.

## Impact

Staff orders UI/API client, protected order route/service, commerce domain and D1 persistence, additive commerce migration, generated internal OpenAPI/client, tests and commerce runbook. No new dependencies, carrier integration, backdating or automatic change to any live order. Codex owns UI and backend under the user's explicit task override. Hosted release remains subject to normal UAT/PRD gates.
