import type { MerchantProductInput } from './product';

export type MerchantScope = { environment: string; accountId: string; dataSourceId: string };
export type MerchantCatalogItem = { variantId: string; storeItemSlug: string };
export type MerchantCatalog = { revision: string; items: MerchantCatalogItem[] };
export type MerchantManagedOffer = MerchantCatalogItem & { inputHash: string | null; submittedAt: string | null };
export type MerchantRunClaim = { scope: MerchantScope; token: string; cursor: string | null; quotaBlocked: boolean };

export interface MerchantSyncRepository {
  claimRun(scope: MerchantScope, now: Date): Promise<MerchantRunClaim | null>;
  listManaged(claim: MerchantRunClaim): Promise<MerchantManagedOffer[]>;
  isClaimCurrent(claim: MerchantRunClaim, now: Date): Promise<boolean>;
  manageOffer(claim: MerchantRunClaim, item: MerchantCatalogItem, now: Date): Promise<boolean>;
  saveSubmitted(claim: MerchantRunClaim, variantId: string, inputHash: string, now: Date): Promise<boolean>;
  removeManaged(claim: MerchantRunClaim, variantId: string, now: Date): Promise<boolean>;
  clearQuotaBlock(claim: MerchantRunClaim, now: Date): Promise<boolean>;
  deferQuota(claim: MerchantRunClaim, nextReset: Date, now: Date): Promise<boolean>;
  finishRun(claim: MerchantRunClaim, cursor: string | null, now: Date): Promise<boolean>;
}

export type MerchantSyncResult = {
  outcome: 'completed' | 'skipped' | 'failed' | 'source_stopped' | 'superseded' | 'lease_lost';
  checked: number;
  upserted: number;
  removed: number;
  failed: number;
  safeReason?: string;
};

type Dependencies = {
  repository: MerchantSyncRepository;
  provider: { upsert(input: MerchantProductInput): Promise<void>; remove(offerId: string): Promise<void> };
  scope: MerchantScope;
  readCatalog(): Promise<MerchantCatalog>;
  readInput(item: MerchantCatalogItem): Promise<MerchantProductInput | null>;
  isCurrent(revision: string): Promise<boolean>;
  prepare?(): Promise<void>;
  checkQuota?(): Promise<void>;
  isSourceFailure?(error: unknown): boolean;
  isQuotaFailure?(error: unknown): boolean;
  errorReason?(error: unknown): string;
  now?: Date;
  currentTime?(): Date;
};

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

/** A complete accepted inventory is required even when this pass only updates one offer. */
export async function runMerchantSynchronization(deps: Dependencies): Promise<MerchantSyncResult> {
  const clock = deps.currentTime ?? (() => new Date());
  const result: MerchantSyncResult = { outcome: 'skipped', checked: 0, upserted: 0, removed: 0, failed: 0 };
  const claim = await deps.repository.claimRun(deps.scope, deps.now ?? clock());
  if (!claim) return result;
  let cursor = claim.cursor;
  result.outcome = 'completed';
  try {
    if (claim.quotaBlocked) {
      if (!deps.checkQuota) throw new Error('Merchant quota requires verification.');
      await deps.checkQuota();
      if (!(await deps.repository.clearQuotaBlock(claim, clock()))) {
        result.outcome = 'lease_lost';
        return result;
      }
    }
    await deps.prepare?.();
    const catalog = await deps.readCatalog();
    if (!catalog.revision || !Array.isArray(catalog.items) || catalog.items.length > 1000)
      throw new Error('Invalid accepted inventory.');
    const accepted = new Map<string, MerchantCatalogItem>();
    const slugs = new Set<string>();
    for (const item of catalog.items) {
      if (!item.variantId || !item.storeItemSlug || accepted.has(item.variantId) || slugs.has(item.storeItemSlug))
        throw new Error('Invalid accepted inventory identity.');
      accepted.set(item.variantId, item);
      slugs.add(item.storeItemSlug);
    }
    const managed = new Map((await deps.repository.listManaged(claim)).map((item) => [item.variantId, item]));
    const identities = [...new Set([...accepted.keys(), ...managed.keys()])].sort();
    const after = cursor === null ? 0 : identities.findIndex((id) => id > cursor!);
    const start = after < 0 ? 0 : after;
    // Two complete offers, including freshness and lease checks, fit D1 Free's 50-query invocation limit.
    const candidates = [...identities.slice(start), ...identities.slice(0, start)].slice(0, 2);
    for (const variantId of candidates) {
      cursor = variantId;
      result.checked++;
      try {
        const item = accepted.get(variantId);
        const input = item ? await deps.readInput(item) : null;
        if (input && input.offerId !== variantId) throw new Error('Merchant offer identity mismatch.');
        const previous = managed.get(variantId);
        const inputHash = input ? await hashInput(input) : null;
        if (
          input &&
          previous?.inputHash === inputHash &&
          previous.submittedAt &&
          clock().getTime() - Date.parse(previous.submittedAt) < REFRESH_MS
        )
          continue;
        if (!input && !previous) continue;
        if (!(await deps.isCurrent(catalog.revision))) {
          result.outcome = 'superseded';
          break;
        }
        if (!(await deps.repository.isClaimCurrent(claim, clock()))) {
          result.outcome = 'lease_lost';
          break;
        }
        // Invalidate confirmed state before every effect: a lost success save must not suppress recovery.
        if (!(await deps.repository.manageOffer(claim, item ?? previous!, clock()))) {
          result.outcome = 'lease_lost';
          break;
        }
        if (!(await deps.isCurrent(catalog.revision))) {
          result.outcome = 'superseded';
          break;
        }
        if (!(await deps.repository.isClaimCurrent(claim, clock()))) {
          result.outcome = 'lease_lost';
          break;
        }
        if (input) {
          await deps.provider.upsert(input);
          if (!(await deps.repository.saveSubmitted(claim, variantId, inputHash!, clock()))) {
            result.outcome = 'lease_lost';
            break;
          }
          result.upserted++;
        } else {
          await deps.provider.remove(variantId);
          if (!(await deps.repository.removeManaged(claim, variantId, clock()))) {
            result.outcome = 'lease_lost';
            break;
          }
          result.removed++;
        }
      } catch (error) {
        result.failed++;
        result.safeReason = deps.errorReason?.(error) ?? 'item_failed';
        if (deps.isQuotaFailure?.(error)) {
          result.outcome = (await deps.repository.deferQuota(claim, nextQuotaReset(clock()), clock()))
            ? 'source_stopped'
            : 'lease_lost';
          break;
        }
        if (deps.isSourceFailure?.(error)) {
          result.outcome = 'source_stopped';
          break;
        }
      }
    }
  } catch (error) {
    result.outcome = deps.isSourceFailure?.(error) ? 'source_stopped' : 'failed';
    result.safeReason = deps.errorReason?.(error) ?? 'source_read_failed';
    if (deps.isQuotaFailure?.(error)) {
      result.outcome = (await deps.repository.deferQuota(claim, nextQuotaReset(clock()), clock()))
        ? 'source_stopped'
        : 'lease_lost';
    }
  } finally {
    if (!(await deps.repository.finishRun(claim, cursor, clock()))) result.outcome = 'lease_lost';
  }
  return result;
}

function nextQuotaReset(now: Date): Date {
  const reset = new Date(now);
  reset.setUTCHours(12, 0, 0, 0);
  if (reset.getTime() <= now.getTime()) reset.setUTCDate(reset.getUTCDate() + 1);
  return reset;
}

async function hashInput(input: MerchantProductInput): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
