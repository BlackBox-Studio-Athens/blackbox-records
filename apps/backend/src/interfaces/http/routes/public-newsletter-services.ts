import { z } from 'zod';

import {
  EmailConfigurationError,
  logNewsletterRegistrationOutcome,
  registerNewsletterContact,
  type NewsletterConsentSource,
  type NewsletterRegistrationResult,
} from '../../../application/email';
import { NEWSLETTER_CONSENT_COPY_VERSION } from '../../../application/commerce/checkout';
import type { AppBindings } from '../../../platform/env';
import type { AppLogger } from '../../../platform/observability';
import { createEmailRuntimeServices } from '../../../infrastructure/resend';

const publicNewsletterEmail = z.string().trim().email();

export function createPublicNewsletterServices(bindings: AppBindings, logger: Pick<AppLogger, 'info' | 'warn'>) {
  return {
    errors: {
      EmailConfigurationError,
      ZodError: z.ZodError,
    },
    registerNewsletterSignup: async (input: {
      consentedAt?: Date;
      email: string;
      source?: Extract<NewsletterConsentSource, 'availability-alert-form' | 'site-form'>;
    }): Promise<NewsletterRegistrationResult> => {
      const emailRuntime = createEmailRuntimeServices(bindings);
      const source = input.source ?? 'site-form';
      const result = await registerNewsletterContact(emailRuntime.provider, emailRuntime.config, {
        consentCopyVersion: NEWSLETTER_CONSENT_COPY_VERSION,
        consentSource: source,
        consentedAt: input.consentedAt ?? new Date(),
        email: publicNewsletterEmail.parse(input.email),
      });

      logNewsletterRegistrationOutcome(logger, result, { source });

      return result;
    },
  };
}
