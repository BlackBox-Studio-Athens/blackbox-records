# Analytics

Closed owner of Staff aggregate reports and prospective Visits history. HTTP/runtime consumers use `index.ts`; Staff consumes generated internal API types only. Provider secrets and retained facts never enter browser modules. Orders owns its paid-order/line aggregation and exposes aggregate-only results.

History uses native D1 SQL and its additive migration; it adds no Prisma client surface.

Reads do not persist provider data. The existing scheduler collects three completed UTC days once at 03:00, with at most three provider calls, three upserts and one retention delete. A day must be complete and at most 64 KiB before replacement. Retain 730 days under the current environment/site key, with no KV or new cron. Failure preserves prior facts and does not interrupt commerce delivery. Documented budgets and local tests are not hosted account usage acceptance.
