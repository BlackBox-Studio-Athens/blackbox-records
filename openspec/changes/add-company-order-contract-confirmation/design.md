# Design

## Context

See proposal.md. The current paid-order delivery model already has immutable order facts, a shopper-confirmation delivery kind, leases and bounded retries. Reuse those owners.

## Goals / Non-Goals

**Goal:** Add an order-bound, retained version of the required purchase information to the existing confirmation.

**Non-goals:** No implementation now; no company formation, VAT decisions, Stripe migration, new mail provider, generic document system or mandatory PDF generation.

## Decisions

- Bind an approved immutable content revision to the order when purchase terms are established. Resolve and retain that revision's content; a reference to an editable or deletable CMS record is insufficient. Do not select the latest terms at email-send time.
- Add the content to HTML and plain-text confirmation bodies. This keeps the result within existing email delivery; a PDF adds machinery without being required for this scope.
- Keep confirmation failures within the existing delivery/recovery path. Never roll back paid stock facts because legal content or email delivery failed. Define the operator's timely recovery procedure before rollout.
- Record the company-transition boundary and preserve historical seller facts. Do not backfill old orders with the new company's identity.
- Claude Desktop prepares any email presentation changes; Codex owns persistence/delivery changes and reviews the complete result. Obtain the owner's preview approval before non-text presentation changes.

## Risks / Trade-offs

- Incorrect company facts or incomplete copy → obtain owner-approved company identity and legally reviewed applicable information before implementation acceptance.
- Mutable/deleted revisions or retries after content changes → retain the original content and test revision changes and retry behavior together.
- Provider acceptance is not inbox receipt → record transport evidence separately from local rendering and operator recovery.

## Migration Plan

Start only after the company is operational and the owner requests implementation. Recheck current law, inspect the then-current order/content owners, select the smallest additive persistence change, verify Local and authorized provider scenarios, and obtain separate release approval. Keep historical snapshots and delivery evidence during rollback; do not erase them or silently replace company confirmations with incomplete messages.
