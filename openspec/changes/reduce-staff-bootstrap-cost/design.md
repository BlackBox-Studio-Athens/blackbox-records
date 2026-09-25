# Design

## Context

See [proposal.md](proposal.md) for the problem and [measurements.md](measurements.md) for revision-pinned evidence. `reduce-staff-navigation-wait` already narrowed Overview reads, coordinated refreshes, fixed initial Stock request timing, and deferred optional editor resources. Its remaining task 5.5 concerns startup. Preserve those changes.

The staff app is a static Astro build embedded in the combined CMS Worker. `StockOpsLayout.astro` supplies global styles and a `client:load` StaffShell around route islands. Initial project CSS currently sits in private external stylesheets. The authenticated Worker serves static assets directly; changing CMS query execution cannot remove their round trips.

`staff-navigation.ts` and `FormatFilter.tsx` import `DISTRO_GROUP_VALUES` from the content-model root. Its barrel reexports modules that construct schemas. Without side-effect metadata, bundling retains those constructions even when only constants are needed. The native experiment proves this on the current build, independently of the separate esbuild probe.

The public Home eager graph also fails its existing 95 KiB gate. `NewsletterSignupForm` eagerly renders `Prose` and `PrivacyLink`; the React `Prose` renderer imports `cmsLinkSchema` from `prose.ts`, which co-locates Zod schema construction and rendering helpers. A fresh build contains an 18-module Zod chunk of 20,002 Brotli bytes. A controlled rendering-only experiment keeps Portable Text and the current URL acceptance policy, removes the browser's schema import, and passes the unchanged gate. The experiment is feasibility evidence; production builds and behavior checks remain required.

## Goals / Non-Goals

**Goals:** Remove the measured project-CSS startup dependency, eliminate unrelated schema initialization from staff constants and public prose rendering, preserve schema/link validation and rich-text output, and enforce the public and staff bundle budgets in their standard builds.

**Non-goals:** A router or shell rewrite, prefetch/preload machinery, API response caches, new timing infrastructure, font/logo redesign, thumbnail backfills, backend query changes, link-policy changes, removal of trust-boundary validation, budget increases, or Cloudflare plan/region/resource changes. Keep the current navigation, freshness, Access verification, private 200/304 rules, no-session/no-KV guarantees, and commerce authority.

## Decisions

### 1. Declare the existing package's side-effect contract

Add `"sideEffects": false` to `packages/content-model/package.json`. Audit the current `src/index.ts` exports first: schema and regex construction is internal value initialization; there must be no required import-time global mutation, registration, polyfill, stylesheet import, or I/O. All functions and validators still used by consumers remain exported and retained.

Keep imports through the existing root interface. No new constants package, deep import, export subpath, per-consumer workaround, or manual `pure` annotation is needed. This preserves the existing module-boundary contract and requires no boundary manifest change. If source has changed since this proposal and the audit finds a required side effect, document it and revise the package annotation deliberately; do not silently disable validation or claim blanket purity.

Expected native-build effect: Overview and Orders each lose about 100 KB raw / 25 KB Brotli of unused startup JavaScript. Stock loses unrelated CMS schema modules but still uses Zod elsewhere. Website legitimately uses content validation and remains approximately unchanged. Do not make a blanket Zod prohibition or a lower request-count target.

### 2. Inline initial project styles through Astro

Add `build: { inlineStylesheets: 'always' }` to `apps/staff/astro.config.mjs`, preserving its other settings. This uses [Astro's existing option](https://docs.astro.build/en/reference/configuration-reference/#buildinlinestylesheets); no plugin, manual concatenation, preload graph, or runtime CSS loader is required.

Keep the existing lazy feature `?inline` CSS imports and style rendering unchanged. Opening rich-text editing, pickers, preview, or selling features must still supply their own styles at feature activation. An `always` setting is not permission to reintroduce unopened editor CSS into initial HTML. Google Fonts remains external; the new rule concerns project CSS only.

The experiment grows initial compressed HTML by about 12–13 KB, removing one or two authenticated CSS responses. Private HTML remains `no-store`, so that CSS is retransmitted on document navigation. This is an intentional measured trade-off for this small staff app. No CSP, Access, cache, binding, or Worker changes are part of the solution.

### 3. Reuse the existing build graph checker

Extend `scripts/check-runtime-bundle-graphs.ts` with `--scope=web|staff`, defaulting to `web`. Preserve existing web output/checks, `--dist=...`, and `--output=...`. Unknown scopes must fail. Select the default dist by scope; avoid a new checker or graph traversal abstraction.

For staff, use these documents and budgets. Website and all collection-query variants share `content/index.html`.

| Report key | Document under staff dist | Maximum eager JS Brotli bytes |
| ---------- | ------------------------- | ----------------------------: |
| overview   | `index.html`              |              118784 (116 KiB) |
| website    | `content/index.html`      |              168960 (165 KiB) |
| stock      | `stock/index.html`        |              148480 (145 KiB) |
| orders     | `orders/index.html`       |              122880 (120 KiB) |

Reuse `initialEntries`, `closure`, `staticImports`, and the existing quality-11 Brotli calculation. Count every initial module script and every `client:load` island component/renderer plus their static dependencies once per route. Do not follow dynamic feature imports into the eager budget. Do not skip the nested route island under StaffShell. Missing documents or referenced chunks must fail rather than produce an empty passing graph.

Each staff route additionally must:

- Have no initial `<link rel="stylesheet">` whose URL is a local `/_astro/` asset. Read link attributes independently of their order. Do not fail on the existing Google Fonts link or require removal of lazy CSS assets from the dist directory.
- Have an HTML body of at most 24,576 bytes (24 KiB) when compressed with the same quality-11 Brotli setting. This bounds the inlining trade-off.
- Report eager file count/raw/Brotli sizes, per-file sizes, HTML raw/Brotli sizes, project stylesheet URLs, applicable budgets, and diagnostics. Keep `--output` machine-readable and exit nonzero for violations.

These ceilings allow modest build variation above the successful native experiment; baseline Overview and Orders fail their new JS budgets, and all four baseline documents fail the stylesheet rule. Verify that distinction against before/after artifacts instead of asserting configuration text alone. Do not raise budgets to make a regression pass. Existing `assertClosedOptionalFeatures` in `scripts/test-content-workspace.mjs` already checks initial scripts, stylesheet/HTML bodies, `.tiptap`, and `.cms-media-grid`; reuse it instead of adding a second browser suite.

Append `pnpm performance:bundles --scope=staff` to the existing root `build:staff` command after route isolation. Append the default `pnpm performance:bundles` check to root `build:web` after its Astro build and route-isolation check. `run-release-preparation.mjs` already invokes these root build commands, so full validation and release builds inherit both checks. Keep the existing checker and budgets; do not add a second budget system.

### 4. Separate local correctness from hosted outcome

Local evidence must use fresh standard `build:web` and `build:staff` builds after all changes, not the ignored diagnostic alias/config. Record both route reports, the final source fingerprint, and the existing closed/open optional-feature checks. Full `pnpm validate` and `pnpm validate:editor` are required because package metadata and prose helpers affect public, staff, and backend consumers. Re-run applicable CMS, content-schema, and publication checks, especially incomplete-draft validation, autosave/conflict handling, private previews, and publication validation. Preserve the canonical CMS build's source/generated KV guards and the authenticated no-session-cookie regression. Use the native browser interface to check newsletter and purchase-information rendering, formatted links/lists/quotes, form behavior, and console cleanliness.

The old 1,500 ms primary-content median threshold remains the hosted ceiling for comparable repeat visits on each measured route; the original clean sample already meets it. The new deterministic acceptance is removal of initial project CSS requests and the explicit bundle/HTML budgets. First-after-deployment visits remain a separate reported cohort. A passing repeat median does not establish that first-visit latency is fixed. If a median exceeds 1,500 ms, required data is absent, or first-view styling fails, keep hosted acceptance open. A first visit above two seconds requires the bounded attribution in the migration plan before claiming the broader startup issue resolved.

### 5. Keep browser prose helpers separate from schema initialization

Move `resolveProse`, `proseBlocks`, `groupEditorialBlocks`, `proseText`, and a new `isSafeCmsLink` predicate into an internal `prose-rendering.ts` module. Keep the existing helper names available through the content-model root entrypoint; do not add a package, public subpath, alias, or copied implementation.

Keep `cmsLinkSchema` and the other Zod schemas in `prose.ts`. The schema refines `z.string()` with the same predicate, preserving type checks and rejection of unsafe protocols, whitespace, backslashes, and malformed URLs. `Prose.tsx` calls the predicate directly and renders children without an anchor when a link value is unsafe or non-string. All CMS, content snapshot, and purchase-information validation continues through the existing schemas.

Use type-only imports for schema-derived prose types in the rendering module. Preserve Portable Text, headings, emphasis, underlines, strike-through, alignment, link target/rel attributes, numbered-list starts and grouping, quote grouping, legacy plain-text conversion, and null-versus-empty precedence. The web component's existing imports stay on the package root.

### 6. Enforce the public web graph in its standard build

Append `pnpm performance:bundles` to root `build:web` after the fresh Astro build and route-isolation check. This selects the existing default web profile and the unchanged 97,280-byte Home budget. The baseline overrun must fail the standard command; the corrected fresh output must pass without changing the budget.

## Revalidation and improvement estimate

### What was checked

This second pass used the same local SHA `78a7f3352c01a6c9186b3cd52a589d3037725433`. Two additional native Astro builds isolated CSS inlining and package metadata, alongside the previous baseline and combined builds. The copied package's source matched the real package byte for byte. The existing bundle checker's static-import patterns produced exactly the same chunk counts and Brotli totals as Vite's emitted module metadata for all sixteen route/build combinations.

The planned checks distinguish the changes correctly: baseline fails the CSS rule everywhere and the Overview/Orders JS budgets; CSS-only fixes just the CSS rule; metadata-only fixes the JS budgets; the combined build passes all JS, HTML, and CSS budgets. Concatenating initial project CSS in document order produced identical rule text before and after on Overview, Website, Stock, and Orders: 72,553 / 78,506 / 72,553 / 79,936 bytes after trimming outer whitespace. Neither unopened rich-editor nor picker CSS appeared. Sampled PRD HTML remained `private, no-store` and had no CSP response header that would prohibit the inlining approach. No security policy was changed.

### Controlled browser comparison

Chrome 153 used the existing local staff fixture server through four isolated static-build servers. HTML responses had a fixed 100 ms delay, non-thumbnail API responses a fixed 300 ms delay, and external project CSS a 100 ms or 1,000 ms delay. Other assets had no injected delay. Responses were `no-store`, text used Brotli quality 4 for serving, and no network bandwidth or CPU throttle was applied. Google Fonts remained unchanged. This tests the browser dependency, not Cloudflare Access, D1, HTTP/3 transport, or production response distributions.

Readiness sampling started in an identical script injected at the beginning of each local document's head. It recorded the first animation frame containing the successful primary state: recent drafts, Pages choices, or 25 Stock/Distro rows. The user explicitly kept Chrome foreground. The 48 retained observations had no captured browser errors, no horizontal overflow at the current desktop viewport, and a maximum sampled frame interval of 33.4 ms. Baseline/combined order alternated between repetitions. Three samples per cell give a median and range, not a field percentile or confidence interval.

| Ordinary scenario | Baseline median (range), ms | Combined median (range), ms |    Median saving |
| ----------------- | --------------------------: | --------------------------: | ---------------: |
| Overview          |         832.4 (709.5–853.7) |         615.2 (586.6–628.5) | 217.2 ms / 26.1% |
| Website           |         374.9 (344.0–529.9) |         313.8 (262.1–664.2) |  61.1 ms / 16.3% |
| Stock             |         669.3 (654.2–673.7) |         535.0 (532.9–547.5) | 134.3 ms / 20.1% |
| Distro            |         667.3 (666.3–672.7) |         546.5 (545.8–549.5) | 120.8 ms / 18.1% |

The isolated Overview medians were 685.6 ms with CSS-only and 704.7 ms with metadata-only. Website was 272.6 ms with CSS-only and 388.4 ms with metadata-only; its baseline was 374.9 ms. Thus the Website timing gain comes from CSS, and the small metadata-only difference there does not establish a regression or improvement. Do not add the separate median differences: browser scheduling, chunking, and discovery noise overlap. Valid outliers remain in the ranges, including CSS-only Overview at 1,178.4 ms and combined Website at 664.2 ms. In the latter, HTML finished at 114.7 ms but initial resource discovery began around 542 ms; its precise cause was not established.

| Injected slow CSS scenario | Baseline median (range), ms | Combined median (range), ms | Median saving |
| -------------------------- | --------------------------: | --------------------------: | ------------: |
| Overview                   |      1555.1 (1548.7–1559.9) |         551.7 (539.3–606.3) |     1003.4 ms |
| Website                    |      1258.7 (1258.3–1282.5) |         270.3 (250.3–283.1) |      988.4 ms |

The combined build makes no initial project CSS requests, so the injected stylesheet delay no longer affects it. This is the strongest causal evidence for the selected fix. Two stylesheets load in parallel; their durations must not be added as two serial savings.

Two warm-ups, an interrupted large batch without a complete retained result, and four subsequent pre-confirmation diagnostics were excluded from the comparison. Three of those four diagnostics had frame gaps of 617–2,117 ms; the remaining isolated clean observation was not used to manufacture a paired result. Sampling resumed only after the user's foreground confirmation.

### New production observations

The dashboard still showed version `7ae6434a`, tag `35884578816-1`, at 100% traffic. The new eight-visit sample ran at 14:45:22–14:45:55 UTC on September 24, with existing browser cache and no network/CPU emulation. It is a baseline recheck, not an optimized deployment. Retained response Rays for later visits ended in `LHR` and used HTTP/3. Do not pool these visits with the earlier cohort or infer a new country reading.

| Destination / visit | HTML TTFB, ms | FCP, ms | Primary content, ms |
| ------------------- | ------------: | ------: | ------------------: |
| Overview first      |        1515.5 |    2776 |              4491.2 |
| Website first       |          95.5 |     244 |               624.1 |
| Stock first         |          92.5 |     236 |               893.0 |
| Distro first        |          87.8 |     244 |               959.3 |
| Overview repeat     |          93.6 |     248 |              1077.7 |
| Website repeat      |          87.5 |     228 |               567.4 |
| Stock repeat        |          92.0 |     252 |               923.4 |
| Distro repeat       |          92.9 |     228 |               943.3 |

The first Overview workspace request began at 3,443.4 ms and lasted 1,042.4 ms. Its layout stylesheet took 273.3 ms, rather than the roughly 110–125 ms seen on subsequent visits. The readiness probe began at 3,414.5 ms on that first visit, so its earlier frame scheduling was not independently captured; later sampled frame intervals were normal. The other probes began at approximately 288–319 ms. All eight captured the transition after installing the probe. No sample was already ready at installation.

These frontend changes cannot remove the observed wait to the first HTML byte or reduce the workspace request's own duration. Holding those two durations constant, even removing all intervening frontend work leaves an optimistic floor of about 2.56 seconds for that first Overview visit. The data does not identify whether the HTML wait arose in connection setup, Access, or Worker execution. The CDP buffer was truncated before the earliest request headers were retained; 143 same-origin starts remained in the partial event capture. Do not claim complete request accounting or provider attribution from that buffer. The new tasks require draining and retaining events after every navigation to avoid repeating that evidence loss.

Before the bounded live pass, current dashboard usage was 6,257 / 100,000 Worker requests for the day; D1 273.01k rows read and 857 written for the day; DO 62.43k requests and 2.63k GB-seconds for the displayed billing period; R2 2.07k Class A, 62.89k Class B, and 1.47 GB for the billing period. Displayed charges were $0. The live ceiling was 700 same-origin requests, 50 application reads, 180 thumbnail/R2 read attempts, and 50,000 D1 rows, with the same ordinary-service reserves as the first worksheet. Only eight document activations were performed. There were no requested hosted writes or quota warnings; exact post-run billed storage/DO operations were not measured. The controlled local runs consume no Cloudflare application quota.

### Estimate and confidence

- **High confidence:** initial project CSS requests disappear, rule content/order stays the same, and Overview/Orders each shed approximately 25 KB Brotli of eager JavaScript. The guard catches the old behavior and accepts the combined build.
- **Moderate confidence, conditional estimate:** with warmed assets, roughly 100 ms private-asset responses, and throughput of at least 10 Mbps, expect about **50–200 ms** faster primary content on routine visits. The local gains of 61–217 ms support that range; they are not deployed before/after measurements. At 10 Mbps the extra 12–13 KB of HTML costs roughly 10 ms of transmission; at 1 Mbps it costs roughly 100 ms and can consume much of the ordinary CSS saving.
- **High confidence in the mechanism, uncertain frequency:** CSS-caused stalls like the earlier 1–1.64 second revalidations are avoidable. The controlled experiment recovered about one second. Recovery from a 1.64-second critical CSS wait could approach 1.5–1.6 seconds when other dependencies do not replace it; this is a conditional estimate, not an all-visit improvement.
- **No supported guarantee:** every first visit below two seconds, a specific Greek result, a p95 target, faster HTML/API service, or a particular benefit from paid hosting. The new first-visit result makes those claims inappropriate.

Ignored reproducibility files remain under `.codex-artifacts/staff-latency-round-three/`: `factorial-probe.config.mjs`, `native-factorial-comparison.json`, `serve-comparison.mjs`, `planned-budget-results.json`, and `style-content-comparison.json`. The helper servers and their fixture child were stopped; application code/configuration was not changed. Full repository/editor tests against a real implementation and hosted candidate acceptance remain required.

## Risks / Trade-offs

- Package-wide annotation could drop a future required import effect → audit now; preserve all consumers' tests and require future effectful modules to be explicitly represented in package metadata.
- Larger HTML is transferred on every full navigation → cap compressed HTML and retain before/after byte evidence. This does not increase provider storage or add writes.
- Website and Stock retain legitimate validators; request counts can slightly rise due to chunking → use route-specific byte budgets and actual resource evidence, not a universal Zod/request-count assertion.
- Inlining can expose a stylesheet ordering or lazy-feature regression → run the existing real built-app Chromium/Firefox checks and inspect narrow/wide layouts, direct editors, pickers, and private previews.
- Browser occlusion can dominate apparent rendering time → verify foreground and several animation-frame intervals before the finite sample; keep invalid samples with a reason. Visibility alone is insufficient.
- Provider latency remains outside the measured Worker execution window → retain Ray/timing evidence and report uncertainty. Do not introduce paid plans or relocate data based on a colo suffix.

## Migration Plan

1. Implement and verify locally on main using `pnpm openspec:guard`. Keep a before/after built report under ignored artifacts; record the sanitized comparison and check results in a new `implementation-evidence.md` in this change. Leave this baseline report intact.
2. Produce the canonical CMS candidate through the repository's normal release process, including `pnpm --filter @blackbox/backend build:cms` with the existing target configuration. Diagnostic direct Astro builds are not deployment evidence. No data migration is needed.
3. Under an authorized UAT rollout, refresh the Free-tier worksheet and smoke Overview, Website, Stock, and Distro once each. Verify initial project CSS request count is zero, protected responses remain private, and normal controls/styles work. Do not repeat a complete performance campaign on UAT.
4. After the separate reviewed PRD promotion authorization, pin source SHA/candidate/run/Worker version and refresh the account worksheet again. Permit at most sixteen PRD document activations: one first-after-deployment visit and three repeat visits for each of `/`, `/content/`, `/stock/`, `/content/?collection=distro`. Record the four first visits separately and the twelve repeat visits together. New hashes do not make every route independently cold; label the actual cache state.
5. Use the user's extension-connected Chrome and the native browser interface/CDP capability. Start network capture before navigation, keep the tab foreground, and verify normal frame scheduling. Drain and retain bounded network events immediately after each visit, checking `truncated` and `hasMore`; never wait until the entire cohort ends to collect headers. Record TTFB, document end, DNS/connect/TLS timing when available, connection reuse, response Ray, CSS/font/script timing, API start/duration, FCP, exact primary-readiness condition, observer start, thumbnail completion/bytes, request counts, cache state, network/colo, and missing data. Preserve all valid outliers. Capture the same primary-content states defined in the baseline, with independent panels and artwork reported separately. Do not infer Greek performance, p95, or complete CPU/CWV results from this small cohort.
6. Preflight must cover automatic refreshes, authentication, thumbnails, and query row costs. Start from ceilings of 1,200 same-origin requests, 80 non-thumbnail API reads, 500 R2 Class B operations, and 100,000 D1 rows read for the complete UAT/PRD pilot, reducing them if current allowance requires it. This is a ceiling, not permission to use all operations. Provider allowance and ordinary-service headroom must be documented before each environment. Stop on warnings, overruns, or missing allowance; no unbounded retries or quota-consuming thumbnail repair.
7. Compare with the baseline's documented conditions and report first visits separately from the repeat median. For any first visit above two seconds, correlate its saved Ray with existing Worker observability and compare request/connection timing with Worker wall/CPU time. Use retained events and at most one three-GET control within the reviewed budget; do not repeat full cohorts. If evidence is missing or delay remains outside the attributed frontend dependency, record the unresolved stage and a separate bounded follow-up instead of changing auth, caching, or infrastructure speculatively.
8. Keep the old `reduce-staff-navigation-wait` task 5.5 open until the remaining startup delay is accounted for. A passing repeat median and a smaller bundle establish the scoped frontend gain, not resolution of the broader first-visit issue. Link any later closure to accepted evidence and the disposition of the separate wait. Do not rewrite earlier measurements or archive either change merely because local checks pass.

Rollback uses the previous reviewed code artifact through the normal promotion process. There is no data rollback. If only CSS ordering fails, revert the staff inlining setting and rebuild through the same gates; if validation behavior fails, revert the package annotation. Do not compensate by loosening security, validation, or budgets.
