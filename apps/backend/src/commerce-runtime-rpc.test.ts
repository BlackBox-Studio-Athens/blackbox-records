import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('uses current gates and webhook secrets over native RPC with an unchanged object environment', async () => {
  const require = createRequire(createRequire(import.meta.url).resolve('wrangler/package.json'));
  const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
  const { build } = require('esbuild');
  const compiled = await build({
    stdin: {
      resolveDir: dirname(fileURLToPath(import.meta.url)),
      loader: 'ts',
      contents: `import handler from './index';
        export { CommerceRuntime } from './index';
        const configs = {
          A: { PRODUCT_ENVIRONMENT: 'PRD', NATIVE_CHECKOUT_ENABLED: 'true', PRD_LAUNCH_APPROVED: 'true', STRIPE_SECRET_KEY: 'sk_live_config_A', STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_A', STRIPE_WEBHOOK_SECRET: 'whsec_A' },
          B: { PRODUCT_ENVIRONMENT: 'PRD', NATIVE_CHECKOUT_ENABLED: 'false', STRIPE_SECRET_KEY: 'sk_live_config_B', STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_B', STRIPE_WEBHOOK_SECRET: 'whsec_B' },
          removed: { PRODUCT_ENVIRONMENT: 'PRD', NATIVE_CHECKOUT_ENABLED: 'true', STRIPE_SECRET_KEY: 'sk_live_config_B', STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_B' },
        };
        export default { fetch(request, env) {
          const config = configs[new URL(request.url).searchParams.get('config')];
          return handler.fetch(request, { COMMERCE_DB: env.COMMERCE_DB, COMMERCE_RUNTIME: env.COMMERCE_RUNTIME, ...config });
        } };`,
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    mainFields: ['browser', 'module', 'main'],
    conditions: ['workerd', 'worker', 'browser'],
    external: ['cloudflare:workers', 'node:*'],
    plugins: [
      {
        name: 'native-prisma-wasm',
        setup(builder: {
          onResolve(options: { filter: RegExp }, callback: () => { path: string; external: boolean }): void;
        }) {
          builder.onResolve({ filter: /\.wasm\?module$/ }, () => ({ path: './prisma-query.wasm', external: true }));
        },
      },
    ],
  });
  const worker = new Miniflare(
    convertV4MiniflareOptions({
      modules: [
        {
          type: 'ESModule',
          path: join(dirname(fileURLToPath(import.meta.url)), 'rpc-worker.mjs'),
          contents: compiled.outputFiles[0].text,
        },
        {
          type: 'CompiledWasm',
          path: join(dirname(fileURLToPath(import.meta.url)), 'prisma-query.wasm'),
          contents: readFileSync(new URL('./generated/prisma/internal/query_compiler_fast_bg.wasm', import.meta.url)),
        },
      ],
      compatibilityDate: '2026-08-31',
      compatibilityFlags: ['nodejs_compat'],
      durableObjects: { COMMERCE_RUNTIME: { className: 'CommerceRuntime', useSQLite: true } },
      d1Databases: ['COMMERCE_DB'],
      bindings: {
        PRODUCT_ENVIRONMENT: 'PRD',
        NATIVE_CHECKOUT_ENABLED: 'true',
        PRD_LAUNCH_APPROVED: 'true',
        STRIPE_SECRET_KEY: 'sk_live_config_A',
        STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_A',
        STRIPE_WEBHOOK_SECRET: 'whsec_A',
      },
    }),
  );
  try {
    for (const [config, enabled] of [
      ['A', true],
      ['B', false],
      ['A', true],
      ['removed', false],
    ] as const) {
      const response = await worker.dispatchFetch(`http://shop.invalid/api/store/capabilities?config=${config}`);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ nativeCheckout: { enabled } });
    }
    // Unsupported events verify signatures and return without provider requests or database writes.
    const body =
      '{\n "id":"evt_rpc_configuration", "type":"customer.created", "data":{"object":{"id":"cus_test"}}\n}\n';
    const timestamp = Math.floor(Date.now() / 1000);
    for (const config of ['A', 'B', 'A', 'removed'] as const) {
      const secret = config === 'A' ? 'whsec_A' : 'whsec_B';
      const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
      const response = await worker.dispatchFetch(`http://shop.invalid/api/stripe/webhooks?config=${config}`, {
        method: 'POST',
        body,
        headers: { 'Stripe-Signature': `t=${timestamp},v1=${signature}` },
      });
      expect(response.status).toBe(config === 'removed' ? 500 : 200);
    }
  } finally {
    await worker.dispose();
  }
}, 60_000);
