# Compliance UI handover for Claude Desktop

Owner: the coordinating Codex chat, **Audit site GDPR compliance**. Updated 14 October 2026.

This is the shared integration handover, not a second task tracker. Each workstream's OpenSpec change owns its requirements, tasks and evidence. Backend contracts and specialist handovers are still being prepared; the table below is not an implementation-ready approval.

## Responsibilities and approval

- Claude Desktop implements all public/staff UI changes, including rendered copy. Codex owns backend/data contracts, legal-source research, tests, integration review and this handover.
- Before changing a main screen beyond text, Claude must show a concrete preview and receive the owner's explicit approval. A handover or implementation prompt is not design approval. Follow the project's Impeccable gates.
- Keep the existing visual language and persistent player. Use existing components and layouts. Do not redesign the site.
- Work in `C:/Users/SVall/WebstormProjects/blackbox-records` on `main`, unless the owner explicitly authorizes another location. Read `AGENTS.md` and its imports first. Preserve unrelated changes. Use the guarded OpenSpec commands.
- Keep code delivery separate from CMS Content Publication, deployment and shopper launch. This handover authorizes none of those external changes.
- If Claude Desktop cannot access or edit the repository, say so. Ask the owner to attach the named documents and prepare a reviewable patch; do not pretend to have changed files or run tests. No Claude CLI is required or assumed.

## Workstreams

The directories below are temporary worktrees. Do not implement in them or copy unreviewed code into `main`. Codex will replace provisional entries with accepted commits, OpenSpec paths and exact contracts after review.

| Audit items | Scope                                                                              | Codex worktree                                          | Handover readiness                                      |
| ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| 2, 5, 10    | Retention and transfer disclosure; privacy access while the apex is a holding page | `C:/Users/SVall/.codex/worktrees/1100/blackbox-records` | Routing and handover reviewed and integrated; owner facts remain |
| 3, 4        | Availability-alert cancellation; verified newsletter registration/re-registration  | `C:/Users/SVall/.codex/worktrees/7df8/blackbox-records` | Pending API contracts, tests and review                 |
| 8           | Harmonised legal-guarantee notice, exact official asset/text and placement         | `C:/Users/SVall/.codex/worktrees/b107/blackbox-records` | Reviewed documents integrated; ready for Claude preview |
| 9           | Product identification and verified economic-operator information under GPSR       | `C:/Users/SVall/.codex/worktrees/9829/blackbox-records` | Pending data contracts, impact and review               |

Each specialist handover must identify its OpenSpec change and reviewed source commit; exact UI edit points and copy; public API request/response/error contracts; authentication, token and retry constraints; loading/success/error/expired/cancelled states where relevant; accessibility and browser acceptance; and unknown facts that remain with the owner. Do not implement against guessed endpoint names or fields.

## Reviewed package: findings 2, 5 and 10

Accepted source commit: `6ad7de5a399538fae810092434d09c1a4f0656e8`, integrated on `main` as `e935c6fd07926eafce65d6532c85ea6c4c449fe4`. Read [clarify-privacy-and-holding-access](../openspec/changes/clarify-privacy-and-holding-access/proposal.md), its [Claude handover](../openspec/changes/clarify-privacy-and-holding-access/handover.md) and [validation record](../openspec/changes/clarify-privacy-and-holding-access/validation.md).

The backend/build portion prepares only four exact temporary redirects for the two slash forms of Privacy and Terms. Parent review checked the scripts, disposable-fixture regression and the corrected cache inputs. Final worktree validation passed 23 selected tasks with matching fingerprint `8d3d7f7acc0fbf4a1819e0874a319d5618de0cf46a1d404f4b0f1eaa26158a05`, recorded in `.codex-artifacts/validation/2026-10-14T09-53-37-769Z-20244-99e155/summary.json`.

The destination is the existing full-site legal page on `pages.dev`, including its navigation to the technical shop. The redirect is not a standalone same-origin Holding document. Claude's preview must show that navigation consequence. Before a separately authorized Holding deployment or rollback, reconcile the redirects with switch-day retirement of the technical hostname to avoid a redirect loop. Hosted response behavior remains unverified.

Claude owns the Holding-link presentation and the actual privacy-copy amendment. The copy is a draft pending the owner's retention practices, relevant statutory periods, mailbox/provider settings, agreements and analytics assessment. Reconcile its newsletter/availability paragraphs with the final consent handover; never publish claims that cancellation or cleanup exists before the complete implementation is released. No general order-data deletion job or tax/launch gate is introduced.

## Reviewed package: finding 8

Accepted documentation commit: `57cf66e6f1228ad6690b68aade33b833c2a9bdde`, integrated into `main`. The eight files are exclusively in [add-harmonised-legal-guarantee-notice](../openspec/changes/add-harmonised-legal-guarantee-notice/proposal.md). Read its [Claude handover](../openspec/changes/add-harmonised-legal-guarantee-notice/handover.md), [legal research](../openspec/changes/add-harmonised-legal-guarantee-notice/legal-research.md) and [open implementation tasks](../openspec/changes/add-harmonised-legal-guarantee-notice/tasks.md).

Parent review checked the full documentation diff, the official Parliament/BOE sources and retained Greek Gazette extracts, and the final local validation summary. The worktree's final summary was `.codex-artifacts/validation/2026-10-14T09-05-14-602Z-49732-f59f39/summary.json`, status `passed`, mode `local`, with identical before/after fingerprint `d2c1483735d10a7fac6ab4260184d9b6dd8e902dfe007323f848aff37afe860e`. It establishes documentation preparation only.

This package needs no new API, database field, consent or checkout rule. Claude can prepare its preview using the proposed Store/checkout reminder, complete unmodified official RGB notice, Greek/English access and accessible transcript. Official asset selection/hashes, approved placement, UI implementation, browser acceptance and any content publication are still open. No design approval or compliance certification is implied. Keep the other workstreams pending until their backend contracts and reviews are complete.

## Facts and boundaries to preserve

1. The owner intentionally plans a small initial launch as a natural person, without business commencement, accepts the risk, and plans a later company with an appropriate KAD and replacement Stripe account. Do not change VAT, checkout or launch gates as part of these UI tasks. This decision is not evidence of a tax exemption or legal compliance.
2. Item 6, the seller telephone/registration-information finding, is explicitly unchanged.
3. Item 7 is deferred in [add-company-order-contract-confirmation](../openspec/changes/add-company-order-contract-confirmation/proposal.md). Do not implement it now. Deferral does not remove a present consumer-information obligation.
4. The owner states that existing own releases were pressed by dunk!pressing. A pressing plant is not automatically the legal manufacturer. Do not apply that fact to every distro item or future release, and do not invent legal names, postal addresses, electronic contacts or safety claims.
5. The audit found actual controller information in the published CMS privacy notice. The repository's purchase-information fixture still contained placeholders. Do not overwrite live editorial facts with fixture data, treat fixture edits as publication, or claim new copy is live.
6. Do not promise fixed deletion periods, automated deletion, EEA-only storage, accepted processor agreements or transfer safeguards without supporting evidence. Preserve statutory retention and legal holds. Explain precise, supported criteria where a fixed duration is not known.
7. Do not call a decorative label a legal-guarantee notice or add the optional GARAN label without qualifying commercial-guarantee evidence. Use the official required format if applicability is established.

## Claude sequence

1. Read this document, the linked OpenSpec workstreams and their final specialist handovers. Check the source commits match the reviewed contracts. Unready workstreams may be explored but not treated as approved implementation contracts.
2. Present the smallest coordinated screen proposal: exact copy, affected screens, existing components, and previews for non-text changes. Identify unanswered factual questions separately. Wait for explicit approval before non-text UI implementation.
3. Implement approved UI only, with the existing architecture and real backend contracts. Do not replace missing endpoints with success mocks, add unsupported claims, or silently relax backend checks.
4. Run the scoped tests and `pnpm validate` required by `docs/agent-workflow.md`. Check keyboard use, focus, errors and narrow screens; run player/navigation continuity checks where affected. Record source-bound evidence in the owning OpenSpec change.
5. Return changed files, commit identity if committed, checks and their evidence paths, screenshots/preview, unresolved facts and publication/release state. Codex reviews before integration or release. Do not mark legal or hosted acceptance complete from local tests alone.

## Prompt for Claude Desktop

```text
Work on BlackBox Records in C:\Users\SVall\WebstormProjects\blackbox-records. Read AGENTS.md and docs/compliance-ui-handoff.md first, then the final specialist handovers and OpenSpec changes it links. You own the UI implementation for audit findings 2, 3, 4, 5, 8, 9 and 10. Codex owns backend work and integration review. Follow the exact reviewed contracts and preserve all scope limits in the handover.

Start by checking handover readiness. Prepare one coordinated proposal with exact copy and concrete previews. Before any non-text UI change on a main screen, show me the preview and wait for my explicit approval. Do not treat this prompt as design approval. Do not change tax settings, checkout/launch gates, item 6, or the future company-order-confirmation change (item 7). Do not deploy, push or publish CMS content.

After approval, implement the approved UI, run the relevant repository checks, update the owning OpenSpec tasks/evidence, and return a concise handover for Codex review. If you cannot access or edit the repository from Claude Desktop, state that limitation and ask me to attach the named handover documents; do not claim to have edited or tested anything.
```
