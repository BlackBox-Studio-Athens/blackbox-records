# Design

## Context

See proposal.md. Both site-form and checkout newsletter consent converge on the email runtime provider. Alerts use D1 leases and transactional Resend sends. Work is isolated at baseline `dfea9e105f51e7e472dc08e535a479e7dbb2186b`; all website UI and rendered-copy changes belong to Claude Desktop.

## Goals / Non-Goals

Prove mailbox ownership before marketing activation; make alert withdrawal self-service and safe under delivery races. Reuse D1, Web Crypto and existing transactional routing. No account system, dependencies, bindings, real sends, provider administration, publication, deployment, tax changes or launch decisions.

## Decisions

- Wrap newsletter registration at email runtime composition so site and paid-order opt-ins share verification. Order and inquiry email send methods remain unchanged.
- HMAC-SHA256 derives a 256-bit capability from a random challenge UUID and existing server-only provider key. Persist only its SHA256 hash plus the challenge ID and original request. This lets failed confirmation sends retry under identical token/body/idempotency key without retaining raw capabilities. Previously delivered links verify independently of key rotation; unsent retries across key rotation fail closed.
- A D1 atomic batch reserves at most twenty new consent-link messages per UTC day, separately from alert-delivery's forty-per-Athens-day budget. Unconsumed recipient/purpose requests within one hour reuse an unsent attempt or acknowledge a sent attempt without another message. A consumed alert link allows a fresh capability for a later request. Exhausted budget returns a generic unavailable result independent of membership. These are conservative operational limits, not legal periods or verified account quota guarantees. Existing provider suppression is never removed.
- Newsletter capability lasts 24 hours. Consume before activation; partial/unknown activation failure requires a fresh link after cooldown. This deliberately avoids retrying an old opt-in after a later unsubscribe. Provider updates and creates omit the global `unsubscribed` field. Confirmed Topic activation cannot override an existing global unsubscribe. Existing globally unsubscribed users must use their provider preference flow/support; the UI must not promise reactivation.
- Alert links apply to all pending alerts for that address and last up to twelve months, aligned with the existing alert retention. Recovery issues links without a membership lookup. New public alert inserts require a delivered, live withdrawal capability in the same D1 transaction. Withdrawal atomically invalidates all existing withdrawal capabilities for the mailbox and deletes pending/sending rows, so an older token cannot let a paused registration insert after withdrawal. Other tokens are invalidated first, then alerts deleted, then the presented token consumed; its unchanged identity anchors every statement in the batch. Leases guard stale reschedule/delete; the final lease read suppresses preparation work already canceled when that read occurs. Capacity checks and duplicate detection share one transaction so concurrent queue changes cannot open a membership oracle.
- Tokens travel only in link fragments and POST JSON. GETs never mutate consent. Claude owns `email-preferences/`, removes the fragment before loading third-party surfaces, sets no-referrer/no-store/noindex and requires an explicit button action.
- Pruning runs on link requests and before provider setup in the existing delivery schedule, so missing credentials do not prevent cleanup. Newsletter evidence expires at 24 hours; alert capability records are removed when no alert remains after the one-hour cooldown. Final alert delivery also removes now-unneeded management records in the same transaction. Daily attempt counts retain thirty days without addresses. Published privacy copy must explain these operational additions before release; source fixture placeholders are not live editorial data.

## Risks / Trade-offs

- In-flight delivery race: withdrawal can commit after the final D1 lease read and before or during provider submission. A message already being processed may still arrive. Deleted rows cannot be retried or recreated by stale delivery work. Do not promise that every message not yet submitted stops, or zero post-click emails.
- Anonymous send abuse: fixed daily/recipient caps bound email cost, but a deliberate distributed flood can consume the public link budget. No new paid anti-abuse service is introduced.
- At the send cap/cooldown the public response is generic; users may need to try later. Existing valid cancellation links remain usable during provider outages.
- New migration `0036_email_consent_capabilities.sql` follows existing `0035_order_dispatch.sql`. Sibling worktrees may independently allocate 0036: parent must reconcile numbering before combining.
- API/backend work alone is not user-facing completion: Claude's page, truthful form copy, reviewed privacy publication and browser acceptance remain outstanding. No UI source edits by Codex.

## Migration Plan

Apply the additive D1 migration through existing release tooling only after parent review and separate release authorization. Coordinate migration numbering. Integrate Claude's page/copy and accepted CMS privacy amendment in the release candidate. A rollback must not restore the old unverified unsubscribe reset; use a reviewed forward fix or temporarily reject newsletter activation. No data backfill or provider resubscription is authorized.

## Sources

- [GDPR Article 7(3), official consolidated regulation](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng): withdrawal must be as easy as giving consent; demonstrate consent. This is a technical design inference, not a legal compliance certification.
- [Greek DPA electronic marketing guidance](https://www.dpa.gr/el/enimerwtiko/thematikes_enotites/proothisiproiontwn/hlektronika_mesa_proothisi) and [Directive 2/2011](https://www.dpa.gr/el/enimerwtiko/prakseisArxis/ilektroniki-sygkatathesi-sto-plaisio-toy-arthroy-11-toy-n-34712006): prior explicit consent and easy/free objection. Mailbox confirmation is the selected anti-abuse mechanism; no claim that double opt-in is universally mandatory.
- [Resend Contact update](https://resend.com/docs/api-reference/contacts/update-contact), [creation](https://resend.com/docs/api-reference/contacts/create-contact), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
- [Cloudflare D1 batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch): ordered statements commit or roll back as one transaction.

Context7 was attempted but unavailable due to its monthly quota. Official provider documentation and the pinned SDK are the fallback evidence. CodeGraph reported this worktree unindexed. Graphify was rebuilt and focused undirected paths established the newsletter and alert seams; exact source reads confirmed behavior.
