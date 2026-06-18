import { z } from 'zod';

import {
  EmailConfigurationError,
  NEWSLETTER_CONSENT_COPY_VERSION,
  logNewsletterRegistrationOutcome,
  readEmailRuntimeConfig,
  registerNewsletterContact,
  type NewsletterRegistrationResult,
} from '../../../application/email';
import type { AppBindings } from '../../../env';
import { createResendEmailGatewayFromConfig } from '../../../infrastructure/resend';

const publicNewsletterEmail = z.string().trim().email();

export function createPublicNewsletterServices(bindings: AppBindings) {
  return {
    errors: {
      EmailConfigurationError,
      ZodError: z.ZodError,
    },
    registerNewsletterSignup: async (input: {
      consentedAt?: Date;
      email: string;
    }): Promise<NewsletterRegistrationResult> => {
      const config = readEmailRuntimeConfig(bindings);
      const result = await registerNewsletterContact(createResendEmailGatewayFromConfig(config), config, {
        consentCopyVersion: NEWSLETTER_CONSENT_COPY_VERSION,
        consentSource: 'site-form',
        consentedAt: input.consentedAt ?? new Date(),
        email: publicNewsletterEmail.parse(input.email),
      });

      logNewsletterRegistrationOutcome(console, result, {
        source: 'site-form',
      });

      return result;
    },
  };
}
