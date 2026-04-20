# Phase 5 Research - Worker Backend Platform And Deployment Plumbing

## Standard Stack

- Astro static frontend remains on the existing GitHub Pages path.
- Separate Cloudflare Worker backend uses `wrangler` as the runtime/deploy tool.
- Worker runtime config should live in `wrangler.jsonc`.
- Local and CI auth should use:
  - local interactive `wrangler login`
  - CI `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

## Architecture Patterns

- Dual-deploy monorepo:
  - static frontend deploy target
  - separate backend deploy target
- Backend-for-frontend (BFF) pattern:
  - browser talks to the Worker backend
  - Worker talks to Stripe and D1
- Explicit environment contract:
  - frontend knows backend base URL
  - backend knows secrets and bindings

## Don't Hand-Roll

- Do not invent ad hoc deploy scripts instead of using Wrangler.
- Do not overload the Astro build to behave like the Worker backend.
- Do not put backend secrets into frontend build-time vars or browser code.

## Common Pitfalls

- Accidentally changing `pnpm build` so the static frontend no longer matches the Pages workflow.
- Treating the sandbox Worker as private while public-surface Cloudflare Access is deferred.
- Coupling frontend and backend env vars so tightly that local dev becomes brittle.

## Code Examples

- Separate commands for frontend and backend
- Frontend env var for backend base URL
- Wrangler-managed backend config and deploy workflow

## Sources

- Astro on-demand rendering
- Astro Cloudflare deployment guide
- Wrangler configuration docs
- Cloudflare Workers secrets docs

---
*Research updated: 2026-04-20 for the dual-deploy architecture*
