import type { OperatorStockRepository, StoreItemOptionRepository } from '../../../domain/commerce/repositories/spi';
import { createStockChangeDelta, parseVariantId } from '../../../domain/commerce';
import { InvalidStockOperationError, StockIdempotencyConflictError, VariantNotFoundError } from './errors';
import { RequestIdentityConflictError } from '../../../domain/commerce/repositories/request-identity';
import type { RecordedStockChange } from './types';
import {
  createRequestIdentity,
  createStockChangeRequestFingerprint,
} from '../../../domain/commerce/request-idempotency';

export type RecordStockChangeCommand = {
  variantId: unknown;
  quantityDelta: unknown;
  reason: string;
  notes: string | null;
  actorEmail: string;
  idempotencyKey?: string;
  productEnvironment?: string;
};

export async function recordStockChange(
  storeItemOptions: StoreItemOptionRepository,
  stock: Pick<OperatorStockRepository, 'recordChange'>,
  command: RecordStockChangeCommand,
): Promise<RecordedStockChange> {
  const variantId = parseVariantId(command.variantId);
  const storeItem = await storeItemOptions.findByVariantId(variantId);

  if (!storeItem) {
    throw new VariantNotFoundError(variantId);
  }

  let quantityDelta;
  try {
    quantityDelta = createStockChangeDelta(command.quantityDelta);
  } catch {
    throw new InvalidStockOperationError('Stock change must use a non-zero whole-number quantity delta.');
  }
  const reason = command.reason.trim();
  const notes = command.notes?.trim() || null;

  if (!reason) {
    throw new InvalidStockOperationError('Stock change reason is required.');
  }

  const requestFingerprint = createStockChangeRequestFingerprint({
    notes,
    quantityDelta,
    reason,
    variantId,
  });
  const requestIdentity = await createRequestIdentity({
    idempotencyKey: command.idempotencyKey,
    productEnvironment: command.productEnvironment ?? 'local',
    requestFingerprint,
  });
  let result;
  try {
    result = await stock.recordChange({
      actorEmail: command.actorEmail,
      notes,
      quantityDelta,
      reason,
      requestIdentity,
      variantId,
    });
  } catch (error) {
    if (error instanceof RequestIdentityConflictError) throw new StockIdempotencyConflictError();
    throw error;
  }

  if (!result) {
    throw new InvalidStockOperationError('Stock quantity cannot go below zero.');
  }
  return result;
}
