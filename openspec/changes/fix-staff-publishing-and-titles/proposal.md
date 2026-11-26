# Proposal

## Why

Four reported defects, three in Staff and one on the public Store:

- A: an item's **Website and shop checkout** step can spin without end. A retry sent while the failed attempt still held its 60-second claim got `pending` back, and the page then polled an operation that no server work was advancing.
- B: in PRD, publishing an edited Distro item (Bruce. "Resurrection") failed with **Publication interrupted**. Staff drafts clear the legacy Distro `group` with `null`, but `ec_distro.group` is `NOT NULL DEFAULT ''`, so native publish failed with a constraint error that the item route turned into a 503.
- C: hosted Workers receive Bandcamp's Client Challenge for every album or track page, so a wrong address (a 404) was reported as "Bandcamp is blocking automatic lookup".
- D: on Store listing cards, Greek titles appeared in lowercase. Latin titles look capitalised because Veneer draws only capitals, while the listing sets `text-transform: none`; the Greek exception uses Inter, which keeps lowercase.

## What Changes

- A: a failed item publication attempt frees its claim at once. Staff treats an item operation that has not requested a website publication as not progressing and shows the failed step with Retry, instead of polling.
- B: before native publish of a Distro entry, the draft's `group: null` is stored as the column's empty value. This covers item publication and runtime (batch) publication, including drafts saved before the fix.
- C: the Bandcamp lookup returns a closed outcome: `resolved`, `not_found` (with an optional suggested address on one related subdomain) or `provider_blocked`. It first asks Bandcamp's public search, which is not challenged from Cloudflare, and accepts only an exact address match. The page read stays as the fallback. Staff shows **Use <address>** for a suggestion.
- D: Greek public titles are uppercased in the shared Greek title class. With `lang="el"`, browsers drop the tonos.

## Capabilities

### Modified Capabilities

- `staff-item-management`: item publication ends in a terminal state; a Distro draft that clears its group publishes.
- `catalog-listening`: the Bandcamp lookup reports a closed outcome.
- `store-catalog-categories`: Greek titles display in capitals.

## Impact

Backend CMS publication and Bandcamp resolution, the commerce item publication command, Staff item-publication and Bandcamp field clients, and one public CSS rule. No schema, migration, binding, price, stock or order change.
