import { env } from 'cloudflare:workers';
import { expect, it, vi } from 'vitest';
import {
  initializeCatalogPrice,
  readCatalogSelling,
  readCatalogPrice,
  createStripeCatalogMetadata,
  createStripeCatalogRequestShapeFingerprint,
  prepareCmsSetupPresentation,
  type StripeCatalogPrice,
} from '../../../src/application/commerce/catalog-sync';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
} from '../../../src/infrastructure/persistence/prisma';
import { parseStripePriceId, parseVariantId } from '../../../src/domain/commerce';
import { createCmsItemPublicationGateway } from '../../../src/interfaces/http/routes/cms-item-publication-gateway';

const actor = 'operator@example.com';
it('reads the native reviewed source by retained id or exact slug without CMS writes', async () => {
  const { db, deps, variantId } = await fixture();
  try {
    const item = (await deps.catalog.findByVariantId(variantId))!;
    const record = (await deps.catalog.findByStoreItem(item))!;
    const requests: Request[] = [];
    const gateway = createCmsItemPublicationGateway(
      {
        fetch: async (input) => {
          requests.push(new Request(input));
          return Response.json({
            data: {
              _rev: 'native-revision',
              item: {
                id: 'cms-retained',
                slug: 'retained',
                status: 'draft',
                liveRevisionId: null,
                data: { title: 'Reviewed saved source' },
              },
            },
          });
        },
      },
      new Request('http://127.0.0.1/api/internal/variants/variant_retained/selling'),
    );
    expect(await gateway.readSetup(record)).toMatchObject({
      cmsRevision: 'native-revision',
      source: { id: 'cms-retained' },
    });
    expect(await gateway.readSetup({ ...record, cmsSourceId: 'cms-retained' })).toMatchObject({
      cmsRevision: 'native-revision',
    });
    expect(requests.map((request) => [request.method, new URL(request.url).pathname])).toEqual([
      ['GET', '/_emdash/api/content/releases/retained'],
      ['GET', '/_emdash/api/content/releases/cms-retained'],
    ]);
    await expect(gateway.readSetup({ ...record, cmsSourceId: 'different-id' })).rejects.toThrow('identity');
  } finally {
    await db.$disconnect();
  }
});
async function fixture(stock: number | null = 1, sourceKind: 'release' | 'distro' = 'release') {
  const db = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
  const variantId = parseVariantId('variant_retained');
  await db.catalogOperation.deleteMany();
  await db.storeOfferSnapshot.deleteMany();
  await db.variantStripeMapping.deleteMany();
  await db.stockChange.deleteMany();
  await db.stock.deleteMany();
  await db.itemAvailability.deleteMany();
  await db.storeItemOption.deleteMany();
  await db.storeItemOption.create({ data: { variantId, storeItemSlug: 'retained', sourceKind, sourceId: 'retained' } });
  if (stock !== null) {
    await db.stock.create({ data: { variantId, quantity: stock, onlineQuantity: stock } });
    await db.stockChange.create({
      data: { variantId, quantityDelta: stock, reason: 'opening_stock', actorEmail: actor },
    });
  }
  await db.itemAvailability.create({ data: { variantId, status: 'available', canBuy: false } });
  const catalog = new PrismaStoreItemOptionRepository(db);
  const mappings = new PrismaVariantStripeMappingRepository(db);
  const journal = new D1CatalogOperationRepository(env.COMMERCE_DB);
  const metadata = createStripeCatalogMetadata('local', (await catalog.findByVariantId(variantId))!);
  const price: StripeCatalogPrice = {
    priceId: parseStripePriceId('price_retained'),
    productId: 'prod_blackbox_local_variant_retained',
    amountMinor: 1250,
    currencyCode: 'EUR',
    priceKind: 'fixed',
    customUnitAmount: null,
    active: true,
    productActive: true,
    taxBehavior: 'inclusive',
    metadata,
    productMetadata: metadata,
    productTaxCode: 'txcd_99999999',
    productName: 'Saved title',
    productDescription: '',
    productImages: [],
    lookupKey: null,
  };
  const gateway = {
    inspectSetupProduct: vi.fn(async () => null),
    retrieveDefaultPrice: vi.fn(async () => price),
    ensureSetupProduct: vi.fn(async () => ({
      productId: price.productId!,
      active: true,
      metadata,
      name: 'Saved title',
    })),
    createReplacementPrice: vi.fn(async () => price),
    selectReplacementPrice: vi.fn(async () => price),
  };
  const source = { id: 'cms-retained', slug: 'retained', data: { title: 'Saved title', group: 'CDs' } };
  const readSource = vi.fn(async () => ({
    cmsRevision: 'native-1',
    source,
    sourceFingerprint: createStripeCatalogRequestShapeFingerprint(source),
  }));
  let time = new Date('2026-09-22T12:00:00Z');
  const deps = {
    environment: 'local' as const,
    catalog,
    mappings,
    journal,
    gateway,
    readSource,
    preparePresentation: prepareCmsSetupPresentation,
    now: () => time,
  };
  const command = {
    operationId: 'initialize-retained',
    expectedRevision: 0,
    cmsRevision: 'native-1',
    itemType: 'CDs',
    price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 1250 },
    confirmLiveSetup: false,
  };
  return {
    db,
    deps,
    command,
    variantId,
    price,
    later() {
      time = new Date(time.getTime() + 2 * 86_400_000);
    },
  };
}

it('prices the real unpriced retained 1/1 item, preserving ledger, pause and publication; configured control stays editable', async () => {
  const { db, deps, command, variantId } = await fixture();
  try {
    const stock = await db.stock.findMany();
    const ledger = await db.stockChange.findMany();
    await expect(readCatalogPrice(deps, variantId)).rejects.toThrow('setup is incomplete');
    expect(await readCatalogSelling(deps, variantId, actor)).toMatchObject({
      state: 'setup_required',
      itemType: null,
      expectedRevision: 0,
    });
    expect(await db.catalogOperation.count()).toBe(0);
    expect(deps.gateway.ensureSetupProduct).not.toHaveBeenCalled();
    expect(await initializeCatalogPrice(deps, variantId, actor, command)).toMatchObject({
      status: 'completed',
      variantId,
    });
    expect(await db.stock.findMany()).toEqual(stock);
    expect(await db.stockChange.findMany()).toEqual(ledger);
    expect(await db.itemAvailability.findFirst()).toMatchObject({ canBuy: false });
    expect(await db.storeItemOption.findFirst()).toMatchObject({
      variantId,
      sourceId: 'retained',
      storeItemSlug: 'retained',
      catalogAvailability: 'withheld',
      catalogRevision: 1,
      itemType: 'CDs',
      cmsSourceId: 'cms-retained',
    });
    expect(await db.storeOfferSnapshot.findFirst()).toMatchObject({
      amountMinor: 1250,
      stripePriceId: 'price_retained',
    });
    deps.readSource.mockRejectedValue(new Error('Unrelated private draft is incomplete'));
    expect(await readCatalogSelling(deps, variantId, actor)).toMatchObject({
      state: 'ready',
      detail: { price: command.price },
    });
    await db.storeItemOption.update({
      where: { variantId },
      data: { catalogRevision: 5, catalogAvailability: 'published' },
    });
    expect(await initializeCatalogPrice(deps, variantId, actor, command)).toMatchObject({ status: 'completed' });
    expect(deps.gateway.createReplacementPrice).toHaveBeenCalledTimes(1);
    await expect(initializeCatalogPrice(deps, variantId, 'other@example.com', command)).rejects.toThrow('conflicts');
    await expect(initializeCatalogPrice(deps, variantId, actor, { ...command, itemType: 'Tapes' })).rejects.toThrow(
      'conflicts',
    );
    await expect(initializeCatalogPrice({ ...deps, environment: 'uat' }, variantId, actor, command)).rejects.toThrow(
      'conflicts',
    );
  } finally {
    await db.$disconnect();
  }
});

it.each([0, null])('derives Distro type and permits %s stock without inventing inventory', async (quantity) => {
  const { db, deps, command, variantId } = await fixture(quantity, 'distro');
  try {
    expect(await readCatalogSelling(deps, variantId, actor)).toMatchObject({
      state: 'setup_required',
      itemType: 'CDs',
    });
    await expect(initializeCatalogPrice(deps, variantId, actor, { ...command, itemType: 'Tapes' })).rejects.toThrow(
      'format',
    );
    expect(await db.catalogOperation.count()).toBe(0);
    await initializeCatalogPrice(deps, variantId, actor, command);
    expect(await db.stock.count()).toBe(quantity === null ? 0 : 1);
    if (quantity === 0) expect(await db.stock.findFirst()).toMatchObject({ quantity: 0, onlineQuantity: 0 });
  } finally {
    await db.$disconnect();
  }
});

it('preserves an established runtime format and price-kind policy', async () => {
  const { db, deps, command, variantId } = await fixture();
  try {
    await db.storeItemOption.update({
      where: { variantId },
      data: { itemType: 'Black Vinyl LP', priceKind: 'pay_what_you_want' },
    });
    expect(await readCatalogSelling(deps, variantId, actor)).toMatchObject({
      state: 'setup_required',
      itemType: 'Black Vinyl LP',
      priceKind: 'pay_what_you_want',
    });
    await expect(initializeCatalogPrice(deps, variantId, actor, command)).rejects.toThrow('policy');
    const price = {
      kind: 'pay_what_you_want',
      currencyCode: 'EUR',
      minimumAmountMinor: 500,
      presetAmountMinor: 1250,
      maximumAmountMinor: 5000,
    };
    const selected = {
      ...(await deps.gateway.retrieveDefaultPrice()),
      priceKind: 'pay_what_you_want' as const,
      amountMinor: null,
      customUnitAmount: { minimumAmountMinor: 500, presetAmountMinor: 1250, maximumAmountMinor: 5000 },
    };
    deps.gateway.selectReplacementPrice.mockResolvedValue(selected);
    await initializeCatalogPrice(deps, variantId, actor, { ...command, itemType: 'Black Vinyl LP', price });
    expect(await db.storeItemOption.findFirst()).toMatchObject({
      itemType: 'Black Vinyl LP',
      priceKind: 'pay_what_you_want',
    });
  } finally {
    await db.$disconnect();
  }
});

it('derives Merch from the saved Clothes group', async () => {
  const { db, deps, command, variantId } = await fixture(null, 'distro');
  try {
    const saved = await deps.readSource();
    saved.source.data.group = 'Clothes';
    expect(await readCatalogSelling(deps, variantId, actor)).toMatchObject({
      state: 'setup_required',
      itemType: 'Clothes',
    });
    await initializeCatalogPrice(deps, variantId, actor, { ...command, itemType: 'Clothes' });
    expect(await db.storeItemOption.findFirst()).toMatchObject({ itemType: 'Clothes' });
    expect(await db.stock.count()).toBe(0);
  } finally {
    await db.$disconnect();
  }
});

it('rejects correctable input, unsafe authority and failed provider reads before recording intent', async () => {
  const { db, deps, command, variantId } = await fixture();
  try {
    for (const input of [
      { ...command, expectedRevision: 1 },
      { ...command, cmsRevision: 'old' },
      { ...command, stock: 99 },
      { ...command, price: { ...command.price, amountMinor: 0 } },
    ])
      await expect(initializeCatalogPrice(deps, variantId, actor, input)).rejects.toThrow();
    await expect(initializeCatalogPrice({ ...deps, environment: 'prd' }, variantId, actor, command)).rejects.toThrow(
      'Confirm',
    );
    deps.readSource.mockResolvedValueOnce({
      cmsRevision: 'native-1',
      source: { id: 'cms-retained', slug: 'retained', data: { title: '', group: 'CDs' } },
      sourceFingerprint: createStripeCatalogRequestShapeFingerprint({}),
    });
    await expect(initializeCatalogPrice(deps, variantId, actor, command)).rejects.toThrow('title');
    deps.gateway.inspectSetupProduct.mockRejectedValueOnce(new Error('provider down'));
    await expect(readCatalogSelling(deps, variantId, actor)).rejects.toThrow('provider down');
    const unsafeGateway = {
      ...deps.gateway,
      inspectSetupProduct: vi.fn(async () => ({
        active: false,
        deleted: true,
        live: false,
        defaultPriceId: null,
        taxCode: null,
        metadata: {},
      })),
    };
    expect(await readCatalogSelling({ ...deps, gateway: unsafeGateway }, variantId, actor)).toMatchObject({
      state: 'blocked',
      action: 'administrator',
    });
    await expect(
      initializeCatalogPrice({ ...deps, gateway: unsafeGateway }, variantId, actor, command),
    ).rejects.toThrow('Product');
    await db.variantStripeMapping.create({ data: { variantId, stripePriceId: 'price_legacy' } });
    await expect(initializeCatalogPrice(deps, variantId, actor, command)).rejects.toThrow('binding');
    expect(await db.catalogOperation.count()).toBe(0);
    expect(deps.gateway.ensureSetupProduct).not.toHaveBeenCalled();
  } finally {
    await db.$disconnect();
  }
});

it('restores accepted input after response loss, fences competing work and preserves intervening stock changes', async () => {
  const { db, deps, command, variantId, later } = await fixture();
  try {
    deps.gateway.selectReplacementPrice.mockRejectedValueOnce(new Error('acknowledgement lost'));
    await expect(initializeCatalogPrice(deps, variantId, actor, command)).rejects.toThrow('acknowledgement');
    const readiness = await readCatalogSelling(deps, variantId, actor);
    expect(readiness).toMatchObject({ state: 'blocked', action: 'resume', pending: command });
    expect(await readCatalogSelling(deps, variantId, 'other@example.com')).toMatchObject({
      state: 'blocked',
      pending: null,
    });
    await expect(
      initializeCatalogPrice(deps, variantId, actor, { ...command, operationId: 'competitor' }),
    ).rejects.toThrow('retained');
    expect(await initializeCatalogPrice(deps, variantId, actor, command)).toMatchObject({ status: 'pending' });
    await db.stock.update({ where: { variantId }, data: { quantity: 3, onlineQuantity: 2, revision: 1 } });
    deps.readSource.mockRejectedValue(new Error('Newer private draft must not replace accepted source'));
    later();
    if (readiness.state !== 'blocked' || !readiness.pending) throw new Error('Missing resume input');
    expect(await initializeCatalogPrice(deps, variantId, actor, readiness.pending)).toMatchObject({
      status: 'completed',
    });
    expect(deps.gateway.createReplacementPrice).toHaveBeenCalledTimes(1);
    expect(await db.stock.findFirst()).toMatchObject({ quantity: 3, onlineQuantity: 2, revision: 1 });
    expect(await db.stockChange.count()).toBe(1);
  } finally {
    await db.$disconnect();
  }
});

it('rolls back every completion write on a snapshot conflict and disallows generic completion', async () => {
  const { db, deps, command, variantId, later } = await fixture();
  try {
    const complete = deps.journal.completePriceInitialization.bind(deps.journal);
    deps.journal.completePriceInitialization = vi.fn(async (operation, snapshot, now) => {
      await expect(deps.journal.advance(operation, 'completed', {}, now)).rejects.toThrow('Invalid');
      expect(await complete(operation, snapshot, new Date(now!.getTime() + 60_001))).toBe(false);
      await db.storeOfferSnapshot.create({ data: { ...snapshot, variantId: 'variant_collision' } });
      return complete(operation, snapshot, now);
    });
    await expect(initializeCatalogPrice(deps, variantId, actor, command)).rejects.toThrow();
    expect(await db.storeItemOption.findFirst()).toMatchObject({
      catalogRevision: 0,
      itemType: null,
      cmsSourceId: null,
    });
    expect(await db.variantStripeMapping.count()).toBe(0);
    expect(await deps.journal.find(command.operationId)).toMatchObject({ status: 'pending', step: 'default_selected' });
    await db.storeOfferSnapshot.deleteMany();
    deps.journal.completePriceInitialization = complete;
    later();
    expect(await initializeCatalogPrice(deps, variantId, actor, command)).toMatchObject({ status: 'completed' });
  } finally {
    await db.$disconnect();
  }
});
