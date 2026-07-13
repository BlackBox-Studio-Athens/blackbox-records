## 1. Exact Distro presentation

- [ ] 1.1 Correct `Magic Sleazeball Corrida` to `Vinyl 7-inch` and keep its display format aligned with the accepted source.
- [ ] 1.2 Derive the combined `7-inch & 10-inch Vinyl` heading from exact groups, preserve visible physical types, and apply the approved group/item order without renumbering content.

## 2. Catalog boundary

- [ ] 2.1 Extend the existing Distro Inventory Source reconciliation to reject non-bijective matches and exact physical-type drift before catalog, availability, or stock artifacts are written.

## 3. Verification

- [ ] 3.1 Add focused tests for combined grouping, empty groups, stable ordering, the three small-vinyl records, and fail-fast source mismatch.
- [ ] 3.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`; use Browser Use to confirm the Distro page contains all accepted records, approved headings, and visible exact types.
