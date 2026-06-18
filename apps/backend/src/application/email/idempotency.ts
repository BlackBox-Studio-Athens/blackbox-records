import type { EmailRuntimeConfig } from './types';

const MAX_RESEND_IDEMPOTENCY_KEY_LENGTH = 256;

export function createEmailIdempotencyKey(input: {
  config: Pick<EmailRuntimeConfig, 'appEnvironment'>;
  entityId: string;
  purpose: string;
}): string {
  return ['blackbox', input.config.appEnvironment, input.purpose, input.entityId]
    .map(toProviderSafeIdempotencySegment)
    .join(':')
    .slice(0, MAX_RESEND_IDEMPOTENCY_KEY_LENGTH);
}

export function createProviderSafeTag(input: { name: string; value: string }) {
  return {
    name: toProviderSafeTagPart(input.name),
    value: toProviderSafeTagPart(input.value),
  };
}

function toProviderSafeIdempotencySegment(value: string): string {
  return (
    value
      .trim()
      .replace(/[^A-Za-z0-9_.-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'unknown'
  );
}

function toProviderSafeTagPart(value: string): string {
  return toProviderSafeIdempotencySegment(value).slice(0, 256);
}
