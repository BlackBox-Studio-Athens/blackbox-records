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
