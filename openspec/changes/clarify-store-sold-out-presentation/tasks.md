# Tasks

## 1. Store purchase status

- [x] 1.1 Correct Worker labels using the design's table without changing response shape or eligibility. Extend existing tests for depleted effective stock, missing records, pauses at zero/positive stock, and non-buyable status with positive stock.
- [x] 1.2 Confirm the proposed visual direction through applicable Impeccable gates, then render purchase states in the shared control with one responsive footprint: 224 × 54 px on desktop and full available width on mobile. Keep Add To Cart primary and filled; use a subtle Store Blood outline for Sold Out and neutral gray for Out of Stock, Checkout Paused, and generic unavailable. Suppress only adjacent duplicate headings, retain standalone summary feedback, and gate detail/compatibility purchase instructions on readiness. Verify pending, ready, unavailable, failed reads, stale snapshots, later ready responses, and state-tone mapping.
- [x] 1.3 Add the per-variant Restock planned field, revision-checked protected update, stock-detail switch, and Store Item setup choice. Default the setup form, API, database migration, and existing rows to false; preserve the flag through quantity changes, and keep Releases and Distro behavior aligned.

## 2. Staff review

- [x] 2.1 Add per-entry Discard saved changes to global review using the existing endpoint and confirmation. Verify eligible/incomplete drafts, cancellation, conflicts, duplicate-submit prevention, pending publication, never-published entries, and list/selection refresh while published content is unchanged.
- [x] 2.2 Disable editor, global, Overview, and selected-review controls by scope using existing comparison helpers and one shared discovery result. Verify unchanged/reverted content, unsaved/saved differences, slug/media/list changes, sparse pages, filtered emptiness, error retry, and publication recovery. Confirm shell/Overview deduplicate reads and typing does not scan the catalog.

## 3. Thumbnails and price copy

- [x] 3.1 Diagnose Disintegration's missing artwork and fix the shared cause, using existing preparation tooling if derivatives are absent. Cover the actual cause with a representative Local fixture and verify existing private-access, placeholder, and payload guarantees. Keep this task incomplete until the reported artwork is confirmed working after the applicable code or derivative repair; record any hosted-access/preparation blocker.
- [x] 3.2 Replace confirmation wording for fixed and pay-what-you-want prices as specified in design.md. Verify initial setup and price changes retain required confirmation and unchanged request payloads.

## 4. Acceptance

- [x] 4.1 Use native Browser Use after the repository probe to check changed public/staff flows on desktop/mobile, with keyboard and 200% zoom. Verify contrast, the restock switch and zero-stock labels, functional disabled controls, discard confirmation/cancellation, thumbnail loading, and listening/navigation. Use Local fixtures for mutations; distinguish hosted sign-in/derivative limitations.
- [ ] 4.2 Run `pnpm validate`, `pnpm validate:editor`, relevant local content-workspace/publication checks, and strict OpenSpec validation on the final implementation. Record compact evidence; follow existing Free-tier rules before hosted derivative preparation.
