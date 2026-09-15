## 1. Confirm prerequisite and existing freshness

- [ ] 1.1 Run `pnpm openspec:guard` and verify completed EmDash acceptance/cutover/handoff and reconciled specs; record the final accepted artifact, hostnames, listing route and public/private binding boundaries before assessment work begins.
- [ ] 1.2 Inventory Static Asset Cache, Document Revalidation, Same-Session Shell Cache and Worker API Freshness on the final topology; verify listing-price response/client no-store behavior and identify snapshot invalidation/publication paths without changing them.

## 2. Collect bounded evidence

- [ ] 2.1 Use existing observability to establish listing browsing demand, response bytes, request locality, current read/CPU/object cost and update frequency; report unavailable values explicitly and verify purchase estimates are not substituted for browsing volume.
- [ ] 2.2 Rehearse representative listing measurement locally across usable fixed/custom prices, missing/inactive snapshots and updates; verify counts/timings are reproducible and distinguish Local simulation from actual edge-cache evidence.
- [ ] 2.3 Trace GET side effects, read current account-wide resource headroom and set explicit request/operation caps before a UAT pilot of at most five listing reads with no automatic retries; deliver actual costs and stop if the budget or observed side effects differ from expectations.
- [ ] 2.4 Verify current Free-plan/hostname support and routing for conditional responses, browser caching and any candidate public edge mechanism; deliver a matrix covering Cache API locality/Access restrictions, CORS, cache keys, invalidation, misses, failure/rollback, and expected reads saved versus added work.

## 3. Discuss and record the decision

- [ ] 3.1 Present the measured no-store-versus-cache comparison to the user with concrete proposed freshness windows only if justified; record the explicit decision and do not infer TTL approval from the original assessment request or elapsed time.
- [ ] 3.2 If no cache is justified, record the no-store decision and close the assessment; if a cache is agreed, use the OpenSpec update workflow or an approved implementation change to define exact TTL/mechanism, full affected listing/freshness deltas, budget and rollout before any runtime edit, verifying the resulting artifacts match the user's decision.
- [ ] 3.3 Validate the completed assessment artifacts with strict OpenSpec validation and targeted formatting checks; if any diagnostic code was added, run its relevant checks and all repository-required behavior gates, reporting measurement limitations without claiming a cache was deployed.
