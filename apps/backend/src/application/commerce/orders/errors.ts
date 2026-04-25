export class CheckoutOrderNotFoundError extends Error {
  public constructor(checkoutSessionId: string) {
    super(`Checkout order was not found for session ${checkoutSessionId}.`);
    this.name = 'CheckoutOrderNotFoundError';
  }
}

export class InvalidOrderTransitionError extends Error {
  public constructor(reason: string) {
    super(reason);
    this.name = 'InvalidOrderTransitionError';
  }
}
