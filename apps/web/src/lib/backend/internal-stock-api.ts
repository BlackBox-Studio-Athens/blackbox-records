import type { InternalApiComponents } from './api-client';
import { getPublicBackendBaseUrl } from './public-backend-config';

export type InternalVariantSummary = InternalApiComponents['schemas']['InternalVariantSummary'];
export type InternalStockDetail = InternalApiComponents['schemas']['InternalStockDetail'];
export type InternalStockHistoryResponse = InternalApiComponents['schemas']['InternalStockHistoryResponse'];
export type InternalStockChangeBody = InternalApiComponents['schemas']['InternalStockChangeBody'];
export type InternalStockCountBody = InternalApiComponents['schemas']['InternalStockCountBody'];
export type RecordedStockChangeResponse = InternalApiComponents['schemas']['RecordedStockChangeResponse'];
export type RecordedStockCountResponse = InternalApiComponents['schemas']['RecordedStockCountResponse'];

type FetchLike = typeof fetch;

interface CreateInternalStockApiOptions {
    backendBaseUrl?: string;
    fetcher?: FetchLike;
}

export class InternalStockApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'InternalStockApiError';
        this.status = status;
    }
}

export function getInternalStockApiBaseUrl(configuredValue = import.meta.env.PUBLIC_BACKEND_BASE_URL): string {
    return getPublicBackendBaseUrl(configuredValue) ?? '';
}

export function buildInternalStockApiUrl(baseUrl: string, path: string, query?: Record<string, string | number | undefined>): string {
    const queryString = new URLSearchParams();

    for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== '') {
            queryString.set(key, String(value));
        }
    }

    const suffix = queryString.size > 0 ? `?${queryString.toString()}` : '';

    if (!baseUrl) {
        return `${path}${suffix}`;
    }

    return `${baseUrl}${path}${suffix}`;
}

export function createInternalStockApi({ backendBaseUrl = '', fetcher = fetch }: CreateInternalStockApiOptions = {}) {
    async function fetchJson<TResponse>(path: string, init?: RequestInit, query?: Record<string, string | number | undefined>): Promise<TResponse> {
        const response = await fetcher(buildInternalStockApiUrl(backendBaseUrl, path, query), {
            credentials: 'include',
            ...init,
            headers: {
                ...(init?.body ? { 'content-type': 'application/json' } : {}),
                ...init?.headers,
            },
        });

        if (!response.ok) {
            const body = await readErrorBody(response);
            throw new InternalStockApiError(response.status, body?.error ?? `Internal stock API request failed with ${response.status}.`);
        }

        return readJson<TResponse>(response);
    }

    return {
        readStock(variantId: string) {
            return fetchJson<InternalStockDetail>(`/api/internal/variants/${encodeURIComponent(variantId)}/stock`);
        },
        readStockHistory(variantId: string, limit = 25) {
            return fetchJson<InternalStockHistoryResponse>(
                `/api/internal/variants/${encodeURIComponent(variantId)}/stock/history`,
                undefined,
                { limit },
            );
        },
        recordStockChange(variantId: string, body: InternalStockChangeBody) {
            return fetchJson<RecordedStockChangeResponse>(`/api/internal/variants/${encodeURIComponent(variantId)}/stock/changes`, {
                body: JSON.stringify(body),
                method: 'POST',
            });
        },
        recordStockCount(variantId: string, body: InternalStockCountBody) {
            return fetchJson<RecordedStockCountResponse>(`/api/internal/variants/${encodeURIComponent(variantId)}/stock/counts`, {
                body: JSON.stringify(body),
                method: 'POST',
            });
        },
        searchVariants(query = '', limit = 25) {
            return fetchJson<InternalVariantSummary[]>('/api/internal/variants', undefined, { limit, q: query });
        },
    };
}

async function readJson<TResponse>(response: Response): Promise<TResponse> {
    return response.json() as Promise<TResponse>;
}

async function readErrorBody(response: Response): Promise<{ error?: string } | null> {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text) as { error?: string };
    } catch {
        return null;
    }
}
