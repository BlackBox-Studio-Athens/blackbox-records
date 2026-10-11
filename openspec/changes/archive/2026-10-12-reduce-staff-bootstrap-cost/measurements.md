# Staff measurements — 2026-09-24

## Result

The confirmed foreground sample has subsecond medians for all four destinations. The remaining two-second visits have a concrete startup dependency: private stylesheets wait for authenticated revalidation before first paint and island startup. A separate local build proves that navigation's constants-only import also retains unnecessary content validation code. This change addresses those two costs; it does not attribute every slow request to the application or promise a particular hosted improvement before deployment.

## Revision and method

- Target: authenticated PRD `https://staff.blackboxrecordsathens.com`.
- Deployed source: `a82f85e41b160927fe16cc38092027288304fd42`; candidate `35882409271`; [promotion 35884578816](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35884578816). Source was checked in promotion logs, separately from the workflow run's own head SHA.
- Active Worker: `blackbox-records-backend-prd`, version `7ae6434a-887d-4915-8c7c-c078ef669638`, tag `35884578816-1`, 100% traffic.
- Local experiments: `78a7f3352c01a6c9186b3cd52a589d3037725433`. This is newer than the deployed source. Experiments used ignored output directories and did not change application source or configuration.
- Browser: user's extension-connected Chrome 153, Windows, viewport 2134 × 983, existing Access session. No cache clear or CPU/network emulation. These are existing-cache visits, not independently cold starts.
- Connection: `/cdn-cgi/trace` reported country `CH`, colo `LHR`, HTTP/3, TLS 1.3, WARP off. Response Rays changed to `AMS` during the confirmed cohort. This is neither a Greek measurement nor evidence of database or Durable Object placement. Current acceptance does not require a specific country.
- Thirty document activations: eighteen exploratory samples, followed by twelve user-confirmed foreground samples. Background frame throttling invalidated the exploratory cohort for rendering comparisons. An additional nine serial GETs isolated request latency without navigation.

Existing-tab attachment initially failed with `Emulation.setFocusEmulationEnabled`. A fresh tab in the same extension-connected Chrome recovered access without changing login or permissions. The separate DevTools browser was unauthenticated and was not used for the final sample. The measurement tab was closed after collection.

Times below use navigation start as zero. HTML is Navigation Timing `responseStart` (TTFB), not total document load. FCP comes from Paint Timing. Primary-content readiness is the first observed matching `main` state, timestamped on the next animation frame by a MutationObserver. The observer was installed after navigation, at 249–1,937 ms in the confirmed cohort; it is not a pre-navigation instrument or proof of the exact earliest possible interaction.

The readiness states were: Overview's successful recent-drafts state, Website's Pages choices, Stock's 25 inventory rows, and Distro's 25 catalog rows. Overview's independent order summary could still be loading. Artwork completion was separate. A polling probe waited for the expected state and two frames as a cross-check; its later timestamp was not substituted for the observer timestamp. No timing is reported as LCP, INP, TBT, or a field Core Web Vitals result.

## Confirmed foreground cohort

The user kept the measurement tab foreground after replying `ready`. A frame check produced approximately 8–11 ms intervals. All twelve buffered long-task observations contained no task over 50 ms. A collected trace was truncated by the event buffer, so it is not a complete CPU profile.

All timestamps are UTC on September 24; durations are milliseconds. Website's publication request was still incomplete when its primary content was captured, so its resource timing is omitted rather than reported as zero or failed.

| Route / repetition | Capture time | HTML TTFB |  FCP | Primary content |
| ------------------ | ------------ | --------: | ---: | --------------: |
| Overview 1         | 13:53:16.310 |      94.7 | 1140 |          1905.9 |
| Website 1          | 13:53:18.702 |     204.5 | 1916 |          2266.0 |
| Stock 1            | 13:53:19.743 |      92.2 |  228 |           908.1 |
| Distro 1           | 13:53:20.733 |      91.1 |  236 |           864.9 |
| Overview 2         | 13:53:28.654 |      95.8 |  236 |           809.6 |
| Website 2          | 13:53:29.389 |      91.0 |  224 |           590.1 |
| Stock 2            | 13:53:30.438 |      88.2 |  224 |           937.9 |
| Distro 2           | 13:53:31.455 |      90.2 |  240 |           877.9 |
| Overview 3         | 13:53:40.218 |      92.7 |  228 |           826.5 |
| Website 3          | 13:53:40.965 |      89.2 |  236 |           641.8 |
| Stock 3            | 13:53:42.115 |     115.4 |  264 |          1045.1 |
| Distro 3           | 13:53:43.131 |     100.1 |  256 |           894.7 |

| Route    | Median primary content |        Range | Initial JS requests |
| -------- | ---------------------: | -----------: | ------------------: |
| Overview |                  826.5 | 809.6–1905.9 |                  24 |
| Website  |                  641.8 | 590.1–2266.0 |                  34 |
| Stock    |                  937.9 | 908.1–1045.1 |                  26 |
| Distro   |                  877.9 |  864.9–894.7 |                  34 |

Three samples per route support a median and range, not a useful p95 estimate. The worst foreground visits remain in the table. The prior 1,500 ms median target is met by this cohort's primary-content definition; this does not retroactively repair the earlier incomplete acceptance sample or establish all-panel readiness.

| Completed application read         | Request start, repetitions 1 / 2 / 3 | Duration, repetitions 1 / 2 / 3 |
| ---------------------------------- | ------------------------------------ | ------------------------------- |
| Overview `workspace?view=overview` | 1495.4 / 567.4 / 546.5               | 408.0 / 236.2 / 273.6           |
| Overview publications              | 1495.7 / 568.5 / 546.9               | 219.3 / 125.9 / 125.3           |
| Stock inventory                    | 538.3 / 542.3 / 593.3                | 353.8 / 381.4 / 439.0           |
| Distro workspace                   | 578.8 / 582.1 / 603.3                | 272.1 / 280.2 / 278.0           |

The focused Overview API work already implemented in `reduce-staff-navigation-wait` remains useful. In the first confirmed visit its request starts at 1,495 ms; optimizing that read alone cannot remove the preceding startup delay.

## Critical stylesheet evidence

| Visit      | Private stylesheet                | Start | Response end | Waiting for response | Result / Ray                                                              |
| ---------- | --------------------------------- | ----: | -----------: | -------------------: | ------------------------------------------------------------------------- |
| Overview 1 | `StockOpsLayout.By1YR0sx.css`     | 106.7 |       1111.3 |                981.0 | 304, `a40246319c21edec-LHR`                                               |
| Website 1  | `use-draft-autosave.BO4Cjgfv.css` | 218.2 |       1895.2 |               1651.5 | CDP status 200, `a402463f1ed2655e-AMS`; 300-byte Resource Timing transfer |
| Website 1  | `StockOpsLayout.By1YR0sx.css`     | 218.3 |       1883.7 |               1639.8 | 304, `a402463f1ed7655e-AMS`                                               |

First paint follows these stylesheet responses: 1,140 ms for Overview and 1,916 ms for Website. Other visits have roughly 90–120 ms module revalidation waves. Observed HTML has no modulepreload links. Removing the project CSS dependency is directly supported; a custom preload graph is not necessary for the first fix.

The autosave stylesheet's cached-body timing is not independent proof of a wire-level 304; CDP reported 200 for that resource. The two layout stylesheet rows have explicit 304 response evidence.

For a separate initial stylesheet request, Cloudflare's existing event log recorded status 304, outcome OK, wall time 75 ms, CPU time 12 ms, Ray `a40235a6796db8e5`, trace `41f3ce62bf5c5062e4796860daea7016`, at 13:41:58.562 UTC. Its browser duration was about 1,912 ms, including 1,769.5 ms waiting for a response. Worker execution alone does not explain that elapsed time. The remaining Access, network, edge, or browser contribution was not isolated. This event is not the Ray of either confirmed outlier.

The static path already authenticates in the entry Worker and serves ASSETS without routing through the CMS Durable Object. Eligible hashed assets use `private, no-cache, must-revalidate`; HTML and APIs use `private, no-store`. A 304 still requires a round trip and authentication. None of these policies should be weakened to obtain a faster benchmark.

## Request-only control

Nine sequential same-origin `fetch` calls used `cache: 'no-store'` in one existing document. Each response was fully consumed. All returned 200; these timings exclude rendering. The runtime path was observed from the current HTML, not guessed.

| Repetition | `/` total | Runtime JS total | Overview API total |
| ---------- | --------: | ---------------: | -----------------: |
| 1          |    1167.2 |            155.5 |              461.8 |
| 2          |      98.3 |             90.2 |              251.5 |
| 3          |      89.1 |             93.6 |              270.7 |

The runtime was `/_astro/client.V7dXQhPI.js` (180,631 decoded bytes); Overview JSON was 36 bytes; HTML was 17,419 bytes. The first HTML response took 1,165.9 ms to headers (`a40245736c29edec-LHR`). Slow responses can therefore occur without a navigation paint delay. No application Server-Timing breakdown was available.

## Artwork and request budget

Completed 25-row Stock artwork samples transferred 357,824 bytes of thumbnail bodies; a completed Distro sample transferred 265,085 bytes. Both exclude the shared 64,910-byte staff logo and remain below the existing 1 MiB row-artwork budget. No original artwork requests were observed. Three distinct Distro thumbnail URLs returned 404 and became placeholders; this is a coverage issue, not proof that all thumbnails succeeded. Fast foreground captures often preceded image completion and must not be treated as zero-byte completed artwork samples.

Before repeated probing, dashboard usage at approximately 13:35–13:41 UTC showed:

| Service         | Reported usage                                                    | Period / qualification                                                                                         |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Workers         | 4,747 of 100,000 requests                                         | Current UTC day                                                                                                |
| D1              | 250.48k rows read, 818 rows written, 15.07 MB storage             | Current day for operations                                                                                     |
| Durable Objects | 62.31k requests, 2.62k GB-seconds; 311 SQL rows read, 176 written | Displayed September 2–October 2 period; used as a conservative upper bound on today's use, not a daily reading |
| R2              | 2.07k Class A, 62.64k Class B, 1.47 GB                            | Displayed billing period                                                                                       |

All displayed charges were $0. The initial sixteen-navigation plan was revised once to at most 32 because foreground verification was demonstrably unreliable; 30 were used. The revised ceiling was 1,600 staff requests, 100 application API reads, 500 R2 Class B operations, and 100,000 D1 rows read. Reserved ordinary-service headroom included 50,000 Worker requests, 2.5 million D1 rows, 30,000 DO requests, 6,500 GB-seconds, and 5 million R2 Class B operations. The unchanged read paths reused retained local no-KV/no-session evidence; no content or commerce writes were requested.

The network event stream recorded 1,357 same-origin request starts, including 60 non-thumbnail application API calls and 322 thumbnail attempts. All were GETs. Capture began after the initial Overview navigation; adding that document and its 29 observed same-origin resources gives a conservative coverage upper bound of 1,387 requests, including at most 63 application reads. There were no `Network.loadingFailed` events, although the three distinct thumbnail 404s above are HTTP failures. Browser counts are not billed D1, DO, or R2 operation deltas, and no post-run provider delta was established. No quota warning was observed. Future hosted work needs a fresh preflight under [the Free-tier rule](../../../docs/cloudflare-free-tier.md).

## Local build experiment

Two native Astro 7.3.2 builds used the same current source, PRD staff environment, and ignored configuration/output paths. The second build aliased the content-model root to an identical local copy with `sideEffects: false` and set `build.inlineStylesheets: 'always'`. Both built all seven routes successfully. These are diagnostic builds, not canonical CMS release artifacts or hosted acceptance.

The eager graph starts at emitted module scripts plus `client:load` island component/renderer URLs and follows static chunk imports only. Per-file Brotli uses quality 11. These are reproducible compressed-size estimates, not measured network transfers.

| Route                     | JS raw, baseline → optimized | JS Brotli, baseline → optimized | JS chunks | HTML Brotli, baseline → optimized | Initial project CSS requests |
| ------------------------- | ---------------------------- | ------------------------------- | --------- | --------------------------------- | ---------------------------- |
| Overview                  | 484102 → 383624              | 138743 → 113822                 | 24 → 24   | 3914 → 16001                      | 1 → 0                        |
| Website / Distro document | 561692 → 561017              | 162569 → 163056                 | 34 → 35   | 3781 → 16702                      | 2 → 0                        |
| Stock                     | 507697 → 495926              | 145085 → 141633                 | 26 → 27   | 4114 → 16211                      | 1 → 0                        |
| Orders                    | 496164 → 395686              | 141897 → 116975                 | 26 → 26   | 4159 → 17412                      | 2 → 0                        |

Optimized Overview and Orders contain only `validation.ts` from content-model and no Zod modules. Stock also drops the unrelated content schemas, but retains 18 Zod modules for its other consumers. Website still needs content validation and retains 20. The metadata change does not justify removing runtime validation or claiming that every route becomes smaller. Module request count does not fall in this experiment.

Overview HTML grows from 17,418 to 89,861 raw bytes; approximately 72.5 KB of project CSS becomes inline. Its Brotli HTML grows by 12,087 bytes, replacing a stylesheet that otherwise requires private revalidation. Google Fonts CSS remains external. Closed editor/picker CSS must remain behind the existing lazy boundary; native inlining is not permission to move that CSS into initial HTML.

A separate esbuild constants-only probe fell from 445,478 to 463 raw bytes (75,641 to 229 Brotli bytes), and the navigation probe fell from 452,224 to 7,125 raw bytes. That isolated result identified the root import effect; the native Astro table above is the relevant sizing evidence. The audited package has schema/regex construction but no required external import-time registration or mutation. Its existing root exports can stay intact.

Ignored reproducibility files are under `.codex-artifacts/staff-latency-round-three/`: `bundle-probe.mjs`, `bundle-probe.json`, `staff-probe.config.mjs`, `compare-builds.mjs`, and `native-build-comparison.json`, plus the two build directories. These are local diagnostic artifacts, not dependencies required by the implementation. The tables in this document are the retained sanitized evidence; a complete raw browser archive is not committed.

## Exploratory rendering samples excluded from the comparison

Document visibility sometimes reported `visible` while animation callbacks ran at roughly one-second intervals. Bringing Chrome forward briefly helped, then measurements slowed again. These eighteen samples preceded the explicit foreground confirmation. Their network observations remain diagnostic; their rendering numbers are not pooled with the confirmed cohort. `—` means not captured, not zero.

| Sample                        | HTML TTFB |   FCP | Observed primary content |
| ----------------------------- | --------: | ----: | -----------------------: |
| Overview initial              |    2968.3 | 21072 |                        — |
| Website initial               |    1299.6 |  2804 |                   3902.4 |
| Stock initial                 |    1924.8 |  5196 |                   7140.6 |
| Distro initial                |    1500.7 |  4796 |                   4793.7 |
| Overview warm 1               |    1510.3 |     — |                   4052.8 |
| Website warm 1                |      94.4 |     — |                        — |
| Stock warm 1                  |      92.4 |     — |                        — |
| Distro warm 1                 |     100.4 |     — |                   2271.2 |
| Overview warm 2               |     100.7 |     — |                   1055.5 |
| Website warm 2                |     108.0 |     — |                   1287.2 |
| Overview foreground attempt 1 |    1775.1 |  1992 |                   5378.5 |
| Website foreground attempt 1  |      94.4 |   332 |                    746.6 |
| Stock foreground attempt 1    |     100.9 |   264 |                   1080.9 |
| Distro foreground attempt 1   |      97.0 |   260 |                    927.7 |
| Overview foreground attempt 2 |     206.3 |   616 |                   3191.0 |
| Website foreground attempt 2  |     119.3 |   392 |                   2691.5 |
| Stock foreground attempt 2    |     110.4 |   308 |                        — |
| Distro foreground attempt 2   |     116.0 |   316 |                   2462.2 |

## References

- [Astro's native stylesheet inlining](https://docs.astro.build/en/reference/configuration-reference/#buildinlinestylesheets) supplies the selected configuration option.
- [esbuild tree shaking](https://esbuild.github.io/api/#tree-shaking) explains the role and correctness obligation of side-effect annotations; the actual Astro build was tested separately.
- [Chrome background-tab behavior](https://developer.chrome.com/blog/background_tabs) supports controlling foreground conditions rather than trusting a visibility flag alone.
- [Cloudflare Worker-first asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) explains why authentication can precede asset serving. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) does not make an authenticated dependency chain disappear.
- [Durable Object location](https://developers.cloudflare.com/durable-objects/reference/data-location/) does not support inferring persistent data location from a browser's edge colo. No region migration is proposed.
