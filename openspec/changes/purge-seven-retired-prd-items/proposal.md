# Purge seven retired PRD items

## Why

Launch cleanup `b3d85861` purged four CMS entries but retained commerce data. Withdrawal `67361817` retained the three other CMS drafts as well. The user now authorizes permanent removal from PRD catalog, staff, stock and exclusive images, without Stripe changes.

## What Changes

- Purge exactly `three-way-plane-your-kingdom-my-life-vinyl`, `endless-searcher`, `broken-fingers-ego-cassette`, `sun-of-nothing-the-guilt-of-feeling-alive-cd`, `in-your-absence`, `bloed-tranen`, and `transatlantic-transiberian`.
- Use temporary administrator tooling, a scoped backup and resumable checkpoints.
- Remove selected CMS revisions/metadata, commerce/stock data, exclusive media and derived R2 objects. Preserve shared images, all other content, the Three Way Plane CD, backups and publication history.

## Capabilities

### New Capabilities

None; this is an authorized one-time operator cleanup with `skip_specs: true`.

### Modified Capabilities

None. Normal staff policy and public APIs remain unchanged.

## Impact

PRD CMS/commerce D1 and CMS R2 only. No new dependency, deployed code, provider mutation or UAT/Local persistent-data change.
