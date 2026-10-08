import { createHttpApp } from './interfaces/http/app';
import { commerceRuntimeConfigFromBindings, type AppBindings, type CommerceRuntimeConfig } from './platform/env';
import { runPaidOrderDeliverySchedule } from './application/commerce/orders/run-paid-order-delivery-schedule';
import { DurableObject } from 'cloudflare:workers';
import { createPrismaClientScope } from './infrastructure/persistence/prisma';
// A narrow entry: the commerce Worker must not bundle the CMS runtime.
import { createPublishedStoreItemNameReader } from './cms/published-store-item-names';
import { productEnvironmentProfileFromBindings } from './platform/env';

const app = createHttpApp();
const preflightApp = createHttpApp({ preflightOnly: true });

// ponytail: one low-traffic store per object; partition only when throughput requires it.
export class CommerceRuntime extends DurableObject<AppBindings> {
  private readonly bindings = createPrismaClientScope(this.env);

  private requestBindings(config: CommerceRuntimeConfig) {
    return createPrismaClientScope({ ...this.bindings, ...commerceRuntimeConfigFromBindings(config) }, this.bindings);
  }

  async fetch(request: Request) {
    return this.fetchWithBindings(request, commerceRuntimeConfigFromBindings(this.env));
  }

  async fetchWithBindings(request: Request, config: CommerceRuntimeConfig) {
    return app.fetch(request, this.requestBindings(config), this.ctx as unknown as ExecutionContext);
  }

  async runPaidOrderDelivery(scheduledTime: number, config: CommerceRuntimeConfig) {
    const bindings = this.requestBindings(config);
    // The combined Worker binds published content storage; alerts name items from the accepted publication.
    const media = (this.env as AppBindings & { MEDIA?: R2Bucket }).MEDIA;
    await runPaidOrderDeliverySchedule(bindings, new Date(scheduledTime), {
      ...(media
        ? {
            itemNames: createPublishedStoreItemNameReader(
              media,
              productEnvironmentProfileFromBindings(bindings).workerDeploymentTarget,
            ),
          }
        : {}),
    });
  }
}

export default {
  async fetch(request, bindings) {
    if (request.method === 'OPTIONS' && new URL(request.url).pathname.startsWith('/api/')) {
      return preflightApp.fetch(request, bindings);
    }
    return bindings.COMMERCE_RUNTIME.getByName('store').fetchWithBindings(
      request,
      commerceRuntimeConfigFromBindings(bindings),
    );
  },
  async scheduled(controller, bindings) {
    await bindings.COMMERCE_RUNTIME.getByName('store').runPaidOrderDelivery(
      controller.scheduledTime,
      commerceRuntimeConfigFromBindings(bindings),
    );
  },
} satisfies ExportedHandler<AppBindings & { COMMERCE_RUNTIME: DurableObjectNamespace<CommerceRuntime> }>;
