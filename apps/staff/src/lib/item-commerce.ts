import {
  editorialRequest,
  type DraftPrice,
  type EditorialRecord,
  type PriceAttempt,
  type PriceDraft,
  type PriceDraftInput,
} from './backend/editorial-api';
import {
  InternalStockApiError,
  type CatalogItemPublishCommand,
  type createInternalStockApi,
} from './backend/internal-stock-api';

export type { DraftPrice, PriceAttempt, PriceDraft, PriceDraftInput };

/** Where the item stands in the shop. Only a withheld item with a price can start selling. */
export type ShopStatus = 'on_sale' | 'ready_to_sell' | 'not_ready';
/** What one publish run does to the shop: nothing, keep checkout in step, or start selling. */
export type ShopIntent = 'none' | 'sync' | 'activate';

// What the item editor and the publish review need to know about selling.
export type ItemCommerceState = {
  variantId: string;
  shop: ShopStatus;
  requiresLiveConfirmation: boolean;
  livePrice: DraftPrice | null;
  priceDraft: PriceDraft | null;
};

/** Selling state of the open item as the editor knows it. */
export type ItemCommerce =
  { status: 'loading' } | { status: 'unavailable' } | { status: 'ready'; state: ItemCommerceState };

/** A workspace read either knows the item's draft (possibly none) or could not read drafts. */
export type DraftLookup = { status: 'unknown' } | { status: 'known'; draft: PriceDraft | null };

export const draftLookup = (record: EditorialRecord): DraftLookup =>
  record.priceDraft === undefined ? { status: 'unknown' } : { status: 'known', draft: record.priceDraft };

export function shopIntent(shop: ShopStatus, putOnSale: boolean): ShopIntent {
  if (shop === 'on_sale') return 'sync';
  return shop === 'ready_to_sell' && putOnSale ? 'activate' : 'none';
}

type StockApi = ReturnType<typeof createInternalStockApi>;
const draftPath = 'plugins/blackbox-editorial/price-drafts';

export class PriceConflictError extends Error {}

export function euroMinor(value: string): number {
  if (!/^\d{1,6}(?:[.,]\d{1,2})?$/.test(value.trim()))
    throw new Error('Enter a positive EUR amount with at most two decimal places.');
  const [whole, fraction = ''] = value.trim().replace(',', '.').split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (amount < 1 || amount > 99_999_999) throw new Error('Amount must be between €0.01 and €999,999.99.');
  return amount;
}

export const formatEuro = (minor: number) => `€${(minor / 100).toFixed(2)}`;
export const priceAmount = (price: DraftPrice) =>
  price.kind === 'fixed' ? price.amountMinor : price.presetAmountMinor;

export function describePrice(price: DraftPrice): string {
  return price.kind === 'fixed'
    ? formatEuro(price.amountMinor)
    : `Pay what you want, suggested ${formatEuro(price.presetAmountMinor)} (${formatEuro(price.minimumAmountMinor)} to ${formatEuro(price.maximumAmountMinor)})`;
}

export function samePrice(a: DraftPrice, b: DraftPrice): boolean {
  if (a.kind === 'fixed' || b.kind === 'fixed') return a.kind === b.kind && priceAmount(a) === priceAmount(b);
  return (
    a.kind === b.kind &&
    a.minimumAmountMinor === b.minimumAmountMinor &&
    a.presetAmountMinor === b.presetAmountMinor &&
    a.maximumAmountMinor === b.maximumAmountMinor
  );
}

export function draftInput({
  revision: _revision,
  updatedBy: _updatedBy,
  updatedAt: _updatedAt,
  ...input
}: PriceDraft): PriceDraftInput {
  return input;
}

export async function readPriceDraft(
  base: string,
  target: { collection: string; recordId: string },
): Promise<PriceDraft | null> {
  const query = new URLSearchParams({ collection: target.collection, id: target.recordId });
  const result = await editorialRequest<{ items: PriceDraft[] }>(base, `${draftPath}?${query}`);
  return result.items[0] ?? null;
}

/** `revision` is the stored draft's revision, or null to create one. */
export async function savePriceDraft(
  base: string,
  draft: PriceDraftInput,
  revision: string | null,
): Promise<PriceDraft> {
  const result = await editorialRequest<{ item: PriceDraft }>(base, draftPath, { draft, revision }, 'PUT');
  return result.item;
}

export async function clearPriceDraft(base: string, draft: PriceDraft): Promise<void> {
  // EmDash reads DELETE route input from the query string, not a body.
  const query = new URLSearchParams({
    collection: draft.collection,
    recordId: draft.recordId,
    revision: draft.revision,
  });
  await editorialRequest(base, `${draftPath}?${query}`, undefined, 'DELETE');
}

export type ItemPublicationStep = 'price' | 'content' | 'item';

// Order of one Publish changes run. Price goes first because it is immediate and never needs a website update.
export function planItemPublication(input: {
  contentChanged: boolean;
  priceDraft: boolean;
  shop: ShopIntent;
  dependencies: boolean;
}): ItemPublicationStep[] {
  const steps: ItemPublicationStep[] = input.priceDraft ? ['price'] : [];
  if (input.shop !== 'activate' && !input.contentChanged) return steps;
  if (input.shop === 'none') return [...steps, 'content'];
  // ponytail: required drafts publish as one content batch first, so the item step requests a second
  // website update; fold dependencies into item publication if that cost starts to matter.
  return [...steps, ...(input.dependencies ? (['content', 'item'] as const) : (['item'] as const))];
}

function newAttempt(readiness: Awaited<ReturnType<StockApi['readSelling']>>, draft: PriceDraft): PriceAttempt {
  if (readiness.state === 'ready') {
    const live = priceAmount(readiness.detail.price);
    if (live !== draft.liveAmountWhenStaged)
      throw new PriceConflictError(
        `The live price changed to ${formatEuro(live)} since this draft. Check the price and publish again.`,
      );
    return { command: 'change', operationId: crypto.randomUUID(), expectedRevision: readiness.detail.expectedRevision };
  }
  if (readiness.state === 'setup_required') {
    const itemType = readiness.itemType ?? draft.itemType;
    if (!itemType) throw new Error('Choose a format on the Price & stock tab before publishing the first price.');
    return {
      command: 'initialize',
      operationId: crypto.randomUUID(),
      expectedRevision: readiness.expectedRevision,
      cmsRevision: readiness.cmsRevision,
      itemType,
    };
  }
  throw new Error(`${readiness.reason} Check the Price & stock tab.`);
}

// Applies a price draft through the existing authorized commands. The draft keeps its first attempt, so any
// device retries the identical idempotent command.
export async function applyPriceDraft(
  base: string,
  api: Pick<StockApi, 'readSelling' | 'changePrice' | 'initializePrice'>,
  variantId: string,
  draft: PriceDraft,
): Promise<'completed' | 'needs_review' | 'pending'> {
  const readiness = await api.readSelling(variantId);
  if (readiness.state === 'ready' && samePrice(readiness.detail.price, draft.price)) {
    await clearPriceDraft(base, draft);
    return 'completed';
  }
  const attempt = draft.attempt ?? newAttempt(readiness, draft);
  const current = draft.attempt ? draft : await savePriceDraft(base, { ...draftInput(draft), attempt }, draft.revision);
  try {
    const result =
      attempt.command === 'initialize'
        ? await api.initializePrice(variantId, {
            operationId: attempt.operationId,
            expectedRevision: attempt.expectedRevision,
            cmsRevision: attempt.cmsRevision,
            itemType: attempt.itemType,
            price: current.price,
            confirmLiveSetup: true,
          })
        : await api.changePrice(variantId, {
            operationId: attempt.operationId,
            expectedRevision: attempt.expectedRevision,
            price: current.price,
            confirmLivePriceChange: true,
          });
    if (result.status === 'completed') await clearPriceDraft(base, current);
    return result.status;
  } catch (error) {
    if (!(error instanceof InternalStockApiError) || error.status !== 409) throw error;
    // Forget the rejected attempt so the next publish re-reads the live price and revisions.
    await savePriceDraft(base, { ...draftInput(current), attempt: null }, current.revision);
    throw new PriceConflictError('The price or item changed since this draft. Check the price and publish again.');
  }
}

export type ItemPublicationStatus = 'live' | 'pending' | 'failed' | 'needs_review';
const itemPublicationKey = (base: string, variantId: string) => `blackbox-item-publication:${base}:${variantId}`;

// Checkout projection plus website publication through the existing item publication command.
export async function startItemPublication(
  base: string,
  api: Pick<StockApi, 'readPublication' | 'publishItem'>,
  variantId: string,
): Promise<ItemPublicationStatus> {
  const detail = await api.readPublication(variantId);
  if (detail.operationStatus === 'needs_review') return 'needs_review';
  const key = itemPublicationKey(base, variantId);
  let saved: CatalogItemPublishCommand | null;
  try {
    saved = JSON.parse(localStorage.getItem(key) ?? 'null') as CatalogItemPublishCommand | null;
  } catch {
    saved = null;
  }
  const command = detail.pending ??
    saved ?? {
      operationId: crypto.randomUUID(),
      expectedRevision: detail.expectedRevision,
      cmsRevision: detail.cmsRevision,
      // Matches the server's retained form, so a resend has the same fingerprint.
      confirmLivePublication: detail.requiresLiveConfirmation,
      retryPublication: false,
    };
  try {
    localStorage.setItem(key, JSON.stringify(command));
  } catch {
    // The server also retains the pending command; local storage only speeds up recovery.
  }
  try {
    const result = await api.publishItem(variantId, {
      ...command,
      retryPublication: detail.publicationStatus === 'failed',
    });
    if (result.status === 'completed') localStorage.removeItem(key);
    if (result.status === 'needs_review') return 'needs_review';
    return result.status === 'completed' ? 'live' : result.publicationStatus === 'failed' ? 'failed' : 'pending';
  } catch (error) {
    if (error instanceof InternalStockApiError && error.status === 409) {
      localStorage.removeItem(key);
      throw new PriceConflictError('The item or its saved content changed. Review it again before publishing.');
    }
    throw error;
  }
}

export async function readItemPublication(
  base: string,
  api: Pick<StockApi, 'readPublication'>,
  variantId: string,
): Promise<ItemPublicationStatus> {
  const detail = await api.readPublication(variantId);
  if (detail.operationStatus === 'needs_review') return 'needs_review';
  if (detail.publicationStatus === 'failed') return 'failed';
  if (!detail.pending && detail.availability === 'published') {
    localStorage.removeItem(itemPublicationKey(base, variantId));
    return 'live';
  }
  return 'pending';
}
