# Local validation

Implementation uses the existing public renderer, native EmDash reads, publication projection, shell loaders and cart storage seam. Hosted rollout remains separate and task 6.1 is not completed.

## Isolation

The managed worktree uses CMS `127.0.0.1:8799`, preview `localhost:8799` and public `127.0.0.1:4339`. Its D1/R2 persistence and Wrangler registry are under its ignored `.codex-artifacts/` directory. Other tasks' canonical ports and databases were retained. The publication smoke verifies the fixture Home record identity before writing. Startup must wait for each Worker's registered RPC endpoint as well as its HTTP listener; stale registry entries from a terminated fixture must not be reused.

## Observed checks

- Full repository validation passed all seven phases, including unit tests, formatting, lint, types, module boundaries and production build. The additional editor gate passed the staff build, preview policy and Chromium/Firefox workspace checks. CMS/public builds passed without KV bindings or new persistent preview sessions.
- Native/publication regressions cover unsaved input, exact saved selections, related entries, media and Store Item identity projection, conflicts and non-mutation. Context tests cover owner checks, expiry, capacity and independent retained input.
- The staff browser suite covers its existing widths and 320 px accessibility, debounce, generation ordering, failure/retry, last-good preview, focus, expand, hidden work and forged origin/source/context/generation messages. The real CSP browser test runs trusted scripts/assets while denying staff DOM access, external requests and form delivery.
- Real preview smoke exercises all thirteen collection destinations, the four collection listing views, HTML redirects, private headers, denied writes and privileged routes, arbitrary image URLs, unselected media, context release and draft/publication non-mutation.
- Paired Home, Release detail/overlay and Store listing/detail comparisons use 390 and 1280 px viewports, real matching font files, settled public controls, text and full-layout assertions, and top/footer screenshots. The browser fixture changes optional font display timing only; production retains optional fonts. Pixel differences are diagnostic, not an acceptance threshold.
- The interaction smoke checks same-document Back/Forward, selection retention, search, memory-only cart state, blocked checkout and an approved-player fixture that stays mounted across section navigation. Provider requests contain no preview context, referrer or credentials. Third-party playback itself is outside the deterministic fixture.
- The related Artist/Release batch used a newly uploaded image and a changed fake Store Item slug. Preview image bytes and Store URL matched actual publication. Original drafts, public content and Store Item identity were restored. The single-entry and two-entry checks measured 6.7 and 8.3 seconds, preserved unrelated-draft privacy and recovered repeated request IDs.
- The separate accepted-snapshot renderer smoke passed 130 public routes, homepage images, private routes and unaccepted-media denial.

Evidence is retained under `.codex-artifacts/preview-parity/`, the preview/publication smoke logs, and `.codex-artifacts/validation/`. Repository validation summaries record their source fingerprints. Earlier failed or invalidated runs are not completion evidence.

The native navigation bootstrap boolean normalization is a shared prerequisite also implemented by the concurrent store-photo task; its guarded conversion and existing checkpoint regression are included here. Firefox can report the dependency's caught Zod JIT attempt under CSP; schema validation falls back without enabling `unsafe-eval`.
