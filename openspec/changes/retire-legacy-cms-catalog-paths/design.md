## Context

See proposal.md. EmDash cutover is accepted; dormant pre-cutover paths still affect tests, builds and release selection. Published distro without commerce setup must remain browsable.

## Goals / Non-Goals

Remove legacy execution paths while preserving runtime identities, publication ordering, stock, prices, orders, backups and Access. No shopper launch or commerce migration is authorized by cleanup.

## Decisions

- Reuse the existing source contract loader only in explicit migration/recovery and fixture commands. Remove routine deployment seed/sync rather than treating repository content as current catalog state.
- Keep the runtime projection reader interface, deleting its compiled implementation.
- Generate readiness SQL on explicit command invocation; install and ordinary validation must work without generated catalog files.
- Require a new release manifest version with combined CMS digests. Reject older candidates and remove staff Pages and commerce-only deployment selection.
- Delete Sveltia routes entirely, verifying HTTP 404. Keep staff assets built into the combined Worker.
- Inventory external identities and consumers before retirement. Preserve the live staff Worker hostname and retain combined release recovery evidence before deleting the detached Pages project.

## Risks / Trade-offs

- Repository recovery inputs may be stale: label them explicitly and retain reviewed apply gates; never invoke them in software release.
- Artifact contract changes invalidate old candidates: require a fresh accepted UAT candidate and verify combined CMS contents.
- Pages history deletion is irreversible: retain a usable combined Worker recovery artifact and exact-resource evidence first.

## Migration Plan

Implement and test locally, accept a fresh UAT candidate, promote that exact candidate with checkout disabled, verify staff and publication, then retire confirmed external resources. Record actual outcomes; do not mark pending hosted work complete.
