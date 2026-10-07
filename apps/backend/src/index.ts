import { createHttpApp } from './interfaces/http/app';
import type { AppBindings } from './platform/env';
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

  async fetch(request: Request) {
    return app.fetch(request, this.bindings, this.ctx as unknown as ExecutionContext);
  }

  async runPaidOrderDelivery(scheduledTime: number) {
    // The combined Worker binds published content storage; alerts name items from the accepted publication.
    const media = (this.env as AppBindings & { MEDIA?: R2Bucket }).MEDIA;
    await runPaidOrderDeliverySchedule(this.bindings, new Date(scheduledTime), {
      ...(media
        ? {
            itemNames: createPublishedStoreItemNameReader(
              media,
              productEnvironmentProfileFromBindings(this.env).workerDeploymentTarget,
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
    return bindings.COMMERCE_RUNTIME.getByName('store').fetch(request);
  },
  async scheduled(controller, bindings) {
    await bindings.COMMERCE_RUNTIME.getByName('store').runPaidOrderDelivery(controller.scheduledTime);
  },
} satisfies ExportedHandler<AppBindings & { COMMERCE_RUNTIME: DurableObjectNamespace<CommerceRuntime> }>;
