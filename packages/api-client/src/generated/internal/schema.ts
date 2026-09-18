export type paths = {
    "/api/internal/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getInternalApiDiscovery"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/inventory": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listInternalInventory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/items/setup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Set up an item using a replayable operator command.
         * @description Requires verified operator Access, an Origin matching this API origin, and X-Blackbox-Request: 1. Reuse the same operationId and body when retrying.
         */
        post: operations["setupCatalogItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/openapi.json": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getInternalApiDescription"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listInternalOrders"];
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
        get: operations["getInternalOrderByCheckoutSession"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/orders/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["searchInternalOrders"];
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
        get: operations["searchInternalVariants"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/variants/{variantId}/price": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read the current item price and edit revision without provider writes. */
        get: operations["readCatalogPrice"];
        put?: never;
        /**
         * Change an item price using a replayable operator command.
         * @description Requires verified operator Access, an Origin matching this API origin, and X-Blackbox-Request: 1. Reuse the same operationId and body when retrying.
         */
        post: operations["changeCatalogPrice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/internal/variants/{variantId}/publication": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read linked content and any retained item publication. */
        get: operations["readCatalogItemPublication"];
        put?: never;
        /** Publish an item without changing its Price or opening stock. */
        post: operations["publishCatalogItem"];
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
        get: operations["readVariantStock"];
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
        post: operations["recordStockChange"];
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
        post: operations["recordStockCount"];
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
        get: operations["readVariantStockHistory"];
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
        ApiAction: {
            href: string;
            /** @enum {string} */
            method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
            operationRef: string;
            parameters?: components["schemas"]["ApiActionParameters"];
            rel: string;
            type?: string;
        };
        ApiActionParameters: {
            body?: {
                [key: string]: unknown;
            };
            path?: {
                [key: string]: string | number | boolean | null;
            };
            query?: {
                [key: string]: string | number | boolean | null;
            };
        };
        ApiLink: {
            href: string;
            rel: string;
            type?: string;
        };
        BackendErrorResponse: components["schemas"]["ProblemDetails"] & {
            error: string;
        };
        CatalogItemPublishDetail: {
            actions?: components["schemas"]["ApiAction"][];
            /** @enum {string} */
            availability: "published" | "withheld" | "retired";
            cmsRevision: string;
            cmsSourceId: string;
            /** @enum {string} */
            collection: "releases" | "distro";
            expectedRevision: number;
            links?: components["schemas"]["ApiLink"][];
            /** @enum {string|null} */
            operationStatus?: "pending" | "completed" | "needs_review" | null;
            pending: {
                cmsRevision: string;
                /** @default false */
                confirmLivePublication: boolean;
                expectedRevision: number;
                /** Format: uuid */
                operationId: string;
                /** @default false */
                retryPublication: boolean;
            } | null;
            /** @enum {string|null} */
            publicationStatus?: "pending" | "live" | "failed" | null;
            requiresLiveConfirmation: boolean;
            title: string;
        };
        CatalogItemPublishResult: {
            actions?: components["schemas"]["ApiAction"][];
            links?: components["schemas"]["ApiLink"][];
            operationId: string;
            /** Format: uuid */
            publicationId?: string;
            /** @enum {string} */
            publicationStatus?: "pending" | "live" | "failed";
            /** @enum {string} */
            status: "pending" | "completed" | "needs_review";
            variantId: string;
        };
        CatalogItemSetupResult: {
            actions?: components["schemas"]["ApiAction"][];
            links?: components["schemas"]["ApiLink"][];
            operationId: string;
            /** @enum {string} */
            status: "pending" | "completed" | "needs_review";
            variantId: string;
        };
        CatalogPriceChangeResult: {
            actions?: components["schemas"]["ApiAction"][];
            links?: components["schemas"]["ApiLink"][];
            operationId: string;
            /** @enum {string} */
            status: "pending" | "completed" | "needs_review";
            variantId: string;
        };
        CatalogPriceDetail: {
            actions?: components["schemas"]["ApiAction"][];
            expectedRevision: number;
            links?: components["schemas"]["ApiLink"][];
            price: {
                amountMinor: number;
                /** @enum {string} */
                currencyCode: "EUR";
                /** @enum {string} */
                kind: "fixed";
            } | {
                /** @enum {string} */
                currencyCode: "EUR";
                /** @enum {string} */
                kind: "pay_what_you_want";
                maximumAmountMinor: number;
                minimumAmountMinor: number;
                presetAmountMinor: number;
            };
            requiresLiveConfirmation: boolean;
            variantId: string;
        };
        InternalApiDescription: {
            [key: string]: unknown;
        };
        InternalApiDiscovery: {
            links: components["schemas"]["ApiLink"][];
        };
        InternalCheckoutOrder: {
            acceptedDeliveryAmountMinor: number | null;
            /** @enum {string|null} */
            acceptedParcelTier: "small" | "medium" | null;
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
                deliveryGrossMinor: number | null;
                deliveryVatMinor: number | null;
                /** @enum {string} */
                kind: "current";
                lines: {
                    displayName: string;
                    lineAmountMinor: number;
                    lineVatMinor: number | null;
                    optionLabel: string | null;
                    quantity: number;
                    storeItemSlug: string;
                    taxRatePercent: number | null;
                    unitAmountMinor: number;
                    variantId: string;
                }[];
                merchandiseGrossMinor: number | null;
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
                totalVatMinor: number | null;
            };
            monetaryPolicyReference: string | null;
            /** Format: date-time */
            needsReviewAt: string | null;
            needsReviewReason: string | null;
            /** Format: date-time */
            notPaidAt: string | null;
            orderReference?: string;
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
            expectedRevision: number | null;
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
            actions?: components["schemas"]["ApiAction"][];
            entries: (components["schemas"]["InternalStockChangeEntry"] | components["schemas"]["InternalStockCountEntry"])[];
            links?: components["schemas"]["ApiLink"][];
            variantId: string;
        };
        InternalStockState: {
            onlineQuantity: number;
            quantity: number;
            revision: number | null;
            /** Format: date-time */
            updatedAt: string | null;
        };
        InternalVariantSummary: {
            actions?: components["schemas"]["ApiAction"][];
            displayName?: string;
            itemType?: string | null;
            links?: components["schemas"]["ApiLink"][];
            onlineQuantity?: number | null;
            quantity?: number | null;
            sourceId: string;
            /** @enum {string} */
            sourceKind: "release" | "distro";
            storeItemSlug: string;
            variantId: string;
        };
        InventoryPage: {
            actions?: components["schemas"]["ApiAction"][];
            before: string;
            items: (components["schemas"]["InternalVariantSummary"] & {
                cmsSourceId: string | null;
            })[];
            links?: components["schemas"]["ApiLink"][];
            nextCursor?: string;
        };
        ProblemDetails: {
            code: string;
            detail: string;
            requestId?: string;
            status: number;
            title: string;
            type: string;
        };
        RecordedStockChangeResponse: {
            actions?: components["schemas"]["ApiAction"][];
            entry: components["schemas"]["InternalStockChangeEntry"];
            links?: components["schemas"]["ApiLink"][];
            stock: components["schemas"]["InternalStockState"];
            variantId: string;
        };
        RecordedStockCountResponse: {
            actions?: components["schemas"]["ApiAction"][];
            entry: components["schemas"]["InternalStockCountEntry"];
            links?: components["schemas"]["ApiLink"][];
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
export interface operations {
    getInternalApiDiscovery: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Protected operator API navigation and description links. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalApiDiscovery"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    listInternalInventory: {
        parameters: {
            query?: {
                area?: "all" | "release" | "distro" | "merch";
                before?: string;
                cursor?: string;
                format?: string;
                limit?: number;
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A bounded inventory page. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryPage"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    setupCatalogItem: {
        parameters: {
            query?: never;
            header?: {
                origin?: string;
                "x-blackbox-request"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default false */
                    confirmLiveSetup?: boolean;
                    /** @enum {string} */
                    itemType: "Vinyl 12-inch" | "Vinyl 10-inch" | "Vinyl 7-inch" | "CDs" | "Clothes" | "Tapes" | "Other";
                    /** @default 0 */
                    openingQuantity?: number;
                    operationId: string;
                    price: {
                        amountMinor: number;
                        /** @enum {string} */
                        currencyCode: "EUR";
                        /** @enum {string} */
                        kind: "fixed";
                    } | {
                        /** @enum {string} */
                        currencyCode: "EUR";
                        /** @enum {string} */
                        kind: "pay_what_you_want";
                        maximumAmountMinor: number;
                        minimumAmountMinor: number;
                        presetAmountMinor: number;
                    };
                    source: {
                        id: string;
                        /** @enum {string} */
                        mode: "existing";
                        /** @enum {string} */
                        sourceKind: "release" | "distro";
                    } | {
                        data: {
                            [key: string]: unknown;
                        };
                        /** @enum {string} */
                        mode: "create";
                        slug: string;
                        /** @enum {string} */
                        sourceKind: "release" | "distro";
                    };
                    storeItemSlug: string;
                };
            };
        };
        responses: {
            /** @description Retained operation status. Retry pending operations with identical input and operation identity. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogItemSetupResult"];
                };
            };
            /** @description Invalid request. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Same-origin operator request required. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operation input or catalog revision conflicts, or live confirmation is missing. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication or item setup is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    getInternalApiDescription: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Protected internal OpenAPI 3.1 description. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalApiDescription"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    listInternalOrders: {
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
                    /** @description RFC 8288 relationships for this response. */
                    Link?: string;
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
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    getInternalOrderByCheckoutSession: {
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
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Checkout order not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    searchInternalOrders: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                notification?: "pending" | "needs_review";
                q?: string;
                status?: components["schemas"]["InternalOrderStatus"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Search all protected orders with stable pagination. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["InternalCheckoutOrder"][];
                        nextCursor: string | null;
                    };
                };
            };
            /** @description Invalid search cursor. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    searchInternalVariants: {
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
                    /** @description RFC 8288 relationships for this response. */
                    Link?: string;
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
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    readCatalogPrice: {
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
            /** @description Current price. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogPriceDetail"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Item setup or price requires reconciliation. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Price is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    changeCatalogPrice: {
        parameters: {
            query?: never;
            header?: {
                origin?: string;
                "x-blackbox-request"?: string;
            };
            path: {
                variantId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default false */
                    confirmLivePriceChange?: boolean;
                    expectedRevision: number;
                    operationId: string;
                    price: {
                        amountMinor: number;
                        /** @enum {string} */
                        currencyCode: "EUR";
                        /** @enum {string} */
                        kind: "fixed";
                    } | {
                        /** @enum {string} */
                        currencyCode: "EUR";
                        /** @enum {string} */
                        kind: "pay_what_you_want";
                        maximumAmountMinor: number;
                        minimumAmountMinor: number;
                        presetAmountMinor: number;
                    };
                };
            };
        };
        responses: {
            /** @description Retained operation status. Retry pending operations with identical input and operation identity. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogPriceChangeResult"];
                };
            };
            /** @description Invalid request. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Same-origin operator request required. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operation input or catalog revision conflicts, or live confirmation is missing. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication or price processing is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    readCatalogItemPublication: {
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
            /** @description Publication detail. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogItemPublishDetail"];
                };
            };
            /** @description Invalid request. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Same-origin operator request required. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Item or content requires review. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Publication unavailable. Retry the retained operation. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    publishCatalogItem: {
        parameters: {
            query?: never;
            header?: {
                origin?: string;
                "x-blackbox-request"?: string;
            };
            path: {
                variantId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    cmsRevision: string;
                    /** @default false */
                    confirmLivePublication?: boolean;
                    expectedRevision: number;
                    /** Format: uuid */
                    operationId: string;
                    /** @default false */
                    retryPublication?: boolean;
                };
            };
        };
        responses: {
            /** @description Retained publication status. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogItemPublishResult"];
                };
            };
            /** @description Invalid request. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Same-origin operator request required. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Item or content requires review. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Publication unavailable. Retry the retained operation. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    readVariantStock: {
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
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Variant not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    recordStockChange: {
        parameters: {
            query?: never;
            header?: {
                "idempotency-key"?: string;
            };
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
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Variant not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description The stock request key conflicts with another operation or is required. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    recordStockCount: {
        parameters: {
            query?: never;
            header?: {
                "idempotency-key"?: string;
            };
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
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Variant not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Stock changed since the recount began. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    readVariantStockHistory: {
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
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication failed. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Variant not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Operator authentication is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
}

