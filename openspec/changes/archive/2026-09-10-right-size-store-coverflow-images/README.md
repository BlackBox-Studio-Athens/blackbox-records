# Acceptance — 2026-09-10

Accepted for closure at 19/19 with explicit timing exceptions. After the remaining gate and the containment change's exceptions were explained, the user authorized applying the same documented exceptions to close this child. This accepts the retained implementation; it does not turn rejected timings into numerical passes or relax the main performance specification.

## Retained implementation and evidence

Commit `46a78e3f` introduced bounded Coverflow image slots; `9f37b7db` added initial-active-cover-only high priority. The original baseline and both implementation measurements remain under ignored `.codex-artifacts/runtime-performance/{81ce9976,46a78e3f,9f37b7db}/`, including bundle, load, activation, wide, mobile, and legacy traversal reports. The parent README retains the before/after results and original failed gates.

The subsequent [accepted containment change](../2026-09-10-contain-below-fold-distro-chunks/README.md) addresses the measured DOM/layout boundary. Its final reports are under `.codex-artifacts/runtime-performance/contain-closure/`. Closure independently matched the current source and build to those reports: revision `d994bb01264f473cfc31bf69be78f9d5e99e4a33`, source SHA-256 `aabe0aa90a6181749e707a2b74f152f2246b92c8ba8e33f492293d5f468a5e3c`, and build SHA-256 `ef19f70a1c59c4173781624d98d0e433c1378bd2053f7adb228e15d5eb47e0a7`. This identifies a measured dirty tree, not a new implementation commit. No application code changed during this closure.

- Five cold mobile runs per route: Store All LCP median/p75 1.072/1.080 seconds, maximum CLS 0.010066; Store Distro 1.164/1.188 seconds, maximum CLS 0.000642. Every load is below the 2.5-second LCP and 0.1 CLS gates.
- All three Store activations retain 104 cards, exactly one listing projection, zero per-card Store Offer reads, and zero Store 5xx responses. Static-only projection `404` remains classified as local API unavailability.
- Mobile expanded traversal records zero layout slices, application-work p95 at most 0.388 ms, paint at most 5.836 ms, and tasks at most 11.654 ms. Wide quiet confirmation has rendering slices below 13.6 ms. Primary and control traces remain retained.
- Existing native Browser Use acceptance on the same application tree covers direct/shell Store All and Distro at desktop/mobile, sharp and ready covers, traversal, disclosure, complete 104/101 card graphs, focus, no overflow, reduced motion, no-JavaScript fallback, overlays, and persistent playback. See the containment evidence for the full browser matrix and classified external-provider browser limitation.

## Accepted exceptions

The final uninstrumented mobile disclosure report has one 51 ms task; tracing retains four rejected 51–77 ms tasks and layout up to 44.339 ms. Occasional wide traversal spans have inconclusive attribution, including a 144.545 ms automation animation-frame callback with only 0.188 ms thread CPU. Thread CPU is diagnostic evidence, not a replacement for wall-time budgets. These are the same bounded exceptions accepted for containment, now accepted for this child's closure. Raw slow samples remain available.

Only parent tasks 2.1, 2.2, 2.4, and 2.5 are closed by this handoff. Historical exact-commit runs satisfy the original measurement work; the final containment evidence is identified by revision plus source/build hashes. Parent browser acceptance and final launch-tree verification remain separate. No hosted performance, provider, or production-launch acceptance is implied.

## Closure verification

Fresh `pnpm test:unit`, `pnpm check` (including commerce boundaries), `pnpm build`, `pnpm audit:unused`, and `pnpm performance:bundles` passed. Logs are ignored under `.codex-artifacts/right-size-closure-{unit,check,build,unused,bundles}.log`; unused-code findings remain non-blocking. Strict validation passes for this child, `production-go-live-readiness`, and the synchronized `site-images` spec. Normal main-spec validation passes all 38 specs; unrelated placeholder Purpose warnings remain. Both added requirements and all five scenarios were compared verbatim after synchronization. `git diff --check` passes.
