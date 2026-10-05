# Proposal

## Why

The user likes the current Store listing title and credit sizes, but wants the item title in Veneer and a quieter font for the complete “by ARTIST” credit. The current roles are reversed.

## What Changes

- Restore the existing Veneer brand font on listing titles at their current responsive 20–24px size.
- Use the existing Inter body font for the entire 14px credit, including linked and unlinked artist or label names.
- Update the design guidance and existing typography browser check.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-catalog-categories`: change listing title and credit font roles while preserving sizing, source copy and interactions.

## Impact

The shared StoreItemCard CSS, DESIGN.md and the scoped Store typography browser test. No new font assets, dependencies, content fields, commerce behavior or public APIs.
