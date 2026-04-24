export type paths = {
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
                /** @description Missing operator identity. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockError"];
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
                /** @description Missing operator identity. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockError"];
                    };
                };
                /** @description Variant not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockError"];
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
                        "application/json": components["schemas"]["InternalStockError"];
                    };
                };
                /** @description Missing operator identity. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockError"];
                    };
                };
                /** @description Variant not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockError"];
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
                        "application/json": components["schemas"]["InternalStockError"];
                    };
                };
                /** @description Missing operator identity. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockError"];
                    };
                };
                /** @description Variant not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockError"];
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
                /** @description Missing operator identity. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockError"];
                    };
                };
                /** @description Variant not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InternalStockError"];
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
        InternalStockError: {
            error: string;
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

