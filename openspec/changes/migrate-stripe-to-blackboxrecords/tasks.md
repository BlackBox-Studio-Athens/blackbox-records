# Tasks

SOL-6.1-max work may be split into account setup, catalog tooling, and acceptance. Read-only work can overlap; keep one writer on `main` and one provider mutation operator per environment. UAT may use approved provisional fixtures. The immediate target is the restricted paid beta in design decision 5; fiscal automation and the later official-account switch remain open work.

## 1. Establish inputs

- [ ] 1.1 Verify the design's exact account/mode map and refresh both source/destination inventories through CLI or read-only Workbench, exhausting pagination and using `status=all` for subscriptions. Record live money/customer obligations, source endpoint state and unrelated target data; reconcile drift from the dated evidence, including sandbox test-clock records if present.
- [ ] 1.2 Export each environment's current item/mapping/offer facts and protected-data baseline; build its reviewed manifest including CMS-only, paused and sold-out items. Verify unique identities, current revisions, approved presentation, tax attributes and fixed/custom amounts from that environment's source authority.
- [ ] 1.3 Record the actual beta seller, stock rights and truthful account/bank/public identity before live settings. Record unresolved fiscal status separately; obtain any required Stripe identity change and update linked VAT/content assumptions without relabeling prior sales.
- [ ] 1.4 Inventory source Sessions, holds, pending payments, CatalogOperations/leases, payable retries and retained review cases. Deliver a drain/disposition journal and usable source rollback references; verify each unresolved obligation has a source-account handling path.
- [ ] 1.5 Assign fiscal/filing, measured BOX NOW, public-content and payout/refund owners through the existing changes. Verify their pending inputs and acceptance evidence are linked once, with provisional UAT evidence clearly identified.

## 2. Prepare migration tooling

- [ ] 2.1 Implement the missing manifest plan/apply/restore path using existing provider gateways. Verify account/mode assertions, source revision checks, atomic mapping/offer updates and resumable object creation; make ambiguous identity or drift stop apply.
- [ ] 2.2 Add focused tests for wrong-account/sandbox, stale rows, partial creation, retry after idempotency expiry, interrupted/repeated apply and inverse restore. Verify protected stock/content/history survives and retries create no duplicate provider objects.
- [ ] 2.3 Replace reset/reseed cutover advice in `docs/stripe-sandbox-uat.md` with the implemented commands and the design's single maintenance procedure. Verify a dry-run hash and restore example; document Local mock/uat-connected behavior and isolate any opt-in real-Stripe local scripts from UAT resets.
- [ ] 2.4 Run focused tooling tests, required `pnpm validate` and diff checks. Record the source fingerprint and reviewed manifest; verify tracked output contains no credentials, private identities or full provider IDs.

## 3. Configure and prove UAT

- [ ] 3.1 Configure the dedicated sandbox using design decision 2 and approved test inputs. Verify Tax calculations, dedicated PMC, ordinary payment/refund receipt settings, effective Session policy and durable key permissions; preserve its unrelated Customers. Inspect manual test receipts with approved recipients and record the automatic-delivery limitation.
- [ ] 3.2 Execute migration steps 1–4 for UAT. Verify rejected checkout while closed, completed source drain, staged endpoint status, correct Worker/GitHub/D1 ownership, all manifest links and protected-data comparisons.
- [ ] 3.3 Execute UAT recovery and signed-event proof in steps 5–6. Verify restore/reapply, endpoint secret matching, replay safety and passing runtime/PMC/webhook/catalog checks before opening the test window.
- [ ] 3.4 Run the shared destination acceptance cases in design decision 4 with approved recipients. Verify totals, payment/3DS failure paths, old checkout URLs, stock/order/outbox, messages and eligible wallets; record fixture/device/test-email limits and the exact source/account.
- [ ] 3.5 Rehearse fulfillment, refunds, returned stock and source-history exceptions with the owning changes. Verify that selected fiscal-provider demonstrations and measured-packing acceptance are separately recorded; link the shared evidence without repeating purchases.

## 4. Prepare PRD while closed

- [ ] 4.1 Verify actual beta seller, Tax, measured packing and truthful public-content inputs. Configure destination live under design decision 2; verify capabilities, durable credentials, hosted policy/support display and payout/refund responsibilities. Record fiscal automation as deferred, with an owner and no compliance claim.
- [ ] 4.2 Refresh the PRD manifest/source drain and execute migration steps 1–4 under the reviewed one-run live catalog authorization. Verify both launch controls remain closed, target object identity and all protected fields; disable a source endpoint only if one exists.
- [ ] 4.3 Execute signed catalog-event proof and readiness checks from steps 6–7. Verify `pnpm runtime:config:verify --env prd --require-live-secrets`, PMC/webhook/catalog checks, required Access/email/origin/Cron inputs and release credential persistence. Refresh affected candidate evidence; perform no live payment.
- [ ] 4.4 Enable **Successful payments** and **Refunds** in destination live Customer emails. Verify both saved switches, the Checkout-to-payment email path, approved seller/support/branding details and receipt preview. Link manual sandbox evidence and require live payment/refund email delivery in the authorized beta smoke; do not enable paid invoice creation for ordinary receipts.
- [ ] 4.5 Record accepted configuration/data/content identities and exact remaining live-proof items for the launch owner, including live receipt delivery and first bank settlement. Verify checkout stays closed and source history remains accessible.

## 5. Complete the handoff

- [ ] 5.1 Hand the launch owner the restricted-beta cohort/limit/access requirements, receipt proof, fiscal/IRIS deferrals, operating owners and rollback boundary. Preserve order/account/seller provenance and document the later official-account switch plus retained refund/dispute access. Verify every unresolved input has an owner and no provisional proof is marked accepted.
- [ ] 5.2 Strict-validate affected OpenSpec changes, run final required repository checks and inspect the worktree. Verify the handoff identifies the accepted source/configuration/content and leaves live smoke/public routing to the user's launch decision.
