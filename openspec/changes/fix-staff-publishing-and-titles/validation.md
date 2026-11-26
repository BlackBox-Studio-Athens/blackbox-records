# Validation

## Root causes

- A: `publishCatalogItem` rethrew unexpected errors without releasing its 60-second claim (`publish-catalog-item.ts`). In PRD, POST 09:35:42 UTC returned 503; the Retry at 09:36:02 found the claim held and got `pending` without a publication. Staff polled `GET …/publication` every 3 s, then every 30 s; nothing advances an operation before `publication_requested`, so the spinner never ended (`item-commerce.ts` `startItemPublication`/`readItemPublication`). Zone analytics show this POST 503 → POST 200 → GET polling pattern twice (09:35–09:39 and 09:40–09:50).
- B: the Bruce. "Resurrection" draft revision stores `group: null` (Staff writes it to clear the legacy column). PRD `ec_distro.group` is `TEXT NOT NULL DEFAULT ''`. Native publish failed with `NOT NULL constraint failed: ec_distro.group` (reproduced on Local: CMS `POST …/publish` returned 500 `CONTENT_PUBLISH_ERROR`, Wrangler log shows the constraint). The item route turned that into 503 "Publication interrupted". PRD operation `7a768a58` stays `pending` at `product_projected`, and its draft is the only PRD Distro draft with a null group.
- C: hosted Worker page reads receive Bandcamp's Client Challenge (confirmed from Cloudflare edge egress through `wrangler dev --remote`: page 200 challenged). The public search API answered the same edge with 200 JSON, not challenged.
- D: `.store-collection-page .store-item-card--listing .brand-card-title` sets `text-transform: none` because Veneer draws only capitals. The approved Greek class switches to Inter, so Greek listing titles kept lowercase. This predates `dfa8aec7`, which only added `lang="el"`; the Store listing card markup and CSS were otherwise unchanged by it.

## Local evidence

- Focused tests: `distro-legacy-group.worker.test.ts` (native EmDash publish fails, then succeeds after the fix), `runtime-publication.worker.test.ts`, `publish-item.worker.test.ts` (immediate Retry resumes), `item-commerce.test.ts`, `bandcamp-resolution.worker.test.ts`, `BandcampField.test.tsx`, `greek-title-css.test.ts`.
- `pnpm validate`: PASSED, mode local, `.codex-artifacts/validation/2026-11-26T10-50-08-258Z-26568-d4cfb9/summary.json`.
- `pnpm build:web` with the e2e pre-order projection: passed.
- Screenshots (scratchpad `ship/`): `AB-item-step-interrupted-{1440,390}.png` (stale pending now ends as failed with Retry), `C-bandcamp-not-found-suggestion-{1440,390}.png`, `C-bandcamp-provider-blocked-{1440,390}.png` (fixture server with mocked outcomes), `D-store-greek-{before,after}-{1440,390}.png` (Local Store search "pirate").

## Not verified locally

- Bandcamp search for the reported wrong address: `thebruce resurrection` and `resurrection` searches do not return `jointhebruce.bandcamp.com`, so that example yields `provider_blocked` on hosted Workers, not a suggestion. The suggestion appears only when search returns the same slug on one related subdomain.
- The PRD Retry on the Bruce. item is left to the owner.

## Release

- Commits `0833e23b`, `1891bf74`, `01f4d4a6`, `db77b5a5`, `11025502` on `main`.
- UAT: push run [45808039209](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/45808039209) succeeded (checks, e2e, staff-previews, deploy-uat). The UAT Worker reports `X-Release-SHA: 1102550238c731d4a8558ae0d67b86fe72b6e4ce`, run 683.
- PRD: promotion [45809739916](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/45809739916) succeeded on attempt 1. `release.json` and the Worker report the same SHA and run 683; the accepted publication `f6776926` and snapshot `165e8b1b…` are unchanged. The PRD Store search "200" shows 200 ΧΡΟΝΙΑ ΠΡΟΤΕΚΤΟΡΑΤΟ in Inter with `text-transform: uppercase`.
- PRD operation `7a768a58` is still `pending` at `product_projected` with an expired lease, and its draft still stores `group: null`; the owner's Retry exercises the fix. No hosted write was made by this work.
