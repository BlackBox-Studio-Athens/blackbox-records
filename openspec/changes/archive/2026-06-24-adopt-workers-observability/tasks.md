## 1. Inventory And Decisions

- [x] 1.1 Inventory Worker-runtime `console.*` calls under `apps/backend/src/**` and classify each as keep, migrate, remove, or script-only/not-runtime.
- [x] 1.2 Record current gaps from `apps/backend/wrangler.jsonc`, `apps/backend/src/interfaces/http/app.ts`, `apps/backend/src/interfaces/http/error-handler.ts`, webhook services, email services, and scheduled catalog verification.
- [x] 1.3 Decide and document initial `observability.logs.head_sampling_rate` and `observability.traces.head_sampling_rate` values for Local, UAT/sandbox, and PRD/production.
- [x] 1.4 Decide whether API responses should expose `x-request-id` for support correlation and document the decision in the implementation notes or docs.
- [x] 1.5 Confirm no external logging SDK, Tail Worker, Logpush destination, or OpenTelemetry export destination is part of this slice.

## 2. Wrangler Observability Configuration

- [x] 2.1 Add explicit Workers Logs configuration to the base Worker target in `apps/backend/wrangler.jsonc`.
- [x] 2.2 Add explicit Workers Logs configuration to `mock` and `mock-api` local runtime targets.
- [x] 2.3 Add explicit Workers Logs configuration to the `sandbox` Worker runtime target mapped to UAT.
- [x] 2.4 Add explicit Workers Logs configuration to the `production` Worker runtime target mapped to PRD.
- [x] 2.5 Add Workers Traces configuration with explicit sampling for each target where tracing is enabled.
- [x] 2.6 Verify the resulting config remains valid against the committed Wrangler schema and does not add secrets or account-specific destination IDs.

## 3. Logger Foundation

- [x] 3.1 Add a Worker-safe logger module under the backend source tree with `info`, `warn`, and `error` helpers that call `console.info`, `console.warn`, and `console.error`.
- [x] 3.2 Define a typed structured log record shape with stable shared fields: `event`, `message`, runtime target, request ID, method, normalized path, status, duration, outcome, safe reason, and retryability where applicable.
- [x] 3.3 Add helpers to omit undefined fields and normalize unknown errors into safe classifications without raw stack traces.
- [x] 3.4 Add redaction or safe-surrogate helpers for checkout session IDs, provider identifiers, emails, phone numbers, postal addresses, tokens, cookies, signatures, and secret-looking values.
- [x] 3.5 Add tests proving logger output is structured, omits undefined fields, chooses the expected console severity, and does not emit representative unsafe values.
- [x] 3.6 Ensure the logger module uses only Worker-compatible APIs and does not buffer logs, perform network I/O, or store request-scoped state globally.

## 4. HTTP Request And Error Observability

- [x] 4.1 Add Hono middleware for `/api/*` that creates a request-scoped ID, measures duration, and makes the ID available to downstream handlers without global mutable state.
- [x] 4.2 Emit one structured request completion event per API request with method, normalized path, status, duration, runtime target, request ID, and outcome.
- [x] 4.3 Exclude raw request bodies, cookies, authorization headers, Access tokens, and unapproved query parameters from request logs.
- [x] 4.4 Update the Hono error handler to emit a structured safe error event instead of logging the raw error object.
- [x] 4.5 Preserve current browser-safe error responses and `Cache-Control: no-store` behavior.
- [x] 4.6 Add Worker-runtime tests for request completion logging, thrown-error logging, request ID correlation, response behavior, and unsafe field exclusion.

## 5. Commerce And Provider Outcome Logs

- [x] 5.1 Migrate existing paid-order email and newsletter registration outcome logs onto the logger wrapper while preserving event names and test expectations where they are already useful.
- [x] 5.2 Migrate Stripe webhook service warnings onto the logger wrapper with consistent `event`, `status`, `safeReason`, `orderReference`, and retryability fields.
- [x] 5.3 Add structured checkout capability and checkout-start outcome logs for allowed, disabled, validation-failed, catalog-drift, stock-unavailable, and provider-failed paths.
- [x] 5.4 Add structured Stripe webhook logs for receipt, verification failure, unsupported event type, duplicate event, paid reconciliation, non-paid reconciliation, catalog reconciliation, and unexpected failure.
- [x] 5.5 Add structured internal stock read/mutation logs with operation kind, variant ID, outcome, runtime target, and safe reason while excluding Access tokens and raw authenticated-user headers.
- [x] 5.6 Add structured feature-gate evaluation failure logs that do not expose flag provider internals or raw evaluation errors to the browser.
- [x] 5.7 Replace scheduled catalog verification's unstructured warning string with start, success, issue-summary, and failure events.
- [x] 5.8 Add or update focused tests for each migrated or newly added domain outcome event.

## 6. Custom Tracing

- [x] 6.1 Add the minimal `cloudflare:workers` tracing integration needed for custom spans in Worker runtime code.
- [x] 6.2 Add safe custom spans for `checkout.start`, `stripe.webhook.reconcile`, `stock.mutate`, `email.send_paid_order_notifications`, `newsletter.register_checkout_opt_in`, and `catalog.verify_scheduled` where code structure makes the span meaningful.
- [x] 6.3 Add only bounded, low-cardinality, safe span attributes such as operation kind, runtime target, outcome, and app-owned identifiers.
- [x] 6.4 Verify no custom span captures raw provider payloads, shopper PII, secrets, full error stacks, or high-cardinality unbounded values.
- [x] 6.5 Add tests or type-level coverage that tracing wrappers do not change return values, thrown errors, or business behavior.

## 7. Validation Tooling

- [x] 7.1 Add automated validation that `apps/backend/wrangler.jsonc` keeps Workers Logs and Traces explicitly configured for the intended runtime targets.
- [x] 7.2 Integrate observability config validation into an existing validation command when appropriate, or add a focused backend test if a command would be too broad.
- [x] 7.3 Add tests for representative unsafe telemetry inputs so future logs cannot silently include secrets, tokens, raw provider payloads, or PII-heavy values.
- [x] 7.4 Keep CI validation local and deterministic; do not require Cloudflare dashboard access, remote Workers Logs reads, or deployed traffic in normal repository gates.

## 8. Documentation And Operator Workflow

- [x] 8.1 Update README or operator documentation with the Workers Logs and Traces model for Local, UAT, and PRD.
- [x] 8.2 Document how to inspect deployed logs with the Cloudflare dashboard and `wrangler tail` for sandbox/UAT and production/PRD Worker targets.
- [x] 8.3 Document the structured event naming and safe-field policy so future commerce/provider logs stay queryable and redacted.
- [x] 8.4 Document that frontend browser RUM, client-side errors, and Core Web Vitals are separate scope and are not routed through Workers Logs by this change.
- [x] 8.5 Document the chosen log and trace sampling rates and when maintainers may raise or lower them during diagnostics.

## 9. Verification

- [x] 9.1 Run `pnpm openspec -- validate adopt-workers-observability --type change --strict`.
- [x] 9.2 Run backend focused tests for logger, request logging, redaction, observability config, and changed domain outcome logs.
- [x] 9.3 Run `pnpm test:unit`.
- [x] 9.4 Run `pnpm check`.
- [x] 9.5 Run `pnpm build`.
- [x] 9.6 If Cloudflare credentials are available, deploy or use an existing sandbox/UAT Worker target and verify a request appears in `wrangler tail` or Workers Logs with the expected structured fields.
- [x] 9.7 If deployed log verification is blocked by credentials or environment availability, record the blocker and the exact local validation completed.
