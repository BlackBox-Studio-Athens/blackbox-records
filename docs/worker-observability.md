# Worker Observability

Backend observability uses Cloudflare Workers Logs, Workers Traces, and structured `console.info` / `console.warn` / `console.error` records. No Pino, Winston, Sentry, Datadog, Tail Worker, Logpush, or OpenTelemetry export destination is part of this slice.

Custom spans use `ctx.tracing` from the Worker `ExecutionContext`, which Cloudflare documents as the same custom-spans API exposed by `import { tracing } from "cloudflare:workers"`.

## Runtime Targets

| Product Environment | Worker target            | Logs sampling | Traces sampling |
| ------------------- | ------------------------ | ------------: | --------------: |
| Local               | base, `mock`, `mock-api` |           `1` |             `1` |
| UAT                 | `uat`                    |           `1` |           `0.1` |
| PRD                 | `prd`                    |           `1` |          `0.01` |

Logs stay at full sampling before PRD checkout opens so rare commerce failures remain diagnosable. Traces are lower in deployed targets to control volume. Raise trace sampling during a short diagnostic window, then return it in the same config file.

## Structured Events

Runtime events use stable `event` names and safe context fields: `productEnvironment`, `workerDeploymentTarget`, `requestId`, `method`, normalized `path`, `status`, `durationMs`, `outcome`, `safeReason`, `retryable`, `orderReference`, `storeItemSlug`, `variantId`, and safe provider surrogates such as `checkoutSessionIdHash`.

Do not log raw request bodies, cookies, authorization headers, Cloudflare Access tokens, Stripe signatures, raw provider payloads, email addresses, phone numbers, postal addresses, message HTML, D1 binding details, or full error stacks. Use the logger helper in `apps/backend/src/observability/index.ts`; it omits `undefined` fields and redacts representative unsafe values.

Every `/api/*` response includes `X-Request-Id`. Support can ask a shopper/operator for that value and correlate it with `http_request_completed`, `http_request_error`, and domain outcome events.

Current runtime `console.*` inventory:

- Migrated: HTTP error handler raw error logging.
- Migrated: paid-order email and checkout newsletter outcome logs.
- Migrated: Stripe webhook service warnings.
- Migrated: scheduled catalog verification warning string.
- New: request completion, checkout capability/start, Stripe webhook receipt/reconciliation, internal stock, feature-gate failure, scheduled catalog start/success/failure events.
- Script-only logs under `apps/backend/scripts/**` remain outside Worker runtime logging.

## Deployed Inspection

From `apps/backend`:

```sh
pnpm exec wrangler tail --env uat --format json
pnpm exec wrangler tail --env prd --format json
```

Use Cloudflare dashboard → Workers & Pages → selected Worker → Logs / Observability Query Builder for stored logs. Select `blackbox-records-backend-uat` or `blackbox-records-backend-prd`.

This implementation pass did not run deployed `wrangler tail` verification because Cloudflare credentials and deployed-traffic access were not available in the local Codex session. Local validation completed: `pnpm openspec -- validate adopt-workers-observability --type change --strict`, focused backend observability tests, `pnpm test:unit`, `pnpm check`, and `pnpm build`.

Frontend browser RUM, client-side errors, and Core Web Vitals are separate scope. Do not route browser telemetry through Workers Logs without a later OpenSpec change.
