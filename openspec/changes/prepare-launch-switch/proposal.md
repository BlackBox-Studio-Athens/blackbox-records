# Proposal

## Why

Switch day (`launch-switch-day`) should be two commands and a few clicks. That needs three things in place first: the PRD API off `workers.dev`, so only the apex remains public after launch; the UAT site off the open internet; and a rehearsed launch script. All three can be done before launch without touching what the apex serves.

## What Changes

- Move the PRD API from `workers.dev` to `blackboxrecordsathens.com/api/*`, including the Stripe live webhook endpoint. The Holding Page has no `/api/` paths, so this works while it is live.
- Put the UAT site behind Cloudflare Access, with a service token for CI. The UAT API stays public.
- Move approved PRD product artwork delivery and active Stripe Product image URLs to apex runtime media before retiring `workers.dev`. Finalization checks that prerequisite before writing.
- Add `pnpm launch:switch`, a local script with `cutover`, `finalize`, `rollback` and `--dry-run`, plus its tests, credentials and a dry-run rehearsal.

## Capabilities

### New Capabilities

- `launch-switch-automation`: the staged local launch script, its checks, snapshot and rollback.

### Modified Capabilities

- `environment-model`: the PRD API is served under the apex, and the UAT site requires Access.

## Impact

Backend `wrangler.jsonc` PRD routes and allowed origins, the `PRD_PUBLIC_BACKEND_BASE_URL` variable, the Stripe live webhook endpoint URL, CI steps that read UAT through an Access service token, a new `scripts/launch-switch/` script with tests, and the environment model and Stripe docs. No UI work. Cloudflare stays on Free.
