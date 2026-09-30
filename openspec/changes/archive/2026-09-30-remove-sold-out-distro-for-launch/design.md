## Context

PRD's accepted R2 snapshot is authoritative. Ordinary native unpublish only withholds checkout; the staff plugin deliberately blocks permanent deletion. See proposal.md for the one-time authorization.

## Goals / Non-Goals

Delete exactly the four red-highlighted editions. Do not add a stock-based visibility filter, a staff deletion feature, a software deployment or Stripe writes.

## Decisions

- Use a standalone administrator script with installed Wrangler remote bindings and native EmDash deletion handlers. The normal staff policy remains intact.
- Bind its saved plan to the accepted pointer/checksum and exact CMS revisions. Preserve the accepted baseline rather than recapturing current CMS publication state.
- Prune removed Store Item identities and unused manifest media, retain original media/backups, validate the candidate using the existing renderer, then conditionally activate it.
- Reserve a CLI-owned publication journal row outside normal runtime processing. Confirm the new public identity before finalizing its Live receipt and purging CMS records. Keep per-record checkpoints for recovery.
- Refuse unexpected order/reservation/reference dependencies. Withhold any linked selling identities without changing physical stock or provider prices.

## Risks / Trade-offs

Concurrent publication or editing: reject a changed baseline/revision. Partial completion: retain an ignored checkpoint and backup, resume the same operation. CMS purge uses native cleanup for revisions and related metadata; immutable earlier snapshots and media remain recovery evidence.

## Migration Plan

Rehearse in an isolated Local fixture, measure a bounded PRD read pilot, review the generated exact-four plan, apply the user's authorization and verify public absence plus preservation. No deployed software migration is needed. Record checks and measured hosted use in evidence.md.
