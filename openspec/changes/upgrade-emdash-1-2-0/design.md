# Design

Use the official `upgrade-emdash@0.1.0 --dry-run --json` for a read-only dependency/changelog plan. Apply exact pins and patch rebases through the existing pnpm workspace. The updater's apply path also refreshes agent skills and does not manage BlackBox's versioned patches or acceptance workflow, so it is not the mutation path here.

Keep revision-fenced deletion in the core patch. Upstream 1.2.0 validates `_rev` again at the draft write; use that implementation and retain the existing competing-save smoke. The unchanged regression found that deletion during a save now returned 404 instead of the required 409. Retain a narrow missing-row conflict check alongside upstream validation; do not restore the old workaround that reused the initial content read. Keep the admin patch's supported block controls, exported image sidebar and scoped thumbnail-producing uploader. Disable the new native video command and drop/paste handler through those controls; existing YouTube/Vimeo embedding remains unchanged.

Use `admin.locales: ['en']` on the CMS integration. The separately built Staff app already activates English; do not claim this setting prunes its independent bundle. The configured editorial plugin has no install/activate hook, so the new startup lifecycle does not introduce content initialization. Keep custom Access auth, sessions disabled, update checks disabled and the existing D1/R2 bindings.

Compare 1.1.0 and 1.2.0 migration identities before starting upgraded code. Rehearse against a disposable copy of the stopped Local D1/R2 store and verify two starts preserve private revisions, dates, relationships, media, accepted pointer, stock and prices. Retain older-history coverage. Hosted release must build its own manifest and inspect actual target history; earlier pending migrations still require recovery evidence and application-before-core ordering.

No interface redesign or new content type is planned. Existing Staff layouts and public rendering contracts remain the acceptance baseline.
