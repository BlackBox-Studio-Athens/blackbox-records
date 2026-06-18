import { z } from 'zod';

import { EmailConfigurationError } from './errors';
import type { EmailRuntimeBindingValues, EmailRuntimeConfig } from './types';

const requiredEmailAddress = z.string().trim().email();
const requiredNonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const emailRuntimeSchema = z.object({
  APP_ENV: z.enum(['local', 'sandbox', 'production']),
  RESEND_API_KEY: requiredNonEmptyString.refine((value) => value.startsWith('re_'), {
    message: 'Resend API key must use the re_ prefix.',
  }),
  RESEND_FROM_EMAIL: requiredEmailAddress.refine((value) => value === 'orders@blackboxrecordsathens.com'),
  RESEND_NEWSLETTER_SEGMENT_ID: optionalNonEmptyString,
  RESEND_NEWSLETTER_TOPIC_ID: requiredNonEmptyString,
  RESEND_OPS_TO_EMAIL: requiredEmailAddress.refine((value) => value === 'blackboxrecordsathens@gmail.com'),
  RESEND_REPLY_TO_EMAIL: requiredEmailAddress.refine((value) => value === 'support@blackboxrecordsathens.com'),
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: requiredEmailAddress.optional(),
});

export function readEmailRuntimeConfig(bindings: EmailRuntimeBindingValues): EmailRuntimeConfig {
  const parsed = emailRuntimeSchema.safeParse(bindings);

  if (!parsed.success) {
    throw new EmailConfigurationError('Email runtime config is missing or invalid.');
  }

  if (parsed.data.APP_ENV === 'sandbox') {
    if (parsed.data.RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL !== 'blackboxrecordsathens+TESTING@gmail.com') {
      throw new EmailConfigurationError('UAT email recipient sink is not configured.');
    }
  }

  return {
    apiKey: parsed.data.RESEND_API_KEY,
    appEnvironment: parsed.data.APP_ENV,
    fromEmail: parsed.data.RESEND_FROM_EMAIL,
    newsletterSegmentId: parsed.data.RESEND_NEWSLETTER_SEGMENT_ID,
    newsletterTopicId: parsed.data.RESEND_NEWSLETTER_TOPIC_ID,
    opsToEmail: parsed.data.RESEND_OPS_TO_EMAIL,
    replyToEmail: parsed.data.RESEND_REPLY_TO_EMAIL,
    uatRecipientOverrideEmail:
      parsed.data.APP_ENV === 'sandbox' ? (parsed.data.RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL ?? null) : null,
  };
}
