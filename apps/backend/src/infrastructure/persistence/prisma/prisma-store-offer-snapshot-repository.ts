import type {
  StoreOfferListingPriceSnapshotRecord,
  StoreOfferListingPriceSnapshotRepository,
  StoreOfferSnapshotRecord,
  StoreOfferSnapshotRepository,
  StoreOfferSnapshotState,
} from '../../../domain/commerce/repositories/spi';
import { createStockQuantity, parseStoreItemSlug, parseStripePriceId, parseVariantId } from '../../../domain/commerce';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapStoreOfferSnapshot(record: {
  amountMinor: number | null;
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

export class PrismaStoreOfferSnapshotRepository
  implements StoreOfferSnapshotRepository, StoreOfferListingPriceSnapshotRepository
{
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

  public async listForListingPricePresentation(): Promise<StoreOfferListingPriceSnapshotRecord[]> {
    const records = await this.prisma.$queryRaw<
      {
        amountMinor: number | null;
        currencyCode: string;
        freshUntil: number | string;
        priceActive: number;
        productActive: number;
        storeItemSlug: string;
        availabilityStatus: 'available' | 'sold_out' | null;
        canBuy: number | null;
        effectiveQuantity: number | null;
        restockPlanned: number | null;
        showLowStock: number | null;
      }[]
    >`
      SELECT snapshot."amountMinor", snapshot."currencyCode", snapshot."freshUntil",
        snapshot."priceActive", snapshot."productActive", snapshot."storeItemSlug",
        availability."status" AS "availabilityStatus", availability."canBuy",
        CASE WHEN stock."variantId" IS NULL THEN NULL
          ELSE MAX(0, MIN(stock."quantity", stock."onlineQuantity") - COALESCE(holds."quantity", 0))
        END AS "effectiveQuantity", stock."restockPlanned", stock."showLowStock"
      FROM "StoreOfferSnapshot" snapshot
      INNER JOIN "StoreItemOption" item ON item."storeItemSlug" = snapshot."storeItemSlug"
        AND item."variantId" = snapshot."variantId"
      LEFT JOIN "ItemAvailability" availability ON availability."variantId" = item."variantId"
      LEFT JOIN "Stock" stock ON stock."variantId" = item."variantId"
      LEFT JOIN (
        SELECT line."variantId", SUM(line."quantity") AS "quantity"
        FROM "CheckoutOrderLine" line
        INNER JOIN "CheckoutOrder" checkout ON checkout."id" = line."orderId"
        WHERE checkout."status" = 'pending_payment'
        GROUP BY line."variantId"
      ) holds ON holds."variantId" = item."variantId"
      ORDER BY snapshot."storeItemSlug" ASC
    `;

    return records.map((record) => ({
      amountMinor: record.amountMinor,
      currencyCode: record.currencyCode,
      freshUntil: new Date(record.freshUntil),
      priceActive: Boolean(record.priceActive),
      productActive: Boolean(record.productActive),
      storeItemSlug: parseStoreItemSlug(record.storeItemSlug),
      availability:
        record.availabilityStatus === null
          ? null
          : {
              status: record.availabilityStatus,
              canBuy: Boolean(record.canBuy),
            },
      stock:
        record.effectiveQuantity === null
          ? null
          : {
              onlineQuantity: createStockQuantity(Number(record.effectiveQuantity)),
              restockPlanned: Boolean(record.restockPlanned),
              showLowStock: Boolean(record.showLowStock),
            },
    }));
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
