# Validation

Product Environment: Local only. No UAT or PRD work, hosted publication or live price operation was performed.

## Acceptance rows

- **Staff/editor:** applies. `pnpm validate:editor` Chromium and Firefox journeys cover one Publish changes on the Price & stock tab, the removed shop and price buttons, an EmDash price draft that survives leaving without a dialog, the header list of changes not live, the review's price and shop checkout rows, undo, and immediate stock actions. `node --import tsx scripts/test-content-workspace.mjs --selling` covers first pricing as a draft, reload, the review with the unchecked first-sale option, undo and 320px layout.
- **CMS/publication:** applies to the plugin and discovery. Worker tests cover the `price-drafts` route (compare-and-set conflicts, shape and provider-field rejection, `content:afterDelete` cleanup), discovery through `handlePluginApiRoute`, draft-only entries in `view=changes`, and the CMS guard allowlist.
- **Commerce/checkout:** partial. Unit tests cover the price command order, retained operation reuse, live-price conflicts, rejected attempts and the publish plan. The Local price command and item publication were not run end to end: every Local release reported a pre-existing "price binding needs administrator review", and the full `pnpm dev` stack could not start because another worktree's preview owns port 4321.
- Shell/player and Release/environment rows do not apply.

## Local runtime observations

Against `pnpm dev:backend:mock` on 127.0.0.1:8787 (real EmDash runtime, `blackbox-editorial` plugin):

- `PUT /_emdash/api/plugins/blackbox-editorial/price-drafts` saved a draft with the operator attribution; a stale revision returned 409; a provider field returned 400; a request without the EmDash CSRF header returned 403.
- `GET /_emdash/api/blackbox/workspace?view=changes&scope=catalog` listed the published release with only a price draft, with `priceDraft` attached.
- EmDash reads DELETE route input from the query string. This was found on the real runtime and fixed in the staff client and fixture; a stale DELETE returned 409 and the current revision deleted the draft.

## Code review follow-up

A high-effort review found ten issues; all were fixed and the types were tightened so the contradictory states cannot be expressed:

- First sale is offered even when nothing else is pending.
- The item step waits for a required content batch to go live.
- Draft saves are serialized.
- A failed selling read falls back to website-only publication.
- Blocked price attempts explain themselves and lock Undo.
- A draft may wait for its format.
- Pending, failed or review-required shop updates show a recovery.
- The stale banner stays off the progress view.
- An unavailable draft store degrades workspace reads.
- Draft list reads include revisions, so the editor reuses them.

The unit, worker and render tests, the editor journeys in Chromium and Firefox, and the selling journey passed after these changes.

## Remaining verification

- Publish a staged price and an on-sale item publication on a Local stack with valid price bindings, then on UAT under the existing release process.
- Hosted Free-tier note: draft saves are debounced single D1 writes through EmDash plugin KV.

Final validation summaries are retained under `.codex-artifacts/validation/`.
