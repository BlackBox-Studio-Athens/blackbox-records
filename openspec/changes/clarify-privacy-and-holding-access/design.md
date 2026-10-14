## Context and scope

Base: `dfea9e105f51e7e472dc08e535a479e7dbb2186b`. Worktree explicitly authorized. The superseding user instruction assigns all UI, including rendered text, to Claude Desktop. This change prepares routing/build checks and a reviewable editorial handover only.

## Decisions

1. Use exact 302 redirects in the isolated Holding artifact's `_redirects`. They reuse the accepted CMS notices on the existing technical PRD origin and avoid a stale static legal copy, a new Worker, or broad proxying. Both slash forms resolve. The destination is the existing full-site legal page, whose own navigation can reach the already-public technical shop; this does not route shop paths on the apex. A same-origin standalone legal layout would be a different UI/routing change and is not implemented here.
2. Artifact validation requires exactly these four entries and rejects any additional redirect or copied shop HTML. `workspace:test-release`'s existing `releaseTests` input list explicitly hashes both app scripts executed by the fixture; its `scriptRuntime` inputs do not otherwise cover them. No change to index, 404, script stripping, CSP, noindex, asset closure, deployment workflow, DNS, checkout or launch flags.
3. Keep privacy editorial changes in the current CMS publication path. The pending fixture is not the live policy and must not replace the accepted controller/contact information. Handover copy is a draft; saving and publication need their own owner authority and exact revision review.
4. Retention disclosure is not a deletion feature. Source proves 12-month availability-alert cleanup, deletion after successful/final failed sends, and persistent browser cart clearing on empty. It does not prove scheduled erasure of orders, withdrawals, inquiries, newsletter contacts or provider mailboxes. No destructive cleanup is added without an adopted schedule and legal-hold rules.
5. Provider terms are evidence of available mechanisms, not evidence of the owner's account acceptance or an adequate transfer assessment. Never claim EEA-only storage or general GDPR certification. Stripe's separate-controller purposes remain distinct.

## Verification and limits

The scoped regression executes the actual preparation/check scripts in a disposable fixture, checks unchanged holding HTML and exact legal redirects, and rejects catchall/shop forwarding and extra shop HTML. It is not a Cloudflare routing emulator. Hosted 302 status, query handling, public destination health, and absence of platform-injected analytics require a separately authorized bounded Holding acceptance after deployment. UI discoverability, mobile/keyboard treatment and CMS publication remain Claude/owner acceptance.

After switch-day finalization, `pages.dev` may redirect back to the apex. The Holding artifact must then be retired/refreshed before any rollback to avoid a policy redirect loop. `launch-switch-day` already owns Holding retirement; this change does not execute it.

## Approved Holding link (owner, 14 October 2026)

Preview v3 approved one quiet muted PRIVACY link in a separate "Legal" navigation under the contact actions, linking `/privacy/` (served by the prepared 302). Terms is not linked from Holding because Holding sells nothing; the `/terms` redirects remain for saved URLs. `check-prd-holding.ts` accepts `/privacy/` as the only relative anchor and requires it; `scripts/holding-legal-routes.test.ts` covers both.
