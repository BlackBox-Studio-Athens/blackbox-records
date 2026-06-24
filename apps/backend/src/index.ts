import { createHttpApp } from './interfaces/http/app';
import { runScheduledCatalogVerification } from './interfaces/scheduled/catalog-verification';
import { runWithTraceSpan } from './observability';
import type { AppEnv } from './env';

const app = createHttpApp();

export default {
  fetch: app.fetch.bind(app),
  scheduled(_controller: ScheduledController, env: AppEnv['Bindings'], context: ExecutionContext) {
    context.waitUntil(
      runWithTraceSpan(
        context,
        'catalog.verify_scheduled',
        {
          productEnvironment: env.PRODUCT_ENVIRONMENT,
        },
        () => runScheduledCatalogVerification(env),
      ),
    );
  },
};
