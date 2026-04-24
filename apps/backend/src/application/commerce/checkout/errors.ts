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
