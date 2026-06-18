import { redactSensitiveSmokeText } from '../smoke-core';

export function scrubSensitiveStripeSmokeText(text: string): string {
  return redactSensitiveSmokeText(text);
}

export function scrubStripeSmokeEvidenceUrl(value: string): string {
  if (value.startsWith('https://checkout.stripe.com/')) {
    return 'https://checkout.stripe.com/[redacted_checkout_url]';
  }

  return scrubSensitiveStripeSmokeText(value);
}
