import type {
  RuntimeCatalogRecord,
  RuntimeCatalogRepository,
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreItemSourceRef,
  InventoryItem,
  InventoryQuery,
  InventoryPage,
} from '../../../domain/commerce/repositories/spi';
import { parseStoreItemSlug, parseVariantId } from '../../../domain/commerce';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapStoreItemOption(record: {
  storeItemSlug: string;
  sourceKind: 'release' | 'distro';
  sourceId: string;
  variantId: string;
}): StoreItemOptionRecord {
  return {
    storeItemSlug: parseStoreItemSlug(record.storeItemSlug),
    sourceKind: record.sourceKind,
    sourceId: record.sourceId,
    variantId: parseVariantId(record.variantId),
  };
}

export class PrismaStoreItemOptionRepository implements StoreItemOptionRepository, RuntimeCatalogRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async readInventory(query: InventoryQuery): Promise<InventoryPage> {
    const before = query.before ?? new Date().toISOString();
    const filters = [
      "(CASE WHEN typeof(c.createdAt) = 'text' THEN unixepoch(c.createdAt) * 1000 ELSE c.createdAt END) <= ?",
    ];
    const values: (string | number)[] = [new Date(before).getTime()];
    if (query.area === 'release') filters.push("c.sourceKind = 'release'");
    if (query.area === 'distro') filters.push("c.sourceKind = 'distro' AND COALESCE(c.itemType, '') <> 'Clothes'");
    if (query.area === 'merch') filters.push("c.itemType = 'Clothes'");
    const browseFormat =
      "CASE c.itemType WHEN 'CD' THEN 'CDs' WHEN 'Tape' THEN 'Tapes' WHEN 'Black Vinyl LP' THEN 'Vinyl 12-inch' ELSE c.itemType END";
    if (query.format) {
      filters.push(`(${browseFormat}) = ?`);
      values.push(query.format);
    }
    const title =
      "COALESCE(NULLIF(json_extract(c.productProjection, '$.name'), ''), replace(c.storeItemSlug, '-', ' '))";
    const format = "COALESCE(c.itemType, '')";
    if (query.q.trim()) {
      filters.push(
        `(instr(lower(${title}), lower(?)) > 0 OR instr(lower(c.storeItemSlug), lower(?)) > 0 OR instr(lower(c.sourceId), lower(?)) > 0)`,
      );
      values.push(query.q.trim(), query.q.trim(), query.q.trim());
    }
    if (query.cursor) {
      let cursor: unknown;
      try {
        cursor = JSON.parse(query.cursor);
      } catch {
        throw new Error('Invalid inventory cursor.');
      }
      if (!Array.isArray(cursor) || cursor.length !== 3 || cursor.some((value) => typeof value !== 'string'))
        throw new Error('Invalid inventory cursor.');
      // Both sides must use SQLite's normalization; JavaScript folds additional Unicode characters.
      filters.push(`(${format}, lower(${title}), c.variantId) > (?, lower(?), ?)`);
      values.push(...cursor);
    }
    const rows = await this.prisma.$queryRawUnsafe<InventoryItem[]>(
      `SELECT c.variantId, c.storeItemSlug, c.sourceId, c.sourceKind, c.cmsSourceId, c.itemType,
      ${title} AS displayName, s.quantity, s.onlineQuantity FROM StoreItemOption c
      LEFT JOIN Stock s ON s.variantId = c.variantId WHERE ${filters.join(' AND ')}
      ORDER BY ${format}, lower(${title}), c.variantId LIMIT ?`,
      ...values,
      query.limit + 1,
    );
    const items = rows.slice(0, query.limit);
    const last = items.at(-1);
    return {
      items,
      before,
      ...(rows.length > query.limit && last
        ? {
            nextCursor: JSON.stringify([last.itemType ?? '', last.displayName, last.variantId]),
          }
        : {}),
    };
  }

  public async findByStoreItem(storeItem: StoreItemOptionRecord): Promise<RuntimeCatalogRecord | null> {
    const record = await this.prisma.storeItemOption.findFirst({ where: storeItem });
    return record
      ? {
          ...mapStoreItemOption(record),
          cmsSourceId: record.cmsSourceId,
          itemType: record.itemType,
          priceKind: record.priceKind,
          productProjection: record.productProjection,
          catalogAvailability: record.catalogAvailability,
          catalogRevision: record.catalogRevision,
        }
      : null;
  }

  public async findByStoreItemSlug(storeItemSlug: string): Promise<StoreItemOptionRecord | null> {
    const record = await this.prisma.storeItemOption.findUnique({
      where: { storeItemSlug },
    });

    return record ? mapStoreItemOption(record) : null;
  }

  public async findByVariantId(variantId: string): Promise<StoreItemOptionRecord | null> {
    const record = await this.prisma.storeItemOption.findUnique({
      where: { variantId },
    });

    return record ? mapStoreItemOption(record) : null;
  }

  public async findBySource(source: StoreItemSourceRef): Promise<StoreItemOptionRecord | null> {
    const record = await this.prisma.storeItemOption.findUnique({
      where: {
        sourceKind_sourceId: {
          sourceId: source.sourceId,
          sourceKind: source.sourceKind,
        },
      },
    });

    return record ? mapStoreItemOption(record) : null;
  }

  public async search(
    query: string | null,
    limit: number,
  ): Promise<
    (StoreItemOptionRecord & {
      displayName?: string;
      quantity: number | null;
      onlineQuantity: number | null;
      itemType: string | null;
    })[]
  > {
    const trimmedQuery = query?.trim() ?? '';

    const records = await this.prisma.storeItemOption.findMany({
      orderBy: {
        storeItemSlug: 'asc',
      },
      take: limit,
      where:
        trimmedQuery.length === 0
          ? undefined
          : {
              OR: [
                { sourceId: { contains: trimmedQuery } },
                { storeItemSlug: { contains: trimmedQuery } },
                { variantId: { contains: trimmedQuery } },
                { productProjection: { path: '$.name', string_contains: trimmedQuery, mode: 'insensitive' } },
              ],
            },
    });

    const stock = records.length
      ? await this.prisma.stock.findMany({
          where: { variantId: { in: records.map((record) => record.variantId) } },
          select: { variantId: true, quantity: true, onlineQuantity: true },
        })
      : [];
    return records.map((record) => {
      const name = (record.productProjection as { name?: unknown } | null)?.name;
      return {
        ...mapStoreItemOption(record),
        itemType: record.itemType,
        quantity: stock.find((item) => item.variantId === record.variantId)?.quantity ?? null,
        onlineQuantity: stock.find((item) => item.variantId === record.variantId)?.onlineQuantity ?? null,
        ...(typeof name === 'string' && name.trim() ? { displayName: name } : {}),
      };
    });
  }
}
