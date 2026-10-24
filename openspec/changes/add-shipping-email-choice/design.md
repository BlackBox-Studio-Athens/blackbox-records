# Design

## Context

See proposal.md for motivation. D1OrderDispatchRepository already commits the dispatch mark and shipping outbox insertion in one D1 batch. Staff orders consume generated protected API contracts. The selected UI is an exact extension of existing dispatch controls; Codex owns all implementation under the explicit user override.

## Decisions

- Add optional `sendShippingEmail` (default true) to the dispatch request. Preserve existing clients and authenticated same-origin checks.
- Add a checked integer `shippingEmailSuppressed` column (default 0) to raw D1 OrderDispatch, mapping it to a boolean in the domain and protected response. A persisted flag avoids inventing a failed/delivered email row or widening the closed delivery statuses.
- Set suppression only on a successful shipped mark requesting no email and lacking an existing shipping delivery. Keep suppression sticky on all later writes. Guard queue creation with both the dispatch compare-and-set result and persisted suppression. Existing queued/sent/review deliveries always retain their history.
- Re-read the saved mark before immediate delivery so the persisted choice, including an earlier opt-out, controls email processing. Scheduled recovery remains unchanged because suppressed orders have no shipping outbox row.
- Use the existing native checkbox/Staff styling directly before Mark shipped. Key dispatch controls by order identity to reset local state when switching orders without resetting on refresh. Show the saved skip in Notifications and saved email outcomes after undo; existing deliveries take display precedence.
- Keep the timestamp meaning unchanged: when staff recorded the mark, not a backdated carrier event. No resend/cancel action or carrier integration.

## Risks / Trade-offs

- An existing email can be in flight: hide the choice when a delivery exists and preserve its outcome rather than promising cancellation.
- Old Worker code does not honor suppression: migrate before deploying the updated Worker and expose the Staff choice only after its response includes the new boolean. Rollback must retain suppression-aware dispatch code; do not re-mark opted-out orders using older code.
- Local fixtures prove UI and controlled provider behavior only; hosted acceptance and release identity remain separate gates.

## Migration Plan

Add the next commerce SQL migration without changing existing rows beyond default false. Preserve paid facts and all outbox history. Validate locally, then use normal UAT/PRD release gates with migration before Worker and Staff exposure. No backfill or mutation of the real order; the user performs its silent mark after production acceptance.
