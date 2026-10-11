# operator-auth — complete received review

Reviewer thread: `01a125ba-17cc-7b92-a69c-7e57a6ee8cc1`.
Reviewer turn: `01a125ba-32e8-7333-b092-e12dd16c4a70`.
Immutable source: `.codex-artifacts/simplification/26-operator-auth-review.result.json`.
Raw source SHA-256: `2ad7efaa01485ea8ad0da6dc7f4d801c9268fb88806b22f0c657b97e9cae1023`.
The complete received report follows. Historical conclusions and check gaps are retained; current implementation decisions are recorded separately in `../implementations/operator-auth.md`.

---

What this change does: This reviews the complete operator-auth module and its connected consumers for behavior-preserving simplifications. Two small changes are supported: avoid unused cryptographic test setup and avoid repeated URL normalization when looking up cached Access signing keys. No repository files were changed, and no project tests or shared validation were run.

**Scope and current behavior**

Working checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, on `main`. Editing scope for the future implementation thread is `apps/backend/src/interfaces/http/auth` and its directly owned tests. The root contains five files, with no nested module roots or generated files: three production files totaling 173 lines, one Worker test file totaling 246 lines, and a 24-line `project.json`.

The closed module exports only `./index.ts` and depends only on `backend-platform`. Its verifier validates the Product Environment, restricts the Local identity bypass to `localhost` and `127.0.0.1`, and verifies hosted Access assertions before producing a normalized operator email. Middleware places that identity in typed request context before allowing internal handlers to run. CMS authentication and preview authentication also consume the verifier; preview supplies its separate configured audience.

The deployment context is Cloudflare Workers serving protected operator and editorial requests. No traffic measurements were available. The improvements below rely on concrete operation counts; no latency improvement was measured.

**Should fix**

1. **Generate RSA signing fixtures only when the test uses them.**

   **What this is:** [operator-identity.worker.test.ts:69](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/auth/operator-identity.worker.test.ts:69) tests missing and malformed assertions. The rejection table at [line 95](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/auth/operator-identity.worker.test.ts:95) tests eight distinct signature, claim, and email failures.

   **Problem:** Lines 73–75 generate and export an RSA key for each missing/malformed case even though neither input reaches key resolution. Lines 105–108 also generate a second RSA key for every rejection row, although only the bad-signature row uses it. That is nine unnecessary key-pair generations and public-key exports per complete owned suite.

   **Source and caller proof:** `createSigner` at lines 185–221 always calls `generateKeyPair('RS256')` and `exportJWK`. The missing-token path returns from `operator-identity.ts:61–63` before verification. Installed `jose` 6.2.12 rejects the one-segment `not-a-jwt` string in [jws_verify.js:71](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/node_modules/jose/dist/webapi/lib/jws_verify.js:71), before the key callback at line 58 can run. In the eight-row table, only `['bad signature', { signingKey: 'other' }]` has a `signingKey` property; the other seven rows sign with `trusted`.

   **Smaller change:** Remove the signer declaration from the missing/malformed test and pass `createLocalJWKSet({ keys: [] })` to `verifyHosted`. In the rejection table, retain the trusted signer and replace the unconditional `other` fixture plus selector with:

   ```ts
   const signer = 'signingKey' in overrides ? await createSigner('trusted') : trusted;
   ```

   The presence check fully distinguishes the current literal table. Keep the helper’s `signingKey` option and the table’s bad-signature discriminator.

   **Behavior to preserve:** Keep every test row and assertion. The bad-signature token must still use a different private key with the same `trusted` key ID, and verification must still use `trusted.jwk`. Keep all issuer, audience, expiration, not-before, email, algorithm, rotation, infrastructure-failure, and forwarded-header cases.

   **Focused validation:** Run `pnpm test operator-auth` in the future implementation thread. Confirm all 23 source-defined cases remain. A read-only probe in this review confirmed that the installed `createLocalJWKSet({ keys: [] })` constructs a resolver without key generation or network access; the project test suite remains unexecuted.

   **Expected net reduction:** Approximately three owned test lines under the repository’s 120-column formatter, plus nine avoided RSA key-pair generations and exports. No production lines or test cases are deleted.

   **If we skip it:** The suite continues doing cryptographic work that cannot affect those cases’ results.

**Nice to have**

2. **Use the validated canonical issuer directly for the JWKS cache key.**

   **What this is:** [operator-identity.ts:123](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/auth/operator-identity.ts:123) caches a resolver for the public signing-key set, called JWKS, by its certificate URL.

   **Problem:** Line 124 constructs a URL and converts it back to a string for every hosted assertion that reaches this helper. On a cache miss, line 128 parses that same string into another URL. The issuer was already parsed and normalized by `parseHttpsOrigin`.

   **Source and caller proof:** Lines 96–113 validate hosted trust and return `url.origin`, after requiring HTTPS and rejecting non-root paths, non-empty query/fragment values, and credentials. The only production call to `remoteKeyResolver` is line 66, using that validated `trust.issuer`. CMS authentication at `apps/backend/src/cms/auth.ts:11` and preview authentication at `apps/backend/src/cms/preview-host.ts:32–36` both pass through the same verifier and validation. Preview’s audience override does not change the issuer-based cache key.

   **Smaller change:** Replace only line 124 with:

   ```ts
   const jwksUrl = `${issuer}/cdn-cgi/access/certs`;
   ```

   Keep `createRemoteJWKSet(new URL(jwksUrl))` on a cache miss, the existing map, and all verification options. Cloudflare documents this certificate endpoint, and JOSE documents resolver caching and refresh behavior. [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [JOSE remote JWKS resolver](https://github.com/panva/jose/blob/main/docs/jwks/remote/functions/createRemoteJWKSet.md).

   **Behavior to preserve:** Preserve the exact certificate URL, resolver reuse by issuer, separate audience checks, key rotation, lazy resolver selection when an injected resolver exists, and current error classification. All trust-boundary URL validation remains in `parseHttpsOrigin`.

   **Equivalence evidence:** An HTTPS origin is already the canonical scheme/host/port string. Appending the fixed absolute path produces the same string as resolving that path against the origin. A read-only Node probe compared both forms for 264 input combinations representing 36 distinct canonical origins, including default/non-default ports, host case, trailing dots, IPv4, IPv6, and internationalized/encoded hosts. It found zero differences. This supports the source reasoning and does not establish Worker runtime acceptance.

   **Focused validation:** Run `pnpm test operator-auth`, then the existing consumer tests through the repository runner:

   ```text
   pnpm test apps/backend/src/interfaces/http/operator-access-middleware.worker.test.ts
   pnpm test apps/backend/src/interfaces/http/internal-stock-routes.test.ts
   ```

   The hosted signed-identity case in `internal-stock-routes.test.ts:599–654` exercises the production resolver path using a mocked fetch and a real signed token. Retain its protection against forged forwarded email. Recheck the URL equivalence probe against the implementation’s final source.

   **Expected net reduction:** Zero production lines; a shorter expression and one fewer URL construction per hosted assertion reaching the helper, on both cache hits and misses. No network call is removed or added.

   **If we skip it:** Cached verification continues parsing a URL solely to reconstruct an already determined cache key.

**Rejected risky or unsupported ideas**

- Keep environment, loopback, trust configuration, assertion, algorithm, lifetime, and email validation. These enforce external trust boundaries and determine existing unauthorized versus unavailable outcomes.
- Keep the error distinctions at `operator-identity.ts:77–92`. JWKS timeout/format/key failures, base `JOSEError`, and `TypeError` map to temporary unavailability; other JOSE failures map to invalid tokens; unexpected errors propagate. The installed remote resolver throws a base `JOSEError` for unsuccessful JWKS HTTP responses, so merging these catches changes observable behavior.
- Keep the resolver cache. It stores reusable key resolvers, not operator identities or request payloads. Removing it changes fetch, caching, and rotation behavior. No evidence supports adding eviction policy or another abstraction.
- Keep the exported header constants, `OperatorAccessResult`, verifier signature, and optional resolver parameter. The forwarding-header constant has regression-test consumers, and the module’s declared public interface must remain compatible even where current production use is absent.
- Keep separate Local and hosted email-result branches. Invalid Local configuration returns `unavailable/invalid_local_identity`; an invalid hosted email claim returns `unauthorized/invalid_token`. Extracting these few lines would add indirection while retaining different outcomes.
- Keep `isLoopbackHostname`. Its name expresses a security policy; inlining it offers no demonstrated maintenance or performance benefit. Expanding the accepted hosts, including IPv6 loopback, changes current behavior.
- Keep the test helper’s `signingKey` property. The rejection-table caller uses it to select the alternate signer. It also allows that override object to be passed through the helper’s typed parameter.
- Delete no tests. All 23 owned cases have distinct regression value. The UAT/PRD policy rows, Local/hosted identity cases, signature/claim failures, remote failure, rotation, and forwarded-header checks cover separate behavior.
- Keep CMS role selection, hostname checks, and preview audience isolation outside this module’s edits. They are connected consumers with their own contracts.

**Inspected files and flows**

Every owned file was read completely, including test bodies and import/export spans omitted by CodeGraph:

| Owned file, relative to `apps/backend/src/interfaces/http/auth/` | Lines | Inspected responsibility                                                                          |
| ---------------------------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------- |
| `index.ts`                                                       |   1–7 | Public exports and compatibility surface                                                          |
| `operator-access-middleware.ts`                                  |  1–33 | Identity context, awaited continuation, rejection logging, 401/503 responses                      |
| `operator-identity.ts`                                           | 1–133 | Environment policy, Local identity, hosted trust, JWT verification, error mapping, resolver cache |
| `operator-identity.worker.test.ts`                               | 1–246 | All 23 cases and all signing/request/resolver helpers                                             |
| `project.json`                                                   |  1–24 | Closed ownership, dependency, exports, Node/Worker test targets                                   |

Connected source and test evidence included:

- `apps/backend/src/interfaces/http/app.ts:17–64` and `routes/register-internal-routes.ts:12–35`: middleware composition and protection before internal handler execution.
- `apps/backend/src/interfaces/http/operator-access-middleware.worker.test.ts:1–116`: protected route matrix, generic 401/503 bodies, no-store headers, and redacted rejection logs.
- `apps/backend/src/interfaces/http/internal-stock-routes.test.ts`: relevant fixture and auth cases at lines 1–62, 231–251, 296–315, 416–514, 599–654, and 691–716. These establish denial before service construction, protected discovery, Local actor attribution, signed hosted actor attribution, and safe responses.
- `apps/backend/src/interfaces/http/stock/register-internal-stock-routes.ts:849–883` and `936–970`: stock change/count audit actors come from middleware identity.
- `apps/backend/src/application/commerce/orders/register-internal-order-routes.ts:226–298`: protected order service construction and no-store reads behind the shared router guard.
- `apps/backend/src/cms/auth.ts:1–15`, `cms/preview-host.ts:1–67`, and the complete `cms/preview-host.test.ts`: CMS roles, exact preview host/audience, rejection handling, Local preview origin, and session response restrictions.
- `apps/backend/src/platform/env.ts`: environment schema, identity type, auth bindings, and typed request context; `platform/interfaces/http/responses.ts:263–287,355–367` and `platform/observability/index.ts`: safe no-store problem responses and request-scoped logging.
- Backend package/test configuration, relevant Wrangler configuration, module boundary policy, simplification proposal/design/spec, operator auth requirements, repository workflow/reference documents, and saved Ponytail instructions. Installed dependency sources were inspected for `jose` 6.2.12, with relevant Workers type definitions from 5.20260926.1.

Graphify’s initial `operator identity` query used budget 2500 and reported truncation: 66 of 127 nodes were shown. Focused explains for `verifyOperatorAccess`, `operatorAccessMiddleware`, `auth/index.ts`, the owned test file, `parseHostedTrust`, `parseHttpsOrigin`, and `remoteKeyResolver` resolved the relevant relationships. Extracted edges guided navigation; source and tests established behavior. CodeGraph returned current source and caller context; bounded exact reads filled its barrel and test-body gaps. This thread neither initialized nor refreshed either graph. A concurrent external Graphify refresh was observed, with its final graph bound to the closing HEAD.

**Source identity and stability**

Review-start HEAD: `3355c335226838f996efb5536f55271f819a3e14`.

Closing HEAD: `1dc943972e0c8cd28bc82c3d16bc964909d37963`.

HEAD advanced during concurrent work. All five owned file hashes and all 14 captured critical connected-file hashes remained unchanged between their initial and closing captures. The owned module had clean scoped Git status at both ends.

Owned fingerprint: `e89532ef78fe76a5d8cdc4344ed200a982f312d761d0735739dc9e21d4154f67`.

Connected-file fingerprint: `9b77cfdc00cd51bd380df97e8f007b63d62df76ff210467589ff000f87f32883`.

Fingerprints are SHA-256 over UTF-8 records sorted by relative path, each formatted as `<file SHA-256><two spaces><relative path>\n`; individual file hashes cover original bytes.

| Owned file                         | SHA-256                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `index.ts`                         | `f29f218dd5d3baf34599790f1edb2f5ef6ebfd198c12b35d276635bede34c953` |
| `operator-access-middleware.ts`    | `2f2069f73655c768c06472ca47c6583e18370bd189bab811951b6949a0c83e4d` |
| `operator-identity.ts`             | `f4345aaa3e81c651507ac1abe76b81ced51460b5f4eb3c34d2b8072c8c502e05` |
| `operator-identity.worker.test.ts` | `1e76104fb4424c0897da9a0d96b4fc98669c291afe9f16b1578837346360ec07` |
| `project.json`                     | `1bcb1b8da72870944c45bdecd90b02aa5f240cbcb10d6e793087a8b9437473f7` |

The connected fingerprint covers the router registration, HTTP app, middleware and stock auth tests, stock/order handler files, CMS auth/preview source and preview tests, platform environment/responses/observability files, backend package manifest, and module test configuration listed above.

**Verification and gaps**

Performed only source, document, graph, Git identity, and hash reads, plus two read-only probes: URL equivalence and empty local JWKS construction. Neither probe wrote files, generated signing keys, or accessed hosted services.

Project tests, `pnpm validate`, shared acceptance, browser checks, and provider checks were deliberately deferred to implementation/verification. The owned rotation test injects a remote resolver, so it establishes verifier behavior with JOSE rotation rather than directly proving reuse of this module’s default resolver map. The connected hosted stock test supplies additional default-resolver-path coverage when run. Context7 exposed JOSE’s official documentation without a pinned 6.2.12 documentation version; installed 6.2.12 source supplied version-specific control-flow evidence. No owned source or test body remains unread.

Verdict: Ready for a fresh implementation thread to independently verify findings 1–2.

Lean: Approximately three test lines, nine unnecessary RSA key-pair generations, and one URL construction per hosted assertion can be removed. No test deletion is proposed.

Not checked: Worker test execution, final repository validation, runtime/provider/browser acceptance, and measured timing improvements.
