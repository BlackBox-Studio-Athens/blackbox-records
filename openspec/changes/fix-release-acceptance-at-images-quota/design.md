## Context

Push run 38111063778 passed repository checks, all four main browser shards, both staff browser jobs and UAT runtime deployment verification. WebKit reported the list at scrollY 0 after closing a detail overlay, and the public-assets smoke received Images HTTP 429 / error 9422. The account stays on Free.

## Decisions

1. Guard the scheduled overlay callback at execution time. `scrollWithLenis(null, ...)` intentionally targets the document elsewhere, so change the overlay caller rather than that shared contract. Missing or disconnected panel roots perform neither scroll nor content focus.
2. The release smoke's `public_assets` scenario verifies media availability. Resolve a trusted direct Images URL to its exact same-environment `/media/content/<sha>` original. Preserve the existing same-origin/base-path checks and reject external sources. Keep `image_transform` separate: it must still require a real small, immutable transformation and reject fallback originals.
3. Prove browser fallback under controlled image failures locally; do not probe the exhausted hosted transformation endpoint to establish that behavior.
4. Preserve software-release gates. Commit source before pushing, run complete CI and hosted smoke, and dispatch PRD only after the UAT push succeeds. Temporarily close UAT checkout for verification, then restore its captured original state. Preserve PRD checkout and each accepted content pointer.

## Risks and Validation

A disconnected callback guard must not suppress normal panel focus; retain the positive unit case. Canonical media extraction must preserve source environment and base path. Focused unit checks, the original WebKit Close/Back case, shell/player continuity, image fallback browser coverage and full UAT CI establish these outcomes. Source-bound final validation and production build precede push. Hosted release receipts record code, run, content and checkout identities. No successful local check substitutes for a failed CI job.
