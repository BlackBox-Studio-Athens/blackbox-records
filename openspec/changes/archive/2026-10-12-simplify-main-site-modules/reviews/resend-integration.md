# Resend integration — complete received review

Reviewer thread: `01a12592-452b-7133-9363-6c688cb5ac50`. Review turn: `01a12592-7c30-7da2-8bc5-3cb831651170`.

Immutable source: [full review result](../../../../.codex-artifacts/simplification/23-resend-integration-review.result.json), raw SHA-256 `9b8b3a5f2da31246d8bbf2cdbedacee167c0242be0429161807e4d01dde39f2e`. The complete received report follows; historical statements describe the reviewer’s read-only turn.

**What this module does:** `resend-integration` selects the Local mock or real Resend gateway, translates email and newsletter operations into SDK calls, and converts provider failures into safe retry classifications. The whole owned module review is complete. Three small simplification candidates are supported by current source and caller evidence.

This was a read-only review in the existing `main` checkout. No repository files, reports, OpenSpec tasks, graphs, generated outputs, or hosted services were changed. No tests or validation commands were run.

**Source identity and ownership**

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`.
- Branch and HEAD at opening and closing: `main`, `3355c335226838f996efb5536f55271f819a3e14`.
- Ownership: `apps/backend/src/infrastructure/resend`. No nested modules or generated sources were present in that root.
- The module is closed. Its sole public entrypoint is `index.ts`; allowed dependencies are `email-application` and `backend-platform`.
- Public exports to preserve: `createEmailRuntimeServices`, `EmailRuntimeServices`, and `ResendEmailGateway`.
- All six owned files retained their opening hashes and remained free of uncommitted changes. Twelve critical caller/dependency files matched their captured hashes at closing. Other modules had concurrent changes, including backend-platform files, so this is source-bound module evidence rather than a frozen whole-repository review.

Module fingerprint: `b1e449e7c95f3b922f4cc7186252fe17049d66dd1384e708d977a31d5164511e`. This is SHA-256 over UTF-8, LF-terminated, filename-sorted lines of `<repository-relative path> <lowercase file SHA-256>` for the following six files.

| Owned file                               | Lines inspected | SHA-256                                                            |
| ---------------------------------------- | --------------: | ------------------------------------------------------------------ |
| `email-runtime-services.ts`              |            1–30 | `6f90d5cbb42099bca560b078c9609972d6652696690397b84fdfd4f468eca688` |
| `index.ts`                               |             1–3 | `430b64690c9bdd398aeb0e24268381b5d5c5e6118db54026a7c005c7c110a008` |
| `project.json`                           |            1–24 | `74ddd5c3d2f928a629e2d715b6797995d19f8352b795b1fc91991bffb064de32` |
| `resend-email-gateway.ts`                |           1–176 | `7f38580a1cf1cd55558464688f423806f82b69d7faeffa20debe55de31b9c8ae` |
| `resend-email-gateway.worker.test.ts`    |           1–204 | `d3c56e9ed4ce587857beb9fd8e74ec3944b74c2c40d6e82862d3a724f9abaa9b` |
| `resend-sdk-worker-shape.worker.test.ts` |            1–26 | `950d775f8eb805d6db7d2646cc2ee1fae3b5319fb645435776bfb927d86f48a1` |

**Nice to have — proven simplifications**

1. **Remove the internal factory that only forwards the API key.**

   **Location:** [resend-email-gateway.ts:91](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/resend/resend-email-gateway.ts:91), lines 91–93; [email-runtime-services.ts:3](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/resend/email-runtime-services.ts:3), lines 3 and 17.

   **What this is:** `createResendEmailGatewayFromConfig(config)` does exactly `new ResendEmailGateway(new Resend(config.apiKey))`. It has one caller, the real-provider branch of `createEmailRuntimeServices`.

   **Problem and proof:** The wrapper adds an internal exported function and couples the gateway file to the complete `EmailRuntimeConfig` type for one property read. Graphify identified its construction relationship; CodeGraph returned its complete implementation; source reference search found only its declaration, import, and one invocation. It is absent from the public `index.ts` exports.

   **Smaller implementation:** Construct `new ResendEmailGateway(new Resend(config.apiKey))` directly in the existing real-provider branch. Move the value import of `Resend` to `email-runtime-services.ts`, import `ResendEmailGateway` there, delete the wrapper, and remove the gateway file’s now-unused `EmailRuntimeConfig` import. Keep `Resend` as a type import in the gateway because `ResendClient` still uses it.

   **Behavior and coverage to retain:** Read and validate configuration first; evaluate the same Local/mock predicate; create one fresh SDK client and gateway only in the real branch; preserve constructor arguments, thrown failures, and every public export. Keep the existing Local mock, Local non-mock, and UAT mock-shaped-key selection cases in `interfaces/http/email-runtime-services.worker.test.ts:23–69`. Those caller tests are outside this module’s editing scope.

   **Focused checks:** `pnpm test resend-integration`, followed by verifier-owned checks of the runtime-services and public inquiry Worker tests. Final validation must retain backend type checking.

   **Expected reduction:** One internal function/export and approximately 3–4 net production lines. No measurable performance improvement is claimed. If skipped, behavior remains correct; the extra construction layer remains.

2. **Share the two error-mapping test bodies while retaining both cases.**

   **Location:** [resend-email-gateway.worker.test.ts:143](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/resend/resend-email-gateway.worker.test.ts:143), lines 143–203.

   **What this is:** Two tests construct the same fake SDK, send the same message, and compare the returned safe result. Their differences are the provider error name, expected reason, retryability, and test title.

   **Problem and proof:** The fixtures and message payloads in lines 144–165 and 175–196 are otherwise identical; both use status `409`. The production paths are distinct: `concurrent_idempotent_requests` maps to a retryable conflict at gateway lines 106–112, while `invalid_idempotent_request` maps to a non-retryable conflict at lines 114–120. Deleting either case would lose regression value.

   **Smaller implementation:** Use one `it.each` body with two rows containing the existing title, error name, safe reason, and retryability. Construct a fresh gateway and mock inside each invocation. Retain the exact message and full `toEqual({ ok: false, reason, retryable })` comparison.

   **Behavior and coverage to retain:** Keep two independently reported test cases. Both must reject raw diagnostic fields in the returned result through the exact equality assertion. Preserve retryable and non-retryable expectations; application consumers use those values to distinguish rescheduling from manual review.

   **Focused checks:** `pnpm test resend-integration`. Confirm that the test output still includes both error cases.

   **Expected reduction:** Approximately 18–25 test lines, depending on table formatting, without reducing the number of meaningful cases. If skipped, the duplicated setup and payload remain.

3. **Delete the standalone options-literal assertion from the SDK shape test.**

   **Location:** [resend-sdk-worker-shape.worker.test.ts:17](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/resend/resend-sdk-worker-shape.worker.test.ts:17), lines 17–24.

   **What this is:** The test creates a locally typed object containing a fixed `idempotencyKey` and asserts equality with the same literal. That object is never passed to the SDK or application code.

   **Problem and proof:** Its runtime assertion cannot detect missing idempotency forwarding. Its useful compile-time check is already performed by the production call: gateway lines 22–35 invoke the SDK-typed `emails.send` with `idempotencyKey` in the second argument. The retained gateway test at lines 26–64 independently asserts that the adapter sends that exact second argument. Backend TypeScript configuration includes both production and test source, and the guarded backend check runs `tsc --noEmit`.

   **Smaller deletion:** Remove the local `SendEmailArguments` alias, `requestOptions` object, and literal equality assertion. Adjust the test title to describe the retained import and operation-shape checks. Keep construction of the real SDK and every operation-presence assertion at lines 6–15.

   **Behavior and coverage to retain:** Preserve the actual Worker-toolchain SDK import and construction check. Preserve SDK signature checking in production and the gateway’s idempotency forwarding regression. The installed SDK is Resend `6.30.0`; its `emails.send` forwards options to `post`, which sets the `Idempotency-Key` header. Current official SDK documentation also places the key in the second send argument. [Resend SDK configuration](https://github.com/resend/resend-node/blob/canary/_autodocs/configuration.md)

   **Focused checks:** `pnpm test resend-integration`, plus backend type checking through final verifier-owned validation.

   **Expected reduction:** Eight test lines, plus an optional adjacent blank line. No meaningful runtime or signature coverage is lost. If skipped, the assertion continues to test only its own fixture.

**Behavior that must remain**

The current implementation has several deliberate constraints that should survive any selected cleanup:

- `sendEmail` copies only the seven approved payload fields and passes idempotency separately. It awaits the SDK before returning a mapped result.
- Newsletter registration updates the contact first. Only `not_found` selects creation. Creation includes explicit Topic opt-in, `unsubscribed: false`, consent properties, and the optional Segment.
- An existing contact’s failed update stops processing. Successful update precedes Topic opt-in; failed Topic update stops Segment addition. With no Segment, the Topic result is returned. Segment addition remains awaited and its own result remains authoritative.
- Successful provider responses return exactly `{ ok: true }`; provider IDs, headers, and diagnostics are not added to application results.
- The Local mock is selected only when the Product Environment is `LOCAL` **and** the validated key starts with `re_mock_`. Local non-mock keys and UAT mock-shaped keys retain real gateway selection.
- Error classification remains exact: concurrent idempotency conflicts, rate limits, and application/internal-server failures are retryable; invalid idempotency, quotas, validation/configuration failures, and unknown errors are not. These distinctions affect persisted delivery handling.

**Rejected ideas**

- **Spread the whole email message into the SDK payload:** this changes the explicit field projection and could forward extra runtime properties. Preserve the current payload boundary.
- **Parallelize Contact, Topic, and Segment writes or remove early returns:** this changes side-effect order and permits later writes after failure.
- **Replace update-first registration with create-first registration:** this changes provider calls and existing-contact behavior.
- **Replace error mapping with a shared constant-result table:** shared objects could change result identity, and table lookup requires careful unknown-key handling. No concrete benefit justifies changing this safety-sensitive mapping here.
- **Remove environment/key checks or share a module-global provider:** the checks enforce Local isolation; shared clients alter construction lifetime and environment/configuration handling. Cloudflare guidance also requires care with request-scoped global state. [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- **Delete the entire SDK shape test:** the mocked gateway tests do not establish that the real SDK imports and exposes its operations in the Worker toolchain.
- **Remove either idempotency error case or the newsletter create/update cases:** they protect distinct behavior.
- **Flatten the Local mock helpers solely to shorten the file:** their names expose the environment safety rule and no-network provider purpose. The proposed internal factory deletion has a clearer justification.

The owned gateway tests do not exhaust every error name or newsletter early-return branch. None of these three candidates changes that production logic. A broader mapper or contact-flow rewrite would need additional equivalence evidence and is not recommended by this review.

**Connected scope inspected**

All owned source, tests, exports, and module metadata were inspected in full. Connected inspection covered:

- The email provider SPI; runtime configuration and configuration errors; recipient routing and idempotency helpers; transactional-email and newsletter-registration callers; Services inquiry delivery; and the complete `email-application.test.ts`.
- All five production callers of `createEmailRuntimeServices`: public newsletter services, public Services inquiry services, withdrawal route composition, webhook email-delivery composition, and scheduled paid-order delivery composition.
- Complete runtime-services and public Services inquiry Worker tests, including Local selection, UAT sink routing, invalid configuration, safe provider rejection, and waiting for provider acceptance.
- Paid-order delivery result conversion and processing, with focused regression reads for transient retry, fifth-attempt review, and expiration without another provider request.
- The current Product Environment profile and binding definitions; installed Resend `6.30.0` implementation/types; installed Workers types `5.20260926.1`; backend test/type-check ownership; relevant newsletter, inquiry, paid-delivery, boundary, language, and simplification specifications; and the active change’s proposal/design/task context.

The expected runtime is the Cloudflare commerce Worker, including request-driven email operations and bounded scheduled delivery work. No performance or load measurements were taken.

**Graph evidence and limitations**

Both existing graph tools were used before substantive source investigation. The initial Graphify query, with budget `2500`, returned a truncated neighborhood. Focused `explain` queries for `ResendEmailGateway` and `createEmailRuntimeServices` then returned complete direct relationship lists; exact source searches established the remaining callers. No graph was initialized, rebuilt, enriched, or saved.

CodeGraph supplied current line-numbered production and test source. Its omission of the SDK shape test and its elisions in connected test files were filled with bounded exact reads. SDK source was inspected directly because it is outside the project index. No unresolved owned-source gap remains. Context7’s Resend references were from the official repository’s canary documentation; version-specific claims above rely on the installed `6.30.0` source.

**Verification handoff**

The implementation thread should independently confirm the recorded hashes and each candidate before editing. Its first focused check is `pnpm test resend-integration`. For finding 1, the persistent verifier should also check `email-runtime-services.worker.test.ts` and `public-services-inquiry-routes.worker.test.ts`, then run the authorized final validation and source-bound task updates. Preserve all public boundary metadata.

**Verdict:** Completed read-only review. Three optional, behavior-preserving reductions are supported; no mandatory fix was identified in the owned module.

**Lean:** Approximately 29–38 net lines are removable across the three candidates, subject to final formatting.

**Not checked:** Test execution, compilation, browser behavior, actual provider delivery, hosted acceptance, and performance. This report is returned inline for the parent to save under the existing OpenSpec change; no report file was written.
