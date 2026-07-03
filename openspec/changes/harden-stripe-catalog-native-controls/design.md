## Context

BlackBox already has the right core shape for a Stripe-owned checkout catalog:

- `createStripeCatalogLookupKey()` builds `blackbox:{environment}:{storeItemSlug}:{variantId}`.
- `createStripeCatalogMetadata()` writes `appEnv`, `sourceId`, `sourceKind`, `storeItemSlug`, and `variantId`.
- `CatalogReconciler` resolves Prices by lookup key, metadata, and existing D1 mapping; it fails closed on ambiguity.
- Catalog mutations already receive idempotency contexts such as `blackbox:catalog:{env}:{variantId}:{action}:{identity}`.
- Scheduled UAT verification is now report-only, while `pnpm stripe:catalog:verify --env uat --apply` remains the explicit mutation command.

The recent UAT reset showed the missing layer: when objects reappear, maintainers need a repeatable Stripe-native investigation path and local reports with the exact safe handles needed to correlate Stripe request logs, Events, Worker logs, D1 rows, and catalog apply runs.

### Research Summary

Official Stripe docs point to three native controls for this scope:

- Workbench/request logs and Events: use Stripe Dashboard/Workbench for request/event forensics. Events expose event type, object data, created time, request ID, and idempotency key when present; Events API retrieval is limited to 30 days. Request logs are the primary source for source/IP/endpoint/method/status style investigation, but they are Dashboard/Workbench-facing rather than a normal product API we should build around.
- Product/Price identifiers: Products support metadata and creation parameters including optional IDs; Prices support `lookup_key`, `transfer_lookup_key`, and metadata. Stripe recommends lookup keys for retrieving current Prices without hard-coding Price IDs. Metadata is the native place for app-owned identity on Stripe objects.
- Stripe search: useful for diagnostics, backfill, and duplicate scans, but not the sole runtime authority. Current-state reconciliation should continue to use list/retrieve paths that the reconciler already owns.
- Idempotency keys: Stripe idempotency keys make retries safe for `POST` mutating API requests. Stripe stores the first result for a key for at least 24 hours, compares later parameters, can replay `500` responses, and can return `Idempotent-Replayed: true`. Request IDs are the support/debug handle. Idempotency prevents duplicate retries; it does not replace catalog reconciliation, actor attribution, workflow concurrency, or scheduled-job gating.
- Product/Price create shapes: `prices.create` can provision a Product when `product_data` is sent, and `products.create` can provision a Price when `default_price_data` is sent. Catalog code should make those combined-create shapes explicit and test-covered so a repair path does not accidentally recreate duplicate Products or Prices.

Primary Stripe sources:

- https://docs.stripe.com/development/dashboard/request-logs
- https://docs.stripe.com/workbench/overview
- https://docs.stripe.com/api/events
- https://docs.stripe.com/api/events/types
- https://docs.stripe.com/api/idempotent_requests
- https://docs.stripe.com/api/request_ids
- https://docs.stripe.com/products-prices/manage-prices
- https://docs.stripe.com/api/prices/create
- https://docs.stripe.com/api/products/create
- https://docs.stripe.com/metadata
- https://docs.stripe.com/search

## Goals / Non-Goals

**Goals:**

- Give operators a runbook for tracing unexpected Product/Price creation, reactivation, archiving, and lookup-key movement using Stripe Workbench/request logs and Events.
- Make catalog verify/apply output include enough safe correlation fields to investigate a Stripe object later.
- Detect active BlackBox-owned Stripe catalog objects that are outside the current expected Store Item catalog.
- Standardize deterministic idempotency keys for catalog mutations and prove retry behavior in tests.
- Preserve the existing sync model: lookup key + metadata + D1 mapping remain the authority path; checkout still revalidates before creating Checkout Sessions.

**Non-Goals:**

- No Stripe Data Pipeline integration.
- No Cloudflare Queue, Durable Object, or new background processing surface.
- No custom observability vendor or logging SDK.
- No automatic scraping of Stripe Dashboard/Workbench logs.
- No retroactive rewriting of existing active Product IDs.
- No PRD live provider mutation before the production gate opens.

## Decisions

### Use Stripe Workbench/request logs as manual forensics, not runtime dependency

The implementation should document exact Stripe Dashboard/Workbench searches for unexpected catalog mutation:

1. Filter around the suspected timestamp.
2. Search event types such as `product.created`, `product.updated`, `price.created`, and `price.updated`.
3. Open the event and record safe fields: event ID, event type, created time, resource kind, redacted Product/Price ID, `request.id`, `request.idempotency_key`, metadata identity, and lookup key.
4. Use request logs to inspect endpoint, source, method, status, API key label if visible, IP, API version, and related request ID. For catalog creation incidents, start with `POST /v1/products` and `POST /v1/prices`.
5. Compare those fields with Worker logs, catalog verify/apply report output, and D1 mappings.

Rationale: Workbench is the native diagnostic surface for request attribution. Building a local replica is unnecessary and incomplete. The local repo only needs to emit handles that make Workbench search precise.

Alternative considered: build a Stripe-log ingestion job. Rejected; Stripe Events only cover event objects and the deeper request-log surface is Dashboard/Workbench-oriented. For this use case, docs plus local correlation fields are enough.

### Make Product/Price create shape intentional

Catalog code should prefer the current explicit shape when provisioning a new catalog entry:

1. Create or restore the intended Product.
2. Create the Price against an existing Product ID.

If a future flow uses `prices.create.product_data` or `products.create.default_price_data`, that flow must be named, logged, and tested as a combined Product/Price create.

Rationale: The incident involved unexpected catalog recreation. Stripe's API supports convenient combined creation, but convenience makes duplicate Product/Price creation harder to spot in review and forensics.

Alternative considered: ban Product creation entirely in catalog apply. Rejected because a reset sandbox or first-time catalog apply needs to create Products when no active owned Product exists.

### Keep lookup key and metadata as the stable catalog identity

The canonical Stripe identity remains:

```text
Price.lookup_key = blackbox:{env}:{storeItemSlug}:{variantId}
Product.metadata.appEnv = {env}
Price.metadata.appEnv = {env}
Product/Price metadata.sourceId
Product/Price metadata.sourceKind
Product/Price metadata.storeItemSlug
Product/Price metadata.variantId
```

The verifier should treat a Product/Price as BlackBox-owned when metadata or lookup key identifies it. Active owned objects that are not in the current expected catalog should be reported as owned-orphan drift. Environment mismatches should be reported as foreign-environment drift, not silently repaired.

Rationale: Price IDs are generated by Stripe, and Products already exist with Stripe-generated IDs. Lookup keys and metadata are the native Stripe features that survive replacement Price flows and let us find current objects.

Alternative considered: make deterministic Product IDs the main identity. Rejected for existing objects because Product IDs are creation-time identifiers and retroactive migration would churn active catalog state. The implementation may use deterministic Product IDs only for fresh recreate/import flows after validating allowed characters and collision behavior, but Product ID must not become the only identity signal.

### Add orphan owned-object detection before cleanup

Catalog verification should scan active and inactive Prices/Products enough to answer:

- Which expected variants are missing or ambiguous?
- Which BlackBox-owned active Prices/Products are outside the current expected catalog?
- Which objects use legacy `blackbox:sandbox:*` or stale UAT naming?
- Which owned objects identify the wrong Product Environment?

Rationale: The incident was not only missing expected objects; it was unexpected objects returning. A clean catalog state needs both sides: expected exists, unexpected absent.

Alternative considered: rely on Stripe Dashboard counts. Rejected because counts cannot classify ownership, environment, or current Store Item membership.

### Treat idempotency keys as retry protection only

Catalog mutation idempotency keys should stay deterministic by logical mutation:

```text
blackbox:catalog:{env}:{variantId}:{action}:{identity}
```

`identity` must change when the intended amount, currency, Product Projection, repair target, or mutation purpose changes. Child API calls may suffix stable operation names like `:product`, `:price`, `:restore_product_{priceId}`, and `:release_lookup_{priceId}`.

Reports and logs should include either the full safe key or a stable hash plus the key fields. Since current keys contain app-owned identifiers and no secrets, they are safe enough for maintainer-facing local reports, but persistent Worker logs may use a hash if log cardinality or privacy becomes a concern. Where the Stripe SDK or API exposes request metadata, local evidence should capture request ID and replay status.

Rationale: Stripe idempotency protects API retries. The reconciler must still search by lookup key/metadata before creating anything because Stripe can prune idempotency keys after at least 24 hours and independent scheduled/apply runs are not retries. Independent runs need run IDs and workflow/concurrency controls; they must not depend on Stripe idempotency as a distributed lock.

Alternative considered: use random UUID idempotency keys on every mutation. Rejected because it would make retry correlation weaker and would not prevent duplicate creates after transient failures.

### Keep Stripe object IDs redacted, but preserve useful correlation

Reports should continue redacting `prod_...`, `price_...`, `evt_...`, and endpoint IDs unless a local operator-only evidence file explicitly needs full IDs and is ignored. Safe public-facing docs should refer to app-owned identifiers, lookup keys, timestamps, event types, request IDs when safe, and redacted Stripe IDs.

Rationale: Provider IDs are useful for diagnosis but should not be committed or pasted into public docs. The existing redaction policy should be extended, not replaced.

Alternative considered: print full IDs in CLI reports because they are not secrets. Rejected because the repo already treats full provider IDs as sensitive evidence and the gain is small.

## Risks / Trade-offs

- [Risk] Stripe Events older than 30 days are unavailable through the Events API. -> Mitigation: local reports, Worker logs, ignored evidence exports, and backup snapshots must hold the catalog run context we need beyond the Stripe event window.
- [Risk] Workbench/request logs are manual and permission-dependent. -> Mitigation: docs list exact fields and filters; restricted Stripe access must be tested in UAT before delegating cleanup to operators.
- [Risk] A Price create accidentally provisions a new Product through `product_data`, or a Product create provisions a default Price through `default_price_data`. -> Mitigation: keep create shapes explicit, add regression tests, and report combined Product/Price creation as a distinct action.
- [Risk] Metadata-only identity can be malformed by Dashboard users. -> Mitigation: verifier reports malformed or missing identity and refuses checkout on ambiguity.
- [Risk] Deterministic idempotency can replay an old result if the identity string is too broad. -> Mitigation: tests prove identity changes when meaningful mutation inputs change.
- [Risk] Idempotency keys can exceed Stripe's maximum key length or hide request-shape changes. -> Mitigation: centralize key building, enforce a length guard, and include a request-shape fingerprint in the identity.
- [Risk] A failed Stripe request can replay a stored `500` response. -> Mitigation: failed apply recovery must rerun verification against current Stripe state and inspect request IDs rather than blindly retrying forever.
- [Risk] Orphan detection can accidentally target objects from another product environment. -> Mitigation: dry-run first, environment mismatch classification, and apply must mutate only confirmed BlackBox-owned objects.
- [Risk] Adding too much logging creates noisy Worker logs. -> Mitigation: log summaries and counts for scheduled verification; reserve per-variant detail for local CLI reports or warning/error cases.

## Migration Plan

1. Audit current catalog identity and idempotency helpers against the documented contract.
2. Add focused tests for lookup-key/metadata identity, foreign-environment detection, owned-orphan detection, and idempotency identity changes.
3. Confirm current-state reconciliation uses Stripe list/retrieve APIs for authority and reserves Stripe Search for diagnostics/backfill.
4. Centralize Stripe catalog idempotency key construction if the audit finds duplicated builders, with a length guard and request-shape fingerprint.
5. Extend catalog verify/apply report formatting with safe forensics fields and Workbench search hints.
6. Extend Worker scheduled verification logs with summary correlation fields only.
7. Update UAT docs with Workbench/Event runbook steps and exact fields to capture before manual cleanup.
8. Run targeted backend/script tests, then `pnpm test:unit`, `pnpm check`, and `pnpm build` for behavior changes.
9. Validate the OpenSpec change.

Rollback:

- If report output becomes noisy, keep the underlying checks and reduce the default report detail behind a `--verbose` or evidence-file flag.
- If orphan detection misclassifies a legitimate object, pause apply, fix identity classification, and rerun dry-run before any cleanup.

## Open Questions

- Should local CLI reports print the complete idempotency key or only a stable hash plus fields?
- Should deterministic Product IDs be adopted only after the next full sandbox recreate, or skipped entirely because lookup key and metadata are sufficient?
- Which Stripe role/permission set lets maintainers view request logs and event request details without broader account administration access?
