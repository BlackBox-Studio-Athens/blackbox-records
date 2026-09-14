import { env } from 'cloudflare:workers';
import { expect, it, vi } from 'vitest';
import { createHttpApp } from '../../src/interfaces/http/app';
import { createPrismaClient } from '../../src/infrastructure/persistence/prisma';
import { D1PaidCheckoutFinalizationRepository } from '../../src/interfaces/http/routes/d1-paid-checkout-finalization-repository';
import { createCartQuantity, parseCheckoutSessionId, parseVariantId } from '../../src/domain/commerce';

it.each([
  { kind: 'release', itemType: 'Vinyl 12-inch', existing: false, custom: false, loss: 'product' },
  { kind: 'distro', itemType: 'Vinyl 12-inch', existing: false, custom: true, loss: 'price' },
  { kind: 'distro', itemType: 'Clothes', existing: true, custom: false, loss: 'select' },
  { kind: 'release', itemType: 'CDs', existing: false, custom: true, loss: 'source' },
])('recovers $kind/$itemType after $loss using the real provider gateway', async (scenario) => {
  const id = `http-recovery-${scenario.loss}`;
  const source = {
    id: `cms-${id}`,
    slug: id,
    data: { title: 'Record', summary: 'CMS copy', ...(scenario.kind === 'distro' ? { group: scenario.itemType } : {}) },
  };
  let savedSource = scenario.existing ? source : null;
  const writes = { source: 0, product: 0, price: 0, select: 0 };
  let lost = false;
  const loss = (phase: string) => {
    if (phase !== scenario.loss || lost) return null;
    lost = true;
    return Response.json(
      { error: { type: 'api_error', message: 'Lost acknowledgement' } },
      { status: 500, headers: { 'stripe-should-retry': 'false' } },
    );
  };
  const cmsFetch = vi.fn(async (input: RequestInfo | URL) => {
    const request = input as Request;
    if (request.method === 'POST') {
      expect(savedSource).toBeNull();
      writes.source++;
      savedSource = source;
      const interrupted = loss('source');
      if (interrupted) return interrupted;
    }
    return savedSource ? Response.json({ data: { item: savedSource } }) : new Response(null, { status: 404 });
  });
  let product: Record<string, unknown> | null = null;
  let price: Record<string, unknown> | null = null;
  const network = vi.spyOn(globalThis, 'fetch').mockImplementation(async (request, init) => {
    const address = new URL(request instanceof Request ? request.url : String(request));
    expect(address.origin).toBe('http://127.0.0.1:12110');
    const body = new URLSearchParams(String(init?.body ?? ''));
    const metadata = Object.fromEntries(
      [...body].filter(([key]) => key.startsWith('metadata[')).map(([key, value]) => [key.slice(9, -1), value]),
    );
    if (address.pathname === '/v1/products' && init?.method === 'POST') {
      expect(product).toBeNull();
      writes.product++;
      product = {
        id: body.get('id'),
        name: body.get('name'),
        description: body.get('description'),
        images: [],
        tax_code: body.get('tax_code'),
        metadata,
        active: true,
        livemode: false,
        default_price: null,
      };
      return loss('product') ?? Response.json(product);
    }
    if (address.pathname.startsWith('/v1/products/')) {
      if (!product)
        return Response.json(
          { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Missing' } },
          { status: 404 },
        );
      expect(address.pathname).toBe(`/v1/products/${String(product.id)}`);
      if (init?.method === 'POST') {
        expect([...body.keys()]).toEqual(['default_price']);
        writes.select++;
        product.default_price = body.get('default_price');
        return loss('select') ?? Response.json(product);
      }
      return Response.json(product);
    }
    if (address.pathname === '/v1/prices' && init?.method === 'POST') {
      expect(price).toBeNull();
      expect(body.get('product')).toBe(product?.id);
      writes.price++;
      price = {
        id: `price_${scenario.loss}`,
        product: product?.id,
        active: true,
        livemode: false,
        type: 'one_time',
        currency: body.get('currency'),
        tax_behavior: body.get('tax_behavior'),
        metadata,
        unit_amount: body.has('unit_amount') ? Number(body.get('unit_amount')) : null,
        custom_unit_amount: body.has('custom_unit_amount[enabled]')
          ? {
              minimum: Number(body.get('custom_unit_amount[minimum]')),
              preset: Number(body.get('custom_unit_amount[preset]')),
              maximum: Number(body.get('custom_unit_amount[maximum]')),
            }
          : null,
      };
      return loss('price') ?? Response.json(price);
    }
    if (address.pathname === '/v1/prices') {
      expect(address.searchParams.get('product')).toBe(product?.id);
      return Response.json({
        object: 'list',
        data: price && address.searchParams.get('active') === 'true' ? [price] : [],
        has_more: false,
      });
    }
    if (address.pathname === `/v1/prices/price_${scenario.loss}`) return Response.json(price);
    throw new Error('Unexpected provider request');
  });
  const db = createPrismaClient(env);
  const command = {
    operationId: id,
    storeItemSlug: id,
    itemType: scenario.itemType,
    openingQuantity: 10,
    source: scenario.existing
      ? { mode: 'existing', sourceKind: scenario.kind, id: source.id }
      : { mode: 'create', sourceKind: scenario.kind, slug: id, data: source.data },
    price: scenario.custom
      ? {
          kind: 'pay_what_you_want',
          currencyCode: 'EUR',
          minimumAmountMinor: 1000,
          presetAmountMinor: 2200,
          maximumAmountMinor: 9900,
        }
      : { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2200 },
  };
  const send = (body: unknown = command) =>
    createHttpApp().request(
      'http://127.0.0.1/api/internal/items/setup',
      {
        method: 'POST',
        headers: { origin: 'http://127.0.0.1', 'x-blackbox-request': '1', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
      { ...env, CMS_RUNTIME: { getByName: () => ({ fetch: cmsFetch }) } as never },
    );
  try {
    expect((await send()).status).toBe(503);
    expect(lost).toBe(true);
    await db.catalogOperation.update({ where: { id }, data: { leaseUntil: new Date(0).toISOString() } });
    const resumed = await send();
    expect(resumed.status).toBe(200);
    const result = (await resumed.json()) as { status: string; variantId: string };
    expect(result.status).toBe('completed');
    expect(await (await send()).json()).toEqual(result);
    expect(writes).toEqual({ source: scenario.existing ? 0 : 1, product: 1, price: 1, select: 1 });
    expect(await db.stock.findUnique({ where: { variantId: result.variantId } })).toMatchObject({
      quantity: 10,
      onlineQuantity: 10,
    });
    expect(await db.stockChange.count({ where: { variantId: result.variantId } })).toBe(1);
    const checkoutSessionId = parseCheckoutSessionId(`cs_setup_sale_${scenario.loss}`);
    const order = await db.checkoutOrder.create({
      data: {
        checkoutSessionId,
        storeItemSlug: id,
        variantId: result.variantId,
        checkoutExpiresAt: new Date(Date.now() + 60_000),
        status: 'pending_payment',
        statusUpdatedAt: new Date(),
        lines: {
          create: {
            storeItemSlug: id,
            variantId: result.variantId,
            stripePriceId: `price_${scenario.loss}`,
            quantity: 2,
            unitAmountMinor: 2200,
            lineAmountMinor: 4400,
          },
        },
      },
    });
    const finalizer = new D1PaidCheckoutFinalizationRepository(env.COMMERCE_DB);
    const sale = {
      checkoutSessionId,
      amountTotalMinor: 4400,
      currencyCode: 'EUR' as const,
      lineItems: [
        {
          variantId: parseVariantId(result.variantId),
          quantity: createCartQuantity(2),
          unitAmountMinor: 2200,
          lineAmountMinor: 4400,
        },
      ],
      newsletterConsentAt: null,
      newsletterConsentCopyVersion: null,
      newsletterOptIn: false,
      recipientName: 'Test Buyer',
      shippingAddressCity: 'Athens',
      shippingAddressCountryCode: 'GR' as const,
      shippingAddressLine1: 'Test 1',
      shippingAddressLine2: null,
      shippingAddressPostalCode: '10558',
      shippingAddressState: null,
      shopperEmail: 'buyer@example.com',
      shopperPhone: null,
      stripePaymentIntentId: null,
      transitionedAt: new Date(),
    };
    expect(await finalizer.finalizePaidCheckout(sale)).toMatchObject({ kind: 'transitioned' });
    expect(await finalizer.finalizePaidCheckout(sale)).toMatchObject({ kind: 'replay' });
    const paid = await db.checkoutOrder.findUnique({ where: { id: order.id }, include: { lines: true } });
    expect(paid).toMatchObject({ status: 'paid', amountTotalMinor: 4400 });
    expect(await (await send()).json()).toEqual(result);
    // Selecting the same source under a fresh operation cannot restart opening inventory.
    const repeat = await send({
      ...command,
      operationId: `${id}-repeat`,
      source: { mode: 'existing', sourceKind: scenario.kind, id: source.id },
    });
    expect(await repeat.json()).toMatchObject({ status: 'needs_review' });
    expect(await db.stock.findUnique({ where: { variantId: result.variantId } })).toMatchObject({
      quantity: 8,
      onlineQuantity: 8,
    });
    expect(await db.stockChange.count({ where: { variantId: result.variantId } })).toBe(2);
    expect(await db.checkoutOrder.findUnique({ where: { id: order.id }, include: { lines: true } })).toEqual(paid);
    expect(writes).toEqual({ source: scenario.existing ? 0 : 1, product: 1, price: 1, select: 1 });
    expect(await db.storeItemOption.findUnique({ where: { variantId: result.variantId } })).toMatchObject({
      cmsSourceId: source.id,
      catalogAvailability: 'withheld',
      catalogRevision: 1,
    });
  } finally {
    network.mockRestore();
    await db.$disconnect();
  }
});
