# Proposal

## Why

Alphabetical artist ordering puts inactive Chronoboros ahead of active Sidus and uses the same first three profiles on Home. Staff need to manage activity without a temporary band-name exception in code.

## What Changes

- Add an optional native Artist activity field; missing or null legacy values mean active.
- Add an Active artist switch below Artist name, using the existing staff switch treatment and private draft/publication flow.
- Order Home and Artists by active first, then name within each group. Keep three Home cards and retain inactive profiles and releases.
- Prepare the additive CMS field through existing schema setup. Set Chronoboros inactive in the retained Local fixture; set hosted editorial state through normal publication after release.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `artist-roster-presentation`: published activity determines roster ordering and Home selection.
- `emdash-editorial-operations`: staff can edit activity privately and publish it with the Artist.

## Impact

Shared content schemas and published projection, native CMS schema preparation, staff Artist fields, public roster queries, focused tests and operational documentation. The Artist content contract gains `is_active`; no new endpoint, dependency or module boundary is needed.
