import { createHash } from 'node:crypto';

import type { StoreItemOptionRecord } from '../../../domain/commerce/repositories/spi';
import type {
  CatalogSyncAction,
  StripeCatalogEnvironment,
  StripeCatalogIdentityMetadata,
  StripeCatalogMutationContext,
} from './types';

type StripeCatalogMutationAction = CatalogSyncAction['kind'] | 'reset_price' | 'reset_product';

export function createStripeCatalogLookupKey(
  environment: StripeCatalogEnvironment,
  storeItem: Pick<StoreItemOptionRecord, 'storeItemSlug' | 'variantId'>,
): string {
  return `blackbox:${environment}:${storeItem.storeItemSlug}:${storeItem.variantId}`;
}

export function createStripeCatalogMetadata(
  environment: StripeCatalogEnvironment,
  storeItem: StoreItemOptionRecord,
): StripeCatalogIdentityMetadata {
  return {
    appEnv: environment,
    sourceId: storeItem.sourceId,
    sourceKind: storeItem.sourceKind,
    storeItemSlug: storeItem.storeItemSlug,
    variantId: storeItem.variantId,
  };
}

export function redactStripeObjectId(value: string): string {
  const trimmed = value.trim();

  if (!trimmed.includes('_')) {
    return '[redacted]';
  }

  const prefix = trimmed.slice(0, trimmed.indexOf('_') + 1);
  const suffix = trimmed.slice(-4);

  return `${prefix}...${suffix}`;
}

export function createStripeCatalogRequestShapeFingerprint(value: unknown): string {
  return `shape_${createStableShortHash(stableJson(value))}`;
}

export function createStripeCatalogMutationContext(input: {
  action: StripeCatalogMutationAction;
  environment: StripeCatalogEnvironment;
  identity?: string | null;
  requestShape: unknown;
  variantId: string;
}): StripeCatalogMutationContext {
  const requestShapeFingerprint = createStripeCatalogRequestShapeFingerprint(input.requestShape);
  const key = buildStripeIdempotencyKey([
    'blackbox',
    'catalog',
    input.environment,
    input.variantId,
    input.action,
    input.identity || 'new',
    requestShapeFingerprint,
  ]);

  return {
    idempotencyKey: key,
    requestShapeFingerprint,
  };
}

export function deriveStripeCatalogChildMutationContext(
  context: StripeCatalogMutationContext | undefined,
  child: string,
): StripeCatalogMutationContext | undefined {
  if (!context) {
    return undefined;
  }

  return {
    ...context,
    idempotencyKey: buildStripeIdempotencyKey([context.idempotencyKey, child]),
  };
}

function buildStripeIdempotencyKey(parts: string[]): string {
  const key = parts.join(':');

  if (key.length <= 255) {
    return key;
  }

  if (parts.length < 5) {
    return ['blackbox', 'catalog', createStableShortHash(key)].join(':');
  }

  const [app, scope, environment, variantId, action] = parts;
  const shortened = [
    app,
    scope,
    environment,
    createStableShortHash(variantId ?? ''),
    action,
    createStableShortHash(key),
  ].join(':');

  if (shortened.length > 255) {
    throw new Error('Generated Stripe catalog idempotency key exceeds 255 characters.');
  }

  return shortened;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, childValue]) => `${JSON.stringify(key)}:${stableJson(childValue)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function createStableShortHash(value: string): string {
  return `v${createHash('sha256').update(value).digest('hex').slice(0, 32)}`;
}
