export type paths = {
    "/api/internal/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    status?: components["schemas"]["InternalOrderStatus"];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Recent checkout orders for protected operator reconciliation. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalCheckoutOrder"][];
                    };
                };
                /** @description Operator authentication failed. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication is temporarily unavailable. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/orders/checkout-sessions/{checkoutSessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    checkoutSessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Checkout order state for one checkout session. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalCheckoutOrder"];
                    };
                };
                /** @description Operator authentication failed. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Checkout order not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication is temporarily unavailable. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/variants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    q?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Search variants for internal stock operations. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalVariantSummary"][];
                    };
                };
                /** @description Operator authentication failed. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication is temporarily unavailable. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/variants/{variantId}/stock": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    variantId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Current stock for a variant. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockDetail"];
                    };
                };
                /** @description Invalid variant id. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication failed. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Variant not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication is temporarily unavailable. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/variants/{variantId}/stock/changes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    variantId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["InternalStockChangeBody"];
                };
            };
            responses: {
                /** @description Recorded a stock change. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RecordedStockChangeResponse"];
                    };
                };
                /** @description Invalid stock change. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication failed. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Variant not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication is temporarily unavailable. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/variants/{variantId}/stock/counts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    variantId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["InternalStockCountBody"];
                };
            };
            responses: {
                /** @description Recorded a stock count. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RecordedStockCountResponse"];
                    };
                };
                /** @description Invalid stock count. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication failed. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Variant not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication is temporarily unavailable. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/variants/{variantId}/stock/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                };
                header?: never;
                path: {
                    variantId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Recent stock history for a variant. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockHistoryResponse"];
                    };
                };
                /** @description Invalid variant id. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication failed. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Variant not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Operator authentication is temporarily unavailable. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        BackendErrorResponse: {
            code: string;
            error: string;
            requestId?: string;
        };
        InternalCheckoutOrder: {
            /** Format: date-time */
            checkoutExpiresAt: string;
            checkoutSessionId: string | null;
            /** Format: date-time */
            createdAt: string;
            deliveries: {
                attemptCount: number;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                deliveredAt: string | null;
                /** @enum {string} */
                kind: "shopper_confirmation" | "ops_fulfillment" | "newsletter_registration";
                /** Format: date-time */
                needsReviewAt: string | null;
                /** Format: date-time */
                nextAttemptAt: string | null;
                safeReason: string | null;
                /** @enum {string} */
                status: "pending" | "delivered" | "needs_review";
                /** Format: date-time */
                updatedAt: string;
            }[];
            fulfillment: {
                /** @enum {string} */
                kind: "unavailable";
            } | {
                /** @enum {string} */
                kind: "incomplete";
                /** @enum {string} */
                reason: "incomplete_paid_fulfillment";
            } | {
                amountTotalMinor: number;
                /** @enum {string} */
                currencyCode: "EUR";
                /** @enum {string} */
                kind: "current";
                lines: {
                    displayName: string;
                    lineAmountMinor: number;
                    optionLabel: string | null;
                    quantity: number;
                    storeItemSlug: string;
                    unitAmountMinor: number;
                    variantId: string;
                }[];
                newsletterConsent: {
                    /** @enum {boolean} */
                    optedIn: false;
                } | {
                    /** Format: date-time */
                    consentedAt: string;
                    copyVersion: string;
                    /** @enum {boolean} */
                    optedIn: true;
                };
                /** Format: date-time */
                paidAt: string;
                recipientName: string;
                shippingAddress: {
                    city: string;
                    /** @enum {string} */
                    country: "GR";
                    line1: string;
                    line2: string | null;
                    postalCode: string;
                    state: string | null;
                };
                shopperContact: {
                    /** Format: email */
                    email: string;
                    phone: string | null;
                };
            };
            /** Format: date-time */
            needsReviewAt: string | null;
            /** Format: date-time */
            notPaidAt: string | null;
            /** Format: date-time */
            paidAt: string | null;
            shippingLocker: {
                /** @enum {string} */
                country_code: "GR";
                locker_id: string;
                locker_name_or_label: string;
            } | null;
            status: components["schemas"]["InternalOrderStatus"];
            /** Format: date-time */
            statusUpdatedAt: string;
            storeItemSlug: string;
            stripePaymentIntentId: string | null;
            /** Format: date-time */
            updatedAt: string;
            variantId: string;
        };
        /** @enum {string} */
        InternalOrderStatus: "pending_payment" | "paid" | "not_paid" | "needs_review";
        InternalStockChangeBody: {
            delta: number;
            notes?: string | null;
            reason: string;
        };
        InternalStockChangeEntry: {
            /** Format: email */
            actorEmail: string;
            id: string;
            notes: string | null;
            quantityDelta: number;
            reason: string;
            /** Format: date-time */
            recordedAt: string;
            /** @enum {string} */
            type: "change";
            variantId: string;
        };
        InternalStockCountBody: {
            countedQuantity: number;
            notes?: string | null;
            onlineQuantity: number;
        };
        InternalStockCountEntry: {
            /** Format: email */
            actorEmail: string;
            countedQuantity: number;
            id: string;
            notes: string | null;
            onlineQuantity: number;
            /** Format: date-time */
            recordedAt: string;
            /** @enum {string} */
            type: "count";
            variantId: string;
        };
        InternalStockDetail: components["schemas"]["InternalVariantSummary"] & {
            stock: components["schemas"]["InternalStockState"];
        };
        InternalStockHistoryResponse: {
            entries: (components["schemas"]["InternalStockChangeEntry"] | components["schemas"]["InternalStockCountEntry"])[];
            variantId: string;
        };
        InternalStockState: {
            onlineQuantity: number;
            quantity: number;
            /** Format: date-time */
            updatedAt: string | null;
        };
        InternalVariantSummary: {
            sourceId: string;
            /** @enum {string} */
            sourceKind: "release" | "distro";
            storeItemSlug: string;
            variantId: string;
        };
        RecordedStockChangeResponse: {
            entry: components["schemas"]["InternalStockChangeEntry"];
            stock: components["schemas"]["InternalStockState"];
            variantId: string;
        };
        RecordedStockCountResponse: {
            entry: components["schemas"]["InternalStockCountEntry"];
            stock: components["schemas"]["InternalStockState"];
            variantId: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export type operations = Record<string, never>;

