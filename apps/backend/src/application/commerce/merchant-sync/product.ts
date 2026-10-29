import { projectProseFields, type ContentSnapshot } from '@blackbox/content-model';
import { parsePreorderShipEstimate } from '../../../domain/commerce';
import type { StockRecord } from '../../../domain/commerce/repositories/spi';
import type { StoreOffer } from '../checkout';

export type MerchantProductInput = {
  offerId: string;
  contentLanguage: 'en';
  feedLabel: 'GR';
  productAttributes: {
    title: string;
    description: string;
    link: string;
    imageLink: string;
    availability: 'IN_STOCK';
    condition: 'NEW' | 'USED';
    price: { amountMicros: string; currencyCode: 'EUR' };
  };
};

export function createMerchantProductInput(
  snapshot: ContentSnapshot,
  item: NonNullable<ContentSnapshot['storeItems']>[number],
  offer: StoreOffer | null,
  stock: StockRecord | null,
  publicOrigin: string,
): MerchantProductInput | null {
  if (
    !snapshot.storeItems?.some(
      (accepted) =>
        accepted.variantId === item.variantId &&
        accepted.storeItemSlug === item.storeItemSlug &&
        accepted.sourceKind === item.sourceKind &&
        accepted.sourceId === item.sourceId,
    ) ||
    !offer ||
    offer.variantId !== item.variantId ||
    offer.storeItemSlug !== item.storeItemSlug ||
    !stock ||
    stock.variantId !== item.variantId ||
    stock.preorder === undefined ||
    !Number.isSafeInteger(stock.quantity) ||
    !Number.isSafeInteger(stock.onlineQuantity) ||
    stock.quantity < 0 ||
    stock.onlineQuantity < 0
  )
    throw new Error('Merchant offer identity or stock is unavailable.');
  if (stock.preorder !== null) {
    if (!stock.preorder || !Number.isFinite(Date.parse(stock.preorder.startedAt)))
      throw new Error('Merchant stock pre-order is unavailable.');
    parsePreorderShipEstimate(stock.preorder.shipEstimate);
    return null;
  }
  if (Math.min(stock.quantity, stock.onlineQuantity) === 0 || offer.catalogStatus === 'sold_out') return null;
  if (offer.catalogStatus === 'catalog_drift') throw new Error('Merchant price requires reconciliation.');
  if (offer.price.kind === 'pay_what_you_want') return null;
  if (
    !offer.canCheckout ||
    offer.price.currencyCode !== 'EUR' ||
    !Number.isSafeInteger(offer.price.amountMinor) ||
    offer.price.amountMinor <= 0
  )
    throw new Error('Merchant fixed price is unavailable.');

  const collection = item.sourceKind === 'release' ? 'releases' : 'distro';
  const record = snapshot.records.find((entry) => entry.collection === collection && entry.slug === item.sourceId);
  const data = record && projectProseFields(collection, record.data);
  if (!data || typeof data.title !== 'string' || !data.title.trim())
    throw new Error('Accepted Merchant product content is unavailable.');
  if (data.product_condition !== 'new' && data.product_condition !== 'used')
    throw new Error('Accepted Merchant product condition is unavailable.');
  const image = data[item.sourceKind === 'release' ? 'cover_image' : 'image'];
  const imageId = image && typeof image === 'object' && !Array.isArray(image) && 'id' in image ? image.id : undefined;
  const media = snapshot.media.find((entry) => entry.id === imageId);
  if (!media || !/^[a-f0-9]{64}$/.test(media.sha256))
    throw new Error('Accepted Merchant product image is unavailable.');
  const origin = new URL(publicOrigin);
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash)
    throw new Error('Merchant public origin is invalid.');
  if (!origin.pathname.endsWith('/')) origin.pathname += '/';
  const title = data.title.trim();
  const description = typeof data.summary === 'string' && data.summary.trim() ? data.summary.trim() : title;
  return {
    offerId: item.variantId,
    contentLanguage: 'en',
    feedLabel: 'GR',
    productAttributes: {
      title: title.slice(0, 150),
      description: description.slice(0, 5000),
      link: new URL(`store/${encodeURIComponent(item.storeItemSlug)}/`, origin).href,
      imageLink: new URL(`media/content/${media.sha256}`, origin).href,
      availability: 'IN_STOCK',
      condition: data.product_condition === 'used' ? 'USED' : 'NEW',
      price: { amountMicros: (BigInt(offer.price.amountMinor) * 10000n).toString(), currencyCode: 'EUR' },
    },
  };
}
