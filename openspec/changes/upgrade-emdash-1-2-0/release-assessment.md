# Release assessment, 11 October 2026

The npm registry reports 1.2.0 for all three direct packages and 0.1.0 for the updater. The updater's dry run and exact package migration identities are retained under `.codex-artifacts/emdash-1.2.0/`.

| Upstream change                             | BlackBox decision                                                                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Save-conflict and toolbar-injection fixes   | Adopt. Retire the old save workaround; retain deletion fencing and the established conflict response.                                           |
| Smaller locale builds                       | Set native `admin.locales` to English. Staff is already English; its separate locale bundle is not pruned by this option.                       |
| Bounded cleanup and faster D1 startup       | Adopt through the upgrade. No hosted performance or quota reduction is claimed.                                                                 |
| Native video block and media ranges         | Keep current approved embeds and image-only uploads. Stored videos need changes across validation, private media and accepted-snapshot readers. |
| Numbered native admin pagination            | Keep the existing bounded Staff cursor navigation; the API remains compatible.                                                                  |
| Configured plugin lifecycle                 | Our editorial plugin has no install/activate hook to run. Verify its validation hooks still work.                                               |
| Site URL precedence and external-auth names | Keep custom Access authentication. No native sign-in email flow or plugin-generated site links need changing here.                              |
| Media response validators                   | Retain private media policy and immutable accepted media delivery.                                                                              |

Sources: [core 1.2.0](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.2.0), [admin 1.2.0](https://github.com/emdash-cms/emdash/releases/tag/%40emdash-cms%2Fadmin%401.2.0), [Cloudflare 1.2.0](https://github.com/emdash-cms/emdash/releases/tag/%40emdash-cms%2Fcloudflare%401.2.0).

The [new updater](https://github.com/emdash-cms/emdash/releases/tag/upgrade-emdash%400.1.0) is useful for review. Apply remains manual through pnpm because the workspace owns versioned patches and agent configuration. Its default skills refresh and generic build/migration suggestions are not BlackBox's operational workflow.

No core migrations were added or removed from 1.1.0; both sets end at 091. Their fingerprints differ, so a fresh target build remains mandatory. Older environments can still have pending history. The disposable Local rehearsal covers the immediate 1.1.0 path; future hosted rollout must inspect its own target and retain the existing release gates.
