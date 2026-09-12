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

## Credential separation

[Retry 34690620552](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/34690620552) passed the paired build and reached the empty-project API check. The UAT environment's Worker credential was denied Pages access (Cloudflare code 10000), before data or deployment mutation. The prior pipeline used the repository Pages credential separately from the UAT environment Worker credential. The workflow restores that separation: Pages preflight → UAT Worker preparation/deployment → Pages deployment → canonical UAT smoke, under one non-cancelling release lock. No credential was copied, broadened, or replaced.

Recovery checks out the release script from the current workflow revision into an ignored tools directory, while compiling app artifacts from the selected source SHA. This allows an older compatible app revision to be rebuilt with current guards; bundles without compiled Worker release identity fail before deployment.

## Accepted Cloudflare UAT and old publisher retirement

[Run 34691464059, attempt 2](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/34691464059) accepted source `c70cfd7374e5d06f77d03ee18d4d25462c6e849c`, release number 352. Public `release.json` and Worker release headers match. Attempt 1 exposed brief Worker edge propagation; post-deployment identity checks now retry for a bounded interval while pre-mutation guards remain immediate.

The canonical smoke artifacts report two passing paid scenarios (fixed price and pay what you want), three passing newsletter/services checks using the managed UAT sink, and four passing static scenarios. Paid orders reached `paid` through the deployed webhook path. The harness's redacted order projection does not expose payment timestamps or delivery diagnostics; it is not evidence of inbox delivery. Hosted cache audit and representative canonical metadata checks passed.

Native browser review covered desktop and 390px mobile layouts, direct routes, release overlays, Bandcamp player persistence during shell navigation, cart, checkout shell, mobile menu, and the Review Site Marker. Shell navigation preserved the iframe and reset scroll/focus. The apex still displayed the holding page.

After acceptance, UAT had 104 stock rows and 494 orders: all 492 pre-existing order projections remained unchanged and two paid smoke orders were added. PRD remained at one stock row and zero orders with snapshot digest `BF0D6912F5757402246A8C24A6472FEA8B8E5D086932898512593A0ADFDA75CC`. Ignored snapshots exclude contact/address fields.

Retirement removes the legacy dispatch input, GitHub Pages job, and publishing permissions. Contract tests reject their return. The CMS authenticator now allows only `blackbox-records-web-uat.pages.dev` and `blackbox-records-web.pages.dev`, preserving inherited OAuth bindings. Historical deployments are retained without a writable GitHub Pages workflow. Historical run `34667202133` retains artifact `github-pages`, ID `10288594202`, digest `sha256:ea137434095efd2142ad63084bd0738bb746fcd22acc131332c5a63c6d8cb912`, expiry `2026-09-13T02:18:58Z`; a local preservation download is in progress.

The retirement tree passed `pnpm test:unit`, `pnpm check`, and `pnpm build` sequentially on 2026-09-12. Target configuration fingerprints now include the Cloudflare account ID; older bundles must be rebuilt and accepted with current tooling before promotion.
