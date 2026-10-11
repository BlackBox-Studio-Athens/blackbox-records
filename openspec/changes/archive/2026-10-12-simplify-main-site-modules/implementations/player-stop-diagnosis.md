# Player Stop diagnosis

**Diagnosis complete; checkpoint remains blocked.** Same fresh player implementer `01a1263d-5cf0-7cd2-8995-04aed53dddca`. No product source, committed e2e test, original implementation report, shared task marker or original failure artifact was changed.

The preserved failure is an interaction timing failure against the existing three-second Stop confirmation window. Evidence does not support attributing it to the three player simplifications, and no player production correction is justified.

## Evidence

The archived WebKit trace shows the first Stop tap completing at **38847.807 ms**. `Stop?` then passed its assertion, and the iframe correctly remained present after that first press. The second action started at **39160.787 ms** and resolved the armed button at **39218.376 ms**, but the trace's actual tap-dispatch log occurs at **42230.573 ms**: **3382.766 ms after the first tap completed**. Its post-action snapshot at **43143.540 ms** shows `Stop?` armed again, while the iframe remains. The eventual screenshot shows the unarmed square after that new confirmation expires. The unchanged 30000 ms iframe assertion failed; this diagnosis does not accept away that failure.

`ShellPlayerSurface.tsx:13–16,51–60,155–180` deliberately expires arming after `STOP_CONFIRM_WINDOW_MS = 3000`. Unarmed, the button omits the Stop routing attribute; pressing it arms the button. Armed, the attribute lets the document router call Stop. `shell-document-event-routing.ts:182–185` calls `stopPlayerSession`, whose first operation is to retire the active session; `player-iframe-session.ts:48–55` deletes the cache entry and synchronously removes the iframe.

Both the Stop UI and its test, the shell session controller and its test, and `e2e/player-continuity.spec.ts` have exactly the same SHA-256 hashes as the implementer's **pre-edit** capture. All current owned player bytes match the completed implementation manifest. The already-recorded 144-input before/after presentation probe remains bound to those actual source hashes. The warm-up reduction deletes an unreachable branch, the music mock change affects test setup only, and the presentation change preserves the active/idle values. None changes confirmation timing, event dispatch or iframe retirement.

## Instrumented current-source reproduction

After the verifier saved its blocked report and released resources, two isolated diagnostic cases ran through the published `pnpm test:e2e` harness with the repository's WebKit engine, existing phone configuration and provider/network fixtures. They retained the existing assertion timeout and used no retries:

- **Timely confirmation:** two real click events from touch input at page times **2888 ms** and **2954 ms**, **66 ms apart**. The second arrived armed. The iframe count became **0** at **2996 ms**, and Open player became hidden.
- **Expired confirmation:** first click **2408 ms**, armed state **2410 ms**, expiry observed **5454 ms**, second click **6140 ms** while unarmed, re-armed state **6142 ms**. The iframe count stayed **1**, reproducing the retained-frame outcome through the intended expiry path.

**Result: 2 passed, exit 0, zero retries.** These cases diagnose the confirmation path; they do not establish acceptance of the original navigation/history case. Raw event attachments, screenshots, traces and the runner report live in [diagnostic evidence](../../../../.codex-artifacts/simplify-main-site-modules/player-stop-diagnosis/diagnosis.json). The [original failure excerpt](../../../../.codex-artifacts/simplify-main-site-modules/player-stop-diagnosis/failure-trace-excerpt.json) retains relevant action logs and delta snapshots without modifying the archived trace.

The global Playwright CLI's WebKit build was unavailable; no browser was installed. The first ignored-config harness attempt failed before tests because its web-server cwd resolved under the artifact folder; only that ignored config was corrected, and `browser.log` remains preserved. The successful run uses `browser-attempt02.log`. The previously healthy Local stack had stopped externally before diagnosis; the normal harness started and stopped its own temporary repository server. No other owner's process was killed. Final resource status is 0/3 validation slots held, Chrome free, and port 4321 free.

## Minimum corrective action and ownership

Route **`e2e/player-continuity.spec.ts:56–63` to the parent's e2e/browser-test owner**, outside player ownership. Prepare stable Stop geometry before arming, then deliver the confirming real touch within the existing 3000 ms window. The diagnostic succeeded by tapping the already-measured button center for confirmation, avoiding another locator scroll/stability preparation after arming. Preserve the `Stop?`, first-press iframe count 1, confirmed iframe count 0, hidden Open player, navigation/history and identity assertions. Preserve timeouts, expiry behavior and meaningful tests. Do not change the shared `press` helper or app-shell product semantics merely to make this case pass.

The production confirmation UI belongs to **app-shell**, not `components/music`; no product change is supported here. A before-source browser deployment is unnecessary given the exact unchanged Stop-path hashes, matching presentation probe and current-engine expiry/timely experiments. The parent must route and authorize the concrete e2e correction, then the verifier must run the corrected original failing case and finish missing checkpoint acceptance. No blind retry of that case was performed. Real provider playback remains unverified.
