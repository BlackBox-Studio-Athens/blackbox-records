## Context

The repo-side webhook handler already accepts Stripe catalog events, dispatches Product/Price events to catalog reconciliation, and runs sandbox reconciliation with `apply: true`. The sandbox Worker also has a six-hour scheduled catalog verification backstop in `apps/backend/wrangler.jsonc`.

The missing control is outside the repo: Stripe must have a persistent account webhook endpoint for the deployed sandbox Worker, and Cloudflare must hold that endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`. Current smoke tooling includes `scripts/start-stripe-sandbox-listener.ts`, which starts `stripe listen --forward-to https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev/api/stripe/webhooks` and syncs the transient CLI listener signing secret into the sandbox Worker. That proves one smoke run can receive forwarded events, but it can also replace the persistent endpoint secret and does not prove the Dashboard endpoint remains configured when the listener is gone.

Stripe's current docs support both Dashboard/Workbench setup and API setup for webhook endpoints. The API can create, update, retrieve, and list webhook endpoints. Endpoint creation returns the signing secret once, while later retrieval returns endpoint configuration without the secret value. Stripe CLI `listen` prints a separate signing secret for the active listener and forwards events only while the listener is running.

## Goals / Non-Goals

**Goals:**

- Add an operational verification plan for the sandbox Stripe webhook endpoint URL and required catalog event subscriptions.
- Make persistent endpoint setup visible through a repo command that can run before smoke, in CI, or in launch readiness checks.
- Verify sandbox Worker `STRIPE_WEBHOOK_SECRET` presence without printing the secret.
- Prevent transient `stripe listen` secrets from being mistaken for persistent webhook configuration.
- Preserve the layered catalog safety model: webhook near-real-time sync, Store Offer read reconciliation, checkout start revalidation, scheduled backstop, and `pnpm stripe:catalog:verify --env uat`.

**Non-Goals:**

- Creating or rotating production webhook endpoints.
- Committing Stripe webhook endpoint IDs, signing secrets, Stripe object IDs, or account-private Dashboard evidence.
- Replacing Stripe-hosted Checkout, catalog reconciliation, Store Offer reads, or scheduled catalog verification.
- Guaranteeing delivery of every Stripe event without backstops. Stripe webhooks are asynchronous operational infrastructure; the guarantee here is detectable configuration plus layered recovery.

## Decisions

### Add a dedicated webhook endpoint verifier

Introduce `pnpm stripe:webhooks:verify --env sandbox`, backed by a script such as `scripts/verify-stripe-webhook-endpoints.ts`. The verifier reads Stripe with the selected environment credentials and lists account webhook endpoints. It fails unless it finds exactly one enabled account endpoint with:

- `url` equal to `https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev/api/stripe/webhooks`
- `livemode` false for sandbox/test mode
- no Connect-only destination
- enabled events including `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, and `price.deleted`

The verifier should fail on missing required catalog events and duplicate matching URLs. It may warn, rather than fail, when extra events are subscribed because the same route also handles checkout events. It should report only redacted endpoint identifiers, for example `we_...abcd`, and never print secrets.

Alternative considered: rely on Dashboard screenshots or `stripe listen` output. Rejected because neither is a repeatable repo-owned gate, and the listener is temporary by design.

### Keep the first implementation verify-only

The first implementation should not mutate Stripe account state. It should verify the endpoint and provide a precise setup/repair runbook for Dashboard/Workbench or a later approved automation slice. This keeps the hardening low-risk while still making missing Dashboard state visible in preflight and CI-capable checks.

If the endpoint already exists, the verifier cannot prove the Worker secret equals the endpoint secret from the Stripe retrieve/list APIs because Stripe does not return the secret on later reads. In that state it can prove endpoint URL/events/status and Worker secret presence, but matching-secret proof requires one of:

- endpoint creation/rotation where the operator immediately writes the returned or revealed secret to the sandbox Worker
- a manual Dashboard secret reveal followed by `wrangler secret put`
- a live delivery probe whose result is recorded as redacted evidence

Automated endpoint creation/rotation can be added later, but it should require an explicit OpenSpec update because it mutates external payment-account state and handles webhook secrets.

Alternative considered: store the webhook signing secret or fingerprint in repo state. Rejected because it would normalize secret-derived committed metadata and still would not prove Cloudflare's current secret value.

### Stop overwriting the persistent Worker secret with transient listener secrets

`scripts/start-stripe-sandbox-listener.ts` currently syncs the active `stripe listen` secret into the deployed sandbox Worker. After the persistent endpoint becomes the sandbox source of truth, that behavior must change. The plan should either remove deployed-sandbox secret syncing from that script or require an explicitly isolated local/temporary mode that cannot replace the primary `STRIPE_WEBHOOK_SECRET`.

For deployed sandbox smoke, prefer the persistent Dashboard endpoint and let Stripe deliver checkout/catalog events directly to the Worker. Use `stripe listen` for local Worker diagnostics or temporary smoke-only investigation, but do not treat it as persistent endpoint evidence.

If a future smoke still needs both persistent Dashboard delivery and CLI-forwarded delivery against the same deployed Worker, add an explicit multi-secret verification design first, such as a primary `STRIPE_WEBHOOK_SECRET` plus short-lived additional listener secret support. Do not silently overwrite the primary secret.

Alternative considered: keep syncing the listener secret before every smoke run. Rejected because it makes the Worker trust the temporary listener instead of the persistent endpoint and can break automatic catalog delivery after the listener exits.

### Verify Worker secret presence and deployment bindings without exposing values

The verifier should call Wrangler or Cloudflare APIs only for non-secret evidence:

- the sandbox Worker exists under the expected name
- `STRIPE_WEBHOOK_SECRET` is configured as a secret binding
- the sandbox Worker still has the six-hour cron backstop configured

If Wrangler cannot expose secret names reliably, the verifier should report "secret presence unverified" with a focused manual action rather than printing or requesting secret values. Manual acceptance can be: `wrangler secret put STRIPE_WEBHOOK_SECRET --env sandbox` followed by a successful webhook delivery probe or paid smoke run using the persistent endpoint.

Alternative considered: add a Worker admin route that reports secret configuration. Rejected for this slice because it increases runtime API surface for an operator-only diagnostic that Wrangler or Cloudflare state should own.

### Keep catalog controls layered

The persistent webhook endpoint is near-real-time synchronization, not blind trust. Existing controls remain part of acceptance:

- Store Offer reads reconcile stale or missing snapshots before showing checkout readiness.
- Checkout start revalidates the active Stripe Price before creating a Checkout Session.
- Scheduled sandbox catalog verification remains enabled every six hours.
- `pnpm stripe:catalog:verify --env uat` remains the operator proof for current catalog state.

The new `stripe:webhooks:verify` command proves the operational path that feeds webhook reconciliation; it does not replace catalog verification.

## Risks / Trade-offs

- [Risk] Existing endpoint retrieval cannot prove the signing secret matches the Worker secret. -> Mitigation: make verify output explicit about "endpoint configured" versus "secret match proven"; use create/rotate-through-script or delivery evidence when matching proof is required.
- [Risk] Extra webhook events on the same endpoint may be legitimate because checkout events share the route. -> Mitigation: fail only when required catalog events are absent, duplicate/misrouted endpoints exist, or endpoint status is disabled; warn on extras.
- [Risk] Updating webhook endpoints can affect paid checkout reconciliation if checkout events are removed accidentally. -> Mitigation: verifier should read and report checkout event subscriptions separately and tasks should include regression checks for paid smoke or documented checkout webhook coverage.
- [Risk] CI may not have Stripe or Cloudflare credentials. -> Mitigation: make the script deterministic and CI-capable, but allow CI to run only in environments with explicit sandbox credentials; otherwise keep it as a manual operator proof command.
- [Risk] Persistent endpoint setup is account state and can drift after validation. -> Mitigation: include the verifier in preflight/launch checks and keep scheduled catalog verification as a runtime drift detector.

## Migration Plan

1. Add `stripe:webhooks:verify` script and tests for endpoint matching, missing events, duplicate endpoints, disabled endpoints, extra events, redaction, and Worker secret-presence classification.
2. Register or repair the sandbox Stripe endpoint through Dashboard/Workbench, then put the endpoint signing secret into the sandbox Worker as `STRIPE_WEBHOOK_SECRET`.
3. Use the verifier to prove endpoint URL, status, required events, and Worker secret presence after manual setup.
4. Change `scripts/start-stripe-sandbox-listener.ts` so it no longer overwrites the deployed sandbox Worker's primary webhook secret with a transient listener secret.
5. Run `pnpm stripe:webhooks:verify --env sandbox`, `pnpm stripe:catalog:verify --env uat`, and a sandbox checkout smoke that relies on the persistent endpoint for webhook delivery.
6. Keep rollback simple: disable the new verifier gate if credentials are unavailable, but do not remove the persistent endpoint or scheduled backstop once configured.
