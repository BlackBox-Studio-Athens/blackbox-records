# Proposal

## Why

Store cards currently put Veneer on the item title and leave its artist credit unconnected. The approved Band in Veneer canvas makes the relationship explicit with “by” and moves the display texture to the credit while keeping the existing sizes.

## What Changes

- Use Inter semibold, with source casing, for Store listing titles and Veneer for the existing artist or label credit.
- Prefix the credit with a plain Inter “by ” and use the same phrase in the card and item-link accessible names.
- Preserve card sizes, links, purchase facts, listening actions, filters and Coverflow visibility.
- Document the listing-card exception to the public title typography rule.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-catalog-categories`: Define the approved title and credit presentation across Store listing categories.

## Impact

The shared Store item card, its listing CSS, the public design guidance and focused browser coverage change. Item pages, cart, checkout, order confirmation, content schemas, Worker APIs and commerce data remain unchanged. Work stays in the explicitly authorized store-typography worktree for review; merging and deployment are outside this change.
