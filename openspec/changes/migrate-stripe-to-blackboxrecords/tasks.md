# Tasks

SOL-6.1-max work may be split into account setup, catalog tooling, and acceptance. Read-only work can overlap; keep one writer on `main` and one provider mutation operator per environment. UAT may use approved provisional fixtures. The immediate target is the restricted paid beta in design decision 5; fiscal automation and the later official-account switch remain open work.

## 1. Establish inputs

- [ ] 1.1 Verify the design's exact account/mode map and refresh both source/destination inventories through CLI or read-only Workbench, exhausting pagination and using `status=all` for subscriptions. Record live money/customer obligations, source endpoint state and unrelated target data; reconcile drift from the dated evidence, including sandbox test-clock records if present.
- [ ] 1.2 Export each environment's current item/mapping/offer facts and protected-data baseline; build its reviewed manifest including CMS-only, withheld, paused and sold-out items. Verify unique identities, revisions, runtime presentation/media, tax attributes and fixed/custom amounts from that environment's source authority; preserve uninitialized items without inventing prices.
- [ ] 1.3 Record the actual beta seller, stock rights and truthful account/bank/public identity before live settings. Record unresolved fiscal status separately; obtain any required Stripe identity change and update linked VAT/content assumptions without relabeling prior sales.
- [ ] 1.4 Inventory source Sessions, holds, pending payments, CatalogOperations/leases, payable retries and retained review cases. Deliver a drain/disposition journal and usable source rollback references; verify each unresolved obligation has a source-account handling path.
- [ ] 1.5 Assign fiscal/filing, measured BOX NOW, public-content and payout/refund owners through the existing changes. Verify their pending inputs and acceptance evidence are linked once, with provisional UAT evidence clearly identified.

## 2. Prepare migration tooling

- [ ] 2.1 Implement design decision 3's single manifest plan/apply/restore command using the runtime presentation reader and existing provider gateways. Require account/mode assertions, reviewed hash, source revision checks, atomic binding/offer updates, resumable creation and explicit PRD live confirmation. Keep the normal verifier's PRD apply prohibition; do not recreate release catalog jobs or use repository backfill as migration authority.
- [ ] 2.2 Run focused tests for wrong account/mode, absent live confirmation, stale rows/hash, partial creation, retry after idempotency expiry, interrupted/repeated apply and inverse restore. Cover runtime media, unpublished/uninitialized rows and all-manifest verification; preserve stock/content/history and prevent duplicate provider objects.
- [ ] 2.3 Update `docs/stripe-sandbox-uat.md` and `docs/catalog-promotion.md` for the implemented operator command, freeze procedure and separate manual provider smoke. Replace reset/reseed advice, retain the warning against legacy backfill image URLs, and include a reviewed dry run and restore example. Preserve Local mock/uat-connected isolation.

## 3. Configure and prove UAT

- [ ] 3.1 Configure the dedicated sandbox using design decision 2 and approved test inputs. Verify Tax calculations, dedicated PMC, ordinary payment/refund receipt settings, effective Session policy and durable key permissions; preserve its unrelated Customers. Inspect manual test receipts with approved recipients and record the automatic-delivery limitation.
- [ ] 3.2 Execute migration steps 1–4 for UAT. Verify rejected checkout while closed, completed source drain, staged endpoint status, correct Worker/GitHub/D1 ownership, all manifest links and protected-data comparisons.
- [ ] 3.3 Execute UAT recovery and signed-event proof in steps 5–6. Verify restore/reapply, endpoint secret matching, replay safety and passing runtime/PMC/webhook/catalog checks before opening the test window.
- [ ] 3.4 Run the existing manual provider smoke and remaining shared cases in design decision 4 against the recorded deployed SHA, with available test stock and approved recipients. Verify totals, payment/3DS failure paths, old checkout URLs, stock/order/outbox, messages and eligible wallets; record fixture/device/test-email limits and the exact account/configuration.
- [ ] 3.5 Rehearse fulfillment, refunds, returned stock and source-history exceptions with the owning changes. Link measured-packing acceptance and shared purchases once; leave fiscal-provider demonstrations open under the beta deferral.

## 4. Prepare PRD while closed

- [ ] 4.1 Verify actual beta seller, Tax, measured packing and truthful public-content inputs. Configure destination live under design decision 2; verify capabilities, durable credentials, hosted policy/support display and payout/refund responsibilities. Record fiscal automation as deferred, with an owner and no compliance claim.
- [ ] 4.2 Refresh the PRD manifest/source drain and execute migration steps 1–4 with the reviewed operator command and its one-run live confirmation. Inspect source live images and verify every target Product uses approved PRD runtime media that resolves; preserve both closed launch controls and all protected fields. Disable a source endpoint only if one exists.
- [ ] 4.3 Execute signed catalog-event proof and readiness checks from steps 6–7. Verify `pnpm runtime:config:verify --env prd --require-live-secrets`, PMC/webhook/catalog checks and required Access/email/origin/Cron inputs. Confirm all three Stripe Worker values and GitHub key/PMC remain aligned after release; PRD promotion does not install or verify them. Refresh affected provider evidence; perform no live payment.
- [ ] 4.4 Enable **Successful payments** and **Refunds** in destination live Customer emails. Verify both saved switches, the Checkout-to-payment email path, approved seller/support/branding details and receipt preview. Link manual sandbox evidence and require live payment/refund email delivery in the authorized beta smoke; do not enable paid invoice creation for ordinary receipts.
- [ ] 4.5 Record accepted configuration/data/content identities and exact remaining live-proof items for the launch owner, including live receipt delivery and first bank settlement. Verify checkout stays closed and source history remains accessible.

## 5. Complete the handoff

- [ ] 5.1 Hand the launch owner the restricted-beta cohort/limit/access requirements, receipt proof, fiscal/IRIS deferrals, operating owners and rollback boundary. Preserve order/account/seller provenance and document the later official-account switch plus retained refund/dispute access. Verify every unresolved input has an owner and no provisional proof is marked accepted.
- [ ] 5.2 Strict-validate affected OpenSpec changes, run final `pnpm validate` and diff checks, and record source-bound evidence. Verify no credentials/private identities/full provider IDs enter tracked output, and the handoff identifies the accepted source/configuration/content while leaving live smoke/public routing to the user's launch decision.
