# Tasks

## 1. Artist contract and native schema

- [x] 1.1 Add default-active Artist activity, native boolean normalization and published projection; verify compatibility, invalid inputs and false round trips in focused content tests.
- [x] 1.2 Prepare the optional native boolean field idempotently and document rollout; verify repeated preparation and incompatible field rejection in the CMS schema test.

## 2. Staff switch

- [x] 2.1 Add the approved switch below Artist name using existing staff styling and draft updates; verify active/inactive/default/disabled semantics with a focused component test and keyboard browser check.
- [x] 2.2 Document private activity editing and explicit publication; verify opening a legacy form does not autosave a default and reopening a saved inactive draft retains false in Local.

## 3. Public rosters

- [x] 3.1 Add the shared activity-aware roster query and use it on Home and Artists; test mixed, homogeneous, empty and legacy rosters while keeping non-roster name ordering.
- [x] 3.2 Mark the retained Chronoboros Local fixture inactive; verify the default source passes content validation and ordering uses data rather than a band-name exception.

## 4. Acceptance

- [x] 4.1 Verify the four-profile order, first-three Home selection, draft privacy and publication in Local at desktop and mobile; record browser evidence and relevant limitations.
- [x] 4.2 Run strict OpenSpec validation, focused tests, `pnpm agent:check` and final `pnpm validate`; record source-bound evidence and remaining hosted release/publication gates.
