import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Stripe from 'stripe';
import { expect, it } from 'vitest';
import { createStripeMockProxyServer } from '../../../../scripts/start-stripe-mock';

async function listen(server: Server) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return (server.address() as { port: number }).port;
}
async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

it('retains SDK Product and Price operations across proxy restart, with scoped lists and expanded reads', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'blackbox-mock-catalog-'));
  let rejectWrites = false;
  let upstreamCalls = 0;
  const upstream = createServer((request, response) => {
    upstreamCalls++;
    request.resume();
    response.writeHead(rejectWrites && request.method === 'POST' ? 400 : 200, { 'content-type': 'application/json' });
    response.end(
      rejectWrites && request.method === 'POST'
        ? JSON.stringify({ error: { type: 'invalid_request_error', message: 'Rejected fixture' } })
        : '{}',
    );
  });
  const upstreamPort = await listen(upstream);
  let proxy = createStripeMockProxyServer(`http://127.0.0.1:${upstreamPort}`, join(directory, 'catalog.json'));
  try {
    const client = (port: number) =>
      new Stripe('sk_test_mock', { host: '127.0.0.1', port, protocol: 'http', maxNetworkRetries: 0 });
    let stripe = client(await listen(proxy));
    const productId = 'prod_blackbox_local_variant_test';
    await expect(stripe.products.retrieve(productId)).rejects.toMatchObject({ statusCode: 404 });
    await stripe.products.create({
      id: productId,
      name: 'Local record',
      tax_code: 'txcd_99999999',
      metadata: { variantId: 'variant_test' },
    });
    expect((await stripe.prices.list({ product: productId })).data).toEqual([]);
    const input = {
      product: productId,
      currency: 'eur',
      unit_amount: 2300,
      tax_behavior: 'inclusive' as const,
      metadata: { catalogOperationId: 'operation' },
    };
    const price = await stripe.prices.create(input, { idempotencyKey: 'local-operation' });
    expect((await stripe.prices.create(input, { idempotencyKey: 'local-operation' })).id).toBe(price.id);
    await stripe.products.update(productId, { default_price: price.id });
    await close(proxy);
    proxy = createStripeMockProxyServer(`http://127.0.0.1:${upstreamPort}`, join(directory, 'catalog.json'));
    stripe = client(await listen(proxy));
    const product = await stripe.products.retrieve(productId, { expand: ['default_price'] });
    expect(product.default_price).toMatchObject({ id: price.id, unit_amount: 2300, tax_behavior: 'inclusive' });
    expect((await stripe.prices.retrieve(price.id, { expand: ['product'] })).product).toMatchObject({
      id: productId,
      metadata: { variantId: 'variant_test' },
    });
    expect((await stripe.prices.list({ product: productId, active: true })).data).toHaveLength(1);
    expect((await stripe.prices.list({ product: productId, active: false })).data).toEqual([]);
    rejectWrites = true;
    await expect(stripe.products.update(productId, { name: 'Rejected' })).rejects.toMatchObject({ statusCode: 400 });
    expect((await stripe.products.retrieve(productId)).name).toBe('Local record');
    expect(upstreamCalls).toBeGreaterThan(10);
  } finally {
    await close(proxy);
    await close(upstream);
    await rm(directory, { recursive: true, force: true });
  }
});
