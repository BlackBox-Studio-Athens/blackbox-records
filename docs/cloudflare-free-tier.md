# Cloudflare Free-tier operating rule

Stay on Free. Do not enable a paid plan to unblock implementation or tests.

The combined CMS Worker uses Access identity and disables Astro sessions. Its canonical `pnpm --filter @blackbox/backend build:cms` command rejects KV in source configuration and in the final adapter-generated Wrangler artifact, including environment and unsafe KV bindings. Dependency upgrades must pass that build and the existing authenticated-request no-session-cookie regression. Deploy only an artifact from a successful canonical build; direct Astro builds are not release evidence.

Before bulk hosted imports, repeated probes, recovery rehearsals, or scheduled work:

1. Rehearse locally. Inspect the final generated bindings and trace service operations, including session/cache writes triggered by GET requests.
2. Read current account-wide usage for each affected operation type. Record the target, remaining allowance, expected operations, retry/pagination/background overhead, and explicit headroom for ordinary service. Unknown usage is not permission for an unbounded hosted run; continue locally until there is enough evidence.
3. Run a small bounded pilot within that allowance, measure actual operations, and revise the estimate before the full run. Stop if observed use exceeds the estimate. Reuse completed evidence instead of rerunning a full import or probe without a concrete reason.
4. On a quota warning, pause affected bulk work and retries, inspect the cause and remaining allowance, and reduce the operation count. On exhaustion, stop affected writes until the provider's stated reset and recheck usage before resuming. Reset alone does not fix unnecessary writes.

Adding a quota-consuming binding or background job requires a documented purpose, owner, measured operation budget, confirmed Free-tier availability, and behavior on exhaustion. Reintroducing KV additionally requires an intentional change to the build guard and its test with that rationale; there is no environment-variable bypass. This policy prevents accidental recurrence, not exhaustion caused by arbitrary account traffic.

Incident evidence: [UAT editorial import](../openspec/changes/replace-sveltia-with-emdash-operations/uat-editorial-import-evidence.md). Cloudflare reported the account's daily KV PUT allowance exhausted on 2026-09-13. Redundant Astro sessions were a verified contributor; the retained evidence does not attribute every account write.

Recovery was verified on 2026-09-14 at 01:01 UTC. Account-wide KV analytics reported no operations for the new UTC day before a bounded probe. One uniquely named diagnostic key in the existing M1 UAT session namespace was written with a 60-second expiry and read back successfully (HTTP 200 for both; exact value match). This used one PUT and one GET, with no retry, namespace creation, binding change, or plan upgrade. Evidence: `.codex-artifacts/emdash-m1/kv-reset-verification.log`. Analytics can lag; this is proof of restored access, not an exact remaining-quota guarantee. Keep the no-KV CMS guards and preflight budgeting rule in force.
