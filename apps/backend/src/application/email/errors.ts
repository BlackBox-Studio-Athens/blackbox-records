export type EmailProviderSafeReason =
  | 'configuration'
  | 'idempotency_conflict_invalid'
  | 'idempotency_conflict_retryable'
  | 'provider_unavailable'
  | 'quota_exceeded'
  | 'rate_limited'
  | 'validation'
  | 'unknown';

export class EmailConfigurationError extends Error {
  public readonly safeReason: EmailProviderSafeReason = 'configuration';

  public constructor(message = 'Email runtime config is not configured.') {
    super(message);
    this.name = 'EmailConfigurationError';
  }
}
