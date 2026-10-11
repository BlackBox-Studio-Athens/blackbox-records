# Design

## Decisions

Keep immutable content snapshots and the publication journal. Pin one or up to twenty selected saved revisions in a durable request before native publication. Process requests in order per environment, persist progress, and resume interrupted work using Durable Object alarms. Prepare a candidate from the current public snapshot, changing only the selected records and required catalog identities. Reuse already verified media and validate/copy newly referenced media only. Activate the immutable snapshot with a conditional current-pointer write; reconcile journal acknowledgement after interruptions.

The public Astro renderer reads only accepted snapshots. A Pages gateway preserves existing pages.dev origins and static assets; a separate public Worker uses the existing Durable Object rendering pattern. Cache pages by code version, content digest and path; current-pointer freshness is bounded to five seconds. Draft preview remains a separate private reader. Dynamic routes resolve request slugs and preserve their existing metadata, overlays and interactive behavior.

Public delivery and CMS publication are environment-specific. Items retains its native publication guards and passes approved revisions to the same processor. Code releases retain reviewed artifact promotion and never replace newer published content. Routine editorial publication needs no GitHub credentials or deployment.

## Recovery and rollout

Bootstrap from each environment's accepted snapshot. Retain prior code artifacts for investigation; content rollback must deliberately select an accepted snapshot rather than restoring stale static content. Validate Local, then quota-budgeted UAT, then promote the exact accepted bundle to PRD. No live catalog mutation or checkout launch. Retain export/restore for backup while retiring build-on-publish after cutover.

## Acceptance

Publish-to-verified fresh public response p95 at most sixty seconds for text, linked content and new media under normal service. Duplicate requests, disconnects, object restarts, concurrent requests, unrelated drafts and lost acknowledgements cannot lose an accepted request or replace newer public content with an older completion. Measure Free-tier requests, storage operations and rendering CPU before hosted rollout.
