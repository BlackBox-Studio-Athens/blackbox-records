export type paths = {
    "/api/checkout/sessions": {
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
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["StartCheckoutBody"];
                };
            };
            responses: {
                /** @description Created a hosted Stripe Checkout Session. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["StartCheckoutResponse"];
                    };
                };
                /** @description Invalid checkout request. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Store item not found. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Checkout unavailable or not configured. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Native checkout is temporarily unavailable. */
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
    "/api/checkout/sessions/{checkoutSessionId}/state": {
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
                /** @description Sanitized Checkout Session state for shopper return UI. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CheckoutState"];
                    };
                };
                /** @description Checkout is not configured. */
                409: {
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
    "/api/newsletter/registrations": {
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
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["NewsletterRegistrationBody"];
                };
            };
            responses: {
                /** @description Registered a public newsletter contact. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["NewsletterRegistrationResponse"];
                    };
                };
                /** @description Invalid newsletter signup request. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Newsletter signup is temporarily unavailable. */
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
    "/api/services/inquiries": {
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
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ServicesInquiryBody"];
                };
            };
            responses: {
                /** @description Submitted a Services inquiry for provider delivery. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ServicesInquiryResponse"];
                    };
                };
                /** @description Invalid Services inquiry request. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description Services inquiry submission is temporarily unavailable. */
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
    "/api/store/capabilities": {
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
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Browser-safe public store capability state. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["StoreCapabilities"];
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
    "/api/store/items/{storeItemSlug}": {
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
                    storeItemSlug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Backend-known checkout eligibility for one store item. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicStoreOffer"];
                    };
                };
                /** @description Store item not found. */
                404: {
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
    "/api/store/items/{storeItemSlug}/variants": {
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
                    storeItemSlug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Checkout-eligible variants for one store item. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicStoreOffer"][];
                    };
                };
                /** @description Store item not found. */
                404: {
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
    "/api/store/listing-prices": {
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
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Browser-safe current Store listing-price presentation. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublicStoreListingPrice"][];
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
        CheckoutState: {
            checkoutSessionId: string;
            /** @enum {string|null} */
            orderStatus: "pending_payment" | "paid" | "not_paid" | "needs_review" | null;
            /** @enum {string} */
            paymentStatus: "paid" | "unpaid" | "no_payment_required";
            shippingLocker: components["schemas"]["CheckoutStateShippingLocker"] | null;
            /** @enum {string} */
            state: "open" | "paid" | "processing" | "expired" | "unknown";
            /** @enum {string|null} */
            status: "open" | "complete" | "expired" | null;
        };
        CheckoutStateShippingLocker: {
            /** @enum {string} */
            country_code: "GR";
            locker_id: string;
            locker_name_or_label: string;
        };
        NewsletterRegistrationBody: {
            /** @enum {boolean} */
            consentAccepted: true;
            /** Format: email */
            email: string;
        };
        NewsletterRegistrationResponse: {
            /** @enum {string} */
            status: "registered";
        };
        PublicStoreListingPrice: {
            displayPrice: string;
            /** @enum {string} */
            presentationState: "ready";
            storeItemSlug: string;
        } | {
            /** @enum {string} */
            presentationState: "unavailable";
            storeItemSlug: string;
        };
        PublicStoreOffer: {
            availability: {
                label: string;
                /** @enum {string} */
                status: "available";
            };
            /** @enum {boolean} */
            canCheckout: true;
            /** @enum {string} */
            catalogStatus: "ready";
            price: components["schemas"]["PublicStoreOfferPrice"];
            storeItemSlug: string;
            variantId: string;
        } | {
            availability: {
                label: string;
                /** @enum {string} */
                status: "sold_out";
            };
            /** @enum {boolean} */
            canCheckout: false;
            /** @enum {string} */
            catalogStatus: "sold_out";
            price: null;
            storeItemSlug: string;
            variantId: string;
        } | {
            availability: {
                label: string;
                /** @enum {string} */
                status: "unavailable";
            };
            /** @enum {boolean} */
            canCheckout: false;
            /** @enum {string} */
            catalogStatus: "catalog_drift";
            price: null;
            storeItemSlug: string;
            variantId: string;
        };
        PublicStoreOfferPrice: {
            amountMinor: number;
            currencyCode: string;
            display: string;
            /** @enum {string} */
            kind: "fixed";
        } | {
            currencyCode: string;
            display: string;
            /** @enum {string} */
            kind: "pay_what_you_want";
            maximumAmountMinor: number;
            minimumAmountMinor: number;
            presetAmountMinor: number;
        };
        ServicesInquiryBody: {
            bandOrProject?: string;
            /** Format: email */
            email: string;
            message: string;
            name: string;
            /** @enum {string} */
            service: "General" | "Tour Booking" | "Merch Printing" | "Vinyl Printing";
            serviceDetails?: string;
        };
        ServicesInquiryResponse: {
            /** @enum {string} */
            status: "submitted";
        };
        StartCheckoutBody: {
            lines?: components["schemas"]["StartCheckoutLine"][];
            newsletterOptIn?: boolean;
            storeItemSlug?: string;
            variantId?: string;
        };
        StartCheckoutLine: {
            quantity: number;
            storeItemSlug: string;
            variantId: string;
        };
        StartCheckoutResponse: {
            /** Format: uri */
            checkoutUrl: string;
        };
        StoreCapabilities: {
            nativeCheckout: {
                enabled: boolean;
                unavailableReason: string | null;
            };
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

