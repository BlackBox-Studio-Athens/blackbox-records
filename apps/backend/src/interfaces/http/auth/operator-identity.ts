export const CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER = 'cf-access-authenticated-user-email';

export type OperatorIdentity = {
    email: string;
};

// Only use this helper on requests that already passed through the protected
// Cloudflare Access boundary for the operator hostname.
export function readOperatorIdentityFromAccessHeaders(headers: Headers): OperatorIdentity | null {
    const email = headers.get(CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER)?.trim();

    if (!email) {
        return null;
    }

    return {
        email,
    };
}
