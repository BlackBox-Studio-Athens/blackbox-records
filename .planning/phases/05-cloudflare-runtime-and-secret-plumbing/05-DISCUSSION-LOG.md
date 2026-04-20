# Phase 5 Discussion Log

## Corrected Architecture

- The Astro site stays static and continues to own frontend rendering.
- GitHub Pages remains the frontend deployment target during this milestone.
- A separate Cloudflare Worker backend is added in-repo for dynamic commerce behavior.

## Locked Operational Choices

- local auth uses `wrangler login`
- CI auth uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
- backend secrets stay in Worker secrets/bindings
- Cloudflare Access is deferred for public sandbox browsing

## Why Phase 5 Changed

The earlier plan drifted into “Astro frontend moves to Workers.” That is no longer the active architecture. Phase 5 now only bootstraps the separate backend.

---
*Logged: 2026-04-20*
