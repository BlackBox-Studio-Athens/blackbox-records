import { z } from 'zod';

import { productEnvironmentProfileFromBindings, productEnvironmentSchema } from '../../env';
import { EmailConfigurationError } from './errors';

const requiredEmailAddress = z.string().trim().email();
const requiredNonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const emailRuntimeBindingInputSchema = z.object({
  PRODUCT_ENVIRONMENT: productEnvironmentSchema,
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  RESEND_NEWSLETTER_SEGMENT_ID: z.string().optional(),
  RESEND_NEWSLETTER_TOPIC_ID: z.string().optional(),
  RESEND_OPS_TO_EMAIL: z.string().optional(),
  RESEND_REPLY_TO_EMAIL: z.string().optional(),
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: z.string().optional(),
});

const emailRuntimeBindingSchema = emailRuntimeBindingInputSchema.pipe(
  z.object({
    PRODUCT_ENVIRONMENT: productEnvironmentSchema,
    RESEND_API_KEY: requiredNonEmptyString.refine((value) => value.startsWith('re_'), {
      message: 'Resend API key must use the re_ prefix.',
    }),
    RESEND_FROM_EMAIL: requiredEmailAddress.refine((value) => value === 'orders@blackboxrecordsathens.com'),
    RESEND_NEWSLETTER_SEGMENT_ID: optionalNonEmptyString,
    RESEND_NEWSLETTER_TOPIC_ID: requiredNonEmptyString,
    RESEND_OPS_TO_EMAIL: requiredEmailAddress.refine((value) => value === 'blackboxrecordsathens@gmail.com'),
    RESEND_REPLY_TO_EMAIL: requiredEmailAddress.refine((value) => value === 'support@blackboxrecordsathens.com'),
    RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: requiredEmailAddress.optional(),
  }),
);

const emailRuntimeConfigSchema = emailRuntimeBindingSchema.transform((bindings) => {
  const productEnvironmentProfile = productEnvironmentProfileFromBindings(bindings);

  return {
    apiKey: bindings.RESEND_API_KEY,
    fromEmail: bindings.RESEND_FROM_EMAIL,
    newsletterSegmentId: bindings.RESEND_NEWSLETTER_SEGMENT_ID,
    newsletterTopicId: bindings.RESEND_NEWSLETTER_TOPIC_ID,
    opsToEmail: bindings.RESEND_OPS_TO_EMAIL,
    productEnvironmentProfile,
    replyToEmail: bindings.RESEND_REPLY_TO_EMAIL,
    uatRecipientOverrideEmail:
      productEnvironmentProfile.emailDeliveryPolicy === 'uat-sink'
        ? (bindings.RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL ?? null)
        : null,
  };
});

export type EmailRuntimeBindingValues = z.input<typeof emailRuntimeBindingSchema>;
export type EmailRuntimeConfig = z.output<typeof emailRuntimeConfigSchema>;

export function readEmailRuntimeConfig(bindings: EmailRuntimeBindingValues): EmailRuntimeConfig {
  const parsed = emailRuntimeConfigSchema.safeParse(bindings);

  if (!parsed.success) {
    throw new EmailConfigurationError('Email runtime config is missing or invalid.');
  }

  if (parsed.data.productEnvironmentProfile.emailDeliveryPolicy === 'uat-sink') {
    if (parsed.data.uatRecipientOverrideEmail !== 'blackboxrecordsathens+TESTING@gmail.com') {
      throw new EmailConfigurationError('UAT email recipient sink is not configured.');
    }
  }

  return parsed.data;
}
