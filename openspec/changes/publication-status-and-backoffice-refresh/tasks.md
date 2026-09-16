## 1. Publication status truth

- [x] 1.1 Add the pure publication-status summarizer and explicit `requesting`/status-read-error types, with unit coverage for old failures followed by pending, live, failed, unavailable, and empty states.
- [x] 1.2 Thread explicit request-in-flight and status-read error state through `ContentApp` without changing publication API calls, and verify a new request immediately outranks retained historical failures.
- [x] 1.3 Update the publication trigger and history popover/Sheet to identify the current row, retain older failures, and expose the refresh action directly in the top-right area; verify accessible names, focus, stale-state copy, and pending polling behavior.

## 2. Shared workspace and Content/Images presentation

- [x] 2.1 Align staff workspace tokens, typography, spacing, focus, target sizing, semantic badges, alerts, skeletons, and reduced-motion behavior while preserving the dark theme and public preview typography boundary; verify the staff build and responsive screenshots.
- [x] 2.2 Polish Content toolbar and publication history using the shared workspace treatment without duplicating draft or operational copy; verify existing Content editing, discard, preview, save, publish, and navigation flows remain unchanged.
- [x] 2.3 Add the selected Images grid/list presentation and strengthen selected, keyboard, metadata, crop-suitability, loading, and field-error states using the existing media data and picker return context; verify image selection tests and narrow-screen behavior.

## 3. Items workspace presentation

- [x] 3.1 Group Item Setup into clear source, editorial, price, stock, and review sections with the shared heading/action treatment; verify existing setup validation, recovery, idempotency, and permission behavior.
- [x] 3.2 Add a compact readiness summary and direct Content/Stock handoffs from existing authoritative setup state; verify blockers are actionable, no identifiers are fabricated, and the existing selected-item context survives navigation.

## 4. Stock and Orders presentation

- [x] 4.1 Refine Stock with compact operator chrome, explicit Adjust/Count mode controls, advisory before/after quantities, and dense history rows; verify existing freshness guards, mutation confirmations, loading/error preservation, and keyboard operation.
- [x] 4.2 Refine Orders with compact quick filters, clearer payment/notification status identity, stronger row hierarchy, and grouped operational detail sections; verify coverage warnings, exact session lookup, stale/error behavior, and read-only boundaries.

## 5. Documentation, regression coverage, and delivery

- [x] 5.1 Update `docs/backoffice-design.md` with the current publication-status rule, current-versus-history distinction, selected visual decisions, deferred ideas, and implementation evidence links.
- [x] 5.2 Extend unit coverage for the publication reducer and rendered status states, then run `pnpm test:unit` successfully.
- [x] 5.3 Extend and run the Content browser fixture in Chromium and Firefox for retained failures, new pending requests, live/newest-failed states, direct refresh, polling, and existing editor regressions.
- [x] 5.4 Run `pnpm check`, `pnpm build`, `pnpm build:staff`, and the relevant preview/content workspace checks at 390, 768, 1280, and 1600 px; record failures and fixes in validation evidence.
- [ ] 5.5 Run strict OpenSpec validation, review the final diff, deploy the exact passing tree to UAT, and verify publication status and workspace visuals in Chromium and Firefox before promotion.
