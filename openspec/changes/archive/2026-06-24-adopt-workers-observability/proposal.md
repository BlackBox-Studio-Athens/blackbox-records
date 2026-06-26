## Why

The backend Worker now owns checkout, stock, webhook, email, catalog verification, and operator APIs, but Cloudflare Workers Logs and Traces are not explicitly enabled in `wrangler.jsonc` and app logs are only partially structured. This leaves intermittent UAT/PRD commerce failures harder to diagnose, especially after deploys, scheduled catalog verification, Stripe webhook delivery, and provider side effects.

## What Changes

- Add a Worker Observability capability for Cloudflare Workers Logs, Workers Traces, structured app logging, redaction, and operational validation.
- Configure Worker observability deliberately for Local, UAT, and PRD runtime targets, with environment-appropriate sampling and no reliance on dashboard defaults.
- Standardize backend logs as searchable structured events emitted through `console.info`, `console.warn`, and `console.error`, with a small repo-owned logger wrapper instead of a heavyweight runtime logging SDK.
- Add request lifecycle, error, scheduled job, checkout, webhook, stock, email, feature gate, and provider-boundary events where they improve diagnosis without exposing secrets, raw provider payloads, PII-heavy data, or internal stack traces.
- Add custom trace spans only around high-value application flows that Cloudflare automatic tracing does not name clearly enough.
- Add validation and documentation so maintainers know how to view Workers Logs, run `wrangler tail`, check observability config, and interpret which logs belong to Local, UAT, or PRD.

## Capabilities

### New Capabilities

- `worker-observability`: Defines Worker Logs/Traces configuration, structured backend app logs, redaction boundaries, trace span usage, and operational verification.

### Modified Capabilities

- None.

## Impact

- `apps/backend/wrangler.jsonc`
- Backend Worker entrypoint and Hono app wiring under `apps/backend/src/index.ts` and `apps/backend/src/interfaces/http/`
- Backend commerce, stock, webhook, email, feature-flag, and scheduled catalog verification services where log events are useful
- Backend tests under `apps/backend/test/`
- Runtime/config validation scripts if observability drift checks are added
- README or deployment/operator docs for Workers Logs, Traces, `wrangler tail`, and environment-specific diagnosis
