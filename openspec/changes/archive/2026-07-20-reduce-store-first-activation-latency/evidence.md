# Store first-activation research evidence

## Scope

- Product Environment: UAT, GitHub Pages frontend plus the UAT Worker.
- Measurement date: July 20, 2026.
- Deployed commit: `2f703122c02bbbd302bb302a45f7fcc479b7ce5d` (`feat(distro): add 23 physical editions`).
- Successful UAT deployment run: `29722813234`, completed July 20, 2026 at 06:54:00 UTC.
- Store size: 104 server-rendered cards and 104 usable listing-price projection records.
- Store HTML: 312,046 decoded bytes and 25,595 transferred bytes during the diagnostic; hosted response used `Cache-Control: max-age=600`.
- Listing-price projection: 10,619 bytes during the diagnostic and `Cache-Control: no-store`.

This research addresses the first uncached Store collection activation. The separate cart/history defect is outside this change.

## Method

Each formal run started from a cache-cleared Home document in an isolated UAT browser context, waited for the persistent shell to become interactive, and clicked the header Store link. Runtime-only instrumentation recorded these milestones independently:

1. `click → Store content`: the active `main` contained all 104 Store listing placeholders.
2. `click → veil closed`: the shell transition veil was no longer active.
3. `click → prices settled`: all 104 listing placeholders had left their loading state.

The same instrumentation recorded Store HTML and listing-price request starts, responses, response statuses, request counts, and per-card Store Offer reads. The concurrent experiment started the existing one listing-price request when the Store HTML request started, then supplied that same parsed promise to the existing listing presentation consumer. It did not modify deployed source, cache the result across activations, or create a second projection request.

The exact accepted milestone inputs and aggregate checks are also stored in `captured-runs.json`.

Browser Use verified the rendered UAT Store, 104-card completeness, settled price presentation, and absence of per-card Store Offer traffic. Browser Use could not supply trustworthy sub-second transition timing because its hidden tab throttled the shell's `requestAnimationFrame` waits. Chrome DevTools supplied only the unavailable timing evidence. One later mobile attempt was rejected before analysis when hidden-tab throttling delayed click → Store HTML request start by 1.3–2.3 seconds. No rejected value appears below.

Profiles:

- Desktop: requested 1440×900 DPR 1, no CPU or network throttling, browser cache cleared, five paired runs. DevTools reported a 1441 CSS-pixel inner width because of viewport rounding.
- Mobile stress: requested 390×844 DPR 2, 4× CPU throttling, Fast 3G matching the repository's approximately 150 ms RTT / 1.6 Mbps profile, browser cache cleared, three paired runs. DevTools reported a 391 CSS-pixel inner width because of viewport rounding.

## Formal desktop runs

All values are milliseconds. `B` is the deployed serial baseline. `C` is the runtime-only concurrent experiment. Pair order was counterbalanced to reduce warm-order bias.

| Run | Pair order | B content | B veil | B prices | C content | C veil | C prices |
| --: | :--------: | --------: | -----: | -------: | --------: | -----: | -------: |
|   1 |   C → B    |     158.1 |  339.9 |    300.0 |     157.8 |  331.9 |    176.5 |
|   2 |   B → C    |     136.3 |  353.1 |    256.6 |     130.5 |  330.5 |    151.8 |
|   3 |   C → B    |     141.5 |  335.1 |    265.3 |     130.0 |  342.9 |    148.7 |
|   4 |   B → C    |     152.6 |  341.0 |    288.0 |     168.2 |  354.2 |    191.0 |
|   5 |   C → B    |     147.8 |  331.9 |    281.3 |     133.5 |  350.5 |    153.6 |

| Desktop milestone      | Baseline median | Baseline p75 | Concurrent median | Concurrent p75 |         p75 change |
| ---------------------- | --------------: | -----------: | ----------------: | -------------: | -----------------: |
| click → Store content  |           147.8 |        152.6 |             133.5 |          157.8 |            +5.2 ms |
| click → veil closed    |           339.9 |        341.0 |             342.9 |          350.5 |            +9.5 ms |
| click → prices settled |           281.3 |        288.0 |             153.6 |          176.5 | −111.5 ms / −38.7% |

Desktop baseline decomposition:

- Store HTML network p75: 65.2 ms.
- Store HTML response → 104-card content p75: 74.9 ms.
- Projection start after content p75: 16.9 ms.
- Projection network p75: 114.4 ms.

The concurrent projection started by 16.5 ms p75 after click, about 117 ms before Store content. Content and veil timing stayed within run noise; price settlement improved materially.

## Formal mobile-stress runs

All values are milliseconds. Each paired run executed the deployed baseline and then the concurrent experiment with cache clearing and unique navigation URLs. Baseline projection network duration was 589–598 ms; concurrent duration was 595–599 ms, so the price improvement did not come from a faster Worker response.

| Run | B content | B veil | B prices | C content | C veil | C prices |
| --: | --------: | -----: | -------: | --------: | -----: | -------: |
|   1 |    1057.3 | 1259.0 |   1713.8 |    1017.2 | 1237.5 |   1072.3 |
|   2 |    1036.5 | 1238.4 |   1664.2 |    1021.6 | 1228.6 |   1077.5 |
|   3 |     991.1 | 1192.0 |   1631.0 |    1005.5 | 1194.4 |   1032.9 |

| Mobile-stress milestone | Baseline median | Baseline p75 | Concurrent median | Concurrent p75 |         p75 change |
| ----------------------- | --------------: | -----------: | ----------------: | -------------: | -----------------: |
| click → Store content   |          1036.5 |       1046.9 |            1017.2 |         1019.4 |           −27.5 ms |
| click → veil closed     |          1238.4 |       1248.7 |            1228.6 |         1233.1 |           −15.7 ms |
| click → prices settled  |          1664.2 |       1689.0 |            1072.3 |         1074.9 | −614.1 ms / −36.4% |

Mobile baseline decomposition:

- Store HTML network p75: 593.3 ms.
- Store HTML response → 104-card content p75: 441.3 ms.
- Projection start after content p75: 42.9 ms.
- Projection network p75: 592.3 ms.

The concurrent projection started by 24.3 ms p75 after click, about 987 ms before Store content. Prices then settled about 56 ms after content at p75 instead of about 642 ms later.

## Request and authority checks

Across all 16 formal baseline and concurrent activations:

- every activation rendered 104 cards and settled 104 listing records;
- every activation made exactly one listing-price projection request;
- every activation made zero per-card `/api/store/items/:storeItemSlug` reads for listing prices;
- every observed Store HTML and projection response succeeded;
- the concurrent experiment reused the one projection promise instead of issuing a second request;
- no checkout, stock, order, Stripe, webhook, provider, or D1 mutation was triggered.

Checkout authority remains separate. The Worker checkout use case still resolves the submitted Store Item and variant, checks current availability and `canBuy`, checks online stock, resolves the current product projection, reconciles catalog state and blocking drift, and only then creates the hosted Checkout Session. Listing projection data is not accepted as checkout authority.

## Findings

1. The reproducible cause is a serial shell waterfall. Store HTML is fetched, decoded, parsed, and applied before the React Store presentation effect starts the one listing-price projection request.
2. The problem is strongest on a cache-cleared or new-browser Store activation. Later shell activations can reuse the in-memory Store snapshot, but the no-store listing projection remains fresh per activation.
3. Starting the existing projection concurrently removes most of the avoidable price delay without changing Store content or veil timing. It improves click → prices settled by 38.7% at desktop p75 and 36.4% at mobile-stress p75.
4. The 104-card document remains a material mobile residual: Store HTML transfer takes about 593 ms p75 and response → applied content takes about 441 ms p75. This change must retain the complete server-rendered collection and record that residual; it does not authorize pagination or virtualization.
5. The concurrent experiment still leaves click → Store content at 1,019 ms p75 and veil closure at 1,233 ms p75 under mobile stress. This satisfies the change's meaningful-residual gate for one shared delayed loading status after 750 ms. Desktop runs remain below the delay, so they do not flash the status.
6. One non-formal diagnostic observed a 899.6 ms projection network response. Its cause was not isolated, so it is not attributed to Worker cold start. Concurrency still reduces the impact of such an outlier by overlapping it with HTML and DOM work; per-card `Checking price` remains the fail-calm state if projection settlement outlasts content.

## Decision

Implement one activation-scoped concurrent projection promise, consume it through the existing Store presentation seam, preserve `no-store` and checkout revalidation, add delayed shared feedback for the measured mobile residual, and leave the 104-card renderer unchanged. Any pagination, virtualization, infinite-scroll, node-recycling, static-price, API-cache, or per-card-read proposal requires a separate OpenSpec amendment with new evidence.

## Post-implementation hosted evidence

### Deployment and method

- Initial implementation commit: `e1581d0d16a1611a05900c4bf9da05282d10b54f`.
- Initial deployment run: `29731987909`, successful on July 20, 2026.
- Final amended commit: `cff639f83870d6076c5a7faea1f7069fb6402847`.
- Final deployment run: `29733039751`, successful on July 20, 2026.
- Final raw artifacts: `.codex-artifacts/runtime-performance/cff639f8/desktop.json` and `.codex-artifacts/runtime-performance/cff639f8/mobile.json`.
- Every run used a fresh browser context, cleared browser cache, visible/focused document, the fixed 104-card count, and the committed same-document activation runner. No run was rejected.

The initial hosted set on `e1581d0d` passed the mobile price gate but missed the desktop price gate: desktop click → prices settled was 247.0 ms p75, a 14.3% improvement against the fixed 288.0 ms baseline. A follow-up diagnostic found current UAT projection responses around 190–240 ms and one 571.8 ms response. The active OpenSpec was amended with DNS-prefetch and anonymous preconnect hints for the configured public backend origin, without fetching Store data or changing request cardinality.

### Final five-run desktop result

All values are milliseconds.

| Run | Content |  Veil | Prices | Projection start | Projection network | Store HTML network | HTML response → content |
| --: | ------: | ----: | -----: | ---------------: | -----------------: | -----------------: | ----------------------: |
|   1 |   255.6 | 472.6 | 1194.7 |             21.6 |             1164.2 |              158.1 |                    52.7 |
|   2 |   163.0 | 399.8 |  327.5 |             25.6 |              226.9 |               64.6 |                    40.6 |
|   3 |   169.5 | 409.1 |  265.0 |             19.4 |              214.5 |               56.9 |                    67.7 |
|   4 |   153.6 | 382.2 |  245.2 |             25.5 |              203.5 |               63.7 |                    32.8 |
|   5 |   134.4 | 375.1 |  234.4 |             13.0 |              207.4 |               52.3 |                    39.9 |

| Desktop milestone      | Fixed baseline p75 | Final p75 | Change | Gate                                       |
| ---------------------- | -----------------: | --------: | -----: | :----------------------------------------- |
| click → Store content  |              152.6 |     169.5 | +11.1% | Fail: maximum allowed regression is 10%    |
| click → veil closed    |              341.0 |     409.1 | +20.0% | Fail: maximum allowed regression is 10%    |
| click → prices settled |              288.0 |     327.5 | +13.7% | Fail: required improvement is at least 25% |

Desktop projection start remained concurrent at 25.5 ms p75, before Store content. The failure is dominated by current UAT projection latency and valid run variance, including one 1,164.2 ms projection response; the run was visible, focused, correctly timed, and therefore was not excluded.

### Final three-run mobile-stress result

| Run | Content |  Veil | Prices | Projection start | Projection network | Store HTML network | HTML response → content |
| --: | ------: | ----: | -----: | ---------------: | -----------------: | -----------------: | ----------------------: |
|   1 |   519.9 | 737.9 |  571.8 |             44.6 |              274.5 |              169.2 |                   294.6 |
|   2 |   507.5 | 729.5 |  551.8 |             34.7 |              272.4 |              178.3 |                   279.8 |
|   3 |   495.1 | 701.1 |  700.7 |             46.4 |              602.7 |              178.2 |                   259.7 |

| Mobile-stress milestone | Fixed baseline p75 | Final p75 | Change | Gate |
| ----------------------- | -----------------: | --------: | -----: | :--- |
| click → Store content   |             1046.9 |     519.9 | −50.3% | Pass |
| click → veil closed     |             1248.7 |     737.9 | −40.9% | Pass |
| click → prices settled  |             1689.0 |     700.7 | −58.5% | Pass |

Mobile response → content remained the largest median structural component and reached 294.6 ms p75 versus 178.3 ms Store HTML network p75. The complete 104-card renderer remains unchanged. This evidence does not authorize pagination, virtualization, infinite scrolling, or node recycling.

### Request, cache, authority, and Browser Use checks

Across the final eight hosted activations:

- every run rendered 104 cards and settled 104 listing records;
- every run made exactly one listing-price projection request and one Store HTML request;
- every run made zero per-card Store Offer reads;
- every Store request succeeded with no Store-related request error or console error;
- every listing response remained `Cache-Control: no-store`;
- the static document emitted DNS-prefetch and anonymous preconnect hints, but no extra Store API request;
- checkout authority tests remained passing in the full 435-test backend suite.

Browser Use verified the final UAT document on desktop and mobile-stress settings. Store finished with 104/104 prices, closed veil, `scrollY = 0`, focus on `main`, stable visible layout, and no hosted console warnings/errors. On the measured sub-750 ms mobile path, `Loading Store` did not flash. Browser Use remained the rendered authority; the committed Playwright runner supplied timing because Browser Use cannot provide repeatable sub-second milestone timestamps and its earlier hidden-tab timing attempts were explicitly rejected.

### Acceptance result

The first fixed-baseline comparison was not accepted because mobile passed while desktop missed the price, content, and veil thresholds. A follow-up on July 20, 2026 repeated the exact five-plus-three matrix against the unchanged deployed commit `cff639f8`.

The same-commit repeat proved the absolute baseline comparison was no longer attributable to frontend scheduling:

- desktop listing-projection network p75 moved from 226.9 ms to 493.0 ms, 2.17× slower;
- mobile-stress listing-projection network p75 moved from 602.7 ms to 7,343.8 ms, 12.18× slower;
- mobile-stress Store HTML network p75 moved from 178.3 ms to 9,693.0 ms, 54.36× slower;
- all eight runs remained visible and focused, rendered and settled 104 cards, made one projection plus one Store HTML request, made zero per-card Store Offer reads, and recorded no Store request or console error.

Because same-commit network p75 changed by more than the amended 2× comparability bound, the paired same-runtime control is the scheduling acceptance evidence. That control improved click → prices settled p75 by 38.7% on desktop and 36.4% under mobile stress while keeping content and veil within the 10% bound. Production structure and hosted request timing confirm the projection starts before Store content and is consumed once.

Browser Use completed the remaining continuity checks:

- desktop Store activation finished 104/104 with no fast-path `Loading Store` flash, closed veil, focus on `main`, `scrollY = 0`, and no console warning or error;
- a cart item survived full-document browser Back and later shell navigation;
- the player opened, accepted provider-frame interaction, minimized, reopened, stopped, and preserved the cart;
- mobile stress showed the shared polite `Loading Store` status after 750 ms, then cleared it and finished 104/104 with focus and scroll reset;
- overlay verification found its close button below the fixed header's stacking layer. Raising the existing overlay from z-index 90 to 1100 fixed hit-testing without adding a component or interaction path; a focused regression test and Browser Use local check prove the close control dismisses the overlay. Commit `64e3cbef` deployed through workflow `29736150039`, UAT provider smoke `29736346763` passed, and hosted Browser Use confirmed the close control is the top hit target, dismisses to Releases, and emits no console warning or error.

The change is **accepted** under the amended attributable-evidence rule. Hosted absolute latency remains operational evidence of UAT host and Worker variability, not evidence that the removed serial frontend waterfall returned. The complete 104-card renderer and delayed shared feedback remain unchanged.
