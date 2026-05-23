import type {
  StoreOfferSnapshotRecord,
  StoreOfferSnapshotRepository,
  StoreOfferSnapshotState,
} from '../../../domain/commerce/repositories/spi';
import { parseStoreItemSlug, parseStripePriceId, parseVariantId } from '../../../domain/commerce';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapStoreOfferSnapshot(record: {
  amountMinor: number;
  currencyCode: string;
  freshUntil: Date;
  priceActive: boolean;
  productActive: boolean;
  storeItemSlug: string;
  stripeLookupKey: string;
  stripePriceId: string;
  syncedAt: Date;
  variantId: string;
}): StoreOfferSnapshotRecord {
  return {
    amountMinor: record.amountMinor,
    currencyCode: record.currencyCode,
    freshUntil: record.freshUntil,
    priceActive: record.priceActive,
    productActive: record.productActive,
    storeItemSlug: parseStoreItemSlug(record.storeItemSlug),
    stripeLookupKey: record.stripeLookupKey,
    stripePriceId: parseStripePriceId(record.stripePriceId),
    syncedAt: record.syncedAt,
    variantId: parseVariantId(record.variantId),
  };
}

export class PrismaStoreOfferSnapshotRepository implements StoreOfferSnapshotRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findByStoreItemSlug(storeItemSlug: string): Promise<StoreOfferSnapshotRecord | null> {
    const record = await this.prisma.storeOfferSnapshot.findUnique({
      where: { storeItemSlug },
    });

    return record ? mapStoreOfferSnapshot(record) : null;
  }

  public async findByVariantId(variantId: string): Promise<StoreOfferSnapshotRecord | null> {
    const record = await this.prisma.storeOfferSnapshot.findUnique({
      where: { variantId },
    });

    return record ? mapStoreOfferSnapshot(record) : null;
  }

  public async save(snapshot: StoreOfferSnapshotState): Promise<StoreOfferSnapshotRecord> {
    const record = await this.prisma.storeOfferSnapshot.upsert({
      create: {
        amountMinor: snapshot.amountMinor,
        currencyCode: snapshot.currencyCode,
        freshUntil: snapshot.freshUntil,
        priceActive: snapshot.priceActive,
        productActive: snapshot.productActive,
        storeItemSlug: snapshot.storeItemSlug,
        stripeLookupKey: snapshot.stripeLookupKey,
        stripePriceId: snapshot.stripePriceId,
        syncedAt: snapshot.syncedAt,
        variantId: snapshot.variantId,
      },
      update: {
        amountMinor: snapshot.amountMinor,
        currencyCode: snapshot.currencyCode,
        freshUntil: snapshot.freshUntil,
        priceActive: snapshot.priceActive,
        productActive: snapshot.productActive,
        stripeLookupKey: snapshot.stripeLookupKey,
        stripePriceId: snapshot.stripePriceId,
        syncedAt: snapshot.syncedAt,
      },
      where: {
        variantId: snapshot.variantId,
      },
    });

    return mapStoreOfferSnapshot(record);
  }
}
