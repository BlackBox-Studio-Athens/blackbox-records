# Footer copy evidence, 2026-10-05

## Source and environment

- Worktree: `C:/Users/SVall/.codex/worktrees/b553/blackbox-records`, branch `codex/staff-release-updates`.
- Base SHA: `ecbf6e9d79c872d5a4803a2e31d7ef97dd26a570`; changes are uncommitted.
- Local focused-check mode: `partial`, status `passed`. Summary: `.codex-artifacts/validation/enable-staff-footer-copy/summary.json`.
- Scoped source fingerprint before and after the initial footer contract run: `baf948df577f58f31dfc10de3b0ec0bba1b109b428ad68e608cc546c41737e57`. After the integrated typing repair, the focused test run uses `ba153305599b4cd2ec514f5fe66e3b32d13b4f390a50cbb9f07e697e5bb7ce11`.
- Fingerprint hashes sorted relative paths followed by their bytes: CMS catalog-schema source/test, ContentFields, FooterSettings test, WebsitePages, Footer, initial settings JSON and shared schemas. Unrelated shared-worktree changes are outside this focused evidence.

## Passed checks

- `pnpm openspec:guard --allow-worktree`.
- `pnpm openspec -- --allow-worktree validate enable-staff-footer-copy --type change --strict`.
- `pnpm test apps/staff/src/components/content/FooterSettings.test.tsx src/components/content/FooterSettings.test.tsx`: settings destination, optional plain input, edit/reset preservation, invalid-type rejection, native draft and accepted snapshot compatibility, null removal before portable settings parsing, private versus selected accepted content.
- `pnpm test apps/backend/src/cms/catalog-schema.test.ts`: CMS runtime module passed; backend-runtime and cms-integration reused valid cached outputs. Schema check covers optional string field creation, safe repeat and incompatible native type rejection.
- Scoped Prettier checks passed; new footer test and change artifacts were formatted.

The first attempted two-file test invocation forwarded the backend filename as a Staff Vitest filter and found no tests. Separate corrected commands above passed; no product test failure remains.

## Acceptance boundaries

Selected rows: Staff/editor and CMS/schema/publication. Shell/player, commerce and hosted release acceptance are outside this footer copy change: rendering changes only description input and retains existing layout/links/player behavior.

Graphify identified Footer imports and settings schema consumers. A directed schema-to-form path was unavailable; CodeGraph supplied exact settings form, mapper, draft validator and schema setup source/callers. Parent owns final graph refresh after the shared edit batch.

No hosted resources, content or deployments were mutated. Existing CMS instances need the normal native schema preparation; old settings data is not rewritten. The Local runtime preview/publication and actual browser form checks below close those acceptance gaps. Full final-tree `pnpm validate` remains the parent's combined acceptance work; Local evidence does not establish hosted acceptance.

## Staff handoff

Open **Website → Navigation & footer → Footer text**, or **Website → Label details**. Edit **Footer text**, **Label name** or **Year established**, let private autosave finish, then review **Publish changes**. Blank Footer text restores the configured label description. The rights notice remains fixed; links are still edited in Navigation.

## Integrated typing repair

The parent's integrated run `.codex-artifacts/validation/2026-10-05T02-41-59-549Z-20404-da7ebd/summary.json` found five TypeScript errors in the new test: four indexed fixture entries could be absent and the draft's collection inferred as a general string. The repair changes only `FooterSettings.test.tsx`: retain the `settings` literal and assert the four fixture entries used by the test. Runtime sources are frozen.

The focused FooterSettings command passed again after this repair. Updated scoped fingerprint: `ba153305599b4cd2ec514f5fe66e3b32d13b4f390a50cbb9f07e697e5bb7ce11`. The permitted named target `rtk proxy pnpm exec nx run @blackbox/staff:typecheck` was admitted but stopped at its `workspace:format` dependency because the releases chat's `openspec/changes/prioritize-record-sales-on-releases/design.md` needed formatting. Staff typecheck itself did not run. The parent was notified to coordinate that file; no dependency or approval guard was bypassed. The parent instructed this chat to freeze all sources and leave the Staff typecheck retry to the combined `pnpm validate` after the releases owner formats and freezes.

## Integrated lint repair

The parent's later run `.codex-artifacts/validation/2026-10-05T02-55-40-676Z-28880-64bd86/summary.json` passed Staff typecheck and found one Staff lint error, `eqeqeq`, in the footer test's null check. Replaced `footer_text == null` with explicit strict null and undefined comparisons. Only `FooterSettings.test.tsx` and this evidence were edited; concurrent releases changes in shared runtime files were retained.

The focused FooterSettings command passed after this one-line repair (exit 0; Nx reported 10.1 seconds), and its scoped formatting check passed. The test-only SHA256 is `991d2f6ab3745a4b744b79e2d9d5b247b2de27738448817506697ba10168badb`; earlier aggregate fingerprints describe their earlier source trees. This chat's sources are frozen. Per the parent's instruction, no global typecheck, lint or validate was run; final combined validation after the releases implementation settles owns lint acceptance and the complete source identity.

## Observed Local footer acceptance

After the parent's readiness signal, `pnpm local:status` confirmed this worktree owned the official mock stack (PID 29004), public port 4321 and no validation slots. The ignored one-off settings-only smoke passed in 5.6 seconds with 47 loopback requests:

- Saving a custom Footer text draft left the actual public Footer and accepted content identity unchanged.
- A saved-revision private preview rendered the custom text through the shared Footer template with private, no-store headers; it changed no saved revision, publication history or public content.
- Explicit publication of only the settings entry made that text appear on the actual public site and matched its accepted publication identity.
- A second settings-only publication restored the original accepted settings and exact Footer HTML. The original private state had no draft; cleanup restored that state too. No unrelated collection, stock, provider or catalog record was changed.

Evidence: `.codex-artifacts/validation/enable-staff-footer-copy/local-3e7952d2-5381-4747-9a90-529b13ba11ed/summary.json`, `before.json`, `restored.json`, preview/public HTML, publication inputs/receipts and per-file compiled manifests. Both operations settled live: custom `2ee9f481-0334-4de8-b036-bd70409a4a5d`, restore `8958952f-965e-4728-b163-5ac0a8682bef`. Historical revision/publication IDs changed; content and private draft presence were restored through existing APIs.

Before/after source fingerprint for Footer, settings schema/setup, publication/preview handlers and settings form/destination: `288aaacc5b3b93affed439323161fca94235ac20ef8f7390191e92d78b0a6da0`. Before/after compiled fingerprint for 740 CMS server, public renderer and Staff JavaScript/configuration/Wasm files: `11ff520f156aeb54db9f24737671ad5f0b57b430200e3b7024caa53449f76800`. Both remained identical during the smoke. These hashes exclude planning notes and the concurrently edited release client shell/editorial helper; they describe the exact compiled runtime tested before the parent's next rebuild. Prepared smoke script SHA256: `32b4ade3eb1e918332230b4cceed83c94f8e8532f6d0aab426778be865bf0f38`.

This first smoke established HTML/API runtime acceptance. The separate browser check below establishes actual field editing/autosave on the rebuilt Local stack. The parent still owns final combined validation, graph refresh and the resulting final source identity.

## Actual Staff browser editing and restoration

After the updated stack readiness signal, `pnpm local:status` confirmed this worktree owned the normal Local stack (PID 42944), public port 4321 and no validation slots. The documented native browser probe initialized the ChromeGPT extension with the **blackbox** profile (`bootstrap_ok`). This narrow browser check passed without a DevTools fallback or browser process changes.

Navigated **Website → Label details** and inspected the real optional **Footer text** textbox and its helper text. Entered a unique marker through the UI and observed **Changes saved · Not live yet: Saved changes**. Read-only native revision checks verified that only `footer_text` changed; actual public Footer HTML, accepted content version and publication history remained identical to the baseline. No Publish action was taken.

Used **More draft actions → Discard saved changes**, confirmed removal of this test's exact draft, and observed the original Footer text, **Changes saved · Everything is live**, disabled Publish and **Saved changes discarded. The live version is now shown.** Read-only checks then verified original settings content, no private draft, unchanged public Footer/content identity and unchanged publication history. The recovery API was prepared but not used.

One Playwright click on More draft actions reported an `Input.dispatchMouseEvent` timeout. A fresh native AX observation showed that the menu had opened; documented AX clicks completed discard and its confirmation. This was a recovered interaction warning, not an unverified browser task or a reason to kill/restart Chrome.

Evidence: `.codex-artifacts/validation/enable-staff-footer-copy/browser-8b529faa-378c-4fbd-ab10-10f9ebf577d6/summary.json`, `before.json`, `saved.json`, `restored.json`, three `*-dom.txt` observations and `before.jpg`, `saved.jpg`, `restored.jpg`. Each JSON stage retains per-file source and compiled manifests. Source fingerprint, including ContentApp, autosave and the frozen editorial helper: `b7ca10cc012955500467f2bf70f16330be7c14a4e150e4432c45d37e40a59bf2`. Compiled CMS/public renderer/Staff fingerprint (740 files): `0422651edae7d65b91dd3367f230dd59613a7daac01d6ccba179c3da607ae820`. Both matched before, after autosave and after restoration. Evidence helper SHA256: `67c98b3e1ba0df4572a1a9f1d82cc3ce265467264234551c6fac25b62cf1e001`.

The rebuilt stack includes the separately owned release snapshot fix, so this compiled fingerprint supersedes the earlier compiled identity for browser editing evidence. The earlier publication smoke still describes its recorded runtime. Subsequent Releases helper and typing repairs do not change Footer field saving, its template or publication behavior; final repository checks cover the combined source. No further footer content mutations are required.

## Parent integration

`pnpm validate` passed in Local mode on the combined tree: 41 affected projects and 55 successful tasks, including tests, lint, type checks and architecture enforcement. Summary: `.codex-artifacts/validation/2026-10-05T05-07-27-381Z-29064-d847ba/summary.json`. Base SHA: `ecbf6e9d79c872d5a4803a2e31d7ef97dd26a570`; matching before/after source fingerprint: `afa0e9ebe0be9d3b7449019e950b5c17f79b3b49854a19820f6fc2b3411d0e48` (76 changed files, no source changes during the accepted pass). Earlier scoped evidence retains its recorded identities. The final run pointer after these note edits is `.codex-artifacts/validation/staff-release-updates-final.json`.

Graphify was refreshed locally using AST extraction, and CodeGraph verified the final shared neutral renderer and its live and shell callers. The known partial extraction of unrelated `scripts/pages-workflow-contract.test.ts` does not establish that file's semantics. Content Publication, hosted acceptance and Software Release remain separate from these Local checks.
