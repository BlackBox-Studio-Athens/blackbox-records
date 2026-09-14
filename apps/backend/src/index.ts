import { createHttpApp } from './interfaces/http/app';
import type { AppBindings } from './env';
import { runPaidOrderDeliverySchedule } from './interfaces/scheduled/run-paid-order-delivery-schedule';
import { DurableObject } from 'cloudflare:workers';

const app = createHttpApp();

// ponytail: one low-traffic store per object; partition only when throughput requires it.
export class CommerceRuntime extends DurableObject<AppBindings> {
  async fetch(request: Request) {
    return app.fetch(request, this.env, this.ctx as unknown as ExecutionContext);
  }

  async runPaidOrderDelivery(scheduledTime: number) {
    await runPaidOrderDeliverySchedule(this.env, new Date(scheduledTime));
  }
}

export default {
  async fetch(request, bindings) {
    return bindings.COMMERCE_RUNTIME.getByName('store').fetch(request);
  },
  async scheduled(controller, bindings) {
    await bindings.COMMERCE_RUNTIME.getByName('store').runPaidOrderDelivery(controller.scheduledTime);
  },
} satisfies ExportedHandler<AppBindings & { COMMERCE_RUNTIME: DurableObjectNamespace<CommerceRuntime> }>;
