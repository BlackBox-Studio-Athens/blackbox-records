# Tasks

- [x] Align staff thumbnail key validation and URL decoding with safe native flat filenames.
- [x] Require a valid bounded PNG thumbnail on new uploads; shrink on the client instead of silently omitting it; preserve original upload success if derivative storage fails.
- [x] Improve bounded R2 inventory/backfill outcomes for unsupported keys, missing originals, and missing or invalid thumbnails; prove writes affect derivatives only.
- [x] Add public CMS image transformations for approved source URLs and widths, negotiated `format=auto`, and original fallback.
- [x] Enable Workers Caching only on the named public image entrypoint; preserve no-store behavior for pages, previews, staff media, and the CMS Worker.
- [x] Document the Images Free hostname/source-origin setup, rollout gates, and current local inventory results.
- [x] Run focused thumbnail/public-image Vitest checks, `pnpm cache:policy:check`, and Browser Use checks for staff Content/Stock and public images.
- [x] Run `pnpm validate` and obtain a valid `pnpm validate:editor` result against a stable source tree.
- [ ] After a fresh Free-tier usage review and one-run authorization, apply the bounded UAT backfill and configuration, verify a representative cache hit, then repeat for PRD after UAT succeeds.
