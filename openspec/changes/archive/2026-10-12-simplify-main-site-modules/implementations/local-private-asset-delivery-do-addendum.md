# Local private asset delivery: registered Durable Object addendum

10 October 2026, following the user's explicit adaptive authorization. The original
`local-private-asset-delivery.md` and all original external/setup results remain
immutable. Existing `main`, HEAD `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`.
Implementation remains **blocked**, with no source repair or acceptance claim.

## Result

The one completed registered Durable Object comparison did **not** reproduce the
corruption. The real actor consumed intact external-binding bytes, and its
separately fetched stream remained intact through the named RPC return to the HTTP
caller. Both the fixture stream and the still-corrupt normal private response used
chunked HTTP framing. A named Durable Object hop or chunked framing alone is
therefore insufficient to reproduce the observed production-chain defect.

Good full SHA-256:
`92be7827d6c18ddf62ea4e84709f42700025c07059842e13158ea9bcfee50e2d`.
Bad normal-private full SHA-256:
`d848014b8d7cd72183a5135b3fee7b4f7f102ea47c2a89338564e786390ae57e`.
Every font response below contains exactly 78,616 bytes, HTTP 200, `font/woff2`.

| Path                                                               | Full hash identity | Chunk order |
| ------------------------------------------------------------------ | ------------------ | ----------- |
| Source font                                                        | Good               | Original    |
| Normal public 4321                                                 | Good               | Original    |
| Normal private CMS 8787                                            | Bad                | Reordered   |
| Isolated public producer 18991                                     | Good               | Original    |
| External response consumed **inside** registered actor             | Good               | Original    |
| Separate external stream returned by actor named RPC to HTTP 18992 | Good               | Original    |

`do-variant.json` records full per-path hashes, headers and each 8 KiB chunk hash.
The three direct/normal bodies and actor-streamed HTTP body are retained as
`do-{normal-public,normal-private,fixture-public,actor-streamed}.woff2` in the ignored
evidence directory. The bad normal body retains source offsets
`[0,8192,57344,16384,24576,32768,40960,49152,65536,73728]`; every fixture read retains
`[0,8192,16384,24576,32768,40960,49152,57344,65536,73728]`.

## Actual native boundary and identities

The same two-process Wrangler harness and installed versions were reused:
Wrangler 4.141.0, Miniflare 5.20260925.0-alpha, workerd 1.20260925.1, Node v24.21.0.
No runtime upgrade, additional dependency or repository test/configuration was
introduced. Only ignored fixture code/configuration changed.

- Producer Node PID 31432 owns workerd PID 45192 at 18991; registry instance
  `8433461c-21d6-4c3d-b479-fe05421107ef`, debug address `127.0.0.1:51877`, default
  entrypoint `assets:rpc-proxy:asset-causal-public`.
- Consumer Node PID 48844 owns workerd PID 51808 at 18992; registry instance
  `50f29b0a-566c-4079-a1ec-3026cc19ae3d`, debug address `127.0.0.1:51894`, default
  entrypoint `core:user:asset-causal-consumer-do`.
- Both actual executables have SHA-256
  `67e15f27397a2bfaba721b4896537d9883f17c074b0ddfee3d42e30a9b534982`.
- Real binding `CMS_RUNTIME`, class `AssetActor extends DurableObject`, named actor
  `editorial`; actor ID measured inside the materialization method is
  `c5d53ba4250ced0c703f9f2f2263c8dbcf0ad2f582f6379cef3ec8bc3835de74`.
  Both requests use that same namespace/name; the streamed request has no extra
  diagnostic response header. The actor ID for that path follows the same named
  namespace lookup, rather than an independently captured response field.

`consumer-do-fixture.json` registers the actual class/namespace with one ephemeral
`new_sqlite_classes` migration. `persist: false` is supplied to the existing
`unstable_dev` API. No DurableObjectState stub, database fixture or CMS schema was
used. The fixture invokes
`env.CMS_RUNTIME.getByName('editorial').fetchWithBindings(request, config)`, matching
the production named RPC shape at `cms-worker.ts:123-128`. The actor makes separate
external `PUBLIC_SITE.fetch` calls for materialized versus streamed modes. It copies
the same private response headers and uses the same `new Response(asset.body, ... )`
wrapper. There is no tee/clone, timeout change, assertion weakening or browser run.

A metadata-only setup failure before either actor comparison is retained as
`do-setup-metadata-failed.{json,log}`: Windows PowerShell lacked `Get-FileHash` in
that subprocess. The fixture was cleaned up. The metadata capture was corrected
to hash the executable with Node, without changing the comparison, timeout,
runtime, header or actor semantics. One subsequent completed DO variant provides
the result above; no further live probe was run.

## Remaining boundary and exact owner handoff

The reduced **external service + registered actor + named RPC streamed response**
chain preserves binary fidelity. The full built normal CMS/public-runtime chain
still corrupts it. This does not identify a before/after corruption layer inside
the normal actor, exclude an upstream defect triggered by the complete chain, or
prove a source regression. A simple buffer patch, service-binding option change or
runtime replacement remains unjustified.

Return to original backend-runtime module 29 implementer
`01a126b3-3ce1-7692-848a-6adb8165187a`, with cms-runtime assistance as needed. Exact
production route remains `cms-worker.ts:123-128` named RPC,
`CmsRuntime.fetchWithBindings:486-489`, `previewRead:357-368`, external debug-port
`PUBLIC_SITE`, and `cms/public-runtime.ts:36-48` public asset forwarding. The
remaining difference is the complete compiled `CmsRuntime` and public Worker,
their binding/export configuration, private authentication/middleware context and
persisted actor execution, rather than the reduced registered-hop shape alone.
No one of these remaining differences is established as the cause.

The minimum next action for the parent to authorize is a source-bound observation
of body fidelity **inside the actual compiled CmsRuntime** immediately after its
external fetch and at its named-RPC HTTP return, retaining the existing Local
actor/state and exact public registry target. This requires the closed owner;
it was not executed here and this role adds no instrumentation or product edits.
No safe Local-only repair candidate is established by either completed comparison.
Stop further probing in this role as instructed.

## Source, checks and resources

`evidence.json` records fixture/configuration/script hashes, full before/after
source differences, actual body evidence and resource handoff. Production and
repository test deltas remain **0 physical / 0 nonblank**, files added/deleted
**0 / 0**. Only the original dedicated report and this addendum are new repository
documents; ignored artifacts are separate. The original report SHA-256 remains
`f22f0eb1f37b0b6f08bfe739bda881d36398912aae2e6ed81a08152b6da04c7f`.
Main 29-module accounting, canonical reviews/implementations, precursor/correction
histories, failed private browser archives and tasks 10/60 are preserved.

OpenSpec guard, scoped note Prettier and guarded strict change validation pass.
No source/test lint, module test or global validation is claimed for unchanged
source. Final global validation, graph/browser union and acceptance remain with
the verifier. No branches, worktrees, commits, pushes or deployments were made.

All fixture Node/workerd processes and debug listeners were stopped, isolated
registries are empty, 18991/18992/51877/51894 are free and **0/3** validation slots
are held. Chrome is free; no browser lease was taken. Normal Local stack PID
**4404**, exec session **50593**, remains running: Worker 8787/workerd 61712,
public 4321/workerd 30104, Stripe mock 12110/12111/12112. Control is returned to
the parent/final verifier; resource handoff is ready. The unchanged normal private
font is still corrupt, so implementation status is **blocked**.
