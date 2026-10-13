import { deriveOpenPreorderProjection, readStoreListingPrices } from '../../../application/commerce/checkout/readers';
import { createPrismaClient, PrismaStoreOfferSnapshotRepository } from '../../../infrastructure/persistence/prisma';
import type { Context } from 'hono';
import type { AppBindings, AppEnv } from '../../../platform/env';
import {
  createBindingLogger,
  normalizeUnknownError,
  requestLogger,
  type AppLogger,
} from '../../../platform/observability';

export const preorderProjectionPath = '/__publication/preorders';

type PushBindings = Pick<AppBindings, 'COMMERCE_DB' | 'PRODUCT_ENVIRONMENT'> & { PUBLIC_SITE?: Fetcher };

/**
 * Sends the current open pre-order projection to the public renderer. Never throws: the commerce write that triggered
 * it has already succeeded, and the next scheduled run pushes again.
 */
export async function pushPreorderProjection(
  bindings: PushBindings,
  logger: Pick<AppLogger, 'info' | 'warn'> = createBindingLogger(bindings),
): Promise<void> {
  // Only the combined Worker binds the renderer; the standalone commerce Worker has nothing to push to.
  if (!bindings.PUBLIC_SITE) return;
  try {
    const { projection, identity } = await deriveOpenPreorderProjection(
      await readStoreListingPrices(new PrismaStoreOfferSnapshotRepository(createPrismaClient(bindings)), 'preorders'),
    );
    const response = await bindings.PUBLIC_SITE.fetch(
      new Request(new URL(preorderProjectionPath, 'https://public-renderer.internal'), {
        method: 'POST',
        body: JSON.stringify(projection),
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }),
    );
    const result = response.ok ? ((await response.json()) as { changed?: boolean }) : null;
    if (!response.ok) await response.body?.cancel();
    if (!result) throw new Error('Pre-order projection push rejected.');
    logger.info({
      event: 'preorder_projection_push',
      outcome: result.changed ? 'changed' : 'unchanged',
      identity: identity.slice(0, 12),
      items: projection.items.length,
    });
  } catch (error) {
    logger.warn({
      ...normalizeUnknownError(error),
      event: 'preorder_projection_push',
      outcome: 'failed',
      retryable: true,
    });
  }
}

/** Pushes after the response; a missing execution context or a failed push leaves the write's response unchanged. */
export function schedulePreorderProjectionPush(context: Context<AppEnv>) {
  const push = pushPreorderProjection(context.env as PushBindings, requestLogger(context));
  try {
    context.executionCtx.waitUntil(push);
  } catch {
    // No execution context outside the Worker runtime; the push still runs and never rejects.
  }
}
