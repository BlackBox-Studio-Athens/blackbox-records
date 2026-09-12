# Implementation evidence — 2026-09-12

## Hosting and local checks

- Created and read back Cloudflare Pages project `blackbox-records-web-uat`, ID `ea599bc4-d097-44fc-9988-f5f19808ba38`, production branch `main`, origin `https://blackbox-records-web-uat.pages.dev`.
- Updated the existing CMS authenticator's public `ALLOWED_DOMAINS` to the UAT and PRD Pages hostnames. Inherited the existing OAuth bindings without reading or replacing their values.
- Local remains `http://127.0.0.1:4321/blackbox-records/`; hosted UAT and PRD use `/` and separate Worker origins. Profile, checkout-return, CORS, media, sitemap, and CMS tests cover the target changes.
- `pnpm test:unit`, `pnpm check`, `pnpm build`, and the unused-code diagnostic passed before commit `22b5321b5b78e5c766731f9dc8b1993a309eaf9b`. Source and prebuilt Worker dry runs passed, including the Prisma WASM module. Prebuilt deployment explicitly selects `wrangler.jsonc`.
- Native browser bootstrap succeeded. The apex rendered `BlackBox Records | Site Coming Online` with `UNDER CONSTRUCTION.`; no apex or holding deployment was performed.

## Rejected bootstrap, preserved data

[Candidate run 34690084786](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/34690084786) passed its full build gates and retained the paired release bundle. Both PRD jobs and the legacy publishing job were skipped. UAT failed before any mutation because the empty Pages project returned HTTP 522; local observation had returned 523.

Recovery accepts either response only after Cloudflare confirms this exact UAT project has zero deployments. Existing unreachable deployments still fail closed. Additional regression checks cover expired/missing artifacts, mixed Worker/frontend revisions, stale run numbers, and partial-failure evidence.

The before/after D1 snapshots were identical:

| Target | Stock rows | Orders | SHA-256 of selected stock/order/reservation rows                   |
| ------ | ---------: | -----: | ------------------------------------------------------------------ |
| UAT    |        104 |    492 | `8F58904282A473C8AE1F86039EA5426E2C9A80A067BACB7E65220576429F8EBF` |
| PRD    |          1 |      0 | `BF0D6912F5757402246A8C24A6472FEA8B8E5D086932898512593A0ADFDA75CC` |

Ignored snapshot files contain application identities and quantities/statuses, excluding shopper contact/address fields. This rejection is failure-path evidence, not hosted acceptance or a successful rollback.
