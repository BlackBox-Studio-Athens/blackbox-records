import { readStoreOffer } from '../../src/application/commerce/checkout';
import { createStripeCatalogGateway } from '../../src/infrastructure/stripe';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { env } from 'cloudflare:workers';
import { expect, it, vi } from 'vitest';
import { createHttpApp } from '../../src/interfaces/http/app';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaItemAvailabilityRepository,
  PrismaStockRepository,
} from '../../src/infrastructure/persistence/prisma';
import {
  CatalogReconciler,
  createRuntimeCatalogProductProjectionReader,
  createStripeCatalogMetadata,
} from '../../src/application/commerce/catalog-sync';
import { parseStoreItemSlug, parseVariantId } from '../../src/domain/commerce';
import { getInternalOpenApiDocument, getPublicOpenApiDocument } from '../../src/interfaces/http/openapi/api-documents';

const url = 'http://127.0.0.1/api/internal/variants/variant_http_price/price';
const command = {
  operationId: 'http-price',
  expectedRevision: 1,
  price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2500 },
};
const headers = { 'content-type': 'application/json', origin: 'http://127.0.0.1', 'x-blackbox-request': '1' };

it('rejects cross-site and malformed commands before provider work and exposes only an internal contract', async () => {
  const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected provider request'));
  try {
    for (const [body, requestHeaders, status] of [
      [command, { ...headers, origin: 'https://attacker.example' }, 403],
      [command, { 'content-type': 'application/json' }, 403],
      [{ ...command, actorEmail: 'attacker@example.com' }, headers, 400],
      [{ ...command, stripePriceId: 'price_injected' }, headers, 400],
      [{ ...command, price: { ...command.price, amountMinor: -1 } }, headers, 400],
    ] as const) {
      const response = await createHttpApp().request(
        url,
        { method: 'POST', headers: requestHeaders, body: JSON.stringify(body) },
        env,
      );
      expect(response.status).toBe(status);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    }
    expect(network).not.toHaveBeenCalled();
    const path = '/api/internal/variants/{variantId}/price';
    expect(getInternalOpenApiDocument().paths?.[path]?.post?.operationId).toBe('changeCatalogPrice');
    expect(getPublicOpenApiDocument().paths).not.toHaveProperty(path);
  } finally {
    network.mockRestore();
  }
});

it.each(
  (['fixed', 'pay_what_you_want'] as const).flatMap((kind) =>
    (['none', 'create', 'select', 'complete'] as const).map((loss) => ({ kind, loss })),
  ),
)('executes and recovers $kind through HTTP after $loss acknowledgement loss', async ({ kind, loss }) => {
  const scenario = `${kind}_${loss}`;
  const caseUrl = url.replace('variant_http_price', `variant_http_price_${scenario}`);
  const price =
    kind === 'fixed'
      ? { kind, currencyCode: 'EUR', amountMinor: 2500 }
      : { kind, currencyCode: 'EUR', minimumAmountMinor: 500, presetAmountMinor: 2500, maximumAmountMinor: 10000 };
  const command = { operationId: `http-price-${scenario}`, expectedRevision: 1, price };
  const issuer = `https://blackbox-price-${scenario.replaceAll('_', '-')}-test.cloudflareaccess.com`;
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), alg: 'RS256', kid: 'price-test', use: 'sig' };
  const token = await new SignJWT({ email: 'verified-price@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'price-test' })
    .setIssuer(issuer)
    .setAudience('price-audience')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
  const hostedEnv = {
    ...env,
    PRODUCT_ENVIRONMENT: 'UAT' as const,
    CF_ACCESS_TEAM_DOMAIN: issuer,
    CF_ACCESS_POLICY_AUD: 'price-audience',
  };
  const hostedHeaders = {
    ...headers,
    'cf-access-jwt-assertion': token,
    'cf-access-authenticated-user-email': 'forged@example.com',
  };
  let network: ReturnType<typeof vi.spyOn> | undefined;
  let completion: ReturnType<typeof vi.spyOn> | undefined;
  const db = createPrismaClient(env);
  const item = {
    variantId: parseVariantId(`variant_http_price_${scenario}`),
    storeItemSlug: parseStoreItemSlug(`http-price-${scenario.replaceAll('_', '-')}`),
    sourceKind: 'release' as const,
    sourceId: `http-price_${scenario}`,
  };
  try {
    await db.storeItemOption.create({
      data: {
        ...item,
        cmsSourceId: `cms-http-price_${scenario}`,
        itemType: 'vinyl',
        priceKind: 'fixed',
        catalogAvailability: 'published',
        catalogRevision: 1,
        productProjection: {
          name: 'HTTP Record',
          description: '',
          imageUrls: [],
          metadata: {},
          taxCode: 'txcd_99999999',
        },
      },
    });
    await db.variantStripeMapping.create({
      data: {
        variantId: item.variantId,
        stripeProductId: `prod_http_price_${scenario}`,
        stripePriceId: `price_http_old_${scenario}`,
      },
    });
    await db.itemAvailability.create({ data: { variantId: item.variantId, status: 'available', canBuy: true } });
    await db.stock.create({ data: { variantId: item.variantId, quantity: 10, onlineQuantity: 10 } });
    const historicalOrder = await db.checkoutOrder.create({
      data: {
        storeItemSlug: item.storeItemSlug,
        variantId: item.variantId,
        checkoutSessionId: `cs_history_${scenario}`,
        checkoutExpiresAt: new Date('2026-09-01T00:00:00Z'),
        status: 'paid',
        statusUpdatedAt: new Date('2026-09-01T00:00:00Z'),
        amountTotalMinor: 1000,
        merchandiseGrossMinor: 1000,
        currencyCode: 'EUR',
        lines: {
          create: {
            storeItemSlug: item.storeItemSlug,
            variantId: item.variantId,
            stripePriceId: `price_http_old_${scenario}`,
            quantity: 1,
            unitAmountMinor: 1000,
            lineAmountMinor: 1000,
          },
        },
      },
      include: { lines: true },
    });
    const metadata = createStripeCatalogMetadata('uat', item);
    const old = {
      id: `price_http_old_${scenario}`,
      product: `prod_http_price_${scenario}`,
      active: true,
      livemode: false,
      type: 'one_time',
      currency: 'eur',
      tax_behavior: 'inclusive',
      unit_amount: 1000 as number | null,
      custom_unit_amount: null as null | { minimum: number; preset: number; maximum: number },
      metadata,
    };
    const historicalPrice = structuredClone(old);
    let replacement: typeof old | null = null;
    let defaultPrice = old.id;
    let failProvider = false;
    let lost = false;
    const lostAcknowledgement = (phase: string) => {
      if (loss !== phase || lost) return null;
      lost = true;
      return Response.json(
        { error: { type: 'api_error', message: 'acknowledgement lost after write' } },
        { status: 500, headers: { 'stripe-should-retry': 'false' } },
      );
    };
    let creates = 0;
    let selections = 0;
    network = vi.spyOn(globalThis, 'fetch').mockImplementation(async (request, init) => {
      const address = new URL(request instanceof Request ? request.url : String(request));
      if (address.origin === issuer) return Response.json({ keys: [jwk] });
      if (address.origin !== 'http://127.0.0.1:12110') throw new Error('Unexpected provider origin');
      if (failProvider)
        return Response.json(
          { error: { type: 'invalid_request_error', message: 'provider-secret-detail' } },
          { status: 400 },
        );
      const body = new URLSearchParams(String(init?.body ?? ''));
      const product = {
        id: old.product,
        active: true,
        livemode: false,
        metadata,
        tax_code: 'txcd_99999999',
        name: 'HTTP Record',
        description: '',
        images: [],
        default_price: defaultPrice,
      };
      if (address.pathname === `/v1/products/prod_http_price_${scenario}`) {
        if (init?.method === 'POST') {
          selections++;
          defaultPrice = body.get('default_price')!;
          return lostAcknowledgement('select') ?? Response.json({ ...product, default_price: defaultPrice });
        }
        return Response.json({
          ...product,
          default_price: address.search ? (replacement?.id === defaultPrice ? replacement : old) : defaultPrice,
        });
      }
      if (address.pathname === '/v1/prices' && init?.method === 'POST') {
        creates++;
        replacement = {
          ...old,
          id: `price_http_new_${scenario}`,
          unit_amount: body.has('unit_amount') ? Number(body.get('unit_amount')) : null,
          custom_unit_amount: body.has('custom_unit_amount[enabled]')
            ? {
                minimum: Number(body.get('custom_unit_amount[minimum]')),
                preset: Number(body.get('custom_unit_amount[preset]')),
                maximum: Number(body.get('custom_unit_amount[maximum]')),
              }
            : null,
          metadata: Object.fromEntries(
            [...body].filter(([key]) => key.startsWith('metadata[')).map(([key, value]) => [key.slice(9, -1), value]),
          ) as typeof metadata,
        };
        return lostAcknowledgement('create') ?? Response.json(replacement);
      }
      if (address.pathname === '/v1/prices')
        return Response.json({
          object: 'list',
          data: replacement && address.searchParams.get('active') === 'true' ? [replacement] : [],
          has_more: false,
        });
      if (address.pathname === `/v1/prices/price_http_new_${scenario}`) return Response.json(replacement);
      throw new Error('Unexpected provider path');
    });
    if (loss === 'complete') {
      const complete = D1CatalogOperationRepository.prototype.completePriceChange;
      completion = vi
        .spyOn(D1CatalogOperationRepository.prototype, 'completePriceChange')
        .mockImplementation(async function (this: D1CatalogOperationRepository, ...args) {
          const result = await complete.apply(this, args);
          if (!lost && args[0].id === command.operationId) {
            lost = true;
            throw new Error('D1 acknowledgement lost after commit');
          }
          return result;
        });
    }
    if (loss !== 'none') {
      const interrupted = await createHttpApp().request(
        caseUrl,
        { method: 'POST', headers: hostedHeaders, body: JSON.stringify(command) },
        hostedEnv,
      );
      expect(interrupted.status).toBe(503);
      expect(lost).toBe(true);
      expect(creates).toBe(1);
      expect(await db.catalogOperation.findUnique({ where: { id: command.operationId } })).toMatchObject({
        step: loss === 'create' ? 'validated' : loss === 'select' ? 'price_bound' : 'completed',
      });
      if (loss !== 'complete') {
        // Expire only the isolated test claim. The provider fake has no idempotency response cache.
        await db.catalogOperation.update({
          where: { id: command.operationId },
          data: { leaseUntil: new Date(Date.now() - 2 * 86_400_000).toISOString() },
        });
      }
    }
    for (let replay = 0; replay < 2; replay++) {
      const response = await createHttpApp().request(
        caseUrl,
        {
          method: 'POST',
          headers: hostedHeaders,
          body: JSON.stringify(command),
        },
        hostedEnv,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(await response.json()).toEqual({
        operationId: command.operationId,
        variantId: item.variantId,
        status: 'completed',
      });
    }
    expect(creates).toBe(1);
    expect(selections).toBe(1);
    expect(old).toEqual(historicalPrice);
    expect(await db.checkoutOrder.findUnique({ where: { id: historicalOrder.id }, include: { lines: true } })).toEqual(
      historicalOrder,
    );
    const storeItems = new PrismaStoreItemOptionRepository(db);
    const reconciler = new CatalogReconciler({
      environment: 'uat',
      storeItems,
      storeOfferSnapshots: new PrismaStoreOfferSnapshotRepository(db),
      stripeCatalog: createStripeCatalogGateway(hostedEnv),
      variantStripeMappings: new PrismaVariantStripeMappingRepository(db),
    });
    const offer = await readStoreOffer(
      storeItems,
      new PrismaItemAvailabilityRepository(db),
      new PrismaStockRepository(db),
      reconciler,
      createRuntimeCatalogProductProjectionReader(storeItems),
      item.storeItemSlug,
    );
    expect(offer).toMatchObject({ catalogStatus: 'ready', canCheckout: true, price });
    expect(creates).toBe(1);
    expect(selections).toBe(1);
    expect(await db.catalogOperation.findUnique({ where: { id: command.operationId } })).toMatchObject({
      actorEmail: 'verified-price@example.com',
      status: 'completed',
    });
    expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
      catalogRevision: 2,
    });
    const conflict = await createHttpApp().request(
      caseUrl,
      {
        method: 'POST',
        headers: hostedHeaders,
        body: JSON.stringify({
          ...command,
          price:
            command.price.kind === 'fixed'
              ? { ...command.price, amountMinor: 3000 }
              : { ...command.price, presetAmountMinor: 3000 },
        }),
      },
      hostedEnv,
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.text()).not.toContain(`prod_http_price_${scenario}`);
    const unconfirmed = await createHttpApp().request(
      caseUrl,
      { method: 'POST', headers: hostedHeaders, body: JSON.stringify(command) },
      { ...hostedEnv, PRODUCT_ENVIRONMENT: 'PRD' },
    );
    expect(unconfirmed.status).toBe(409);
    expect(creates).toBe(1);
    failProvider = true;
    const failed = await createHttpApp().request(
      caseUrl,
      {
        method: 'POST',
        headers: hostedHeaders,
        body: JSON.stringify({ ...command, operationId: `http-interrupted_${scenario}`, expectedRevision: 2 }),
      },
      hostedEnv,
    );
    expect(failed.status).toBe(503);
    expect(await failed.text()).not.toContain('provider-secret-detail');
    expect(await db.catalogOperation.findUnique({ where: { id: `http-interrupted_${scenario}` } })).toMatchObject({
      status: 'pending',
      step: 'started',
    });
  } finally {
    completion?.mockRestore();
    network?.mockRestore();
    await db.$disconnect();
  }
});
