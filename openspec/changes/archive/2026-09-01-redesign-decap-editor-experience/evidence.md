# Acceptance Evidence

Date: 2026-09-01

## Accepted behavioral tree

- Commit: `55f69d7c6aa4415662f119e6fb89f6a3c753ec7b`
- Local gates on the exact tree: `pnpm test:unit`, `pnpm check`, and `pnpm build` passed.
- This behavioral commit is the launch-catalog evidence reference. The later archive-only commit does not replace it.

## Static deployment

- Workflow: `pages.yml`
- Run: [33513979001](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/33513979001)
- Head SHA: `55f69d7c6aa4415662f119e6fb89f6a3c753ec7b`
- Result: unit tests, workspace checks, hosted UAT build, GitHub Pages UAT deployment, hosted PRD build, and disabled PRD static deployment passed.
- Scope: normal static deployment only. This evidence does not authorize production launch, native checkout, or other live commerce mutation.

## Focused UAT smoke

- `cms_assets`: [33514374291](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/33514374291)
  - Head SHA: `55f69d7c6aa4415662f119e6fb89f6a3c753ec7b`
  - Result: deployed-commit checkout, Playwright setup, focused UAT smoke, and evidence upload passed.
- `cms_admin`: [33514591960](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/33514591960)
  - Head SHA: `55f69d7c6aa4415662f119e6fb89f6a3c753ec7b`
  - Result: deployed-commit checkout, Playwright setup, focused UAT smoke, and evidence upload passed.

## Owner no-publish walkthrough

- Status: passed in the authenticated hosted UAT CMS through the authorized owner's Chrome session.
- New Artist: no visible Slug field or override action.
- New Store Item: task-first editorial field order remained intact; no price, stock, checkout, order-processing, fulfillment, Stripe, D1, or operator-auth control appeared.
- Existing Store Item image: collection-owned media selection, replacement, and preview worked; the original image was restored before leaving the editor, leaving no unsaved change.
- New Release: title, Artist relation, cover media, alt text, release date, formats, and public-copy controls were enabled and usable.
- No Save or Publish action was selected. Fresh CMS editor tabs produced no unexpected page or console error and no task-blocking usability defect was found.
- Evidence is intentionally redacted: no account identity, tokens, private-data screenshots, or provider payloads are recorded.
