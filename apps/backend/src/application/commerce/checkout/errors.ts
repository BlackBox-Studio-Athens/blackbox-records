import type { CheckoutSessionId } from '../../../domain/commerce';

export class StoreItemNotFoundError extends Error {
  public constructor(storeItemSlug: string) {
    super(`Store item not found: ${storeItemSlug}`);
  }
}

export class VariantMismatchError extends Error {
  public constructor() {
    super('Variant does not belong to the requested store item.');
  }
}

export class CheckoutUnavailableError extends Error {
  public constructor() {
    super('This item is not available for checkout.');
  }
}

export class CheckoutConfigurationError extends Error {
  public constructor(message = 'Checkout is not configured for this item.') {
    super(message);
  }
}

export class CheckoutCreationError extends CheckoutConfigurationError {
  public constructor(
    public readonly definitiveNonCreation: boolean,
    public readonly session: { checkoutSessionId: CheckoutSessionId; checkoutExpiresAt: Date } | null = null,
  ) {
    super('Checkout could not be started.');
  }
}

export class CustomPriceCartError extends CheckoutUnavailableError {
  public constructor() {
    super();
    this.message = 'Pay what you want items must be purchased alone, with quantity one. Update your cart to continue.';
  }
}

export class NativeCheckoutDisabledError extends Error {
  public constructor() {
    super('Native checkout is temporarily unavailable.');
  }
}
