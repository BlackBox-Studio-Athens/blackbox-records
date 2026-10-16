# Proposal

## Why

The apex served the launched site before the automatic Web Analytics beacon was restored on 16 October 2026. Staff Stats omits that launch traffic, and the available edge aggregates must be captured before retention expires.

## What Changes

- Preserve read-only aggregate evidence and derive a bounded launch-gap estimate with explicit exclusions.
- Merge a committed backend aggregate into overlapping Stats ranges without changing existing analytics or the response contract.
- Advance the analytics cache version and verify ranges, boundaries and source reconciliation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-analytics`: include the documented edge-derived estimate for the 16 October launch gap.

## Impact

Only the existing public-commerce-http analytics route, its aggregate JSON and tests, and analytics documentation change. No staff UI, dependency, D1 migration, analytics setting or provider data write is needed. Production promotion remains conditional on the authoritative task brief.
