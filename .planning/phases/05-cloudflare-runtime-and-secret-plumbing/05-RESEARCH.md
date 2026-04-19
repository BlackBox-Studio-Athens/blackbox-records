---
phase: 5
slug: cloudflare-runtime-and-secret-plumbing
status: ready
---

# Phase 5 Research

## Repo facts that matter

- `astro.config.mjs` is still Pages/static oriented today.
- `/shop/` is still a redirect route, so no live server routes exist yet for commerce.
- The current production workflow remains `.github/workflows/pages.yml`.
- The app shell and Astro content collections are already the stable front-end baseline and should not be disrupted by runtime work.

## Research conclusions

1. Phase 5 should stop at platform capability.
2. The phase should not front-run local D1 or Prisma domain work, because that now belongs to inserted Phase 6.1.
3. The Worker runtime and secret model need to be explicit before any native shop or checkout work starts.
4. A stable sandbox hostname belongs in Phase 5 because later checkout and webhook phases need one consistent target.

## Resulting plan shape

- `05-01` adapter bootstrap
- `05-02` prerender contract
- `05-03` Wrangler and environment model
- `05-04` local Worker development
- `05-05` sandbox deploy workflow and hostname
- `05-06` secrets contract
