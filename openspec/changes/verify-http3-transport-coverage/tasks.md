## 1. Confirm prerequisites and coverage

- [ ] 1.1 Run `pnpm openspec:guard` and verify the EmDash epic's completed final acceptance/cutover, handoff, and reconciled specs; record the accepted revision and stop implementation if that prerequisite is incomplete.
- [ ] 1.2 Inventory the final Local/UAT/PRD hostnames and every transport leg from the design, including public media and outbound/provider/webhook paths; verify the report records control/ownership and distinguishes native bindings from external network hops.
- [ ] 1.3 Recheck official Cloudflare/provider support and actual client capabilities; deliver the supported/unsupported/platform-managed matrix and confirm no proposed option needs paid service, new proxy topology, local launcher changes, or 0-RTT enablement.

## 2. Verify and enable feasible hosted HTTP/3

- [ ] 2.1 Reuse existing diagnostics or prepare a narrow protocol probe locally; verify that it reports negotiated protocol rather than advertisement, records cache/connection state, and refuses to claim HTTP/3 from a client without QUIC support.
- [ ] 2.2 Trace chosen safe API reads and establish current account-wide Free-tier headroom with numeric request/operation caps; verify the evidence accounts for object/D1/GET-side effects and excludes checkout/provider writes.
- [ ] 2.3 Snapshot affected UAT host/zone settings and enable HTTP/3 only where an owned supported setting needs changing; verify actual negotiation on public Pages/assets/media and public Worker targets with a capable client, documenting provider-owned-host limitations separately.
- [ ] 2.4 Verify protected staff/CMS/internal API transport under normal authorized Access identity; confirm observed responses are from the actual application rather than an Access redirect and expose no credentials in evidence.
- [ ] 2.5 Run the bounded comparable protocol samples and TCP fallback cases; deliver individual values, median/range, target identity and failures, without claiming production percentiles or database savings.

## 3. Rollout and handoff

- [ ] 3.1 Prepare the minimal PRD settings/release change after UAT acceptance and execute only through the applicable authorized rollout; verify each feasible PRD host and confirm fallback, authentication and unchanged checkout launch gates.
- [ ] 3.2 Verify rollback using the recorded settings and deliver final per-leg evidence; leave eligible unverified legs outstanding and explicitly justify unsupported/platform-managed exceptions.
- [ ] 3.3 Run targeted diagnostic checks and strict OpenSpec validation; if implementation changes behavior, also run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final tree, recording results and any unresolved hosted limitation before completion.
