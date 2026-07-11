import { z } from 'zod';

import { productEnvironmentProfileFromBindings, productEnvironmentSchema } from '../../env';
import { EmailConfigurationError } from './errors';

const requiredEmailAddress = z.string().trim().email();
const requiredNonEmptyString = z.string().trim().min(1);
const requiredHttpsUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => new URL(value).protocol === 'https:');
const optionalNonEmptyString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

export const UAT_RESEND_RECEIVING_SINK_EMAIL = 'uat-sink@ambkime.resend.app';

const emailRuntimeBindingInputSchema = z.object({
  EMAIL_BRAND_HOME_URL: z.string().optional(),
  EMAIL_BRAND_LOGO_URL: z.string().optional(),
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
    EMAIL_BRAND_HOME_URL: requiredHttpsUrl,
    EMAIL_BRAND_LOGO_URL: requiredHttpsUrl,
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
    emailBrandHomeUrl: bindings.EMAIL_BRAND_HOME_URL,
    emailBrandLogoUrl: bindings.EMAIL_BRAND_LOGO_URL,
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
    if (parsed.data.uatRecipientOverrideEmail !== UAT_RESEND_RECEIVING_SINK_EMAIL) {
      throw new EmailConfigurationError('UAT email recipient sink is not configured.');
    }
  }

  if (
    parsed.data.emailBrandHomeUrl !== parsed.data.productEnvironmentProfile.emailBrand.homeUrl ||
    parsed.data.emailBrandLogoUrl !== parsed.data.productEnvironmentProfile.emailBrand.logoUrl
  ) {
    throw new EmailConfigurationError('Email brand config does not match the Product Environment profile.');
  }

  return parsed.data;
}
