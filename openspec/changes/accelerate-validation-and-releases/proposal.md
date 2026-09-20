# Proposal

## Why

Full local validation is a frequent Codex wait, and UAT release preparation repeats serial work. Bounded local prototypes and existing CI/provider logs identify concrete improvements: cheaper test setup, native caches, independent preparation, bounded media reads, a faulty paid-order wait, and duplicate artifact bytes. Existing successful UAT attempts have a 22m08s median; this investigation used zero new CI runs. See [design.md](design.md) for results and limitations; [research.md](research.md) retains the earlier investigation.

## What Changes

- Move the proven 21 backend application/domain test files into the existing Node suite while retaining all Worker integration cases.
- Split web request tests from lightweight tests, preserving MSW lifecycle and rejection of accidental live requests.
- Add native Prettier content caching with tool/config/plugin invalidation and an uncached command; keep final lint uncached.
- Adopt the measured Local Worker cap of three on eligible hosts, retaining two for CI and lower-resource hosts. Keep other suite scheduling unchanged.
- Overlap independent web/staff builds and Chromium/Firefox fixtures with complete failure/cancellation handling.
- Reuse every unit/check leaf through partial `validate:checks` in CI, followed by the existing release gates.
- Restore immutable media in batches of at most four without increasing request counts or changing authority.
- Persist only Astro's native public image cache, retaining it only when normal releases demonstrate net savings; remove redundant package setup from the plain-Node inspection job.
- Fix the paid-order poll that always waits two minutes despite successful payment, keeping all final smoke checks.
- Transfer identical artifact bytes once using the existing manifest hashes, then reconstruct and verify both complete targets. Retain legacy candidate compatibility and PRD promotion without rebuilding.
- Extend existing measurement tools minimally and report actual Local and hosted outcomes. Require at least 20% lower warm-full median during implementation acceptance; verify fresh/fast non-regression rather than promising unmeasured gains.

The pilot measured full validation at **150.4s and 150.3s**, versus unchanged controls of **221.2s and 197.6s**: **23.9% faster against the stricter control, 28.2% midpoint reduction**. The browser-fixture wrapper fell from 105.8s to 53.9s. These are Local prototype results, not proof of end-to-end CI speed. The earlier 40% warm / 30% fresh / 25% fast / 35% UAT targets are replaced by evidence-based acceptance. New CI logs justify image-cache persistence: 1,103 images took 92.8s cold and 0.3s from the native cache later in the same job. The full artifact is 793 MB; manifest accounting suggests about 268 MB of unique compressed payload, and a real-image local round-trip shrank 47.3 MB to 11.8 MB. Stripe and Cloudflare show successful webhook handling roughly two minutes before our smoke ends. These support the implementation mechanisms; cross-run cache/transfer savings and complete CI speed still require natural-release observation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tooling-validation`: complete test selection, scoped setup, bounded scheduling, cache-safe formatting, partial CI checks, correct smoke polling, and low-overhead comparable evidence.
- `software-release-promotion`: bounded media restoration, independent preparation, native image reuse and lossless compact transfer with unchanged logical artifacts and release gates.

## Impact

Primary surfaces: existing validator/benchmark and process helpers, backend/web Vitest configs and package scripts, formatter command, restore/release-candidate/smoke scripts, workflow contracts, `.github/workflows/pages.yml`, and command/runbook documentation. No runtime dependencies, paid services, application behavior, deployment topology, or credential changes.

The [ten tasks](tasks.md) are prepared for **gpt-5.6-luna / max** to implement the selected design. Normal commands remain unchanged by the ignored prototypes. Reuse historical job/step data, allow at most one optional 60-second Linux round-trip probe inside an ordinary release, then collect normal-release metrics. No benchmark-only workflows, extra payments or paid runners. Hosted execution retains existing authorization and Free-tier boundaries; performance acceptance remains pending until comparable natural release evidence exists.
