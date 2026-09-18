export class VariantNotFoundError extends Error {
  public constructor(variantId: string) {
    super(`Variant ${variantId} was not found.`);
    this.name = 'VariantNotFoundError';
  }
}

export class InvalidStockOperationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidStockOperationError';
  }
}

export class StockConflictError extends Error {
  public constructor() {
    super('Stock changed. Refresh and reassess the count before submitting again.');
    this.name = 'StockConflictError';
  }
}

export class StockIdempotencyConflictError extends RequestIdentityConflictError {
  public constructor() {
    super('This Idempotency-Key was already used for different stock input. Start a new operation.');
    this.name = 'StockIdempotencyConflictError';
  }
}
import { RequestIdentityConflictError } from '../../../domain/commerce/repositories/request-identity';
