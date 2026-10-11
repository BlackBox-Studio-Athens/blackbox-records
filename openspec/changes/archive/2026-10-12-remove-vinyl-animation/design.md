## Context

The release record effect belongs to `ReleaseCard.astro` and `global.css`; the label image is generated only for that effect. Store vinyl print rotation belongs to `StoreBuyIcon.tsx` through its animated image layer.

## Decisions

- Remove the complete release-record rendering path and its WebP, including light layers, lazy background rules and motion guards.
- Retain the shared edition href and all bracket, purchase and listening feedback independently of the deleted record.
- Move the vinyl icon's existing print path into its stationary base SVG and remove its spin layer and asset. Other formats retain their existing layers.
- Use the existing release browser check to verify absent records and unchanged shared feedback; retain unit coverage for edition wording and Store icon assets.
- Commit only this request's paths. Existing uncommitted release repairs belong to their current owner.

## Verification

Run focused editorial and Store layout tests, the affected release browser cases and a focused Store icon observation at desktop and phone sizes. Refresh Graphify, validate this change strictly, then run `pnpm validate` and record its source-bound summary before committing locally.
