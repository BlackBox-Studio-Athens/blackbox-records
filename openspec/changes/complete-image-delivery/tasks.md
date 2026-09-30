# Tasks

- [x] Align staff thumbnail key validation and URL decoding with safe native flat filenames.
- [x] Require a valid bounded PNG thumbnail on new uploads; shrink on the client instead of silently omitting it; preserve original upload success if derivative storage fails.
- [x] Improve bounded R2 inventory/backfill outcomes for unsupported keys, missing originals, and missing or invalid thumbnails; prove writes affect derivatives only.
- [x] Add public CMS image transformations for approved source URLs and widths, negotiated `format=auto`, and original fallback.
- [x] Enable Workers Caching only on the named public image entrypoint; preserve no-store behavior for pages, previews, staff media, and the CMS Worker.
- [x] Document the Images Free hostname/source-origin setup, rollout gates, and current local inventory results.
- [x] Run focused thumbnail/public-image Vitest checks, `pnpm cache:policy:check`, and Browser Use checks for staff Content/Stock and public images.
- [x] Run `pnpm validate` and obtain a valid `pnpm validate:editor` result against a stable source tree.
- [x] Forward only `Accept` through the Pages gateway; gateway test in `test:tooling`.
- [x] Snap requested widths up the transformation ladder; keep the original only for a missing or non-positive width.
- [x] Cache successful published HTML at the edge for at most 60 seconds through the default entrypoint; set explicit `no-store` on not-found responses and on originals returned after a failed transformation.
- [x] Run strict OpenSpec validation and `pnpm validate` on the final tree for the 2026-09-30 fixes; see `validation.md`.
- [ ] After release, verify on UAT and then PRD: `Accept` negotiation and snapped widths through the gateway, HTML `cf-cache-status`/`Age` reuse, and `no-store` on `/content-version.json` and not-found responses (probes in `validation.md`).
- [ ] After a fresh Free-tier usage review and one-run authorization, apply the bounded UAT backfill and configuration, verify a representative cache hit, then repeat for PRD after UAT succeeds.
