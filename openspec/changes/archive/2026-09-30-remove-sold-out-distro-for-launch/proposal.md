## Why

The PRD distro catalog includes four unavailable editions marked red in the September 30 master-sheet export. Remove those editions before launch; subsequent sold-out items remain visible.

## What Changes

- Add a one-time, exact-four operator cleanup with a read-only plan, revision-bound apply, scoped backup and resumable progress.
- Remove the four records from PRD's accepted snapshot and permanently purge their CMS content after public confirmation.
- Preserve Three Way Plane's CD, all other accepted content, private drafts, stock, prices and ordinary staff deletion rules.

## Capabilities

### New Capabilities

None. This is a bounded operator data cleanup, with `skip_specs: true`.

### Modified Capabilities

None. Existing publication and sold-out behavior remain unchanged.

## Impact

Backend operator tooling and its regression checks; PRD CMS D1 and accepted R2 content. No public API, dependency, deployed software or Stripe changes.
