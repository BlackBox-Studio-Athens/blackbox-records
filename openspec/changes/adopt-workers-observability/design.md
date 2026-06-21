## Context

The backend Worker is now the runtime authority for checkout creation, Stripe webhooks, stock mutations, email side effects, feature-gate evaluation, D1 persistence, and scheduled catalog verification. Current runtime observability is incomplete:

- `apps/backend/wrangler.jsonc` has no explicit `observability` block.
- The Hono app has no request lifecycle logging middleware.
- The global error handler logs a raw `Error` object.
- Email and webhook side effects already emit some structured objects, but event shape is not centralized.
- Scheduled catalog verification emits one unstructured warning string.
- Runtime code does not use Workers Traces or custom spans.

Cloudflare's current guidance is to enable Workers Logs and Traces through Wrangler, use `console.info`, `console.warn`, and `console.error` for severity, log structured JSON-compatible objects, and use custom spans only where application-specific flow names add value beyond automatic platform instrumentation.

## Goals / Non-Goals

**Goals:**

- Make UAT and PRD Worker behavior diagnosable from Cloudflare Workers Logs before incidents happen.
- Keep observability configuration explicit in versioned Wrangler config, not dependent on dashboard defaults.
- Standardize app logs so Query Builder can filter by event name, route, status, environment, order reference, variant ID, provider boundary, and safe reason.
- Prevent secrets, raw provider payloads, full shopper PII, stack traces, Access tokens, cookies, and internal D1 details from entering persistent logs.
- Add custom tracing only around high-value application flows where Cloudflare automatic spans are too generic.
- Provide local and deployed verification paths without making CI depend on Cloudflare dashboard access.

**Non-Goals:**

- Do not add Pino, Winston, Sentry, Datadog, Honeycomb, or another runtime logging SDK for this slice.
- Do not add Tail Workers, Logpush, or OpenTelemetry export destinations unless a later ops decision chooses an external sink.
- Do not add frontend browser RUM or client-side error collection to Workers Logs; static frontend browser telemetry is separate scope.
- Do not log raw Stripe, Resend, BOX NOW, D1, Cloudflare Access, or checkout payloads.
- Do not change checkout, stock, webhook, email, or catalog business behavior except for observability side effects.

## Decisions

### Decision 1: Use native Workers Logs and Traces as the platform sink

Configure `observability` in `apps/backend/wrangler.jsonc` for the base Worker and each deployed environment. Use logs at full sampling initially for low-volume Local/UAT, and choose an explicit PRD sampling value during implementation based on expected request volume and cost tolerance.

Alternative considered: rely on Cloudflare's default observability setting for new Workers. Rejected because this repo has existing Workers and environment-specific targets; config drift would be invisible in code review.

Alternative considered: add an external observability provider now. Rejected because Cloudflare Workers Logs and Query Builder are enough for this app's current operational needs, and external exports add credential, cost, and retention policy decisions.

### Decision 2: Add a small repo-owned logger wrapper

Create a Worker-safe logger module with typed event helpers. It should call `console.info`, `console.warn`, or `console.error` directly with structured records and shared fields:

- `event`
- `message`
- `productEnvironment` and `workerDeploymentTarget`
- `requestId` when request scoped
- `method`, `path`, `status`, and `durationMs` for HTTP events
- domain-safe identifiers such as `orderReference`, `variantId`, `storeItemSlug`, `checkoutSessionIdHash`, `provider`, `safeReason`, and `retryable` when applicable

The wrapper should omit undefined fields, normalize errors into safe fields, and provide redaction helpers. It should not buffer logs, perform network I/O, mutate global request state, or require Node-only APIs.

Alternative considered: use Hono's logger middleware. Rejected because it emits line-oriented request strings and does not enforce the redaction and domain event schema this Worker needs.

Alternative considered: use Pino/Winston. Rejected because Workers Logs already collect `console.*`, and heavyweight loggers add runtime compatibility and bundle cost without solving app-specific redaction.

### Decision 3: Log request lifecycle at the Hono boundary

Add middleware for `/api/*` that creates a per-request `requestId`, records start time, and emits one request completion event with route-safe path data, status, duration, method, and outcome. Error handling should emit a separate safe error event before returning the existing provider-safe response.

Request logs must avoid raw query strings by default. If query data is needed later, add named allowlisted keys only.

### Decision 4: Standardize domain outcome events

Keep useful existing event names where already present, but route them through the logger wrapper and make field names consistent. Add missing structured outcome logs around:

- checkout capability evaluation and checkout start failures
- Stripe webhook receipt, verification failure, event dedupe, paid/non-paid reconciliation, and catalog webhook reconciliation
- stock read/write and operator mutation outcomes
- paid order email and newsletter registration outcomes
- feature-gate evaluation failures
- scheduled catalog verification start, success, issue summary, and failure

These events should be outcome logs, not payload dumps. They should describe what happened, which safe identifier it relates to, and whether an operator action or retry is needed.

### Decision 5: Use custom spans sparingly

Enable Workers Traces and add custom spans only around high-value application operations:

- `checkout.start`
- `stripe.webhook.reconcile`
- `stock.mutate`
- `email.send_paid_order_notifications`
- `newsletter.register_checkout_opt_in`
- `catalog.verify_scheduled`

Use span attributes for low-cardinality and safe identifiers only. Do not put raw emails, addresses, phone numbers, raw provider payloads, secrets, or full error stacks into span attributes.

### Decision 6: Validate through config tests and smokeable operator commands

Add automated validation that `wrangler.jsonc` keeps observability enabled for the intended Worker runtime targets and that obvious unsafe fields are not emitted by logger tests. Document manual deployed checks through `wrangler tail` and Cloudflare Workers Logs Query Builder. CI should not require dashboard access or remote log reads.

## Risks / Trade-offs

- [Risk] Log volume increases cost or hides useful signals in noise. Mitigation: one request completion event per API request, outcome logs only for meaningful domain transitions, and explicit sampling in Wrangler.
- [Risk] Logs accidentally persist PII or secrets. Mitigation: centralize logger helpers, test redaction, avoid raw payload logging, and document prohibited fields.
- [Risk] Tracing API maturity changes. Mitigation: keep tracing behind the official `cloudflare:workers` API, use few spans, and avoid business logic dependence on spans.
- [Risk] Refactoring existing `console.*` calls changes test expectations. Mitigation: migrate call sites incrementally with focused tests around event shape, not console implementation details.
- [Risk] PRD sampling too low hides rare failures. Mitigation: document the chosen rate and keep it easy to raise during incident diagnosis.

## Migration Plan

1. Inventory current runtime `console.*` calls and classify script-only logs separately from Worker runtime logs.
2. Add explicit Wrangler observability for base, mock, mock-api, sandbox/UAT, and production/PRD Worker targets.
3. Add the logger wrapper, redaction helpers, and focused unit tests.
4. Add Hono request/error logging middleware and tests.
5. Migrate existing Worker runtime logs to structured logger events.
6. Add missing domain outcome logs in checkout, webhook, stock, email, feature-gate, and scheduled catalog paths.
7. Enable traces and add the limited custom spans.
8. Add docs and validation scripts/tests for config, field safety, and deployed log inspection.
9. Validate with OpenSpec, backend tests, standard repo gates, and a manual deployed `wrangler tail` check when Cloudflare credentials are available.

Rollback is configuration-first: reduce sampling or disable custom spans if volume or runtime issues appear. Logger calls remain ordinary `console.*` side effects and should not block core runtime behavior.

## Open Questions

- What PRD `observability.logs.head_sampling_rate` and `observability.traces.head_sampling_rate` should be used before checkout opens? Default proposal: full logs during pre-go-live and low sampled traces, then revisit after traffic is known.
- Should API responses expose `x-request-id` for shopper/operator support correlation? Default proposal: yes for API responses, because it contains no sensitive data and makes support/debugging faster.
