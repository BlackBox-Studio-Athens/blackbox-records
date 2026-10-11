# Backend runtime: Local font delivery repair attempt

**Blocked. The post-RPC buffering candidate failed the required normal private browser matrix and concurrent wire verification. It was rejected and reverted. No production or test repair remains, and no acceptance is claimed.** Existing `main`, HEAD `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`; execution crossed midnight into 2026-10-11 Europe/Bucharest. Tasks remain 10/60.

The complete actual-chain result, execution report, machine evidence index, binary check, closeout and parent causal/preparation audits were read. Their recorded source/protected/font inputs matched admission. No earlier reduced model was repeated. The candidate was independently exercised through the documented normal `pnpm dev:stack:stripe-mock` launcher, without an ignored Worker wrapper, probe headers, diagnostic logging or native fixture. The earlier diagnostic's logging-perturbed pass was not used as repair proof.

## Authorized candidate and disposition

Only `apps/backend/src/cms-worker.ts` and its existing directly owned `editorial-request-rewrite.worker.test.ts` were edited temporarily. The outer preview-host branch awaited the existing named `getByName('editorial').fetchWithBindings`, preserving actor authentication, path restrictions, privacy checks and side-effect order. It then materialized only responses meeting all of these conditions: trusted existing `PRODUCT_ENVIRONMENT === 'LOCAL'`, GET, status 200, exact `Content-Type: font/woff2`, and a non-null body. The new native Response received the original status, statusText and headers. No catch, retry, timeout, dependency, public API or generic buffering helper was introduced.

The environment predicate already exists in this Worker and the preview-host helper; it uses configuration, not a client-supplied host as Local authorization. UAT/PRD and every excluded response retained the original object and stream. Tests covered native bytes/status/statusText/header equality; UAT/PRD, HEAD, POST, 206, 304, 204, null-body 200, 403/410/500, HTML and SSE passthrough; and RPC/body-read failure propagation without recovery calls. The namespace seam was substituted in these tests. They establish native response and routing contracts, not fidelity of the full registered CMS/service chain.

Both edited files were restored with native `apply_patch` to their exact captured admission bytes after the candidate failed. Ignored `.before` and `.candidate` files preserve the attempted implementation and tests. The final 3,326-file source/document comparison reports no changes or deletions outside the new dedicated note; protected precursor inputs and recorded result/audit histories also match. The generated normal-stack build still represents the rejected candidate; it is evidence, not a source repair. Any subsequent normal launcher rebuilds from the restored source.

## Clean runtime and mandatory browser results

The clean unmodified control reproduced the known problem before the candidate was applied. Public and source bodies were 78,616 bytes with SHA-256 `92be7827d6c18ddf62ea4e84709f42700025c07059842e13158ea9bcfee50e2d`; private HTTP returned the same length/status/MIME but hash `d848014b8d7cd72183a5135b3fee7b4f7f102ea47c2a89338564e786390ae57e` and Brotli error `ERR__ERROR_FORMAT_BLOCK_LENGTH_1`. Source/public decompressed to 153,255 bytes, hash `eabc54770c5c58b9817ff1cb6a454ee2ca2487a95196923e1e74929ce7f9fc12`. An initial pre-readiness control attempt encountered ECONNREFUSED while the launcher was still building; it is a startup failure, not the successful clean control.

After the candidate's documented rebuild, two separate sequential private GETs returned the exact source bytes and decompressed successfully. Both retained private/no-store, no-referrer, nosniff and noindex/nofollow; their ETag matched the contemporaneous public producer. HEAD returned status 200 and zero body. GET transport changed from chunked to Content-Length 78616. The producer ETag changed across ordinary builds, so cross-restart ETag equality is not claimed. Native tests verify passing the original header map unchanged; no pre-buffer header digest was instrumented into the normal Worker.

The original published command was then run once:

```text
node --import tsx apps/backend/scripts/smoke-content-preview.mjs --browsers
```

`PREVIEW_BROWSER`, `PREVIEW_STAFF_ORIGIN` and `PREVIEW_PUBLIC_ORIGIN` were absent. The default Chromium/Firefox matrix, original deadlines, assertions and existing script behavior were retained. No publication, regression or narrowing flags were supplied. Both browsers initially reported Artist detail rendered. During that scenario's subsequent redirect to `/blackbox-records/store/distro/`, Firefox logged a Veneer sanitizer rejection. The command exited 1 with `page.waitForFunction: Timeout 30000ms exceeded` at line 851, the redirect readiness wait. That wait does not label the timed-out browser in its output; the Firefox rejection is explicit, but assigning the unlabeled timeout independently to an engine would exceed the evidence. Actual browser font bytes were not captured. Later collection views and Newsletter/editor/calendar/stock/upload branches remain unrun.

Complete current failure output and exit result are retained in `private-browser.log` and `private-browser-result.json`. Complete older Firefox and Chromium failures remain at their original immutable retry01 archive paths, with file identities saved in `prior-browser-failure-identities.json`. Existing canonical preview artifacts were copied before the command and after failure; these old screenshots/JSON are not represented as fresh passing evidence. The smoke failed before producing the later staff artifacts.

Eight concurrent native GETs against the clean candidate handler then yielded six exact source bodies and two corrupt bodies, all status 200, 78,616 bytes and Content-Length 78616. Four requests used ordinary fetch headers and four used a Firefox-like User-Agent/Accept set; this one batch does not establish a header-specific cause. Both bad bodies were intact 8 KiB block permutations:

| Request | Wire SHA-256                                                       | Source block order at 8 KiB wire boundaries                     | Brotli                             |
| ------- | ------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------- |
| 3       | `e9bd6ba503d15da09b873831dc39a569d7da9faf9a1bd2dec91077f790badb7d` | 0, 8192, 16384, 65536, 24576, 32768, 40960, 49152, 57344, 73728 | `ERR__ERROR_FORMAT_TRANSFORM`      |
| 5       | `b54d3b50d279f708f8b555034b9a3e325fb234d9c087e05e156bde9b001e8beb` | 0, 8192, 16384, 49152, 24576, 32768, 40960, 57344, 65536, 73728 | `ERR__ERROR_FORMAT_BLOCK_LENGTH_1` |

Each original body, header map and block order is retained. These failures reject the workaround despite its sequential success. There is no unique upstream defect assignment and no font replacement justification.

## Checks, accounting and resources

`pnpm openspec:guard` passed before implementation and before this note. A red scoped run retained the expected added body-read failure-contract test failure, with 46 other module tests passing and the automatically selected CMS integration target passing. The candidate's `pnpm test backend-runtime` passed 47/47 tests in five files; changed-file ESLint exited 0, and scoped Prettier formatted only the added test lines. Those results cover the attempted candidate. No final global validation, graph rebuild, strict check, public/pages/commerce rerun or task-marker change was performed; the final verifier retains those responsibilities after a verified repair exists.

| File                                       | Admission / final SHA-256                                          | Attempt SHA-256                                                    | Attempt physical / nonblank increment | Final increment |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------- | --------------- |
| `cms-worker.ts`                            | `69b7e102ae1915fad5ff91dc0f1395a9bd7847938cc63981eae46ee7f90540a1` | `706f20b1b9936658e1b03c564e7ad44968fdad93b1a4d746b0e742da1ad684f0` | +16 / +16 production                  | 0 / 0           |
| `editorial-request-rewrite.worker.test.ts` | `080e4d4f3ad97733233e7344bcdf25c6481d21e69a989790f52119a823f39ac3` | `876b6f4b6a45852e3044e23f6cebdb9a17e4101c2cf63979a3e3a2eebd0ac9f9` | +94 / +91 test                        | 0 / 0           |

Final production/test files modified, added or deleted: **0/0/0**. One dedicated audit Markdown note and ignored evidence were added. Format-only credit: zero. Parent's base remains 777 physical lines removed (572 production, 205 test), 658 nonblank (523 production, 135 test), and four net code files removed; this rejected attempt contributes zero final delta.

The attempted Local buffer used O(font-size) memory, with a 78,616-byte payload allocation for this font plus runtime overhead/copies per concurrent request. It delayed response delivery until full materialization; two sequential total durations were approximately 43.4 ms and 24.3 ms. These are individual observations, not a performance bound or benchmark. No general hard size/latency cap was introduced. PRD/UAT streaming was preserved by the candidate and is now byte-identical to admission after reversion.

Installed runtime remained Node v24.21.0, Wrangler 4.141.0, Miniflare 5.20260925.0-alpha and workerd 1.20260925.1. Both running normal Workers used executable hash `67e15f27397a2bfaba721b4896537d9883f17c074b0ddfee3d42e30a9b534982`. Source and compiled manifests for control, browser input and rejected candidate are saved; the compiled artifacts were stable over the browser/concurrent observations.

Independent Local fixture comparisons confirmed unchanged publication history and restored Newsletter draft data. No public publication/restore, delivery, catalog, hosted, deployment, commit, push or worktree action occurred. The original smoke finally closed both browsers and released private preview leases. Both owned normal stacks and all check sessions exited. Native fixtures started: zero. Normal and recorded debug listeners are free, registry is `{}`, stack lease is null, validation slots are 0/3 and Chrome is free. Stale owned registry records were archived and removed only after exact instance/port matching and listener absence; cleanup assertion/missing-output errors remain retained.

## Smallest next boundary and owner

**Parent route: Local runtime/tooling owner, with module29 and cms-runtime cooperation for a bounded diagnostic, before any cross-owner edit.** The unresolved boundary is the actual concurrent named-RPC response body's post-RPC ArrayBuffer consumption versus its subsequent native Response/private HTTP delivery. The clean outer materialization did not prevent wire permutations, but these executions did not capture the buffer's digest before HTTP delivery. Therefore they do not distinguish corruption already present in that concurrent consumption from corruption introduced during final delivery.

The next justified action is one bounded concurrent actual-chain comparison recording those two byte identities and current native service/runtime identities. Keep actor auth/path/privacy and named RPC intact; treat additional observation hooks as timing perturbations and retain an unmodified failing control. If the consumed buffer is already wrong, narrow toward real actor wrapping/native RPC/service delivery with cms-runtime and Local tooling ownership. If it is correct while wire bytes are wrong, Local native HTTP delivery owns the repair. A tooling alternative or nested CMS edit needs the parent's explicit owner transfer; no retry, serialization workaround, upgrade, font/UI change or speculative cross-owner patch is proposed as a fix.

No fully verified repair exists in the authorized branch. Source repair and the full private browser matrix remain pending; final-verifier retry02 must not be released as though this gate passed.

Machine evidence: `.codex-artifacts/simplification/backend-runtime-local-font-delivery/evidence.json`. Resource closeout: `closeout.json`; exact final source accounting: `accounting.json`; current failure: `private-browser.log`; bounded concurrent bodies: `concurrent-wire.json` and `concurrent-block-order.json`.
