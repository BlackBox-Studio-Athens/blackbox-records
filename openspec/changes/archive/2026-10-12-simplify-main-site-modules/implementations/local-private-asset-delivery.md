# Local private asset delivery: blocked implementation handoff

10 October 2026; independent implementation role; existing `main` at
`f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`. No acceptance is granted.

## Outcome

The review's current binary corruption finding is independently confirmed. The
authorized reduced external-binding comparison completed, but it did not reproduce
the corruption. No Local tooling repair is justified by that partial result, so no
production or repository test changes were made. The remaining production-specific
boundary must return to the parent for backend-runtime/cms-runtime ownership.

The complete reviewer result, report, evidence and parent audit were read. The
result SHA-256 matches the supplied
`527f46fb68838055039ad248acc5fe873604a641f316bb56c2eed1725bf098f2`.
All nineteen reviewed source/configuration identities checked here still match.
Both graphs were consulted: the broad Graphify query was truncated and replaced
with focused explanations of `startLocalPublicRuntime` and `run-local-stack.mjs`;
CodeGraph supplied the exact launcher, preview forwarding and RPC source.

## Native comparison and limits

Evidence is in `.codex-artifacts/simplification/local-private-asset-delivery/`:
`causal-probe.json`, `causal-probe.log`, `registry-at-probe.json`, the two fixture
modules/configurations, `fixture-runner.mjs` and `causal-probe.mjs`.

The verified fixture starts two separate Node processes through the installed
Wrangler `unstable_dev` API. Producer PID 26424 serves 18991; consumer PID 55892
serves 18992. Its isolated registry records producer instance
`d1547881-983a-4a4c-a1c4-ce23a942066b`, debug address `127.0.0.1:60800`, and default
entrypoint `assets:rpc-proxy:asset-causal-public`. The producer uses the existing
compiled public asset directory and directly returns `env.ASSETS.fetch(request)`.
The consumer's `PUBLIC_SITE` targets that external producer. Public and consumer
compatibility dates match their normal counterparts, 2026-09-16 and 2026-08-31;
both use `nodejs_compat`. Installed versions are Wrangler 4.141.0, Miniflare
5.20260925.0-alpha, workerd 1.20260925.1, Node v24.21.0.

The first consumer request consumes `asset.arrayBuffer()` and computes SHA-256
inside the Worker before any CMS response wrapper. A separate second fetch copies
headers, applies the exact four private preview headers and returns
`new Response(asset.body, { status: asset.status, headers })`. No response clone,
tee, mock fetcher, font replacement, browser or provider was used.

| Read path                                   |  Bytes | SHA-256 prefix     | Source-identical |
| ------------------------------------------- | -----: | ------------------ | ---------------- |
| Unchanged source                            | 78,616 | `92be7827d6c18ddf` | Yes              |
| Normal public HTTP after restart            | 78,616 | `92be7827d6c18ddf` | Yes              |
| Normal private CMS HTTP after restart       | 78,616 | `d848014b8d7cd721` | No               |
| Isolated producer direct HTTP               | 78,616 | `92be7827d6c18ddf` | Yes              |
| External binding consumed before wrapper    | 78,616 | `92be7827d6c18ddf` | Yes              |
| Separate external fetch forwarded as stream | 78,616 | `92be7827d6c18ddf` | Yes              |

Full hashes and 8 KiB chunk identities are recorded in the JSON. The normal private
body retains the review's source-offset order
`[0,8192,57344,16384,24576,32768,40960,49152,65536,73728]`; every successful fixture
read has the original order. Public/private normal ETags still match each other
despite different bodies; the clean rebuild changed the ETag to
`"6c5989b0f51da6597354c5a5557c9d09"`, while both full body hashes stayed unchanged.
The normal private HTTP response is chunked; the reduced streamed fixture response
has Content-Length 78616. This is an observed transport difference, not an isolated
cause or permission to add/change headers in product code.

Setup records are preserved separately, without treating them as causal passes:
`setup-no-stack.json` records the inherited stack disappearing before the first
GET; `setup-consumer-bundle-failed.{json,log}` records an ignored fixture import
pulling unsupported Astro virtual modules; and `setup-unproven-crossing.{json,log}`
records a same-process API experiment whose empty registry did not prove the
required external crossing. The final fixture corrected the static-header import
and isolated each runtime in a subprocess. Only the final verified external pair
supports the boundary conclusion. No additional native/browser matrix was run.

These results show that the reduced external binding plus module-handler wrapper
is not sufficient to reproduce this defect. They do not prove that the complete
production RPC chain, the upstream runtime or the CMS wrapper is correct. They
also do not identify the precise reordering layer or repair the failed browser
gate. No blanket upstream-tool defect or browser-only explanation is established.

## Exact owner route and minimum next action

The production route contains an additional named Durable Object RPC hop:

1. `apps/backend/src/cms-worker.ts:123-128` routes the private host through
   `CMS_RUNTIME.getByName('editorial').fetchWithBindings(request, config)`.
2. `CmsRuntime.fetchWithBindings`, lines 486-489, calls `previewRead`.
3. `previewRead`, lines 357-368, fetches `PUBLIC_SITE` and returns the streamed
   private response from inside the Durable Object method.
4. The installed external proxy resolves the separately registered public runtime
   through its debug-port service entrypoint; the public static handler at
   `apps/backend/src/cms/public-runtime.ts:36-48` returns `ASSETS.fetch`.

The reduced fixture places the consumer at the module fetch handler. It does not
replicate the named `CmsRuntime.fetchWithBindings` RPC return, persistent editorial
Durable Object, complete built Worker or middleware context. The nearest missing
source-backed boundary is therefore the named Durable Object response-return hop,
not a proven font or external-proxy defect.

Parent should route a bounded follow-up to the closed **backend-runtime** owner,
with **cms-runtime** assistance: retain the external producer and move both
materialized-body and streamed-body comparison branches inside a native Durable
Object method named `fetchWithBindings`, reached through that named RPC exactly as
above. Capture body hash inside the method and at the HTTP receiver, plus registry
instance/debug identities and response length framing. This is a proposed next
probe, not executed or accepted here. A buffer conversion at product line 368 is
only a conditional candidate if that owner proves correct bytes inside the method
and corrupt bytes after its streamed return, then supplies bounded-memory and
contract evidence. No such product edit is authorized or justified in this role.

No safe, smaller existing Local-launcher/service-binding option that addresses the
actual failing chain was established. Replacing the runtime, bypassing named RPC,
adding an HTTP adapter or buffering arbitrary public responses would add unproven
behavior changes. No dependent source edit was attempted.

## Changes, checks and resource handoff

Before identity: `before-identity.json`, 3,479 tracked/project/protected-history
records. After identity and exact differences: `after-identity.json` and
`identity-diff.json`. This support role adds only this dedicated OpenSpec note and
ignored evidence/temporary fixture files. Production delta: **0 physical / 0
nonblank**. Repository test delta: **0 physical / 0 nonblank**. Production/test
files added/deleted: **0 / 0**. The main 29-module 777 physical / 658 nonblank /
4 net files accounting is unchanged. Shared task/proposal acceptance markers and
both complete failed private browser archives remain unchanged.

`pnpm openspec:guard` passed before fixture preparation and before this note. The
note is checked with scoped Prettier. No changed production/test lint or module
test run applies because no such file changed. No regression was added for an
unimplemented repair; the native byte-fidelity fixture remains review evidence.
Final global validation, graph refresh, browser union, tasks 10/60 and all acceptance
decisions remain with the final verifier. No branch, worktree, commit, push or
deployment was created.

Inherited PID 49336/session 82764 exited independently before the first GET. This
role restored the authorized normal stack with `pnpm dev:stack:stripe-mock`.
Startup reported no pending commerce migrations, retained existing stock/prices
without reseeding and reused persisted Local data. Current stack PID **4404**,
exec session **50593**, serves public **4321** (workerd PID 30104) and Worker
**8787** (workerd PID 61712); normal Stripe mock ports 12110/12111/12112 remain
owned by that stack. All isolated fixture workers and debug listener 60800 are
stopped; 18991/18992 are free, the isolated registry is empty, all **0/3** validation
slots are held, and Chrome is free. No browser lease was acquired. The normal stack
is left running and its control is returned to the parent/final verifier.

**Implementation status: blocked; resource handoff ready.** Normal private binary
delivery still fails source equality. Required private Firefox/Chromium browser
acceptance remains unresolved, and no scoped fix or acceptance is claimed.
