# Validation

Product Environment: Local. UAT (task 4.3) and PRD promotion are not run here; they wait for the maintainer's release gate.

## Repository gates (4.1)

- `pnpm validate`: passed, `mode: local`, source SHA `1e3765748ecc2d3c408125a74ea9ba1b6392be4f`, before and after fingerprint `45a36ca8825f798ceb62c03a8dc9243e784e743a0f9f8bbd42c3db7d3f8b52aa`, no source changes during the run. Summary: `.codex-artifacts/validation/2026-10-13T19-31-01-231Z-25768-d71ba8/summary.json`. The fingerprint covers the uncommitted documentation edits; documentation and OpenSpec change files leave the cached code tasks valid.
- `pnpm openspec -- --allow-worktree validate render-preorders-in-html --type change --strict`: `Change 'render-preorders-in-html' is valid`.
- `pnpm check:boundaries`: module boundary audit, dependency-cruiser (775 modules, no violations) and commerce boundary audit passed. Boundary changes: `storefront-catalog` exports `./lib/open-preorders.ts`; `public-commerce-http` exports `./routes/preorder-projection-push.ts`.
- `pnpm agent:check`: passed.

## Focused tests

- Commerce: `checkout-core` 177/177 (projection: ready stocked pre-orders, paused, not buyable, inactive price, sold out and arrived-date exclusions, withheld estimate, stable canonical identity), `stock-integration` 6/6 (push posts the projection; rejected fetch resolves and logs a redacted `preorder_projection_push`; a staff pre-order write issues one push with the same response whether the renderer is reachable or failing; a read pushes nothing), `public-commerce-http` 319/319 (paid finalization and a catalog price update each schedule one push, an ignored event none), `backend-runtime` 45/45 (every cron run pushes).
- Renderer: `cms-runtime` 151/151 (invalid bodies 400; gateway POST 405 and GET 404 without reaching the renderer; a changed projection purges once, changes the ETag and binds persisted keys to its identity; an unchanged push purges and writes nothing; hibernation reuse still serves the projected page with a 304 and no re-render; previews render the projection; the store writes once per identity), `backend-tooling` 281/281 (renderer alias keeps the web reader's exports).
- Web: `web-store` 138/138, `web-editorial` 54/54, `storefront-catalog` 164/164, `web-pages` 71/71, `app-shell` 291/291.

## Browser checks (3.5)

- `pnpm test:e2e e2e/home-preorders.spec.ts`: 16 passed, 0 failed (`.codex-artifacts/e2e/home-preorders-summary.json`).
- `pnpm test:e2e e2e/release-merchandising.spec.ts`: 42 passed, 0 failed (`.codex-artifacts/e2e/release-merchandising-summary.json`).
- Also run because the fixture changes Home and Releases for every spec: `catalog-video-contact` 14, `home-swipe-rows` 8, `home-motto` 5 and `shell-islands` 1 passed. `home-touch-prefetch` fails one `@phone` test (a news-card tap after a cancelled swipe opens no overlay); it fails identically on unmodified `main` (`c5a8fc3f`) and with an empty projection, so it predates this change.
- Coverage change: e2e can no longer stub Home candidates, and the repository content has no release clip. The Home cases for video, native and Afterwise ambience, cover-only chapters, Watch/close and the minimized-player interplay were dropped from e2e (and the Afterwise film test from `catalog-video-contact`); their markup stays covered by `StorePreorderShowcase.test.tsx`. Real playback in a browser is no longer verified by e2e.
- Not run locally: `performance-acceptance` and the rest of the suite (CI runs it on push).

## Local acceptance (4.2)

The full Local stack (`pnpm dev`, stripe-mock) failed to start first: the Staff build gate measured Orders eager JavaScript at 131,497 Brotli bytes against its 127 KiB budget, from `main`'s dispatch controls. The owner approved raising it to 129 KiB (`fix(staff)` commit). The pre-order was opened and ended through the internal stock API that Staff calls (`PATCH /api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock/preorder`), with `curl` of the Local public renderer at `http://127.0.0.1:4321/blackbox-records/` two seconds after each write. Evidence: `.codex-artifacts/preorder-html-local/` (HTML, headers, `summary.txt`, `stack.log`, screenshots).

| Step                            | Request ID                             | Push log                                               | Home HTML                                                       | Releases HTML                                                             |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Before (no pre-order)           | —                                      | —                                                      | 50,387 bytes, no `id="preorders"`                               | no `data-release-projected`, no Pre-order                                 |
| Open, ships early December 2026 | `251c73c3-bb6e-4cea-997a-16620eea3544` | `outcome: 'changed'`, identity `2c7a432dc0fc`, 1 item  | 59,046 bytes, section present, `€28.00`, Disintegration chapter | 1 `data-release-projected`, Pre-order vinyl, "around early December 2026" |
| End                             | `9acbbf13-47ba-4b18-9348-24e65cdcd86e` | `outcome: 'changed'`, identity `eef46741adfc`, 0 items | 50,387 bytes, no section                                        | no projection, no Pre-order                                               |

While the pre-order was open, a headless Chromium load recorded the section (Home) and the Pre-order action (Releases) present at `DOMContentLoaded` with no later insertion: `{"home":{"atParse":true,"insertedLater":0},"releases":{"atParse":true,"insertedLater":0}}`.

## Unverified

- Hosted behavior: UAT cron push, Workers Cache tag purge propagation and the edge window (task 4.3), then PRD.
- The Staff UI itself was not clicked; the same internal API was called directly.
- A pending checkout hold on the last pre-order copy changes the listing but is not a push trigger; the next cron run, within five minutes, removes the item from the projection. Purchase paths keep their authoritative offer reads.
