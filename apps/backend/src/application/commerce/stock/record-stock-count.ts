import type { OperatorStockRepository, StoreItemOptionRepository } from '../../../domain/commerce/repositories/spi';
import { createStockQuantity, createStockState, parseVariantId } from '../../../domain/commerce';
import {
  InvalidStockOperationError,
  StockConflictError,
  StockIdempotencyConflictError,
  VariantNotFoundError,
} from './errors';
import { RequestIdentityConflictError } from '../../../domain/commerce/repositories/request-identity';
import type { RecordedStockCount } from './types';
import {
  createRequestIdentity,
  createStockCountRequestFingerprint,
} from '../../../domain/commerce/request-idempotency';

export type RecordStockCountCommand = {
  expectedRevision: unknown;
  variantId: unknown;
  countedQuantity: unknown;
  onlineQuantity: unknown;
  notes: string | null;
  actorEmail: string;
  idempotencyKey?: string;
  productEnvironment?: string;
};

export async function recordStockCount(
  storeItemOptions: StoreItemOptionRepository,
  stock: Pick<OperatorStockRepository, 'recordCount'>,
  command: RecordStockCountCommand,
): Promise<RecordedStockCount> {
  const variantId = parseVariantId(command.variantId);
  const storeItem = await storeItemOptions.findByVariantId(variantId);

  if (!storeItem) {
    throw new VariantNotFoundError(variantId);
  }

  let nextStock;
  try {
    nextStock = createStockState({
      onlineQuantity: createStockQuantity(command.onlineQuantity),
      quantity: createStockQuantity(command.countedQuantity),
    });
  } catch {
    throw new InvalidStockOperationError('Online stock cannot exceed counted stock.');
  }

  const expectedRevision = command.expectedRevision;
  if (
    expectedRevision !== null &&
    (typeof expectedRevision !== 'number' || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
  ) {
    throw new InvalidStockOperationError('A stock revision or explicit null is required.');
  }

  const notes = command.notes?.trim() || null;
  const requestFingerprint = createStockCountRequestFingerprint({
    countedQuantity: nextStock.quantity,
    expectedRevision,
    notes,
    onlineQuantity: nextStock.onlineQuantity,
    variantId,
  });
  const requestIdentity = await createRequestIdentity({
    idempotencyKey: command.idempotencyKey,
    productEnvironment: command.productEnvironment ?? 'local',
    requestFingerprint,
  });
  let result;
  try {
    result = await stock.recordCount({
      expectedRevision,
      actorEmail: command.actorEmail,
      countedQuantity: nextStock.quantity,
      notes,
      onlineQuantity: nextStock.onlineQuantity,
      requestIdentity,
      variantId,
    });
  } catch (error) {
    if (error instanceof RequestIdentityConflictError) throw new StockIdempotencyConflictError();
    throw error;
  }

  if (!result) throw new StockConflictError();
  return result;
}
