## Context

Evidence came from the nine workflows, the smoke runners and roughly 45 recent hosted runs. See proposal.md for motivation.

- Run 34611386558 failed `happy_path_paid` with `locator.click: Timeout 2000ms exceeded` while the checkout page still showed "Calculating delivery and current prices…"; the concurrent scenario needed 11 s to open checkout.
- Run 36266176320 failed static smoke on a real hosted `402` console error, so the console-error assertion stays.
- The sitemap lists artist, release and news detail pages but not Store Items; the Store listing links every Store Item.

## Decisions

- Single-source versions through `pnpm/action-setup` without `version` and `actions/setup-node` with `node-version-file`. Jobs that check out a candidate SHA now use that source's declared toolchain, which matches its lockfile.
- Add `persist-credentials: false` to every checkout. `gh` uses `GH_TOKEN`; no step pushes or fetches through git.
- Keep static-smoke inputs to site URL, scenario and screenshot policy; the runner keeps its other CLI flags for local use.
- Add one shared job-summary helper in the smoke core and call it from each runner's entry point; outside GitHub Actions it does nothing.
- Discover one representative detail page per section from generated markup with bounded regular expressions, like the existing media-path check. Skip Store category segments using the web app's reserved segment set.
- Keep code-owned section headings and UI copy. Store Items expect `Back to Store`, which every item renders; `Add it to the cart` renders only for purchasable items, and provider smoke already proves purchase. `/about/` asserts no label: its section label is CMS content, and UAT still shows `About` because the `Who we are` label was published only in Local.
- Ignore the Chromium `compute-pressure` permissions-policy message in the shared console filter. It appeared in one of three live runs after discovery selected an artist page with a YouTube embed; site code never requests that feature.

## Risks / Trade-offs

- Discovery follows the first listed entry, so a broken page later in the list is not probed. The suite remains a smoke check, not a crawl.
- Markup-based discovery depends on generated `<loc>` and anchor output; a format change fails with an explicit discovery error.
- Digest pinning still requires approving the pending Renovate branch; this change only removes the test obstacle.

## Migration Plan

Merge through the normal Software Release. The next Release run exercises the updated static smoke and summaries. Dispatch `UAT static smoke` once to confirm the reduced inputs. Revert by restoring the previous workflow and runner files; no data or provider state changes.
