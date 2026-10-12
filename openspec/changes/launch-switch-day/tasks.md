# Tasks

Tags: `[Claude]` contains UI work; `[Claude or Codex]` has none; `[Owner]` needs the owner's sign-in, credentials or a purchase. This change has no UI work. Requires `prepare-launch-switch` to be complete.

## 1. Switch day

- [ ] 1.1 [Owner] Run `pnpm launch:switch -- cutover`; keep its summary path.
- [ ] 1.2 [Owner] Do the printed manual steps: submit the sitemap and request indexing for Home and Store in Search Console, re-scrape the apex in Facebook Sharing Debugger and LinkedIn Post Inspector, confirm the Stripe Dashboard business website and policy URLs.
- [ ] 1.3 [Owner] Make the first real sale; [Claude or Codex] confirm the paid order, the order email, the stock decrement and the staff order view.
- [ ] 1.4 [Owner] After 24 hours, run `pnpm launch:switch -- finalize`; keep its summary path.

## 2. After launch

- [ ] 2.1 [Claude or Codex] Retire the Holding Page workflow, branch, source, artifact and `noindex` remnants; remove `pages.dev` from PRD allowed origins and return URLs; update the environment model, catalog promotion and holding-page specs and docs.
- [ ] 2.2 [Claude or Codex] Record the cutover and finalize evidence; run strict OpenSpec validation and `pnpm validate`; archive this change.

## 3. Replaced changes

- [ ] 3.1 [Claude or Codex] Mark `production-go-live-readiness` 6.5a, 6.6 and 6.7 and `share-brand-card-link-previews` 2.3 as moved here, then archive both changes.
