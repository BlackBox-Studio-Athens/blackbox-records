export function normalizePublicBackendBaseUrl(value: string): string {
    return value.replace(/\/+$/, '');
}

export function getPublicBackendBaseUrl(configuredValue = import.meta.env.PUBLIC_BACKEND_BASE_URL): string | null {
    const configuredBaseUrl = configuredValue?.trim();

    if (!configuredBaseUrl) {
        return null;
    }

    return normalizePublicBackendBaseUrl(configuredBaseUrl);
}
