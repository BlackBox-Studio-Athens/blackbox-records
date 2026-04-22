import type { AppOpenApi } from '../../../env';

export function registerInternalRoutes(_app: AppOpenApi): void {
    // Staff-only routes will register here as they are introduced.
    // They belong on the separate Access-protected operator hostname under
    // `/api/internal/*`, never on the public shopper hostname.
}
