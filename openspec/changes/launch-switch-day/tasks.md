# Tasks

Tags: `[Claude]` contains UI work; `[Claude or Codex]` has none; `[Owner]` needs the owner's sign-in, credentials or a purchase. This change has no UI work. Requires `prepare-launch-switch` to be complete.

## 1. Switch day

- [x] 1.1 [Owner] Cutover executed in [run 38888410766](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38888410766), PRD release 595, SHA `3e8ee282270c30ee61376de7a443f9bb3fa7f278`. Preserve its `launch-state` rollback snapshot. Home/TLS passed and the apex remained live; the run failed only because the stale fallback check waited for a hero still deliberately hidden behind film. This does not claim a green cutover run; see `validation.md`.
- [ ] 1.2 [Owner] Do the printed manual steps: submit the sitemap and request indexing for Home and Store in Search Console, re-scrape the apex in Facebook Sharing Debugger and LinkedIn Post Inspector, confirm the Stripe Dashboard business website and policy URLs.
- [ ] 1.3 [Owner] Make the first real sale; [Claude or Codex] confirm the paid order, the order email, the stock decrement and the staff order view.
- [ ] 1.4 [Owner] After 24 hours, run `pnpm launch:switch -- finalize`; keep its summary path.

## 2. After launch

- [ ] 2.1 [Claude or Codex] Remove the one-off schedule from `launch-switch.yml`; retire the Holding Page workflow, branch, source, artifact and `noindex` remnants; remove `pages.dev` from PRD allowed origins and return URLs; update the environment model, catalog promotion and holding-page specs and docs.
- [ ] 2.2 [Claude or Codex] Record the cutover and finalize evidence; run strict OpenSpec validation and `pnpm validate`; archive this change.

## 3. Replaced changes

- [x] 3.1 [Claude or Codex] Moved `production-go-live-readiness` 6.5a, 6.6 and 6.7 here and archived it as `2026-10-16-production-go-live-readiness`, creating its launch-readiness baseline. `share-brand-card-link-previews` was already archived on 2026-10-14; its pending 2.3 social re-scrape is owned by task 1.2 here.

## 4. Authorized post-launch preparation, 2026-10-16

- [x] 4.1 Restore automatic analytics in an isolated commit with focused regressions and reconciled contracts: `29dccd9fb5692be2c0a07ce50bf8327652ccd4e6`.
- [ ] 4.2 Promote only the authorized analytics candidate after a green push run and exact ancestry verification; record release/Home identity and set `prd-launch` `LAUNCH_ACCEPT_RELEASE`. Blocked: extra concurrent commit `42f0c60a` precedes analytics and subsequent main pushes supersede its run. No promotion or variable write authorized for those candidates.
- [ ] 4.3 Complete archived `add-site-analytics` 1.6 after the analytics release: beacon, shell page view and no analytics cookie; also verify no chapter pause control and Home 200/current SHA.
- [x] 4.4 Corrected visible-image fallback and added explicit reviewed-release acceptance with regressions. Prepared the guarded 2026-10-17 10:45 UTC finalize schedule after artwork readiness passed (99 active products, 98 distinct compliant/responding images). A scheduled run refuses a missing/malformed accepted SHA before invoking launch. No real finalize/rollback run in this session.
