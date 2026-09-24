import { env } from 'cloudflare:workers';
import { expect, it, vi } from 'vitest';
import { createHttpApp } from '../../src/interfaces/http/app';
import { createPrismaClient } from '../../src/infrastructure/persistence/prisma';
import { StripeCatalogGatewayClient } from '../../src/infrastructure/stripe/stripe-catalog-gateway';
import { parseStripePriceId } from '../../src/domain/commerce';
import type { StripeCatalogPrice } from '../../src/application/commerce/catalog-sync';
import { getInternalOpenApiDocument, getPublicOpenApiDocument } from '../../src/interfaces/http/openapi/api-documents';

it('protects setup and completes one draft through the bound CMS service', async () => {
  const path = '/api/internal/items/setup';
  const url = 'http://127.0.0.1' + path;
  const headers = { 'content-type': 'application/json', origin: 'http://127.0.0.1', 'x-blackbox-request': '1' };
  const command = {
    operationId: 'http-setup',
    storeItemSlug: 'http-setup',
    source: {
      mode: 'create',
      sourceKind: 'distro',
      slug: 'http-setup',
      data: { title: 'Record', summary: 'CMS copy', group: 'Vinyl 12-inch' },
    },
    itemType: 'Vinyl 12-inch',
    openingQuantity: 10,
    restockPlanned: true,
    price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2200 },
  };
  let source: unknown = null;
  const cmsFetch = vi.fn(async (input: RequestInfo | URL) => {
    const request = input as Request;
    expect(request.url).toMatch(/^http:\/\/127\.0\.0\.1\/_emdash\/api\/content\/distro/);
    if (request.method === 'POST') source = { id: 'cms-http-setup', ...((await request.json()) as object) };
    return source ? Response.json({ data: { item: source } }) : new Response(null, { status: 404 });
  });
  const bindings = { ...env, CMS_RUNTIME: { getByName: vi.fn(() => ({ fetch: cmsFetch })) } as never };
  const product = vi
    .spyOn(StripeCatalogGatewayClient.prototype, 'ensureSetupProduct')
    .mockResolvedValue({ productId: 'prod_http_setup', active: true, name: 'Record', metadata: {} });
  const price = { priceId: parseStripePriceId('price_http_setup') } as StripeCatalogPrice;
  const create = vi.spyOn(StripeCatalogGatewayClient.prototype, 'createReplacementPrice').mockResolvedValue(price);
  const select = vi.spyOn(StripeCatalogGatewayClient.prototype, 'selectReplacementPrice').mockResolvedValue(price);
  const db = createPrismaClient(env);
  try {
    for (const [body, requestHeaders, status] of [
      [command, { ...headers, origin: 'https://foreign.example' }, 403],
      [command, { 'content-type': 'application/json' }, 403],
      [{ ...command, actorEmail: 'forged@example.com' }, headers, 400],
      [{ ...command, stripeProductId: 'prod_injected' }, headers, 400],
    ] as const) {
      expect(
        (
          await createHttpApp().request(
            url,
            { method: 'POST', headers: requestHeaders, body: JSON.stringify(body) },
            bindings,
          )
        ).status,
      ).toBe(status);
    }
    expect(
      (await createHttpApp().request(url, { method: 'POST', headers, body: JSON.stringify(command) }, env)).status,
    ).toBe(503);
    expect(cmsFetch).not.toHaveBeenCalled();
    expect(product).not.toHaveBeenCalled();
    const response = await createHttpApp().request(
      url,
      { method: 'POST', headers, body: JSON.stringify(command) },
      bindings,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const result = (await response.json()) as { status: string; variantId: string };
    expect(result.status).toBe('completed');
    expect(product).toHaveBeenCalledWith(
      expect.objectContaining({
        projection: { name: 'Record', description: 'CMS copy', imageUrls: [], metadata: {}, taxCode: 'txcd_99999999' },
      }),
      expect.any(Object),
    );
    const replay = await createHttpApp().request(
      url,
      { method: 'POST', headers, body: JSON.stringify(command) },
      bindings,
    );
    expect(await replay.json()).toEqual(result);
    expect(cmsFetch).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledTimes(1);
    expect(await db.stock.findUnique({ where: { variantId: result.variantId } })).toMatchObject({
      quantity: 10,
      onlineQuantity: 10,
      restockPlanned: true,
    });
    expect(await db.storeItemOption.findUnique({ where: { variantId: result.variantId } })).toMatchObject({
      catalogAvailability: 'withheld',
    });
    expect(getInternalOpenApiDocument().paths?.[path]?.post?.operationId).toBe('setupCatalogItem');
    expect(getPublicOpenApiDocument().paths).not.toHaveProperty(path);
  } finally {
    product.mockRestore();
    create.mockRestore();
    select.mockRestore();
    await db.$disconnect();
  }
});
