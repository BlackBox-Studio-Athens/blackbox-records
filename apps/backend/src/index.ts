import { createHttpApp } from './interfaces/http/app';
import type { AppBindings } from './env';
import { runPaidOrderDeliverySchedule } from './interfaces/scheduled/run-paid-order-delivery-schedule';

const app = createHttpApp();

export default {
  fetch: app.fetch.bind(app),
  async scheduled(controller, bindings) {
    await runPaidOrderDeliverySchedule(bindings, new Date(controller.scheduledTime));
  },
} satisfies ExportedHandler<AppBindings>;
